const fs = require('fs');
const path = require('path');

function write(relPath, content) {
    const fullPath = path.join(__dirname, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
    console.log(`Created ${relPath}`);
}

// ---- UPDATE CORE TYPES ----
const coreTypesPath = path.join(__dirname, 'packages/core/src/types/index.ts');
let coreTypes = fs.readFileSync(coreTypesPath, 'utf8');

const newTypes = `
export enum RejectionReason {
  BUDGET_TOO_LOW = 'BUDGET_TOO_LOW',
  DEADLINE_INFEASIBLE = 'DEADLINE_INFEASIBLE',
  SKILL_CONSTRAINT = 'SKILL_CONSTRAINT',
  DUPLICATE = 'DUPLICATE',
  INVALID_JOB = 'INVALID_JOB',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export type ComplexityBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface EconomicAnalysis {
  budget: number;
  complexityBand: ComplexityBand;
  estimatedEffortRange: [number, number];
  confidence: number;
  meanEffort: number;
  effectiveHourlyRate: number;
  effectiveHourlyRateRange: [number, number];
  targetRate: number;
  minRate: number;
  minimumRateShortfall: number;
}

export enum RoutingDecision {
  REJECT = 'REJECT',
  DEEP_REASON_REQUIRED = 'DEEP_REASON_REQUIRED',
  HIGH_PRIORITY_DEEP_REASON = 'HIGH_PRIORITY_DEEP_REASON',
  COUNTER_CANDIDATE = 'COUNTER_CANDIDATE'
}

export enum QualificationFlag {
  EVIDENCE_INSUFFICIENT = 'EVIDENCE_INSUFFICIENT'
}

export interface ScoreBreakdown {
  overall: number;          
  technicalFit: number;     
  evidenceStrength: number; 
  budgetFit: number;        
  preferenceFit: number;    
  scopeClarity: number;     
  route: RoutingDecision;
  qualificationFlags: QualificationFlag[];
  explanations: string[];
  evidenceConfidence: number;
  economicSummary: EconomicAnalysis;
}

export interface EvaluationRecord {
  id: string;
  opportunityId: string;
  evaluationRoute: RoutingDecision;
  qualificationFlags: QualificationFlag[];
  priority: number;
  deepReasonStatus: 'PENDING' | 'COMPLETED' | 'NOT_REQUIRED';
  scoreBreakdown: ScoreBreakdown;
  createdAt: Date;
}
`;

if (!coreTypes.includes('RejectionReason')) {
    fs.writeFileSync(coreTypesPath, coreTypes + '\n' + newTypes);
    console.log('Updated core types.');
}

// Update state machine
const smPath = path.join(__dirname, 'packages/core/src/domain/stateMachine.ts');
let sm = fs.readFileSync(smPath, 'utf8');
if (!sm.includes('RETRIEVING')) {
    sm = sm.replace('DISCOVERED: [\'NORMALIZED\', \'FAILED\'],', `
  DISCOVERED: ['NORMALIZED', 'FAILED'],
  NORMALIZED: ['DEDUPLICATED', 'FAILED'],
  DEDUPLICATED: ['FILTERED', 'FAILED'],
  FILTERED: ['RETRIEVING', 'REJECTED', 'FAILED'],
  RETRIEVING: ['ENRICHING', 'FAILED'],
  ENRICHING: ['EVALUATING', 'FAILED'],
  EVALUATING: ['REJECTED', 'SHORTLISTED', 'FAILED'],
  REJECTED: [],
    `.trim());
    fs.writeFileSync(smPath, sm);
    console.log('Updated state machine transitions.');
}

