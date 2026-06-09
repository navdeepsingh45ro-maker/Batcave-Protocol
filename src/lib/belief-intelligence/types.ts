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

// ── V4.1: Thought classification ─────────────────────────────
export type ThoughtType = "strengthening" | "limiting" | "neutral";

export interface BeliefEntry {
  id: string;
  userId?: string;
  date: ISODate;
  time?: string;
  states: BeliefState[];
  primaryCause: BeliefCause | null;
  /** V4.1: renamed from recurringThought — the dominant thought of the session */
  dominantThought?: string | null;
  /** V4.1: "strengthening" | "limiting" | "neutral" */
  thoughtType?: ThoughtType | null;
  /** Legacy alias — kept for migration compatibility */
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
  recurringThought: string | null; // the surface-level thought that triggers the belief
  limitingBelief: string;
  newDecision: string;
  /** V4.1: empowering belief that replaces the limiting one */
  newEmpoweringBelief?: string | null;
  evidence: string[];
  archivedEvidence?: string[];
  archived?: boolean;
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
  topThoughts: Array<{ thought: string; count: number; thoughtType?: ThoughtType | null }>;
  /** V4.1 */
  strengtheningThoughts: Array<{ thought: string; count: number }>;
  limitingThoughts: Array<{ thought: string; count: number }>;
  stateThoughtPairs: PatternCorrelation[];
  stateCausePairs: PatternCorrelation[];
}

// ── Belief Transformation (V4.1) ─────────────────────────────
export interface BeliefTransformation {
  recurringThought: string;
  limitingBelief: string;
  newEmpoweringBelief: string;
  newDecision: string;
  usageCount: number;
  decisionId: string;
}

export interface CreateBeliefEntryInput {
  date: ISODate;
  time?: string;
  states: BeliefState[];
  primaryCause?: BeliefCause | null;
  dominantThought?: string | null;
  thoughtType?: ThoughtType | null;
  /** Legacy alias */
  recurringThought?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateDecisionInput {
  recurringThought?: string | null;
  limitingBelief: string;
  newDecision: string;
  newEmpoweringBelief?: string | null;
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
  newEmpoweringBelief?: string | null;
  archived?: boolean;
}
