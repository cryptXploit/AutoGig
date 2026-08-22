const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');

const newEvRepo = `export class SQLiteEvidenceRepository {
  constructor(private db: DatabaseSync) {}
  
  async findById(id: string): Promise<any | null> {
    const row = this.db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    if (!row) return null;
    return row;
  }
  
  async save(evidence: any): Promise<void> {
    this.db.prepare(\`
      INSERT INTO evidence (id, userId, type, url, content, metadata, extractionStatus, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        content=excluded.content,
        metadata=excluded.metadata,
        extractionStatus=excluded.extractionStatus
    \`).run(
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
}`;

code = code.replace(/export class SQLiteEvidenceRepository \{[\s\S]*?\}\s*\}/, newEvRepo);
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
