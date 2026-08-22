const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/opportunity-worker/src/index.ts');
let code = fs.readFileSync(file, 'utf8');

// The replacement was already attempted, it's missing backticks. Let's just fix the backticks in the file.
// Or wait, let's just use regex to fix db.prepare(UPDATE -> db.prepare(`UPDATE
code = code.replace(/db\.prepare\(UPDATE/g, 'db.prepare(`UPDATE');
code = code.replace(/WHERE id = \?\)\.run/g, 'WHERE id = ?`).run');
code = code.replace(/db\.prepare\(SELECT/g, 'db.prepare(`SELECT');
code = code.replace(/WHERE opportunityId = \?\"\)\.get/g, 'WHERE opportunityId = ?`).get');

// Actually wait, let's just write the entire `processEvent` function correctly via string interpolation in JS.

code = code.replace(/async function processEvent\([\s\S]*?async function main/m, 
`async function processEvent(
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
  
  if (!opp) throw new Error(\`Opportunity not found: \${oppId}\`);

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

    console.log(\`Phase D starting for \${oppId}...\`);
    
    const evidenceList = await evRepo.getEvidenceForSkills(profile.userId, opp.normalizedSkills);
    const evaluation = db.prepare(\`SELECT * FROM evaluations WHERE opportunityId = ?\`).get(oppId);
    
    const deepResult = await reasoner.evaluate(opp, evaluation, evidenceList, profile, pref);
    
    db.prepare(\`UPDATE evaluations SET clientRiskAssessment = ?, deepReasonStatus = 'COMPLETED' WHERE opportunityId = ?\`)
      .run(deepResult.clientRiskAssessment || 'UNKNOWN', oppId);
      
    if (deepResult.recommendedAction === 'SKIP') {
       console.log(\`\${oppId} skipped by AI.\`);
       if (!canTransition('EVALUATING', 'REJECTED')) throw new Error('Invalid transition EVALUATING -> REJECTED');
       db.prepare(\`UPDATE opportunities SET status = 'REJECTED' WHERE id = ?\`).run(oppId);
       bus.acknowledge(event.eventId);
       return;
    }
    
    if (!canTransition('EVALUATING', 'SHORTLISTED') || !canTransition('SHORTLISTED', 'PROPOSAL_GENERATING')) {
       throw new Error('Invalid transition to PROPOSAL_GENERATING');
    }
    db.prepare(\`UPDATE opportunities SET status = 'PROPOSAL_GENERATING' WHERE id = ?\`).run(oppId);
    
    const propText = await propGen.generate(opp, deepResult, evidenceList, profile, deepResult.recommendedAction);
    
    const proposalId = \`prop-\${oppId}-1\`;
    await proposalRepo.saveProposal({
       id: proposalId,
       opportunityId: oppId,
       text: propText,
       status: 'VERIFYING',
       version: 1,
       runId: event.eventId
    });
    
    if (!canTransition('PROPOSAL_GENERATING', 'VERIFYING')) throw new Error('Invalid transition to VERIFYING');
    db.prepare(\`UPDATE opportunities SET status = 'VERIFYING' WHERE id = ?\`).run(oppId);
    
    const vResult = await vGate.runVerificationLoop(propText, evidenceList, 2);
    
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
       console.log(\`\${oppId} PROPOSAL BLOCKED!\`);
    } else {
       if (!canTransition('VERIFYING', 'VERIFIED') || !canTransition('VERIFIED', 'PENDING_APPROVAL')) {
           throw new Error('Invalid transition to PENDING_APPROVAL');
       }
       db.prepare(\`UPDATE opportunities SET status = 'PENDING_APPROVAL' WHERE id = ?\`).run(oppId);
       console.log(\`\${oppId} PROPOSAL VERIFIED & PENDING_APPROVAL.\`);
    }
    
    bus.acknowledge(event.eventId);
    return;
  }

  if (event.eventType === 'OPPORTUNITY_DISCOVERED' && opp.status === 'DISCOVERED' && canTransition('DISCOVERED', 'NORMALIZED')) {
    const allOpps = db.prepare(\`SELECT id FROM opportunities WHERE sourceJobId = ? AND id != ?\`).all(opp.sourceJobId, opp.id);
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
       console.log(\`\${oppId} rejected by rules: \${ruleResult.reason}\`);
    } else {
       const retriever = new LocalSimilarityRetriever();
       const economics = new EconomicEngine();
       
       const techFit = retriever.computeTechnicalFit(opp, profile);
       const ecoResult = economics.calculate(opp, pref);
       
       const evidenceList = await evRepo.getEvidenceForSkills(profile.userId, opp.normalizedSkills);
       let evidenceCount = evidenceList.length;
       
       const scorer = new OpportunityScorer();
       breakdown = scorer.score(techFit, evidenceCount, ecoResult, 80, 80);
       
       route = breakdown.route;
       qualFlags = breakdown.qualificationFlags;
       if (route === 'REJECT') finalState = 'REJECTED';
       console.log(\`\${oppId} evaluated. Score: \${breakdown.overall}, Route: \${route}, Flags: \${qualFlags}\`);
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(\`UPDATE opportunities SET status = ? WHERE id = ?\`).run(finalState, oppId);
      
      const states = ['NORMALIZED', 'DEDUPLICATED', 'FILTERED', 'RETRIEVING', 'ENRICHING', 'EVALUATING'];
      if (finalState === 'REJECTED') states.push('REJECTED');

      for (let i = 0; i < states.length; i++) {
         const s = states[i];
         const prev = i === 0 ? 'DISCOVERED' : states[i-1];
         if (!canTransition(prev as any, s as any)) throw new Error(\`Invalid transition: \${prev} -> \${s}\`);
         const transitionId = crypto.randomUUID();
         db.prepare(\`INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, causationId, actor) VALUES (?, ?, ?, ?, ?, ?)\`)
           .run(oppId, prev, s, transitionId, event.eventId, 'opportunity-worker');
      }
      
      const runId = \`run-\${event.eventId}\`;
      db.prepare(\`INSERT INTO runs (id, status) VALUES (?, 'IN_PROGRESS') ON CONFLICT(id) DO NOTHING\`).run(runId);
      db.prepare(\`INSERT INTO run_stages (runId, stage, status, latency) VALUES (?, ?, ?, ?)\`).run(runId, 'PHASE_C_PIPELINE', 'SUCCESS', 250);
      
      if (breakdown) {
         await evalRepo.saveEvaluation({
            id: \`eval-\${oppId}\`,
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
            eventId: \`evt-deep-reason-\${oppId}\`,
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

async function main`);

// Missing imports: SQLiteProposalRepository, SQLiteClaimRepository, SQLiteVerificationRepository
code = code.replace(/SQLiteEvaluationRepository\n\} from '@autogig\/db';/g, 
`SQLiteEvaluationRepository,
  SQLiteProposalRepository,
  SQLiteClaimRepository,
  SQLiteVerificationRepository
} from '@autogig/db';`);

fs.writeFileSync(file, code);
