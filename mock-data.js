const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./data/autogig.db');

db.exec(`
  INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, normalizedSkills, normalizedBudget, deadline, client, provenance, sourceReliability, publishedAt, ingestionTimestamp, status) 
  VALUES ('opp-123', 'test', 'test-1', 'http://test.com', 'Senior AI Engineer', 'Need AI engineer for local LLM', '[]', 100, '2026-10-10T00:00:00Z', '{}', 'test', 0.9, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'PENDING_APPROVAL');
`);

db.exec(`
  INSERT INTO opportunities (id, source, sourceJobId, canonicalUrl, title, description, normalizedSkills, normalizedBudget, deadline, client, provenance, sourceReliability, publishedAt, ingestionTimestamp, status) 
  VALUES ('opp-456', 'test', 'test-2', 'http://test2.com', 'Senior AI Engineer', 'Need AI engineer for local LLM', '[]', 100, '2026-10-10T00:00:00Z', '{}', 'test', 0.9, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'VERIFIED');
`);
