import { OpportunitySource, RawOpportunity } from '@autogig/core';

export class UpworkRSSSource implements OpportunitySource {
  name = 'upwork-rss';

  async fetch(): Promise<RawOpportunity[]> {
    // Standard secure RSS fetch without CAPTCHA bypass or scraping
    // Return empty for now as RSS parsing requires external libraries not configured yet.
    return [];
  }
}
