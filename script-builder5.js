const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/opportunity-worker/src/index.ts');
let code = fs.readFileSync(file, 'utf8');

// I will write a custom regex replacement or just use JS to find and replace the deep reason block
const startIndex = code.indexOf(`if (event.eventType === 'OPPORTUNITY_DEEP_REASON_REQUIRED') {`);
const endIndex = code.indexOf(`if (event.eventType === 'OPPORTUNITY_DISCOVERED'`);

if (startIndex > -1 && endIndex > -1) {
  const newBlock = `if (event.eventType === 'OPPORTUNITY_DEEP_REASON_REQUIRED') {
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
      
    // State Persistence helper
    const advanceState = (newState: string) => {
        const prev = db.prepare(\`SELECT status FROM opportunities WHERE id = ?\`).get(oppId).status;
        if (!canTransition(prev as any, newState as any)) throw new Error(\`Invalid transition \${prev} -> \${newState}\`);
        db.prepare(\`UPDATE opportunities SET status = ? WHERE id = ?\`).run(newState, oppId);
        db.prepare(\`INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, causationId, actor) VALUES (?, ?, ?, ?, ?, ?)\`)
          .run(oppId, prev, newState, crypto.randomUUID(), event.eventId, 'opportunity-worker');
    };

    db.exec('BEGIN IMMEDIATE');
    try {
        if (deepResult.recommendedAction === 'SKIP') {
           console.log(\`\${oppId} skipped by AI.\`);
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
    
    const propText = await propGen.generate(opp, deepResult, evidenceList, profile, deepResult.recommendedAction);
    const proposalId = \`prop-\${oppId}-1\`;
    
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
    
    const vResult = await vGate.runVerificationLoop(propGen, opp, deepResult, profile, propText, evidenceList, 2);
    
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
       db.exec('BEGIN IMMEDIATE');
       try {
           advanceState('VERIFIED');
           advanceState('PENDING_APPROVAL');
           console.log(\`\${oppId} PROPOSAL VERIFIED & PENDING_APPROVAL.\`);
           db.exec('COMMIT');
       } catch(err) {
           db.exec('ROLLBACK');
           throw err;
       }
    }
    
    bus.acknowledge(event.eventId);
    return;
  }

  `;
  const modified = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync(file, modified);
}
