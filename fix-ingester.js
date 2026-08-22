const fs = require('fs');
let code = fs.readFileSync('apps/ingestion-worker/src/evidence/EvidenceIngester.ts', 'utf-8');
code = code.replace(/private evidenceRepo: any/, "private evidenceRepo: import('@autogig/core').EvidenceRepository");
code = code.replace(/const record = \{[\s\S]*?\};/, `
    let extractionError = undefined;
    if (extractionStatus === 'FAILED') extractionError = type === 'TEXT' ? 'Read Error' : 'No native extraction library available';
    const record: import('@autogig/core').Evidence = {
      id,
      userId: 'u1',
      type,
      storageKey: filePath,
      createdAt: new Date(),
      metadata: {
        originalFilename,
        mimeType,
        extractedText,
        extractedFacts: [],
        relevantSkills: [],
        confidence: extractionStatus === 'SUCCESS' ? 1.0 : 0.0,
        extractionStatus,
        extractionError
      }
    };
`);
code = code.replace(/saveEvidence/, 'save');
fs.writeFileSync('apps/ingestion-worker/src/evidence/EvidenceIngester.ts', code);
