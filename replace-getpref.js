const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

const newGetPref = `async getPreference(userId: string): Promise<Preference | null> {
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
  }`;

code = code.replace(/async getPreference.*?\}\n\s*return\s*\{.*?\};\n\s*\}/s, newGetPref);
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
