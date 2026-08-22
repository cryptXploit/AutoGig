import { Scheduler } from '@autogig/core';

export class LocalScheduler implements Scheduler {
  private intervals = new Map<string, NodeJS.Timeout>();
  private activePromises = new Map<string, Promise<void>>();
  private isShuttingDown = false;
  private states = new Map<string, 'IDLE' | 'RUNNING' | 'FAILED'>();

  constructor() {
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  schedule(jobId: string, cron: string, task: () => Promise<void>): void {
    if (this.intervals.has(jobId)) {
      throw new Error(`Schedule already exists for jobId: ${jobId}`);
    }
    
    this.states.set(jobId, 'IDLE');

    // Parse mock cron to MS for Local (assume it's an interval string like '5m' or MS integer for simplicity)
    let ms = 60000;
    if (cron.endsWith('m')) ms = parseInt(cron) * 60000;
    else if (!isNaN(parseInt(cron))) ms = parseInt(cron);
    else ms = 5000; // default 5s for tests

    const interval = setInterval(async () => {


      if (this.isShuttingDown) return;
      if (this.states.get(jobId) === "RUNNING") {
        console.warn(`[LocalScheduler] Job ${jobId} skipped: previous run is still active.`);
        return;
      }
      
      this.states.set(jobId, 'RUNNING');
      try {
        const p = task();
        this.activePromises.set(jobId, p);
        await p;
        this.activePromises.delete(jobId);
        this.states.set(jobId, 'IDLE');
      } catch (e) {
        console.error(`[LocalScheduler] Job ${jobId} failed:`, e);
        this.states.set(jobId, 'FAILED');
      }
    
    
    }, ms);

    this.intervals.set(jobId, interval);
  }

  async shutdown(): Promise<void> {
    
    console.log('[LocalScheduler] Shutting down...');
    this.isShuttingDown = true;
    for (const [id, interval] of this.intervals.entries()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    await Promise.all(Array.from(this.activePromises.values()).map(p => p.catch(() => {})));
    console.log('[LocalScheduler] Shutdown complete.');

  }
}
