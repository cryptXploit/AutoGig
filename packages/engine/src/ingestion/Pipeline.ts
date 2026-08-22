import { RawOpportunity, CanonicalOpportunity, OpportunitySource, EventBus } from '@autogig/core';
import crypto from 'crypto';

export class IngestionPipeline {
  constructor(
    private sources: OpportunitySource[],
    private oppRepo: import('@autogig/core').OpportunityRepository,
    private bus: EventBus
  ) {}

  async run(): Promise<void> {
    for (const source of this.sources) {
      try {
        const rawOpps = await source.fetch();
        for (const raw of rawOpps) {
          await this.process(raw, source.name);
        }
      } catch (e) {
        console.error(`[IngestionPipeline] Source ${source.name} failed:`, e);
      }
    }
  }

  async process(raw: RawOpportunity, sourceName: string): Promise<void> {
    // 1. Validation
    if (!raw.title || !raw.canonicalUrl || !raw.sourceJobId) {
       console.error(`[IngestionPipeline] Invalid RawOpportunity: missing required fields`);
       return; // Reject
    }

    // 2. Normalization
    const canonical: CanonicalOpportunity = {
       id: `opp-${crypto.randomUUID()}`,
       source: raw.source || sourceName,
       sourceJobId: raw.sourceJobId,
       canonicalUrl: raw.canonicalUrl,
       title: raw.title,
       description: raw.description,
       normalizedSkills: raw.skills || [],
       normalizedBudget: typeof raw.budget === 'number' ? raw.budget : null,
       deadline: raw.deadline ? new Date(raw.deadline) : null,
       client: raw.client || {},
       provenance: sourceName,
       sourceReliability: 0.8,
       publishedAt: new Date(raw.publishedAt),
       ingestionTimestamp: new Date(),
       status: 'DISCOVERED'
    };

    // 3. Deduplication Order:
    // a. source + sourceJobId
    const existingBySource = await this.oppRepo.findBySource(canonical.source, canonical.sourceJobId);
    if (existingBySource) return;

    // b. canonicalUrl
    const existingByUrl = await this.oppRepo.findByUrl(canonical.canonicalUrl);
    if (existingByUrl) return;

    // c. Title + Client + PublishedAt proximity (deterministic)
    const existingByContent = await this.oppRepo.findSimilar(canonical.title, canonical.client, canonical.publishedAt);
    if (existingByContent) return;

    
    // d. Semantic similarity -> uncertain duplicate (signal only, don't delete)
    if (typeof (this.oppRepo as any).findSemanticDuplicate === 'function') {
      const semanticDup = await (this.oppRepo as any).findSemanticDuplicate(canonical.title, canonical.description);
      if (semanticDup) {
         canonical.uncertainDuplicateReason = 'Semantic similarity matched with ' + semanticDup.id;
      }
    }

    // 4. Persistence

    await this.oppRepo.save(canonical);

    // 5. Event Publication
    await this.bus.publish({
      eventId: `evt-discover-${canonical.id}`,
      eventType: 'OPPORTUNITY_DISCOVERED',
      schemaVersion: '1.0',
      attempt: 1,
      createdAt: new Date(),
      payload: { opportunityId: canonical.id }
    });
  }
}

