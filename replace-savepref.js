const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

const newSavePref = `async savePreference(pref: Preference): Promise<void> {
    this.db.prepare(\`INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)\`).run(pref.userId, pref.userId + '@autogig.com');
    this.db.prepare(\`
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
    \`).run(
      pref.userId,
      pref.targetRate,
      pref.minRate,
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
  }`;

// Replace the existing savePreference using regex
code = code.replace(/async savePreference.*?\}\);?\s*\}/s, newSavePref);
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
