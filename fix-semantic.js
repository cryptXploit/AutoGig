const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', 'utf-8');
const searchStr = 'async findSimilar';
const insert = `
  async findSemanticDuplicate(title: string, description: string): Promise<CanonicalOpportunity | null> {
    const rows = this.db.prepare('SELECT * FROM opportunities').all() as any[];
    
    // Simple jaccard similarity over title+description tokens for semantic proxy
    const tokenize = (t: string) => new Set((t||'').toLowerCase().match(/\\w+/g) || []);
    const tokens = tokenize(title + ' ' + description);
    if (tokens.size === 0) return null;

    for (const r of rows) {
      const rTokens = tokenize(r.title + ' ' + r.description);
      const intersection = new Set([...tokens].filter(x => rTokens.has(x)));
      const union = new Set([...tokens, ...rTokens]);
      const sim = intersection.size / (union.size || 1);
      if (sim > 0.85) return this.mapRow(r);
    }
    return null;
  }
`;
code = code.replace(searchStr, insert + '\n  ' + searchStr);
fs.writeFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', code);
