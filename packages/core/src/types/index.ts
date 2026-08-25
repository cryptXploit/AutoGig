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
  status: 'APPLIED' | 'INTERVIEW' | 'WON' | 'LOST' | 'WITHDRAWN';
  clientResponse?: string;
  feedback?: string;
  createdAt: Date;
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
