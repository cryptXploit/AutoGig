import fs from 'fs';
import path from 'path';
import { OpportunitySource, RawOpportunity } from '@autogig/core';

export class DemoFixtureSource implements OpportunitySource {
  name = 'demo-fixture';

  async fetch(): Promise<RawOpportunity[]> {
    const jobsPath = path.resolve(__dirname, '../../../../data/demo/jobs.json');
    if (!fs.existsSync(jobsPath)) return [];
    
    const data = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
    return data.map((job: any) => ({
      source: this.name,
      sourceJobId: job.sourceJobId || job.id,
      canonicalUrl: job.canonicalUrl,
      title: job.title,
      description: job.description,
      skills: job.normalizedSkills || [],
      budget: job.normalizedBudget,
      deadline: job.deadline,
      client: job.client,
      publishedAt: job.publishedAt,
      rawPayload: JSON.stringify(job)
    }));
  }
}
