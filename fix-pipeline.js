const fs = require('fs');
let code = fs.readFileSync('packages/engine/src/ingestion/Pipeline.ts', 'utf-8');
code = code.replace(/\/\/ d\. Semantic similarity[\s\S]*?\/\/ 4\. Persistence/, `
    // d. Semantic similarity -> uncertain duplicate (signal only, don't delete)
    if (typeof (this.oppRepo as any).findSemanticDuplicate === 'function') {
      const semanticDup = await (this.oppRepo as any).findSemanticDuplicate(canonical.title, canonical.description);
      if (semanticDup) {
         canonical.uncertainDuplicateReason = 'Semantic similarity matched with ' + semanticDup.id;
      }
    }

    // 4. Persistence
`);
fs.writeFileSync('packages/engine/src/ingestion/Pipeline.ts', code);
