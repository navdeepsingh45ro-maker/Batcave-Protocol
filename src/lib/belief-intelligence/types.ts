export type ISODate = `${number}-${number}-${number}`;
export type ISODateTime = string;

// ── V4.4: State Categories ──────────────────────────────────────
export type StateCategory = "positive" | "neutral" | "negative";

// ── V4.4: 15-state focused library ─────────────────────────────
export type BeliefState =
  // Positive (7)
  | "Focused"
  | "Motivated"
  | "Confident"
  | "Energized"
  | "Calm"
  | "Disciplined"
  | "Flow State"
  // Neutral (6)
  | "Reflective"
  | "Curious"
  | "Recovering"
  | "Uncertain"
  | "Thinking"
  | "Observing"
  // Negative (7)
  | "Heavy"
  | "Lonely"
  | "Anxious"
  | "Overwhelmed"
  | "Frustrated"
  | "Fatigued"
  | "Disconnected"
  // Deprecated aliases (kept for migration of old data)
  | "Determined"
  | "Restless"
  | "Fired Up";

// ── V4.4: Dynamic cause system ──────────────────────────────────
export type PositiveCause =
  | "Momentum"
  | "Recent Progress"
  | "Mission Progress"
  | "Productive Session"
  | "Strong Discipline"
  | "Physical Energy"
  | "Clear Direction"
  | "Clear Plan"
  | "Good Sleep"
  | "Fewer Interruptions"
  | "Progress"
  | "Inspiration"
  | "Energy Peak"
  | "Clarity"
  | "Preparation"
  | "Past Success"
  | "Competence"
  | "Readiness"
  | "Meditation"
  | "Rest"
  | "Order"
  | "No Urgent Threats"
  | "Strong Commitment"
  | "High Stakes"
  | "System Alignment"
  | "Deep Work"
  | "Optimal Challenge"
  | "Zero Distractions";

export type NeutralCause =
  | "Reflection"
  | "Learning"
  | "Observation"
  | "Processing"
  | "Transition Period"
  | "Exploration"
  | "Post-Action"
  | "Transition"
  | "End of Day"
  | "Intense Output"
  | "Illness"
  | "Poor Sleep"
  | "Complex Problem"
  | "Ambiguity"
  | "Strategy Session"
  | "New Information"
  | "Novel Problem"
  | "Waiting"
  | "Passive State";

export type NegativeCause =
  | "Missing Connection"
  | "Fear Of Failure"
  | "Fatigue"
  | "Lack Of Progress"
  | "Rejection Memory"
  | "Financial Stress"
  | "Social Pressure"
  | "Identity Conflict"
  | "Uncertainty"
  | "Burnout"
  | "Poor Diet"
  | "Sedentary"
  | "Isolation"
  | "Conflict"
  | "Looming Deadline"
  | "Too Many Tasks"
  | "No Prioritization"
  | "Context Switching"
  | "Blocked Project"
  | "Interruption"
  | "Technical Issue"
  | "Sleep Deprivation"
  | "Long Hours"
  | "Physical Exhaustion"
  | "Lack of Purpose"
  | "Boredom"
  | "Misalignment";

export type BeliefCause = PositiveCause | NeutralCause | NegativeCause | "Other";

// ── V4.1: Thought classification ─────────────────────────────
export type ThoughtType = "strengthening" | "limiting" | "neutral";

export interface BeliefEntry {
  id: string;
  userId?: string;
  date: ISODate;
  time?: string;
  /** V4.4: UI enforces single state, but array kept for migration compat */
  states: BeliefState[];
  /** V4.4: derived from dominant state */
  stateCategory?: StateCategory;
  primaryCause: BeliefCause | null;
  /** V4.1: the dominant thought of the session */
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
  recurringThought: string | null;
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
  stateCategory?: StateCategory;
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
