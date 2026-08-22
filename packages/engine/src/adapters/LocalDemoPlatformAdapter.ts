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
    // Simulated determinism for demo
    if (clientId === 'client-1') {
      return { hiringRate: 0.85, totalSpent: 50000, reviewScore: 4.8 };
    }
    if (clientId === 'client-2') {
      return { hiringRate: 0.10, totalSpent: 100, reviewScore: 2.1 }; // Bad client
    }
    return { hiringRate: 0.5, totalSpent: 5000, reviewScore: 4.0 };
  }

  async prepareApplication(application: ApplicationIntelligence, proposal: ProposalRecord): Promise<boolean> {
    console.log(`[DemoAdapter] Simulated application prep for ${application.opportunityId}`);
    return true;
  }

  async prepareReply(opportunityId: string, text: string): Promise<boolean> {
    console.log(`[DemoAdapter] Simulated reply for ${opportunityId}`);
    return true;
  }

  async getOutcome(opportunityId: string): Promise<OutcomeRecord | null> {
    // Simulated outcome
    return null; 
  }
}
