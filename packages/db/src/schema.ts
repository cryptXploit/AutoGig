import { DatabaseSync } from 'node:sqlite';

export function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY,
      name TEXT,
      skills TEXT,
      experience TEXT,
      projects TEXT,
      certifications TEXT,
      preferredTechnologies TEXT,
      resumeKey TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS preferences (
      userId TEXT PRIMARY KEY,
      targetRate REAL,
      minRate REAL,
      blockedClients TEXT,
      preferredProjectTypes TEXT,
      riskTolerance TEXT,
      theme TEXT DEFAULT 'SYSTEM',
      language TEXT DEFAULT 'EN',
      reasoningDepth TEXT DEFAULT 'MEDIUM',
      proposalStrictness TEXT DEFAULT 'MEDIUM',
      evidenceStrictness TEXT DEFAULT 'MEDIUM',
      humanApprovalRequired INTEGER DEFAULT 1,
      learningEnabled INTEGER DEFAULT 1,
      refreshInterval INTEGER DEFAULT 30,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      sourceJobId TEXT NOT NULL,
      canonicalUrl TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      normalizedSkills TEXT,
      normalizedBudget REAL,
      deadline DATETIME,
      client TEXT,
      provenance TEXT,
      sourceReliability REAL,
      publishedAt DATETIME NOT NULL,
      ingestionTimestamp DATETIME NOT NULL,
      status TEXT NOT NULL,
      uncertainDuplicateReason TEXT
    );

    CREATE TABLE IF NOT EXISTS opportunity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunityId TEXT NOT NULL,
      previousState TEXT NOT NULL,
      nextState TEXT NOT NULL,
      eventId TEXT NOT NULL, causationId TEXT,
      actor TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      opportunityId TEXT,
      type TEXT NOT NULL,
      storageKey TEXT NOT NULL,
      metadata TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      actor TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      endedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS run_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      runId TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      latency INTEGER,
      retryCount INTEGER DEFAULT 0,
      error TEXT,
      startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      endedAt DATETIME,
      FOREIGN KEY (runId) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS event_queue (
      eventId TEXT PRIMARY KEY,
      eventType TEXT NOT NULL,
      schemaVersion TEXT DEFAULT '1.0',
      attempt INTEGER DEFAULT 1,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      availableAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      claimedAt DATETIME,
      processedAt DATETIME,
      lastError TEXT
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      overall REAL,
      technicalFit REAL,
      evidenceStrength REAL,
      budgetFit REAL,
      preferenceFit REAL,
      scopeClarity REAL,
      route TEXT,
      qualificationFlags TEXT,
      priority INTEGER,
      deepReasonStatus TEXT,
      explanations TEXT,
      clientRiskAssessment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      version INTEGER NOT NULL,
      runId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      proposalId TEXT NOT NULL,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      verificationStatus TEXT NOT NULL,
      evidenceId TEXT,
      FOREIGN KEY(proposalId) REFERENCES proposals(id)
    );

    CREATE TABLE IF NOT EXISTS verification_runs (
      id TEXT PRIMARY KEY,
      proposalId TEXT NOT NULL,
      attempt INTEGER NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(proposalId) REFERENCES proposals(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      proposalId TEXT,
      tailoredResume TEXT NOT NULL,
      screeningAnswers TEXT NOT NULL,
      suggestedRate REAL,
      suggestedTimeline TEXT,
      readinessScore REAL NOT NULL,
      recommendation TEXT NOT NULL,
      evidenceCoverage TEXT,
      matchedSkills TEXT,
      emphasizedSkills TEXT,
      deEmphasizedSkills TEXT,
      missingRequirements TEXT,
      truthfulLimitations TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id),
      FOREIGN KEY(proposalId) REFERENCES proposals(id)
    );

    CREATE TABLE IF NOT EXISTS client_intelligence (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      clientIdentity TEXT NOT NULL,
      trustScore REAL NOT NULL,
      paymentReliabilityScore REAL NOT NULL,
      hiringReliabilityScore REAL NOT NULL,
      communicationRiskScore REAL NOT NULL,
      scopeRiskScore REAL NOT NULL,
      budgetSignalScore REAL NOT NULL,
      overallRiskLevel TEXT NOT NULL,
      confidence REAL NOT NULL,
      recommendation TEXT NOT NULL,
      signals TEXT NOT NULL,
      reasons TEXT NOT NULL,
      unknowns TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );

    CREATE TABLE IF NOT EXISTS outcomes (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      status TEXT NOT NULL,
      clientResponse TEXT,
      feedback TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );

        CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      intelligence TEXT,
      validationResult TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id)
    );
  `);

  try { db.exec("ALTER TABLE conversations ADD COLUMN status TEXT NOT NULL DEFAULT 'RECEIVED'"); } catch(e) {}
  try { db.exec("ALTER TABLE conversations ADD COLUMN intelligence TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE conversations ADD COLUMN validationResult TEXT"); } catch(e) {}

  try { db.exec("ALTER TABLE evaluations ADD COLUMN finalScore REAL"); } catch(e) {}
  try { db.exec("ALTER TABLE evaluations ADD COLUMN historicalIntelligence TEXT"); } catch(e) {}


  try { db.exec("ALTER TABLE outcomes ADD COLUMN clientFeedback TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN hired INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN paymentSuccess INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN rating INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN responseTimeDays INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN proposalAccepted INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN conversationAccepted INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN realizedRate INTEGER"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN realizedTimeline TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN failureReason TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE outcomes ADD COLUMN metadata TEXT"); } catch(e) {}


  db.exec(`
    CREATE TABLE IF NOT EXISTS decision_plans (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL UNIQUE,
      finalDecision TEXT NOT NULL,
      confidence REAL NOT NULL,
      priority TEXT NOT NULL,
      reasons TEXT,
      riskFlags TEXT,
      missingInformation TEXT,
      timingRecommendation TEXT,
      applicationReadiness REAL,
      humanApprovalRequired INTEGER NOT NULL,
      decisionTrace TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id) ON DELETE CASCADE
    );
  `);


  db.exec(`
    CREATE TABLE IF NOT EXISTS lifecycle_states (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL UNIQUE,
      opportunityFingerprint TEXT,
      clientFingerprint TEXT,
      applicationFingerprint TEXT,
      historicalFingerprint TEXT,
      conversationFingerprint TEXT,
      lastDecisionPlanId TEXT,
      lastEvaluatedAt TEXT NOT NULL,
      nextReviewAt TEXT,
      changeReason TEXT,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decision_plan_history (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL,
      decisionPlanId TEXT NOT NULL,
      previousDecision TEXT,
      newDecision TEXT NOT NULL,
      triggerEvent TEXT NOT NULL,
      changeReason TEXT,
      previousConfidence REAL,
      newConfidence REAL NOT NULL,
      decisionTrace TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id) ON DELETE CASCADE
    );
  `);


  db.exec(`
    CREATE TABLE IF NOT EXISTS decision_explainability (
      id TEXT PRIMARY KEY,
      opportunityId TEXT NOT NULL UNIQUE,
      decision TEXT NOT NULL,
      summary TEXT,
      confidence REAL NOT NULL,
      evidenceCoverage REAL NOT NULL,
      reportJson TEXT NOT NULL,
      generatedAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(opportunityId) REFERENCES opportunities(id) ON DELETE CASCADE
    );
  `);

}