const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', 'utf-8');
code = code.replace(/async findBySource\(source: string, sourceJobId: string\): Promise<any>/g, 'async findBySource(source: string, sourceJobId: string): Promise<CanonicalOpportunity | null>');
code = code.replace(/async findByUrl\(canonicalUrl: string\): Promise<any>/g, 'async findByUrl(canonicalUrl: string): Promise<CanonicalOpportunity | null>');
code = code.replace(/async findSimilar\(title: string, client: any, publishedAt: Date\): Promise<any>/g, 'async findSimilar(title: string, client: import("@autogig/core").OpportunityClient | undefined, publishedAt: Date): Promise<CanonicalOpportunity | null>');
code = code.replace(/return this\.db\.prepare\('SELECT \* FROM opportunities WHERE source = \? AND sourceJobId = \?'\)\.get\(source, sourceJobId\);/g, 'const row = this.db.prepare(\'SELECT * FROM opportunities WHERE source = ? AND sourceJobId = ?\').get(source, sourceJobId) as any;\n    return row ? this.mapRow(row) : null;');
code = code.replace(/return this\.db\.prepare\('SELECT \* FROM opportunities WHERE canonicalUrl = \?'\)\.get\(canonicalUrl\);/g, 'const row = this.db.prepare(\'SELECT * FROM opportunities WHERE canonicalUrl = ?\').get(canonicalUrl) as any;\n    return row ? this.mapRow(row) : null;');
code = code.replace(/return r;/g, 'return this.mapRow(r);');
fs.writeFileSync('packages/db/src/repositories/SQLiteOpportunityRepository.ts', code);
