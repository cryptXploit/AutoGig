const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

code = code.replace(
  "riskTolerance: 'MEDIUM',",
  `riskTolerance: 'MEDIUM',
        theme: 'SYSTEM',
        language: 'EN',
        reasoningDepth: 'MEDIUM',
        proposalStrictness: 'MEDIUM',
        evidenceStrictness: 'MEDIUM',
        humanApprovalRequired: true,
        learningEnabled: true,
        refreshInterval: 30,`
);

code = code.replace(
  "riskTolerance: row.riskTolerance || 'MEDIUM',",
  `riskTolerance: row.riskTolerance || 'MEDIUM',
      theme: row.theme || 'SYSTEM',
      language: row.language || 'EN',
      reasoningDepth: row.reasoningDepth || 'MEDIUM',
      proposalStrictness: row.proposalStrictness || 'MEDIUM',
      evidenceStrictness: row.evidenceStrictness || 'MEDIUM',
      humanApprovalRequired: row.humanApprovalRequired === undefined ? true : Boolean(row.humanApprovalRequired),
      learningEnabled: row.learningEnabled === undefined ? true : Boolean(row.learningEnabled),
      refreshInterval: row.refreshInterval || 30,`
);

code = code.replace(
  "blockedClients=excluded.blockedClients,",
  `blockedClients=excluded.blockedClients,
        theme=excluded.theme,
        language=excluded.language,
        reasoningDepth=excluded.reasoningDepth,
        proposalStrictness=excluded.proposalStrictness,
        evidenceStrictness=excluded.evidenceStrictness,
        humanApprovalRequired=excluded.humanApprovalRequired,
        learningEnabled=excluded.learningEnabled,
        refreshInterval=excluded.refreshInterval,`
);

code = code.replace(
  "INSERT INTO preferences (userId, targetRate, minRate, blockedClients, preferredProjectTypes, riskTolerance)",
  "INSERT INTO preferences (userId, targetRate, minRate, blockedClients, preferredProjectTypes, riskTolerance, theme, language, reasoningDepth, proposalStrictness, evidenceStrictness, humanApprovalRequired, learningEnabled, refreshInterval)"
);

code = code.replace(
  "JSON.stringify(pref.preferredProjectTypes || []),",
  `JSON.stringify(pref.preferredProjectTypes || []),
      pref.riskTolerance || 'MEDIUM',
      pref.theme || 'SYSTEM',
      pref.language || 'EN',
      pref.reasoningDepth || 'MEDIUM',
      pref.proposalStrictness || 'MEDIUM',
      pref.evidenceStrictness || 'MEDIUM',
      pref.humanApprovalRequired === false ? 0 : 1,
      pref.learningEnabled === false ? 0 : 1,
      pref.refreshInterval || 30
`
);

// We need to carefully remove the original pref.riskTolerance || 'MEDIUM' that is now duplicated by my replace above.
// Actually, let me just rewrite the savePreference function safely.
