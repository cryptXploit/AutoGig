import { OpportunityScorer } from './OpportunityScorer';
import { RoutingDecision, EconomicAnalysis } from '@autogig/core';

describe('OpportunityScorer', () => {
  const scorer = new OpportunityScorer();
  
  const mockEco = (rate: number): EconomicAnalysis => ({
    budget: 1000, budgetStatus: 'KNOWN', complexityBand: 'LOW', estimatedEffortRange: [10, 10], confidence: 1, meanEffort: 10,
    effectiveHourlyRate: rate, effectiveHourlyRateRange: [rate, rate], targetRate: 100, minRate: 50, minimumRateShortfall: 0
  });

  // To hit 49: e.g. tech=50, ev=0, budget=100 (rate=100), pref=80, scope=20
  // 50*0.3(15) + 0 + 100*0.2(20) + 80*0.15(12) + 20*0.1(2) = 49
  test('Score 49 -> REJECT', () => {
    const res = scorer.score(50, 0, mockEco(100), 80, 20);
    expect(res.overall).toBe(49);
    expect(res.route).toBe(RoutingDecision.REJECT);
  });

  // To hit 50: e.g. tech=50, ev=0, budget=100 (rate=100), pref=80, scope=30
  // 15 + 20 + 12 + 3 = 50
  test('Score 50 -> DEEP_REASON_REQUIRED', () => {
    const res = scorer.score(50, 0, mockEco(100), 80, 30);
    expect(res.overall).toBe(50);
    expect(res.route).toBe(RoutingDecision.DEEP_REASON_REQUIRED);
  });

  // To hit 79: e.g. tech=100, ev=80, budget=100, pref=60, scope=0
  // 100*0.3(30) + 80*0.25(20) + 100*0.2(20) + 60*0.15(9) + 0 = 79
  test('Score 79 -> DEEP_REASON_REQUIRED', () => {
    const res = scorer.score(100, 1, mockEco(100), 60, 0);
    expect(res.overall).toBe(79);
    expect(res.route).toBe(RoutingDecision.DEEP_REASON_REQUIRED);
  });

  // To hit 80: e.g. tech=100, ev=80, budget=100, pref=60, scope=10
  // 30 + 20 + 20 + 9 + 1 = 80
  test('Score 80 -> HIGH_PRIORITY_DEEP_REASON', () => {
    const res = scorer.score(100, 1, mockEco(100), 60, 10);
    expect(res.overall).toBe(80);
    expect(res.route).toBe(RoutingDecision.HIGH_PRIORITY_DEEP_REASON);
  });

  // To hit 100: tech=100, ev=100, budget=100, pref=100, scope=100
  // wait, evidence=1 => evidenceStrength=80 in my mock. Let's fix scorer to pass exact evidence.
  // Actually, scorer just checks route. It doesn't need to be exactly 100. Let's test >80
  test('Score 90 -> HIGH_PRIORITY_DEEP_REASON', () => {
    const res = scorer.score(100, 1, mockEco(100), 100, 50);
    expect(res.overall).toBe(90);
    expect(res.route).toBe(RoutingDecision.HIGH_PRIORITY_DEEP_REASON);
  });
  
  test('Counter Candidate', () => {
    // techFit >= 80, evidence >= 60, rate >= min, rate < target, scope >= 60
    const res = scorer.score(80, 1, mockEco(80), 100, 60);
    expect(res.route).toBe(RoutingDecision.COUNTER_CANDIDATE);
  });
});

