import { DecisionPlan, LifecycleState, DecisionPlanHistory, ExplainabilityReport } from '@autogig/core';
import { EvidenceRepository, Evidence, Profile, Preference } from '@autogig/core';
import { DatabaseSync } from 'node:sqlite';

export class SQLiteProfileRepository {
  constructor(private db: DatabaseSync) {}
  async getProfile(userId: string): Promise<Profile | null> {
    const row = this.db.prepare('SELECT * FROM profiles WHERE userId = ?').get(userId) as any;
    if (!row) {
      // Return a default profile if none exists
      return {
        userId,
        name: 'AutoGig User',
        skills: ['TypeScript', 'Node.js', 'React'],
        experience: [],
        projects: [],
        certifications: [],
        preferredTechnologies: []
      };
    }
    return {
      userId: row.userId,
      name: row.name,
      skills: row.skills ? JSON.parse(row.skills) : [],
      experience: row.experience ? JSON.parse(row.experience) : [],
      projects: row.projects ? JSON.parse(row.projects) : [],
      certifications: row.certifications ? JSON.parse(row.certifications) : [],
      preferredTechnologies: row.preferredTechnologies ? JSON.parse(row.preferredTechnologies) : [],
      resumeKey: row.resumeKey
    };
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.db.prepare(`INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)`).run(profile.userId, profile.userId + '@autogig.com');
    this.db.prepare(`
      INSERT INTO profiles (userId, name, skills, experience, projects, certifications, preferredTechnologies, resumeKey)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET 
        name=excluded.name, 
        skills=excluded.skills,
        experience=excluded.experience,
        projects=excluded.projects,
        certifications=excluded.certifications,
        preferredTechnologies=excluded.preferredTechnologies,
        resumeKey=excluded.resumeKey,
        updatedAt=CURRENT_TIMESTAMP
    `).run(
      profile.userId,
      profile.name || null,
      JSON.stringify(profile.skills || []),
      JSON.stringify(profile.experience || []),
      JSON.stringify(profile.projects || []),
      JSON.stringify(profile.certifications || []),
      JSON.stringify(profile.preferredTechnologies || []),
      profile.resumeKey || null
    );
  }
}

export class SQLitePreferenceRepository {
  constructor(private db: DatabaseSync) {}
  async getPreference(userId: string): Promise<Preference | null> {
    const row = this.db.prepare('SELECT * FROM preferences WHERE userId = ?').get(userId) as any;
    if (!row) {
      return {
        userId,
        targetRate: 100,
        minRate: 50,
        blockedClients: [],
        preferredProjectTypes: [],
        riskTolerance: 'MEDIUM',
        theme: 'SYSTEM',
        language: 'EN',
        reasoningDepth: 'MEDIUM',
        proposalStrictness: 'MEDIUM',
        evidenceStrictness: 'MEDIUM',
        humanApprovalRequired: true,
        learningEnabled: true,
        refreshInterval: 30,
        updatedAt: new Date()
      };
    }
    return {
      userId: row.userId,
      targetRate: row.targetRate || 100,
      minRate: row.minRate || 50,
      blockedClients: row.blockedClients ? JSON.parse(row.blockedClients) : [],
      preferredProjectTypes: row.preferredProjectTypes ? JSON.parse(row.preferredProjectTypes) : [],
      riskTolerance: row.riskTolerance || 'MEDIUM',
      theme: row.theme || 'SYSTEM',
      language: row.language || 'EN',
      reasoningDepth: row.reasoningDepth || 'MEDIUM',
      proposalStrictness: row.proposalStrictness || 'MEDIUM',
      evidenceStrictness: row.evidenceStrictness || 'MEDIUM',
      humanApprovalRequired: row.humanApprovalRequired === undefined ? true : Boolean(row.humanApprovalRequired),
      learningEnabled: row.learningEnabled === undefined ? true : Boolean(row.learningEnabled),
      refreshInterval: row.refreshInterval || 30,
      updatedAt: new Date(row.updatedAt || Date.now())
    };
  }

  async savePreference(pref: Preference): Promise<void> {
    this.db.prepare(`INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)`).run(pref.userId || 'user-local', pref.userId + '@autogig.com');
    this.db.prepare(`
      INSERT INTO preferences (userId, targetRate, minRate, blockedClients, preferredProjectTypes, riskTolerance, theme, language, reasoningDepth, proposalStrictness, evidenceStrictness, humanApprovalRequired, learningEnabled, refreshInterval)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET 
        targetRate=excluded.targetRate,
        minRate=excluded.minRate,
        blockedClients=excluded.blockedClients,
        preferredProjectTypes=excluded.preferredProjectTypes,
        riskTolerance=excluded.riskTolerance,
        theme=excluded.theme,
        language=excluded.language,
        reasoningDepth=excluded.reasoningDepth,
        proposalStrictness=excluded.proposalStrictness,
        evidenceStrictness=excluded.evidenceStrictness,
        humanApprovalRequired=excluded.humanApprovalRequired,
        learningEnabled=excluded.learningEnabled,
        refreshInterval=excluded.refreshInterval,
        updatedAt=CURRENT_TIMESTAMP
    `).run(
      pref.userId,
      pref.targetRate || 100,
      pref.minRate || 50,
      JSON.stringify(pref.blockedClients || []),
      JSON.stringify(pref.preferredProjectTypes || []),
      pref.riskTolerance || 'MEDIUM',
      pref.theme || 'SYSTEM',
      pref.language || 'EN',
      pref.reasoningDepth || 'MEDIUM',
      pref.proposalStrictness || 'MEDIUM',
      pref.evidenceStrictness || 'MEDIUM',
      pref.humanApprovalRequired === false ? 0 : 1,
      pref.learningEnabled === false ? 0 : 1,
      pref.refreshInterval || 30
    );
  }
}

export class SQLiteEvidenceRepository {
  constructor(private db: DatabaseSync) {}
  
  async findById(id: string): Promise<any | null> {
    const row = this.db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    if (!row) return null;
    return row;
  }
  
  async save(evidence: any): Promise<void> {
    this.db.prepare(`
      INSERT INTO evidence (id, userId, type, url, content, metadata, extractionStatus, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        content=excluded.content,
        metadata=excluded.metadata,
        extractionStatus=excluded.extractionStatus
    `).run(
      evidence.id, evidence.userId, evidence.type, evidence.url, 
      evidence.content, JSON.stringify(evidence.metadata || {}), 
      evidence.extractionStatus, 
      evidence.createdAt instanceof Date ? evidence.createdAt.toISOString() : new Date().toISOString()
    );
  }

  async getEvidenceForSkills(userId: string, skills: string[]): Promise<any[]> {
    if (skills.length === 0) return [];
    const rows = this.db.prepare('SELECT * FROM evidence WHERE userId = ?').all(userId) as any[];
    return rows.filter(r => {
       const meta = r.metadata ? JSON.parse(r.metadata) : {};
       const evSkills = meta.skills || [];
       return evSkills.some((s: string) => skills.includes(s));
    });
  }
}

export class SQLiteEvaluationRepository {
  constructor(private db: DatabaseSync) {}
  
    async findByOpportunityId(opportunityId: string): Promise<any> {
      const row = this.db.prepare('SELECT * FROM evaluations WHERE opportunityId = ?').get(opportunityId) as any;
      if (!row) return null;
      return {
        id: row.id,
        opportunityId: row.opportunityId,
        evaluationRoute: row.route,
        qualificationFlags: row.qualificationFlags ? JSON.parse(row.qualificationFlags) : [],
        priority: row.priority,
        deepReasonStatus: row.deepReasonStatus,
        finalScore: row.finalScore,
        historicalIntelligence: row.historicalIntelligence ? JSON.parse(row.historicalIntelligence) : undefined,
        scoreBreakdown: {
          overall: row.overall,
          technicalFit: row.technicalFit,
          evidenceStrength: row.evidenceStrength,
          budgetFit: row.budgetFit,
          preferenceFit: row.preferenceFit,
          scopeClarity: row.scopeClarity,
          route: row.route,
          clientRiskAssessment: row.clientRiskAssessment,
          explanations: row.explanations ? JSON.parse(row.explanations) : []
        },
        createdAt: new Date(row.createdAt)
      };
    }

    async saveEvaluation(record: any): Promise<void> {
    this.db.prepare(`
      INSERT INTO evaluations (
        id, opportunityId, overall, technicalFit, evidenceStrength, budgetFit, 
        preferenceFit, scopeClarity, route, qualificationFlags, priority, 
        deepReasonStatus, explanations, clientRiskAssessment, finalScore, historicalIntelligence
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        overall=excluded.overall,
        technicalFit=excluded.technicalFit,
        evidenceStrength=excluded.evidenceStrength,
        budgetFit=excluded.budgetFit,
        preferenceFit=excluded.preferenceFit,
        scopeClarity=excluded.scopeClarity,
        route=excluded.route,
        qualificationFlags=excluded.qualificationFlags,
        priority=excluded.priority,
        deepReasonStatus=excluded.deepReasonStatus,
        explanations=excluded.explanations,
        clientRiskAssessment=excluded.clientRiskAssessment,
        finalScore=excluded.finalScore,
        historicalIntelligence=excluded.historicalIntelligence
    `).run(
      record.id,
      record.opportunityId,
      record.scoreBreakdown?.overall ?? 0,
      record.scoreBreakdown?.technicalFit ?? 0,
      record.scoreBreakdown?.evidenceStrength ?? 0,
      record.scoreBreakdown?.budgetFit ?? 0,
      record.scoreBreakdown?.preferenceFit ?? 0,
      record.scoreBreakdown?.scopeClarity ?? 0,
      record.evaluationRoute,
      JSON.stringify(record.qualificationFlags || []),
      record.priority || 0,
      record.deepReasonStatus || 'NOT_REQUIRED',
      JSON.stringify(record.scoreBreakdown?.explanations || []),
      record.scoreBreakdown?.clientRiskAssessment || null,
      record.finalScore || null,
      record.historicalIntelligence ? JSON.stringify(record.historicalIntelligence) : null
    );
  }
}

export class SQLiteProposalRepository {
  constructor(private db: DatabaseSync) {}

  async saveProposal(record: any): Promise<void> {
    this.db.prepare(`
      INSERT INTO proposals (id, opportunityId, text, status, version, runId)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status, text=excluded.text
    `).run(record.id, record.opportunityId, record.text, record.status, record.version, record.runId);
  }

  async getProposal(id: string): Promise<any> {
    return this.db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  }
}

export class SQLiteClaimRepository {
  constructor(private db: DatabaseSync) {}

  async saveClaims(claims: any[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO claims (id, proposalId, text, category, verificationStatus, evidenceId)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET verificationStatus=excluded.verificationStatus
    `);
    for (const c of claims) {
      stmt.run(c.id, c.proposalId, c.text, c.category, c.verificationStatus, c.evidenceId || null);
    }
  }

  async getClaimsForProposal(proposalId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM claims WHERE proposalId = ?').all(proposalId) as any[];
  }
}

export class SQLiteVerificationRepository {
  constructor(private db: DatabaseSync) {}

  async saveVerificationRun(run: any): Promise<void> {
    this.db.prepare(`
      INSERT INTO verification_runs (id, proposalId, attempt, status, result)
      VALUES (?, ?, ?, ?, ?)
    `).run(run.id, run.proposalId, run.attempt, run.status, JSON.stringify(run.result));
  }
}


export class SQLiteConversationRepository {
  constructor(private db: DatabaseSync) {}
  
  findByOpportunityId(opportunityId: string): import('@autogig/core').ConversationMessage[] {
    const rows = this.db.prepare(`SELECT * FROM conversations WHERE opportunityId = ? ORDER BY createdAt ASC`).all(opportunityId);
    return rows.map((row: any) => ({
      id: row.id,
      opportunityId: row.opportunityId,
      sender: row.sender,
      text: row.text,
      status: row.status,
      intelligence: row.intelligence ? JSON.parse(row.intelligence) : undefined,
      validationResult: row.validationResult ? JSON.parse(row.validationResult) : undefined,
      createdAt: new Date(row.createdAt)
    }));
  }

  save(message: import('@autogig/core').ConversationMessage): void {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (
        id, opportunityId, sender, text, status, intelligence, validationResult, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        text=excluded.text,
        status=excluded.status,
        intelligence=excluded.intelligence,
        validationResult=excluded.validationResult
    `);
    stmt.run(
      message.id,
      message.opportunityId,
      message.sender,
      message.text,
      message.status,
      message.intelligence ? JSON.stringify(message.intelligence) : null,
      message.validationResult ? JSON.stringify(message.validationResult) : null,
      message.createdAt.toISOString()
    );
  }
}


export class SQLiteDecisionPlanRepository {
  constructor(private db: DatabaseSync) {}

  save(plan: DecisionPlan): void {
    const stmt = this.db.prepare(`
      INSERT INTO decision_plans (
        id, opportunityId, finalDecision, confidence, priority, reasons, riskFlags,
        missingInformation, timingRecommendation, applicationReadiness, humanApprovalRequired,
        decisionTrace, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(opportunityId) DO UPDATE SET
        finalDecision=excluded.finalDecision,
        confidence=excluded.confidence,
        priority=excluded.priority,
        reasons=excluded.reasons,
        riskFlags=excluded.riskFlags,
        missingInformation=excluded.missingInformation,
        timingRecommendation=excluded.timingRecommendation,
        applicationReadiness=excluded.applicationReadiness,
        humanApprovalRequired=excluded.humanApprovalRequired,
        decisionTrace=excluded.decisionTrace,
        updatedAt=excluded.updatedAt
    `);
    
    stmt.run(
      plan.id,
      plan.opportunityId,
      plan.finalDecision,
      plan.confidence,
      plan.priority,
      JSON.stringify(plan.reasons),
      JSON.stringify(plan.riskFlags),
      JSON.stringify(plan.missingInformation),
      plan.timingRecommendation,
      plan.applicationReadiness,
      plan.humanApprovalRequired ? 1 : 0,
      JSON.stringify(plan.decisionTrace),
      plan.createdAt.toISOString(),
      plan.updatedAt.toISOString()
    );
  }

  findByOpportunityId(opportunityId: string): DecisionPlan | null {
    const stmt = this.db.prepare('SELECT * FROM decision_plans WHERE opportunityId = ?');
    const row = stmt.get(opportunityId) as any;
    if (!row) return null;
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      finalDecision: row.finalDecision,
      confidence: row.confidence,
      priority: row.priority,
      reasons: JSON.parse(row.reasons || '[]'),
      riskFlags: JSON.parse(row.riskFlags || '[]'),
      recommendedNextAction: '',
      missingInformation: JSON.parse(row.missingInformation || '[]'),
      timingRecommendation: row.timingRecommendation,
      applicationReadiness: row.applicationReadiness,
      humanApprovalRequired: row.humanApprovalRequired === 1,
      evidenceIds: [],
      decisionTrace: JSON.parse(row.decisionTrace || '{}'),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}


export class SQLiteLifecycleRepository {
  constructor(private db: DatabaseSync) {}

  save(state: LifecycleState): void {
    const stmt = this.db.prepare(`
      INSERT INTO lifecycle_states (
        id, opportunityId, opportunityFingerprint, clientFingerprint, applicationFingerprint,
        historicalFingerprint, conversationFingerprint, lastDecisionPlanId,
        lastEvaluatedAt, nextReviewAt, changeReason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(opportunityId) DO UPDATE SET
        opportunityFingerprint=excluded.opportunityFingerprint,
        clientFingerprint=excluded.clientFingerprint,
        applicationFingerprint=excluded.applicationFingerprint,
        historicalFingerprint=excluded.historicalFingerprint,
        conversationFingerprint=excluded.conversationFingerprint,
        lastDecisionPlanId=excluded.lastDecisionPlanId,
        lastEvaluatedAt=excluded.lastEvaluatedAt,
        nextReviewAt=excluded.nextReviewAt,
        changeReason=excluded.changeReason
    `);
    
    stmt.run(
      state.id,
      state.opportunityId,
      state.opportunityFingerprint,
      state.clientFingerprint,
      state.applicationFingerprint,
      state.historicalFingerprint,
      state.conversationFingerprint,
      state.lastDecisionPlanId || null,
      state.lastEvaluatedAt.toISOString(),
      state.nextReviewAt ? state.nextReviewAt.toISOString() : null,
      state.changeReason || null
    );
  }

  findByOpportunityId(opportunityId: string): LifecycleState | null {
    const stmt = this.db.prepare('SELECT * FROM lifecycle_states WHERE opportunityId = ?');
    const row = stmt.get(opportunityId) as any;
    if (!row) return null;
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      opportunityFingerprint: row.opportunityFingerprint,
      clientFingerprint: row.clientFingerprint,
      applicationFingerprint: row.applicationFingerprint,
      historicalFingerprint: row.historicalFingerprint,
      conversationFingerprint: row.conversationFingerprint,
      lastDecisionPlanId: row.lastDecisionPlanId,
      lastEvaluatedAt: new Date(row.lastEvaluatedAt),
      nextReviewAt: row.nextReviewAt ? new Date(row.nextReviewAt) : undefined,
      changeReason: row.changeReason
    };
  }
}

export class SQLiteDecisionHistoryRepository {
  constructor(private db: DatabaseSync) {}

  save(history: DecisionPlanHistory): void {
    const stmt = this.db.prepare(`
      INSERT INTO decision_plan_history (
        id, opportunityId, decisionPlanId, previousDecision, newDecision,
        triggerEvent, changeReason, previousConfidence, newConfidence,
        decisionTrace, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      history.id,
      history.opportunityId,
      history.decisionPlanId,
      history.previousDecision || null,
      history.newDecision,
      history.triggerEvent,
      history.changeReason,
      history.previousConfidence || null,
      history.newConfidence,
      JSON.stringify(history.decisionTrace),
      history.createdAt.toISOString()
    );
  }

  findByOpportunityId(opportunityId: string): DecisionPlanHistory[] {
    const stmt = this.db.prepare('SELECT * FROM decision_plan_history WHERE opportunityId = ? ORDER BY createdAt DESC');
    const rows = stmt.all(opportunityId) as any[];
    return rows.map(row => ({
      id: row.id,
      opportunityId: row.opportunityId,
      decisionPlanId: row.decisionPlanId,
      previousDecision: row.previousDecision,
      newDecision: row.newDecision,
      triggerEvent: row.triggerEvent,
      changeReason: row.changeReason,
      previousConfidence: row.previousConfidence,
      newConfidence: row.newConfidence,
      decisionTrace: JSON.parse(row.decisionTrace || '{}'),
      createdAt: new Date(row.createdAt)
    }));
  }
}


export class SQLiteDecisionExplainabilityRepository {
  constructor(private db: DatabaseSync) {}

  save(report: ExplainabilityReport): void {
    const stmt = this.db.prepare(`
      INSERT INTO decision_explainability (
        id, opportunityId, decision, summary, confidence, evidenceCoverage, reportJson, generatedAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(opportunityId) DO UPDATE SET
        decision=excluded.decision,
        summary=excluded.summary,
        confidence=excluded.confidence,
        evidenceCoverage=excluded.evidenceCoverage,
        reportJson=excluded.reportJson,
        updatedAt=excluded.updatedAt
    `);
    
    stmt.run(
      `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      report.opportunityId,
      report.decision,
      report.summary,
      report.confidence,
      report.evidenceCoverage,
      JSON.stringify(report),
      report.generatedAt.toISOString(),
      new Date().toISOString()
    );
  }

  findByOpportunityId(opportunityId: string): ExplainabilityReport | null {
    const stmt = this.db.prepare('SELECT reportJson FROM decision_explainability WHERE opportunityId = ?');
    const row = stmt.get(opportunityId) as any;
    if (!row) return null;
    return JSON.parse(row.reportJson);
  }
}
