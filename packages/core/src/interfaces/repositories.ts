import { CanonicalOpportunity } from '../schemas/opportunity';
import { OpportunityFilters, Evidence, Decision, RunDetails, Profile, Preference } from '../types';

export interface OpportunityRepository {
  findBySource(source: string, sourceJobId: string): Promise<CanonicalOpportunity | null>;
  findByUrl(canonicalUrl: string): Promise<CanonicalOpportunity | null>;
  findSimilar(title: string, client: import("../types").OpportunityClient | undefined, publishedAt: Date): Promise<CanonicalOpportunity | null>;
  findById(id: string): Promise<CanonicalOpportunity | null>;
  save(opportunity: CanonicalOpportunity): Promise<void>;
  list(filters?: OpportunityFilters): Promise<CanonicalOpportunity[]>;
}

export interface EvidenceRepository {
  findById(id: string): Promise<Evidence | null>;
  save(evidence: Evidence): Promise<void>;
}

export interface DecisionRepository {
  save(decision: Decision): Promise<void>;
}

export interface RunRepository {
  saveRun(runDetails: RunDetails): Promise<void>;
}

export interface ProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
}

export interface PreferenceRepository {
  getPreferences(userId: string): Promise<Preference | null>;
}



