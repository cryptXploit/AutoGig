import { ClientIntelligenceEngine } from '@autogig/engine';
import { SQLiteClientIntelligenceRepository } from '@autogig/db';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { canTransition, Preference, Profile, RejectionReason } from '@autogig/core';
import { 
  SQLiteOpportunityRepository, 
  SQLiteRunRepository,
  SQLiteProfileRepository,
  SQLitePreferenceRepository,
  SQLiteEvidenceRepository,
  SQLiteEvaluationRepository,
  SQLiteProposalRepository,
  SQLiteClaimRepository,
  SQLiteVerificationRepository,
  SQLiteApplicationRepository
} from '@autogig/db';
import { SQLiteEventBus } from '@autogig/events';
import { getAIProvider } from '@autogig/ai';
import { RuleEngine, LocalSimilarityRetriever, EconomicEngine, OpportunityScorer, DeepReasoner, ProposalGenerator, VerificationGate, ApplicationIntelligenceEngine } from '@autogig/engine';

const MAX_RETRIES = 3;
const BASE_DELAY = 2;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processEvent(
  db: DatabaseSync, 
  repo: SQLiteOpportunityRepository, 
  runs: SQLiteRunRepository, 
  bus: SQLiteEventBus, 
  profRepo: SQLiteProfileRepository,
  prefRepo: SQLitePreferenceRepository,
  evRepo: SQLiteEvidenceRepository,
  evalRepo: SQLiteEvaluationRepository,
  event: any
) {
  const oppId = event.payload.opportunityId;
  const opp = await repo.findById(oppId);
  
  if (!opp) throw new Error(`Opportunity not found: ${oppId}`);

  let profile = await profRepo.getProfile('u1');
  let pref = await prefRepo.getPreference('u1');
  
  if (!profile) profile = { userId: 'u1', name: 'Demo User', skills: ['Node.js', 'TypeScript', 'SQL', 'React'], resumeKey: '' };
  if (!pref) pref = { userId: 'u1', targetRate: 100, minRate: 50, blockedClients: ['Evil Corp'], updatedAt: new Date() };

  if (event.eventType === 'OPPORTUNITY_DEEP_REASON_REQUIRED') {
    if (opp.status !== 'EVALUATING') {
       bus.acknowledge(event.eventId);
       return;
    }
    
    const proposalRepo = new SQLiteProposalRepository(db);
    const claimRepo = new SQLiteClaimRepository(db);
    const verifyRepo = new SQLiteVerificationRepository(db);
    
    const ai = getAIProvider();
    const reasoner = new DeepReasoner(ai);
    const propGen = new ProposalGenerator(ai);
    const vGate = new VerificationGate(ai);

    console.log(`Phase D starting for ${oppId}...`);
    
    const evidenceList = await evRepo.getEvidenceForSkills(profile.userId, opp.normalizedSkills);
    const evaluation = db.prepare(`SELECT * FROM evaluations WHERE opportunityId = ?`).get(oppId);
    
    const deepResult = await reasoner.evaluate(opp as any, evaluation as any, evidenceList as any, profile as any, pref as any);
    
    db.prepare(`UPDATE evaluations SET clientRiskAssessment = ?, deepReasonStatus = 'COMPLETED' WHERE opportunityId = ?`)
      .run(deepResult.clientRiskAssessment || 'UNKNOWN', oppId);
      
    // State Persistence helper
    const advanceState = (newState: string) => {
        const prevRow: any = db.prepare(`SELECT status FROM opportunities WHERE id = ?`).get(oppId);
        const prev = prevRow ? prevRow.status : 'DISCOVERED';
        if (!canTransition(prev as any, newState as any)) throw new Error(`Invalid transition ${prev} -> ${newState}`);
        db.prepare(`UPDATE opportunities SET status = ? WHERE id = ?`).run(newState, oppId);
        db.prepare(`INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, causationId, actor) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(oppId, prev, newState, crypto.randomUUID(), event.eventId, 'opportunity-worker');
    };

    db.exec('BEGIN IMMEDIATE');
    try {
        if (deepResult.recommendedAction === 'SKIP') {
           console.log(`${oppId} skipped by AI.`);
           advanceState('REJECTED');
           bus.acknowledge(event.eventId);
           db.exec('COMMIT');
           return;
        }
        
        advanceState('SHORTLISTED');
        advanceState('PROPOSAL_GENERATING');
        db.exec('COMMIT');
    } catch(err) {
        db.exec('ROLLBACK');
        throw err;
    }
    

    const propText = await propGen.generate(opp as any, deepResult as any, evidenceList as any, profile as any, deepResult.recommendedAction as 'RECOMMEND' | 'COUNTER');
    const proposalId = `prop-${oppId}-1`;
    
    // --- G4.2 Application Intelligence ---
    const appIntelEngine = new ApplicationIntelligenceEngine(ai);
    const appIntelResult = await appIntelEngine.generate({
      opportunity: opp as any,
      profile: profile as any,
      preferences: pref as any,
      evidence: evidenceList as any,
      evaluation: deepResult as any
    });

    const appRepo = new SQLiteApplicationRepository(db);
    appRepo.save({
      id: `app-${oppId}-1`,
      opportunityId: oppId,
      proposalId: proposalId,
      ...appIntelResult,
      createdAt: new Date()
    });
    // ------------------------------------

    await proposalRepo.saveProposal({

       id: proposalId,
       opportunityId: oppId,
       text: propText,
       status: 'DRAFT',
       version: 1,
       runId: event.eventId
    });
    
    db.exec('BEGIN IMMEDIATE');
    try {
        advanceState('VERIFYING');
        db.exec('COMMIT');
    } catch(err) {
        db.exec('ROLLBACK');
        throw err;
    }
    
    await proposalRepo.saveProposal({ id: proposalId, opportunityId: oppId, text: propText, status: 'VERIFYING', version: 1, runId: event.eventId });
    
    const vResult = await vGate.runVerificationLoop(propGen, opp as any, deepResult as any, profile as any, propText, evidenceList as any, 2);
    
    await claimRepo.saveClaims(vResult.claims.map((c: any) => ({...c, proposalId})));
    await verifyRepo.saveVerificationRun({
       id: crypto.randomUUID(),
       proposalId,
       attempt: 1,
       status: vResult.status,
       result: vResult.claims
    });
    
    await proposalRepo.saveProposal({
       id: proposalId,
       opportunityId: oppId,
       text: vResult.text,
       status: vResult.status,
       version: 1,
       runId: event.eventId
    });
    
    if (vResult.status === 'BLOCKED') {
       console.log(`${oppId} PROPOSAL BLOCKED!`);
    } else {
       db.exec('BEGIN IMMEDIATE');
       try {
           advanceState('VERIFIED');
           advanceState('PENDING_APPROVAL');
           console.log(`${oppId} PROPOSAL VERIFIED & PENDING_APPROVAL.`);
           db.exec('COMMIT');
       } catch(err) {
           db.exec('ROLLBACK');
           throw err;
       }
    }
    
    bus.acknowledge(event.eventId);
    return;
  }

  if (event.eventType === 'OPPORTUNITY_DISCOVERED' && opp.status === 'DISCOVERED' && canTransition('DISCOVERED', 'NORMALIZED')) {
    const allOpps = db.prepare(`SELECT id FROM opportunities WHERE sourceJobId = ? AND id != ?`).all(opp.sourceJobId, opp.id);
    if (allOpps.some((o: any) => o.id < opp.id)) {
      (opp as any).isDuplicate = true;
    }

    const ruleEngine = new RuleEngine();
    const ruleResult = ruleEngine.evaluate(opp, pref);
    
    let finalState = 'EVALUATING';
    let route: any = 'PENDING';
    let qualFlags: any[] = [];
    let breakdown: any = null;

    if (!ruleResult.pass) {
       finalState = 'REJECTED';
       route = 'REJECT';
       console.log(`${oppId} rejected by rules: ${ruleResult.reason}`);
    } else {
       const retriever = new LocalSimilarityRetriever();
       const economics = new EconomicEngine();
       
       const techFit = retriever.computeTechnicalFit(opp, profile);
       const ecoResult = economics.calculate(opp, pref);
       
       const evidenceList = await evRepo.getEvidenceForSkills(profile.userId, opp.normalizedSkills);
       let evidenceCount = evidenceList.length;
       
       
        const ai = getAIProvider();
        const clientEngine = new ClientIntelligenceEngine(ai);
        const clientRepo = new SQLiteClientIntelligenceRepository(db);
        const clientResult = await clientEngine.generate({
          opportunityId: opp.id,
          opportunity: opp as any,
          client: (opp as any).client || {},
          evidence: evidenceList
        });
        await clientRepo.save(clientResult);

        if (clientResult.recommendation === 'BLOCK') {
          console.log(`[Worker] Client Intelligence blocked ${oppId}`);
          db.prepare(`UPDATE opportunities SET status = ? WHERE id = ?`).run('REJECTED', oppId);
          
          const rejectionRepo = new (require('@autogig/db').SQLiteRejectionRepository)(db);
          await rejectionRepo.save({
            id: require('crypto').randomUUID(),
            opportunityId: oppId,
            reason: 'Client blocked by intelligence rules.',
            details: clientResult.reasons.join(', '),
            createdAt: new Date()
          });
          bus.acknowledge(event.eventId);
          db.exec('COMMIT');
          return;
        }

        const scorer = new OpportunityScorer();
        breakdown = scorer.score(techFit, evidenceCount, ecoResult, clientResult.trustScore, clientResult.confidence);

       
       route = breakdown.route;
       qualFlags = breakdown.qualificationFlags;
       if (route === 'REJECT') finalState = 'REJECTED';
       console.log(`${oppId} evaluated. Score: ${breakdown.overall}, Route: ${route}, Flags: ${qualFlags}`);
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`UPDATE opportunities SET status = ? WHERE id = ?`).run(finalState, oppId);
      
      const states = ['NORMALIZED', 'DEDUPLICATED', 'FILTERED', 'RETRIEVING', 'ENRICHING', 'EVALUATING'];
      if (finalState === 'REJECTED') states.push('REJECTED');

      for (let i = 0; i < states.length; i++) {
         const s = states[i];
         const prev = i === 0 ? 'DISCOVERED' : states[i-1];
         if (!canTransition(prev as any, s as any)) throw new Error(`Invalid transition: ${prev} -> ${s}`);
         const transitionId = crypto.randomUUID();
         db.prepare(`INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, causationId, actor) VALUES (?, ?, ?, ?, ?, ?)`)
           .run(oppId, prev, s, transitionId, event.eventId, 'opportunity-worker');
      }
      
      const runId = `run-${event.eventId}`;
      db.prepare(`INSERT INTO runs (id, status) VALUES (?, 'IN_PROGRESS') ON CONFLICT(id) DO NOTHING`).run(runId);
      db.prepare(`INSERT INTO run_stages (runId, stage, status, latency) VALUES (?, ?, ?, ?)`).run(runId, 'PHASE_C_PIPELINE', 'SUCCESS', 250);
      
      if (breakdown) {
         await evalRepo.saveEvaluation({
            id: `eval-${oppId}`,
            opportunityId: oppId,
            evaluationRoute: route,
            qualificationFlags: qualFlags,
            priority: route === 'HIGH_PRIORITY_DEEP_REASON' ? 1 : 0,
            deepReasonStatus: (route === 'DEEP_REASON_REQUIRED' || route === 'HIGH_PRIORITY_DEEP_REASON' || route === 'COUNTER_CANDIDATE') ? 'PENDING' : 'NOT_REQUIRED',
            scoreBreakdown: breakdown,
            createdAt: new Date()
         });
      }

      if (finalState === 'EVALUATING' && (route === 'DEEP_REASON_REQUIRED' || route === 'HIGH_PRIORITY_DEEP_REASON' || route === 'COUNTER_CANDIDATE')) {
         bus.publish({
            eventId: `evt-deep-reason-${oppId}`,
            eventType: 'OPPORTUNITY_DEEP_REASON_REQUIRED',
            schemaVersion: '1.0',
            attempt: 1,
            createdAt: new Date(),
            payload: { opportunityId: oppId, evaluationRoute: route, qualificationFlags: qualFlags }
         });
      }
      
      bus.acknowledge(event.eventId);
      db.exec('COMMIT');
    } catch (err: any) {
      db.exec('ROLLBACK');
      throw err;
    }
  } else {
    bus.acknowledge(event.eventId);
  }
}

async function main() {
  const dbPath = path.resolve(__dirname, '../../../data/autogig.db');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  
  const repo = new SQLiteOpportunityRepository(db);
  const runs = new SQLiteRunRepository(db);
  const bus = new SQLiteEventBus(db);
  const profRepo = new SQLiteProfileRepository(db);
  const prefRepo = new SQLitePreferenceRepository(db);
  const evRepo = new SQLiteEvidenceRepository(db);
  const evalRepo = new SQLiteEvaluationRepository(db);
  
  const isOnce = process.argv.includes('--once');
  let idleCount = 0;

  while (true) {
    bus.reclaimStale(5 * 60 * 1000);
    const event = bus.claimPending();
    if (event) {
      idleCount = 0;
      try {
        await processEvent(db, repo, runs, bus, profRepo, prefRepo, evRepo, evalRepo, event);
      } catch (err: any) {
        console.error(`Failed event ${event.eventId}:`, err.message);
        bus.fail(event.eventId, err.message, MAX_RETRIES, BASE_DELAY);
      }
    } else {
      if (isOnce) {
        if (idleCount > 2) break; 
        idleCount++;
      }
      await sleep(1000);
    }
  }
}

main().catch(console.error);





