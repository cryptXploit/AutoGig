import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { SQLiteClientIntelligenceRepository, SQLiteApplicationRepository } from '@autogig/db';
import { resolve } from 'path';
import { z } from 'zod';
import { 
  SQLiteOpportunityRepository, 
  SQLiteEvaluationRepository, 
  SQLiteProposalRepository, 
  SQLiteClaimRepository, 
  SQLitePreferenceRepository,
  SQLiteEvidenceRepository,
  SQLiteProfileRepository
} from '@autogig/db';
import { canTransition, CanonicalOpportunity } from '@autogig/core';
import { randomUUID } from 'crypto';

const app = express();

const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';
app.use(cors({ origin: WEB_APP_URL, credentials: true }));
app.use(express.json());

const dbPath = resolve(__dirname, '../../../data/autogig.db');
const db = new DatabaseSync(dbPath);

const oppRepo = new SQLiteOpportunityRepository(db);
const evalRepo = new SQLiteEvaluationRepository(db);
const propRepo = new SQLiteProposalRepository(db);
const claimRepo = new SQLiteClaimRepository(db);
const prefRepo = new SQLitePreferenceRepository(db);
const evRepo = new SQLiteEvidenceRepository(db);
const profileRepo = new SQLiteProfileRepository(db);

const ACTOR = 'user-local';

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const opps = await oppRepo.list();
    const stats = {
      scanned: opps.length,
      rejected: opps.filter((o: CanonicalOpportunity) => o.status === 'REJECTED').length,
      shortlisted: opps.filter((o: CanonicalOpportunity) => ['SHORTLISTED', 'PROPOSAL_GENERATING', 'VERIFYING', 'VERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'COUNTERED'].includes(o.status)).length,
      deepReasoningCompleted: opps.filter((o: CanonicalOpportunity) => ['PROPOSAL_GENERATING', 'VERIFYING', 'VERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'COUNTERED'].includes(o.status)).length,
      verifiedProposals: opps.filter((o: CanonicalOpportunity) => ['VERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'COUNTERED'].includes(o.status)).length,
      awaitingApproval: opps.filter((o: CanonicalOpportunity) => o.status === 'PENDING_APPROVAL').length,
    };
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    let opps = await oppRepo.list();
    if (status) {
      opps = opps.filter((o: CanonicalOpportunity) => o.status === status);
    }
    opps.sort((a: CanonicalOpportunity, b: CanonicalOpportunity) => new Date(b.ingestionTimestamp).getTime() - new Date(a.ingestionTimestamp).getTime());
    res.json({ success: true, data: opps });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opp = await oppRepo.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found' });
    
    let evaluation = db.prepare('SELECT * FROM evaluations WHERE opportunityId = ?').get(opp.id) as any;
      if (evaluation && typeof evaluation.scoreBreakdown === 'string') {
        const sb = JSON.parse(evaluation.scoreBreakdown);
        evaluation = { ...evaluation, ...sb, explanations: Array.isArray(sb.explanations) ? sb.explanations.join('\n') : sb.explanations };
      }
    const proposal = db.prepare('SELECT * FROM proposals WHERE opportunityId = ? ORDER BY createdAt DESC LIMIT 1').get(opp.id) as any;
    let claims = [];
    if (proposal) {
      claims = await claimRepo.getClaimsForProposal(proposal.id);
    }
    const evidence = db.prepare('SELECT * FROM evidence WHERE opportunityId = ?').all(opp.id);
    const events = db.prepare('SELECT * FROM opportunity_events WHERE opportunityId = ? ORDER BY timestamp ASC').all(opp.id);
    let verificationRuns: any[] = [];
    if (proposal) {
      verificationRuns = db.prepare('SELECT * FROM verification_runs WHERE proposalId = ? ORDER BY createdAt ASC').all(proposal.id);
    }

    
    const ciRepo = new SQLiteClientIntelligenceRepository(db);
    const clientIntelligence = await ciRepo.getByOpportunityId(opp.id);
    const appRepo = new SQLiteApplicationRepository(db);
    const applicationIntelligence = appRepo.findByOpportunityId(opp.id);
    const convRepo = new (require('@autogig/db').SQLiteConversationRepository)(db);
    const conversations = convRepo.findByOpportunityId(opp.id);

    res.json({ 
      success: true, 
      data: {
        opportunity: opp,
        evaluation,
        proposal,
        events,
        verificationRuns,
        claims,
        evidence,
        clientIntelligence,
      applicationIntelligence
    }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});


app.post('/api/opportunities/:id/outcome', async (req, res) => {
  try {
    const oppId = req.params.id;
    const { status, clientFeedback } = req.body;
    const outcomeRepo = new (require('@autogig/db').SQLiteOutcomeRepository)(db);
    
    let outcome = outcomeRepo.findByOpportunityId(oppId);
    if (!outcome) {
       outcome = {
         id: `out-${Date.now()}`,
         opportunityId: oppId,
         status: status || 'APPLIED',
         clientFeedback,
         createdAt: new Date()
       };
    } else {
       if (status) outcome.status = status;
       if (clientFeedback) outcome.clientFeedback = clientFeedback;
    }
    
    outcomeRepo.save(outcome);
    res.json({ success: true, outcome });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

  app.post('/api/opportunities/:id/approve', async (req, res) => {
  try {
    const opp = await oppRepo.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found' });
    if (opp.status === 'APPROVED') return res.json({ success: true, data: { status: 'APPROVED' } });

    if (!canTransition(opp.status, 'APPROVED')) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${opp.status} to APPROVED` });
    }
    if (opp.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, error: 'Must be PENDING_APPROVAL' });
    }

    const proposal = db.prepare('SELECT * FROM proposals WHERE opportunityId = ? ORDER BY createdAt DESC LIMIT 1').get(opp.id) as any;
    if (!proposal || proposal.status !== 'VERIFIED') {
      return res.status(400).json({ success: false, error: 'Proposal must be VERIFIED' });
    }

    const claims = await claimRepo.getClaimsForProposal(proposal.id);
    if (claims.some((c: any) => c.verificationStatus === 'BLOCK')) {
      return res.status(400).json({ success: false, error: 'Cannot approve proposal with BLOCKED claims' });
    }

    db.prepare('BEGIN').run();
    try {
      db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run('APPROVED', opp.id);
      db.prepare(`
        INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, actor, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(opp.id, opp.status, 'APPROVED', randomUUID(), ACTOR, new Date().toISOString());
      db.prepare(`
        INSERT INTO decisions (id, opportunityId, decision, actor, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), opp.id, 'APPROVE', ACTOR, new Date().toISOString());
      db.prepare('COMMIT').run();
    } catch (err) {
      db.prepare('ROLLBACK').run();
      throw err;
    }

    res.json({ success: true, data: { status: 'APPROVED' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

const CounterSchema = z.object({
  instruction: z.string().optional()
});

app.post('/api/opportunities/:id/counter', async (req, res) => {
  try {
    const opp = await oppRepo.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found' });
    if (opp.status === 'COUNTERED') return res.json({ success: true, data: { status: 'COUNTERED' } });
    
    if (!canTransition(opp.status, 'COUNTERED')) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${opp.status} to COUNTERED` });
    }
    if (opp.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, error: 'Must be PENDING_APPROVAL' });
    }

    const parseResult = CounterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid body' });
    }
    const instruction = parseResult.data.instruction || '';

    db.prepare('BEGIN').run();
    try {
      db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run('COUNTERED', opp.id);
      db.prepare(`
        INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, actor, reason, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(opp.id, opp.status, 'COUNTERED', randomUUID(), ACTOR, instruction, new Date().toISOString());
      db.prepare(`
        INSERT INTO decisions (id, opportunityId, decision, reason, actor, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), opp.id, 'COUNTER', instruction, ACTOR, new Date().toISOString());
      db.prepare('COMMIT').run();
    } catch (err) {
      db.prepare('ROLLBACK').run();
      throw err;
    }

    res.json({ success: true, data: { status: 'COUNTERED' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

const RejectSchema = z.object({
  reasonCategory: z.enum(['LOW_BUDGET', 'BAD_CLIENT_SIGNAL', 'SKILL_MISMATCH', 'BORING_SCOPE', 'INSUFFICIENT_EVIDENCE', 'WRONG_TECH_STACK', 'OTHER'])
});

app.post('/api/opportunities/:id/reject', async (req, res) => {
  try {
    const opp = await oppRepo.findById(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found' });
    if (opp.status === 'REJECTED') return res.json({ success: true, data: { status: 'REJECTED' } });

    if (!canTransition(opp.status, 'REJECTED')) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${opp.status} to REJECTED` });
    }
    
    // Explicit requirement: "APPROVE / COUNTER / REJECT are only allowed from PENDING_APPROVAL."
    if (opp.status !== 'PENDING_APPROVAL') {
       return res.status(400).json({ success: false, error: 'Must be PENDING_APPROVAL' });
    }

    const parseResult = RejectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid reasonCategory' });
    }
    const reasonCategory = parseResult.data.reasonCategory;

    db.prepare('BEGIN').run();
    try {
      db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run('REJECTED', opp.id);
      db.prepare(`
        INSERT INTO opportunity_events (opportunityId, previousState, nextState, eventId, actor, reason, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(opp.id, opp.status, 'REJECTED', randomUUID(), ACTOR, reasonCategory, new Date().toISOString());
      db.prepare(`
        INSERT INTO decisions (id, opportunityId, decision, reason, actor, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), opp.id, 'REJECT', reasonCategory, ACTOR, new Date().toISOString());
      db.prepare('COMMIT').run();
    } catch (err) {
      db.prepare('ROLLBACK').run();
      throw err;
    }

    res.json({ success: true, data: { status: 'REJECTED' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});



app.get('/api/profile', async (req, res) => {
  try {
    const profile = await profileRepo.getProfile('user-local');
    res.json({ success: true, data: profile });
  } catch(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const profile = req.body;
    profile.userId = 'user-local';
    await profileRepo.saveProfile(profile);
    res.json({ success: true, data: profile });
  } catch(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

app.put('/api/preferences', async (req, res) => {
  try {
    const pref = req.body;
    pref.userId = 'user-local';
    await prefRepo.savePreference(pref);
    res.json({ success: true, data: pref });
  } catch(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

app.get('/api/preferences', async (req, res) => {
  try {
    const pref = await prefRepo.getPreference('user-local');
    const decisions = db.prepare('SELECT decision, reason, COUNT(*) as count FROM decisions WHERE decision = \'REJECT\' GROUP BY reason').all();
    res.json({ success: true, data: { preferences: pref, learned: decisions } });
  } catch(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: msg });
  }
});

const PORT = process.env.PORT || 8080;
  
app.get('/api/health', (req, res) => {
  try {
    const row = db.prepare('SELECT 1').get();
    const dbUp = !!row;
    res.json({
      success: true,
      data: {
        api: 'UP',
        database: dbUp ? 'UP' : 'DOWN',
        aiProvider: process.env.AI_PROVIDER || 'mock',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.json({
      success: false,
      data: {
        api: 'UP',
        database: 'DOWN',
        aiProvider: process.env.AI_PROVIDER || 'mock',
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.get('/api/runs', async (req, res) => {
  try {
    const runRows = db.prepare('SELECT s.runId, s.stage, s.status, s.latency, s.startedAt, s.endedAt, s.error, s.retryCount FROM run_stages s ORDER BY s.startedAt DESC LIMIT 100').all();
    res.json({ success: true, data: runRows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/runs/:id', async (req, res) => {
    try {
      const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(req.params.id);
      if (!run) return res.status(404).json({ error: 'Run not found' });
      const stages = db.prepare('SELECT * FROM run_stages WHERE runId = ? ORDER BY id ASC').all(req.params.id);
      res.json({ ...run, stages });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/evidence', async (req, res) => {
  try {
    const PaginationSchema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1, "Page must be >= 1").optional().default("1"),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100, "Limit must be between 1 and 100").optional().default("20")
    });
    const parsed = PaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid pagination', details: parsed.error.errors });
    }
    const page = parsed.data.page;
    const limit = parsed.data.limit;
    const evRows = db.prepare('SELECT id, type, metadata, createdAt FROM evidence ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(limit, (page - 1) * limit);
    res.json({ success: true, data: evRows.map((e: any) => ({ ...e, metadata: JSON.parse(e.metadata || '{}') })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/evidence/:id', async (req, res) => {
    try {
      const ev = db.prepare('SELECT id, type, metadata, createdAt FROM evidence WHERE id = ?').get(req.params.id) as any;
      if (!ev) return res.status(404).json({ error: 'Evidence not found' });
      res.json({ ...ev, metadata: JSON.parse(ev.metadata || '{}') });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(PORT, () => console.log(`Web API listening on port ${PORT}`));

