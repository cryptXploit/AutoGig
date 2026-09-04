export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface OpportunityFilters {
  status?: string | string[];
  minScore?: number;
  [key: string]: unknown;
}

export interface OpportunityClient { name?: string; rating?: number; totalSpent?: number; country?: string; history?: string; paymentVerified?: boolean; hiringCount?: number; hireRate?: number; repeatHiring?: boolean; reviewSignal?: string; communicationSignal?: string; scopeClaritySignal?: string; [key: string]: unknown; }

export interface RawOpportunity {
  source: string;
  sourceJobId: string;
  canonicalUrl: string;
  title: string;
  description: string;
  skills: string[];
  budget?: string | number | null;
  deadline?: string | Date | null;
  client?: OpportunityClient;
  publishedAt: string | Date;
  rawPayload: string;
}

export interface OpportunitySource {
  name: string;
  fetch(): Promise<RawOpportunity[]>;
}

export interface Evidence {
  id: string;
  userId: string;
  opportunityId?: string;
  type: 'PDF' | 'IMAGE' | 'TEXT' | 'LINK';
  storageKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Decision {
  id: string;
  opportunityId: string;
  decision: 'SKIP' | 'COUNTER' | 'RECOMMEND' | 'APPROVE' | 'REJECT';
  reason?: string;
  actor: string;
  createdAt: Date;
}

export interface RunDetails {
  runId: string;
  stage: string;
  status: string;
  latency: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  errors?: unknown[];
  retryCount?: number;
}

export interface Profile {
  userId: string;
  name?: string;
  skills: string[];
  experience?: string[];
  projects?: string[];
  certifications?: string[];
  preferredTechnologies?: string[];
  resumeKey?: string;
}

export type RiskTolerance = 'LOW' | 'MEDIUM' | 'HIGH';

export type ThemeSetting = 'SYSTEM' | 'LIGHT' | 'DARK' | 'HACKER';
export type LanguageSetting = 'EN' | 'BN';
export type StrictnessLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Preference {
  userId: string;
  targetRate: number;
  minRate: number;
  blockedClients?: string[];
  theme?: ThemeSetting;
  language?: LanguageSetting;
  reasoningDepth?: StrictnessLevel;
  proposalStrictness?: StrictnessLevel;
  evidenceStrictness?: StrictnessLevel;
  humanApprovalRequired?: boolean;
  learningEnabled?: boolean;
  refreshInterval?: number;
  preferredProjectTypes?: string[];
  riskTolerance?: RiskTolerance;
  updatedAt: Date;
}

export interface StorageMetadata {
  size: number;
  contentType: string;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface NotificationAction {
  label: string;
  url?: string;
  payload?: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  structuredData?: Record<string, unknown>;
}

export interface EmbeddingIndexRequest {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}



export enum RejectionReason {
  BUDGET_TOO_LOW = 'BUDGET_TOO_LOW',
  DEADLINE_INFEASIBLE = 'DEADLINE_INFEASIBLE',
  SKILL_CONSTRAINT = 'SKILL_CONSTRAINT',
  CLIENT_BLOCKED = 'CLIENT_BLOCKED',
  DUPLICATE = 'DUPLICATE',
  INVALID_JOB = 'INVALID_JOB',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export type ComplexityBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface EconomicAnalysis {
  budgetStatus: 'KNOWN' | 'UNKNOWN';
  budget: number | null;
  complexityBand: ComplexityBand;
  estimatedEffortRange: [number, number];
  meanEffort: number;
  confidence: number;
  effectiveHourlyRate?: number | null;
  effectiveHourlyRateRange?: [number, number] | null;
  targetRate: number;
  minRate: number;
  minimumRateShortfall?: number | null;
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


export interface HistoricalIntelligence {
  historicalSuccessAdjustment: number;
  historicalConfidence: number;
  patternConfidence: number;
  recommendationConfidence: number;
  successRate: number;
  similarOutcomeCount: number;
  explanation: string;
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
  finalScore?: number;
  historicalIntelligence?: HistoricalIntelligence;
  createdAt: Date;
}

export type ProposalStatus = 'DRAFT' | 'VERIFYING' | 'VERIFIED' | 'BLOCKED';

export interface DeepEvaluationResult {
  opportunityAssessment: string;
  technicalFitReasoning: string;
  economicAssessment: string;
  scopeAssessment: string;
  evidenceAssessment: string;
  clientSignalAssessment: string;
  risks: string[];
  missingInformation: string[];
  recommendedAction: 'RECOMMEND' | 'COUNTER' | 'SKIP';
  priority: number;
  reasoningSummary: string;
  clientRiskAssessment?: 'LOW_RISK' | 'ELEVATED_RISK' | 'UNKNOWN';
}

export interface ProposalRecord {
  id: string;
  opportunityId: string;
  text: string;
  status: ProposalStatus;
  version: number;
  runId?: string;
  createdAt?: Date;
}

export type ClaimCategory = 'SKILL' | 'EXPERIENCE' | 'PROJECT' | 'METRIC' | 'TECHNOLOGY' | 'CREDENTIAL';
export type ClaimVerificationStatus = 'PASS' | 'FLAG' | 'BLOCK' | 'PENDING';

export interface Claim {
  id: string;
  proposalId: string;
  text: string;
  category: ClaimCategory;
  verificationStatus: ClaimVerificationStatus;
  evidenceId?: string;
}

export interface EvidenceContext {
  evidenceId: string;
  type: string;
  provenance: string;
  confidence: number;
  storageKey: string;
  extractedFacts?: string[];
  relevantSkills?: string[];
}

export interface DeepReasoningInput {
  opportunity: import("../schemas/opportunity").CanonicalOpportunity;
  evaluation: EvaluationRecord;
  evidence: EvidenceContext[];
  profile: Profile;
  preferences: Preference;
}

export interface ProposalGenerationInput {
  opportunity: import("../schemas/opportunity").CanonicalOpportunity;
  reasoning: DeepEvaluationResult;
  evidence: EvidenceContext[];
  profile: Profile;
  decision: 'RECOMMEND' | 'COUNTER';
  previousDraft?: string;
  blockedClaims?: string[];
  applicationIntelligence?: import('./index').ApplicationIntelligenceResult;
}




// --- G4+ Types ---



export interface TailoredSkill {
  skill: string;
  relevance: 'STRONG' | 'MODERATE' | 'WEAK' | 'MISSING';
  emphasis: boolean;
  source: string;
  evidenceIds: string[];
}

export interface TailoredExperience {
  content: string;
  relevance: 'STRONG' | 'MODERATE' | 'WEAK';
  emphasis: boolean;
  source: string;
}

export interface TailoredProject {
  content: string;
  relevance: 'STRONG' | 'MODERATE' | 'WEAK';
  emphasis: boolean;
  evidenceIds: string[];
}

export interface TailoredResume {
  summary: string;
  headline: string;
  skills: TailoredSkill[];
  experience: TailoredExperience[];
  projects: TailoredProject[];
  certifications: string[];
  limitations: string[];
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
  status: 'PASS' | 'LIMITED' | 'NEEDS_USER_INPUT' | 'BLOCK';
  evidenceIds: string[];
}

export interface ApplicationIntelligence {
  id: string;
  opportunityId: string;
  proposalId?: string;
  tailoredResume: TailoredResume;
  screeningAnswers: ScreeningAnswer[];
  suggestedRate: number | null;
  suggestedTimeline: string;
  readinessScore: number;
  recommendation: 'APPLY' | 'REVIEW' | 'SKIP';
  evidenceCoverage: number;
  matchedSkills: string[];
  emphasizedSkills: string[];
  deEmphasizedSkills: string[];
  missingRequirements: string[];
  truthfulLimitations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OutcomeRecord {
  id: string;
  opportunityId: string;
  status: 'APPLIED' | 'INTERVIEW' | 'WON' | 'LOST' | 'WITHDRAWN' | 'CLIENT_REPLIED' | 'NO_RESPONSE' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
  clientResponse?: string;
  feedback?: string;
  createdAt: Date;
  clientFeedback?: 'POSITIVE_FEEDBACK' | 'NEGATIVE_FEEDBACK' | 'NEUTRAL';
  hired?: boolean;
  paymentSuccess?: boolean;
  rating?: number;
  responseTimeDays?: number;
  proposalAccepted?: boolean;
  conversationAccepted?: boolean;
  realizedRate?: number;
  realizedTimeline?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export type ConversationStatus = 'GENERATED' | 'VALIDATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'READY_TO_DISPATCH' | 'SENT' | 'RECEIVED';

export interface ConversationIntelligence {
  conversationStage: 'NEW_LEAD' | 'DISCOVERY' | 'REQUIREMENTS_CLARIFICATION' | 'BUDGET_DISCUSSION' | 'TIMELINE_DISCUSSION' | 'NEGOTIATION' | 'DECISION_PENDING' | 'WON' | 'LOST' | 'UNKNOWN';
  clientIntent: string;
  clientSentiment?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  scopeClarity: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetClarity: 'LOW' | 'MEDIUM' | 'HIGH';
  timelineClarity: 'LOW' | 'MEDIUM' | 'HIGH';
  trustSignal: number;
  negotiationOpportunity: boolean;
  missingInformation: string[];
  recommendedAction: 'NO_ACTION' | 'ASK_CLARIFYING_QUESTIONS' | 'SEND_REPLY' | 'NEGOTIATE' | 'REQUEST_BUDGET' | 'REQUEST_TIMELINE' | 'REQUEST_REQUIREMENTS' | 'ESCALATE_TO_HUMAN' | 'STOP_COMMUNICATION';
  recommendedQuestions: string[];
  suggestedReply?: string;
  replyTone?: string;
  confidence: number;
  riskFlags: string[];
  evidenceIds: string[];
  requiresHumanApproval: boolean;
}

export interface ConversationValidationResult {
  status: 'PASS' | 'FAILED_SKILL' | 'FAILED_EXPERIENCE' | 'FAILED_RATE' | 'FAILED_POLICY' | 'BLOCKED_CLIENT' | 'PENDING';
  reason?: string;
  blockedClaims?: string[];
}

export interface ConversationMessage {
  id: string;
  opportunityId: string;
  sender: 'CLIENT' | 'AGENT' | 'USER';
  text: string;
  status: ConversationStatus;
  intelligence?: ConversationIntelligence;
  validationResult?: ConversationValidationResult;
  createdAt: Date;
}

export interface PlatformAdapter {
  name: string;
  discover(): Promise<import('./index').RawOpportunity[]>;
  getOpportunity(sourceJobId: string): Promise<import('./index').RawOpportunity | null>;
  getClientContext(clientId: string): Promise<Record<string, unknown>>;
  prepareApplication(application: ApplicationIntelligence, proposal: import('./index').ProposalRecord): Promise<boolean>;
  prepareReply(opportunityId: string, text: string): Promise<boolean>;
  getOutcome(opportunityId: string): Promise<OutcomeRecord | null>;
  syncConversation?(opportunityId: string): Promise<ConversationMessage[]>;
  executeAction?(request: import('./index').ExecutionRequest): Promise<import('./index').ExecutionResult>;
}

export interface ApplicationIntelligenceInput {
  opportunity: import("../schemas/opportunity").CanonicalOpportunity;
  profile: import("./index").Profile;
  preferences: import("./index").Preference;
  evidence: import("./index").EvidenceContext[];
  evaluation: import("./index").DeepEvaluationResult;
}

export type ApplicationIntelligenceResult = Omit<import("./index").ApplicationIntelligence, 'id' | 'opportunityId' | 'proposalId' | 'createdAt'>;


// Phase G4.3: Client Intelligence
export type ClientSignalCategory = 'PAYMENT' | 'HIRING_HISTORY' | 'COMMUNICATION' | 'SCOPE' | 'BUDGET' | 'OUTCOME';
export type ClientSignalValue = 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';

export interface ClientSignal {
  category: ClientSignalCategory;
  value: ClientSignalValue;
  source: string;
  confidence: number;
  evidenceId?: string;
  verified: boolean;
  reason?: string;
}

export interface ClientIntelligenceResult {
  clientIdentity: string;
  trustScore: number;
  paymentReliabilityScore: number;
  hiringReliabilityScore: number;
  communicationRiskScore: number;
  scopeRiskScore: number;
  budgetSignalScore: number;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  confidence: number;
  recommendation: 'PRIORITIZE' | 'NORMAL' | 'CAUTION' | 'BLOCK';
  signals: ClientSignal[];
  reasons: string[];
  unknowns: string[];
  createdAt: Date;
  opportunityId: string;
}

export interface ClientIntelligenceInput {
  opportunityId: string;
  opportunity: any;
  client: OpportunityClient;
  evidence: EvidenceContext[];
}


export type DecisionFinalAction = 'APPLY_NOW' | 'APPLY_AFTER_REVIEW' | 'ASK_CLIENT_FIRST' | 'NEGOTIATE' | 'WAIT' | 'SKIP' | 'BLOCK';
export type DecisionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DecisionTrace {
  baseEvaluation?: Record<string, any>;
  clientSignal?: Record<string, any>;
  applicationSignal?: Record<string, any>;
  historicalSignal?: Record<string, any>;
  conversationSignal?: Record<string, any>;
  timingSignal?: Record<string, any>;
  hardConstraints: string[];
  finalDecision: DecisionFinalAction;
}

export interface DecisionPlan {
  id: string;
  opportunityId: string;
  finalDecision: DecisionFinalAction;
  confidence: number;
  priority: DecisionPriority;
  reasons: string[];
  riskFlags: string[];
  missingInformation: string[];
  recommendedNextAction: string;
  timingRecommendation: string;
  applicationReadiness: number;
  humanApprovalRequired: boolean;
  evidenceIds: string[];
  decisionTrace: DecisionTrace;
  createdAt: Date;
  updatedAt: Date;
}


export interface LifecycleFingerprints {
  opportunityFingerprint: string;
  clientFingerprint: string;
  applicationFingerprint: string;
  historicalFingerprint: string;
  conversationFingerprint: string;
}

export interface LifecycleState extends LifecycleFingerprints {
  id: string;
  opportunityId: string;
  lastDecisionPlanId?: string;
  lastEvaluatedAt: Date;
  nextReviewAt?: Date;
  changeReason?: string;
}

export interface DecisionPlanHistory {
  id: string;
  opportunityId: string;
  decisionPlanId: string;
  previousDecision?: DecisionFinalAction;
  newDecision: DecisionFinalAction;
  triggerEvent: string;
  changeReason: string;
  previousConfidence?: number;
  newConfidence: number;
  decisionTrace: DecisionTrace;
  createdAt: Date;
}


export interface DecisionFactor {
  id: string;
  category: string;
  signal: string;
  value: any;
  contribution: number;
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  explanation: string;
  evidenceIds: string[];
}

export interface EvidenceNode {
  evidenceId: string;
  sourceType: string;
  sourceReference: string;
  claim: string;
  verificationStatus: string;
  strength: number;
  supportsDecision: boolean;
  explanation: string;
}

export interface ConstraintNode {
  constraint: string;
  status: string;
  source: string;
  effect: string;
}

export interface UncertaintyNode {
  uncertainty: string;
  impact: string;
  reason: string;
  requiredAction: string;
}

export interface DecisionHistoryExplanation {
  previous: string;
  trigger: string;
  new: string;
  why: string;
  confidenceChange: string;
}

export interface ExplainabilityReport {
  opportunityId: string;
  decision: DecisionFinalAction;
  summary: string;
  confidence: number;
  decisionFactors: DecisionFactor[];
  evidenceNodes: EvidenceNode[];
  constraintNodes: ConstraintNode[];
  uncertaintyNodes: UncertaintyNode[];
  decisionHistory: DecisionHistoryExplanation[];
  evidenceCoverage: number;
  unsupportedClaims: string[];
  missingEvidence: string[];
  humanReviewReason?: string;
  generatedAt: Date;
}


export enum ActionType {
  DISCOVER_OPPORTUNITY = 'DISCOVER_OPPORTUNITY',
  VIEW_OPPORTUNITY = 'VIEW_OPPORTUNITY',
  RANK_OPPORTUNITY = 'RANK_OPPORTUNITY',
  TAILOR_RESUME = 'TAILOR_RESUME',
  GENERATE_PROPOSAL = 'GENERATE_PROPOSAL',
  SEND_PROPOSAL = 'SEND_PROPOSAL',
  GENERATE_REPLY = 'GENERATE_REPLY',
  SEND_REPLY = 'SEND_REPLY',
  NEGOTIATE_RATE = 'NEGOTIATE_RATE',
  NEGOTIATE_SCOPE = 'NEGOTIATE_SCOPE',
  REQUEST_CLARIFICATION = 'REQUEST_CLARIFICATION',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
  ACCEPT_CONTRACT = 'ACCEPT_CONTRACT',
  DECLINE_OPPORTUNITY = 'DECLINE_OPPORTUNITY',
  RECORD_OUTCOME = 'RECORD_OUTCOME',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  UPDATE_GIG = 'UPDATE_GIG',
  CREATE_PROJECT_ASSET = 'CREATE_PROJECT_ASSET'
}

export enum ActionDisposition {
  AUTO_EXECUTE = 'AUTO_EXECUTE',
  AUTO_DRAFT_ONLY = 'AUTO_DRAFT_ONLY',
  REQUIRE_HUMAN_APPROVAL = 'REQUIRE_HUMAN_APPROVAL',
  BLOCK_ACTION = 'BLOCK_ACTION'
}

export enum AutonomyLevel {
  MANUAL = 'MANUAL',
  ASSISTED = 'ASSISTED',
  SUPERVISED = 'SUPERVISED',
  HIGH_AUTONOMY = 'HIGH_AUTONOMY'
}

export interface UserPolicy {
  id?: string;
  minimumRate: number;
  targetRate: number;
  maximumNegotiationDiscount: number;
  maximumNegotiationRounds: number;
  blockedClients: string[];
  blockedKeywords: string[];
  allowedPlatforms: string[];
  allowedActionTypes: string[];
  requireApprovalForMessaging: boolean;
  requireApprovalForProposalSubmission: boolean;
  requireApprovalForNegotiation: boolean;
  maxDailyApplications: number;
  maxDailyMessages: number;
  maxActiveNegotiations: number;
  minimumConfidenceForAutoDraft: number;
  minimumConfidenceForAutoExecute: number;
  autoSendEnabled: boolean;
  autoNegotiateEnabled: boolean;
  autoProposalEnabled: boolean;
  workingHours: string;
  timezone: string;
  autonomyLevel: string;
}

export interface PlatformPolicy {
  platform: string;
  allowedActions: ActionType[];
  requiresHumanApproval(action: ActionType): boolean;
  isRateAllowed(rate: number, context: unknown): boolean;
  isMessageAllowed(text: string, context: unknown): boolean;
  isProposalSubmissionAllowed(context: unknown): boolean;
  getPolicyVersion(): string;
}

export interface ActionRequest {
  opportunityId: string;
  actionType: ActionType;
  platform: string;
  proposedText?: string;
  proposedRate?: number;
  proposedTimeline?: string;
  proposedScope?: string;
  targetClient?: string;
  metadata?: any;
}

export interface PolicyDecision {
  id: string;
  opportunityId: string;
  actionType: ActionType;
  platform: string;
  disposition: ActionDisposition;
  reasons: string[];
  violatedRules: string[];
  requiredApprovals: string[];
  allowedParameters?: any;
  blockedParameters?: any;
  confidence: number;
  evaluatedAt: Date;
  policyVersion: string;
}

export interface ActionUsage {
  id: string;
  userId: string;
  platform: string;
  actionType: ActionType;
  count: number;
  windowStart: Date;
  windowEnd: Date;
  lastExecutedAt: Date;
}


export enum OpportunityUrgency {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum OpportunityPriority {
  BACKLOG = 'BACKLOG',
  NORMAL = 'NORMAL',
  PRIORITY = 'PRIORITY',
  HIGH_PRIORITY = 'HIGH_PRIORITY',
  IMMEDIATE = 'IMMEDIATE'
}

export enum StrategyType {
  APPLY_NOW = 'APPLY_NOW',
  PREPARE_AND_APPLY = 'PREPARE_AND_APPLY',
  WAIT_FOR_MORE_INFORMATION = 'WAIT_FOR_MORE_INFORMATION',
  ASK_CLIENT_FIRST = 'ASK_CLIENT_FIRST',
  NEGOTIATE_FIRST = 'NEGOTIATE_FIRST',
  SKIP = 'SKIP',
  WATCH = 'WATCH'
}

export interface OpportunityStrategy {
  opportunityId: string;
  urgency: OpportunityUrgency;
  priority: OpportunityPriority;
  priorityScore: number;
  strategy: StrategyType;
  timingScore: number;
  freshnessScore: number;
  clientResponsivenessScore: number;
  competitionRiskScore: number;
  expectedValueScore: number;
  historicalSuccessScore: number;
  applicationReadinessScore: number;
  policyReadinessScore: number;
  confidence: number;
  reasons: string[];
  risks: string[];
  recommendedNextAction: string;
  expiresAt?: Date;
  generatedAt: Date;
}


export interface UserIntelligenceProfile {
  id: string;
  identity: {
    name: string;
    headline: string;
    location: string;
    timezone: string;
  };
  professional: {
    skills: string[];
    experience: string[];
    projects: string[];
    certifications: string[];
    education: string[];
    portfolioLinks: string[];
    githubLinks: string[];
    domainExperience: string[];
  };
  commercial: {
    targetRate: number;
    minimumRate: number;
    preferredRate: number;
    preferredProjectSize: string;
    preferredTimeline: string;
  };
  availability: {
    availableHoursPerWeek: number;
    availableFrom: string;
    workingHours: string;
    timezone: string;
  };
  communication: {
    preferredTone: string;
    language: string;
    responseStyle: string;
    negotiationStyle: string;
  };
  restrictions: {
    forbiddenClaims: string[];
    forbiddenSkills: string[];
    forbiddenIndustries: string[];
    forbiddenClients: string[];
    blockedKeywords: string[];
  };
  platformPreferences: {
    allowedPlatforms: string[];
  };
  autonomy: {
    autonomyLevel: string;
    autoProposalEnabled: boolean;
    autoMessagingEnabled: boolean;
    autoNegotiationEnabled: boolean;
    autoSubmissionEnabled: boolean;
  };
  updatedAt: Date;
}

export interface UserEvidenceRecord {
  id: string;
  userId: string;
  category: string;
  claim: string;
  value: string;
  sourceType: string;
  sourceReference: string;
  verified: boolean;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionReadiness {
  opportunityId: string;
  readinessScore: number;
  state: 'READY_TO_DRAFT' | 'READY_FOR_REVIEW' | 'READY_FOR_HUMAN_APPROVAL' | 'BLOCKED';
  missingRequirements: string[];
  blockingReasons: string[];
  nextAction: string;
  confidence: number;
  generatedAt: Date;
}


export type ExecutionStatus = 
  | 'DRAFT'
  | 'VALIDATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'READY_TO_EXECUTE'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'BLOCKED';

export interface ExecutionRequest {
  id: string;
  opportunityId: string;
  actionType: ActionType;
  platform: string;
  payload: any;
  policyDecisionId?: string;
  executionReadinessId?: string;
  requestedBy: string;
  status: ExecutionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionResult {
  id: string;
  executionRequestId: string;
  status: ExecutionStatus;
  success: boolean;
  externalReference?: string;
  message: string;
  failureReason?: string;
  metadata?: any;
  executedAt?: Date;
}

export interface ExecutionAuditRecord {
  id: string;
  executionRequestId: string;
  opportunityId: string;
  actionType: ActionType;
  policyDecisionId?: string;
  readinessId?: string;
  approvalRequired: boolean;
  approvalGranted: boolean;
  previousStatus: ExecutionStatus;
  newStatus: ExecutionStatus;
  reason: string;
  actor: string;
  timestamp: Date;
}


// G4.14: Agent Controller Types
export type AgentGoal = 
  | 'APPLY_FOR_OPPORTUNITY'
  | 'CLARIFY_REQUIREMENTS'
  | 'NEGOTIATE_RATE'
  | 'RESPOND_TO_CLIENT'
  | 'PREPARE_APPLICATION'
  | 'WAIT_FOR_CLIENT'
  | 'MONITOR_OPPORTUNITY';

export type AgentStopReason =
  | 'GOAL_ACHIEVED'
  | 'MAX_ITERATIONS'
  | 'POLICY_BLOCKED'
  | 'READINESS_BLOCKED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'NO_VALID_ACTION'
  | 'EXECUTION_FAILED'
  | 'OPPORTUNITY_REJECTED'
  | 'OPPORTUNITY_EXPIRED'
  | 'USER_CANCELLED'
  | 'PLATFORM_UNAVAILABLE'
  | 'WAITING_FOR_EVENT';

export interface AgentRun {
  id: string;
  opportunityId: string;
  goal: AgentGoal;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'FAILED';
  currentStep: string;
  iteration: number;
  maxIterations: number;
  stopReason?: AgentStopReason;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AgentActionPlan {
  actionType: ActionType;
  reason: string;
  expectedOutcome: string;
  requiredEvidence: string[];
  requiresHumanApproval: boolean;
  confidence: number;
}

export interface AgentState {
  opportunityId: string;
  currentStrategy?: string;
  policyDisposition?: string;
  readinessState?: string;
  lastExecutionStatus?: string;
  pendingApproval: boolean;
  previousActionTypes: ActionType[];
  consecutiveIdenticalActions: number;
}

export interface AgentIteration {
  id: string;
  runId: string;
  iteration: number;
  observedState: AgentState;
  selectedAction?: AgentActionPlan;
  policyDecision?: any; // Will map to PolicyDecision but keep simple here
  readinessDecision?: any; // Will map to ExecutionReadiness
  executionDecision?: string; // e.g. "PROCEED", "BLOCK", "REQUEST_APPROVAL"
  result?: any; // ExecutionResult or failure msg
  stopReason?: AgentStopReason;
  timestamp: Date;
}
