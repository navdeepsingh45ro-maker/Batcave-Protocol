export type ISODate = `${number}-${number}-${number}`;
export type ISODateTime = string;

export type BeliefState =
  | "Focused"
  | "Lonely"
  | "Heavy"
  | "Fatigued"
  | "Overwhelmed"
  | "Determined"
  | "Restless"
  | "Calm";

export type BeliefCause =
  | "Missing Connection"
  | "Fear Of Failure"
  | "Purpose Drift"
  | "Rejection Memory"
  | "Fatigue"
  | "Uncertainty"
  | "Lack Of Progress"
  | "Financial Stress"
  | "Social Pressure"
  | "Identity Conflict"
  | "Other";

export interface BeliefEntry {
  id: string;
  userId?: string;
  date: ISODate;
  time?: string;
  states: BeliefState[];
  primaryCause: BeliefCause | null;
  recurringThought?: string | null;
  notes?: string;
  source?: "quick-checkin" | "manual" | "import" | "system";
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DecisionMatrixEntry {
  id: string;
  userId?: string;
  recurringThought: string | null; // V2: the surface-level thought that triggers the belief
  limitingBelief: string;
  newDecision: string;
  evidence: string[]; // user-generated evidence only
  archivedEvidence?: string[]; // soft-deleted evidence kept for history
  archived?: boolean; // soft-delete the whole entry
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DecisionUsage {
  id: string;
  decisionId: string;
  userId?: string;
  usedAt: ISODateTime;
  context?: {
    beliefEntryId?: string;
    relatedState?: BeliefState;
    relatedCause?: BeliefCause;
  };
}

export interface PatternCorrelation {
  state: BeliefState | string;
  thought?: string;
  cause?: BeliefCause | string;
  count: number;
}

export interface PatternReport {
  totalEntries: number;
  topStates: Array<{ state: BeliefState | string; count: number }>;
  topCauses: Array<{ cause: BeliefCause | string; count: number }>;
  topThoughts: Array<{ thought: string; count: number }>;
  stateThoughtPairs: PatternCorrelation[];
  stateCausePairs: PatternCorrelation[];
}

export interface CreateBeliefEntryInput {
  date: ISODate;
  time?: string;
  states: BeliefState[];
  primaryCause?: BeliefCause | null;
  recurringThought?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateDecisionInput {
  recurringThought?: string | null;
  limitingBelief: string;
  newDecision: string;
  evidence?: string[];
}

export interface AddEvidenceInput {
  decisionId: string;
  evidence: string;
}

export interface RemoveEvidenceInput {
  decisionId: string;
  evidenceIndex: number;
}

export interface ArchiveEvidenceInput {
  decisionId: string;
  evidenceIndex: number;
}

export interface UpdateDecisionInput {
  id: string;
  recurringThought?: string | null;
  limitingBelief?: string;
  newDecision?: string;
  archived?: boolean;
}
