import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { initializeSchema, SQLiteOpportunityRepository, SQLiteEvidenceRepository } from '@autogig/db';
import { SQLiteEventBus } from '@autogig/events';
import { LocalScheduler, IngestionPipeline } from '@autogig/engine';
import { DemoFixtureSource } from './sources/DemoFixtureSource';
import { URLSource } from './sources/URLSource';
import { UpworkRSSSource } from './sources/UpworkRSSSource';
import { EvidenceIngester } from './evidence/EvidenceIngester';

async function main() {
  const dbPath = path.resolve(__dirname, '../../../data/autogig.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  
  initializeSchema(db);
  
  const oppRepo = new SQLiteOpportunityRepository(db);
  const evRepo = new SQLiteEvidenceRepository(db);
  const bus = new SQLiteEventBus(db);
  
  const isDemo = process.argv.includes('--demo');
  const isOnce = process.argv.includes('--once');

  let sources: any[] = [];
  if (isDemo) {
    sources = [new DemoFixtureSource()];
  } else {
    sources = [
      new DemoFixtureSource(),
      new UpworkRSSSource(),
      new URLSource('http://example.com/jobs')
    ];
  }

  const pipeline = new IngestionPipeline(sources, oppRepo, bus);
  const evidenceIngester = new EvidenceIngester(evRepo, path.resolve(__dirname, '../../../data/evidence'));

  if (isOnce) {
    console.log('[IngestionWorker] Running ONE-SHOT ingestion...');
    await pipeline.run();
    await evidenceIngester.ingestAll();
    console.log('[IngestionWorker] ONE-SHOT complete. Exiting.');
    process.exit(0);
  } else {
    console.log('[IngestionWorker] Starting background scheduler...');
    const scheduler = new LocalScheduler();

    scheduler.schedule('ingest-opps', '10m', async () => {
      console.log('[IngestionWorker] Running ingestion pipeline...');
      await pipeline.run();
    });

    scheduler.schedule('ingest-evidence', '10m', async () => {
      console.log('[IngestionWorker] Running evidence ingestion...');
      await evidenceIngester.ingestAll();
    });

    // Do an initial run so it doesn't wait 10m silently
    await pipeline.run().catch(e => console.error(e));
    await evidenceIngester.ingestAll().catch(e => console.error(e));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
