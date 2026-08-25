import { PlatformAdapter, RawOpportunity, ApplicationIntelligence, ProposalRecord, OutcomeRecord, OpportunitySource } from '@autogig/core';

export class LocalDemoPlatformAdapter implements PlatformAdapter {
  name = 'local-demo';

  constructor(private discoverySource: OpportunitySource) {}

  async discover(): Promise<RawOpportunity[]> {
    return this.discoverySource.fetch();
  }

  async getOpportunity(sourceJobId: string): Promise<RawOpportunity | null> {
    const opps = await this.discover();
    return opps.find(o => o.sourceJobId === sourceJobId) || null;
  }

  async getClientContext(clientId: string): Promise<Record<string, unknown>> {
    // Phase G4.3: Real structured signals from adapter
    if (clientId === 'good-client') {
      return { paymentVerified: true, hiringCount: 20, rating: 4.9, totalSpent: 50000 };
    }
    if (clientId === 'cheap-client') {
      return { paymentVerified: true, hiringCount: 1, rating: 2.5, totalSpent: 15 };
    }
    if (clientId === 'evil-client' || clientId === 'evil-inc') {
      return { paymentVerified: false, hiringCount: 0, rating: 1.0 };
    }
    if (clientId === 'unknown-client') {
      return {};
    }
    return { paymentVerified: false, hiringCount: 0, rating: 4.0 };
  }

  async prepareApplication(application: ApplicationIntelligence, proposal: ProposalRecord): Promise<boolean> {
    console.log('[DemoAdapter] Simulated application prep for ' + application.opportunityId);
    return true;
  }

  async prepareReply(opportunityId: string, text: string): Promise<boolean> {
    console.log('[DemoAdapter] Simulated reply for ' + opportunityId);
    return true;
  }

  async getOutcome(opportunityId: string): Promise<OutcomeRecord | null> {
    return null; 
  }
}
