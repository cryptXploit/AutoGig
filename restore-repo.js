const fs = require('fs');
let code = fs.readFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', 'utf-8');
const evRepo = `export class SQLiteEvidenceRepository {
  constructor(private db: DatabaseSync) {}
  async getEvidenceForSkills(userId: string, skills: string[]): Promise<any[]> {
    if (skills.length === 0) return [];
    const rows = this.db.prepare('SELECT * FROM evidence WHERE userId = ?').all(userId) as any[];
    return rows.filter(r => {
       const meta = r.metadata ? JSON.parse(r.metadata) : {};
       const evSkills = meta.skills || [];
       return evSkills.some((s: string) => skills.includes(s));
    });
  }
}

export class SQLiteEvaluationRepository`;

code = code.replace("export class SQLiteEvaluationRepository", evRepo);
fs.writeFileSync('packages/db/src/repositories/SQLiteOtherRepositories.ts', code);
