import { CanonicalOpportunity, Preference, RejectionReason } from '@autogig/core';

export class RuleEngine {
  public evaluate(opp: CanonicalOpportunity & { isDuplicate?: boolean }, pref: Preference): { pass: boolean, reason?: RejectionReason } {
    if (!opp.title || !opp.description) return { pass: false, reason: RejectionReason.INSUFFICIENT_DATA };
    
    // Duplicate detection (now driven by repository flag)
    if (opp.isDuplicate) return { pass: false, reason: RejectionReason.DUPLICATE };
    
    if ((opp.normalizedBudget || 0) > 0 && (opp.normalizedBudget || 0) < 10) return { pass: false, reason: RejectionReason.BUDGET_TOO_LOW };

    if (pref.blockedClients && pref.blockedClients.includes(opp.client?.name || '')) {
       return { pass: false, reason: RejectionReason.CLIENT_BLOCKED };
    }
    
    if (opp.deadline && (opp.deadline.getTime() - Date.now()) < 12 * 3600 * 1000 && (opp.normalizedBudget || 0) > 1000) {
       return { pass: false, reason: RejectionReason.DEADLINE_INFEASIBLE };
    }

    return { pass: true };
  }
}
