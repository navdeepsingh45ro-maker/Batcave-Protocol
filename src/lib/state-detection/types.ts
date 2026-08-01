import type { ConstraintType, FoundationType, ISODate, ISODateTime } from "../foundation";

export type { ISODate, ISODateTime };

// ── V4.4: Expanded EmotionalState (mirrors BeliefState) ─────────
export type EmotionalState =
  // Positive
  | "Focused"
  | "Motivated"
  | "Confident"
  | "Energized"
  | "Calm"
  | "Disciplined"
  | "Flow State"
  // Neutral
  | "Reflective"
  | "Curious"
  | "Recovering"
  | "Uncertain"
  | "Thinking"
  | "Observing"
  // Negative
  | "Heavy"
  | "Lonely"
  | "Anxious"
  | "Overwhelmed"
  | "Frustrated"
  | "Fatigued"
  | "Disconnected"
  // Deprecated (migration compat)
  | "Determined"
  | "Restless"
  | "Fired Up";

export type RiskLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export type BehaviorCategory =
  | "constraint-failure"
  | "foundation-missed"
  | "foundation-completed"
  | "mission-abandoned"
  | "avoidance"
  | "scrolling"
  | "recovery-action"
  | "custom";

export interface StateRiskWeight {
  state: EmotionalState;
  weight: number;
}

export interface RiskThreshold {
  level: RiskLevel;
  minScore: number;
}

export interface StateInterventionDefinition {
  triggerState: EmotionalState;
  recommendation: string;
  targetSystem: string;
  priority: number;
}

export interface DailyStateLog {
  id: string;
  userId?: string;
  date: ISODate;
  selectedStates: EmotionalState[];
  riskScore: number;
  riskLevel: RiskLevel;
  timestamp: ISODateTime;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface StateTrend {
  state: EmotionalState;
  direction?: "up" | "down" | "stable";
  occurrences?: number;
  trendDays?: number;
  count: number;
  firstSeen?: ISODate;
  lastSeen?: ISODate;
}

export interface StateFrequency {
  state: EmotionalState;
  count: number;
  percentage: number;
}

export interface InterventionRecommendation {
  triggerState: EmotionalState;
  recommendation: string;
  targetSystem?: string;
  priority: number;
  effectivenessScore?: number;
}

export interface InterventionHistory {
  id: string;
  date: ISODate;
  triggerState: EmotionalState;
  recommendation: string;
  accepted: boolean;
  createdAt: ISODateTime;
}

export interface StateCorrelation {
  state: EmotionalState;
  correlatedFoundation?: FoundationType | ConstraintType;
  correlationStrength: number;
  direction?: "positive" | "negative";
  // Extended fields used by calculations.ts
  behavior?: string;
  behaviorCategory?: string;
  occurrencesWithState?: number;
  behaviorOccurrencesWithState?: number;
  behaviorOccurrencesWithoutState?: number;
  sampleSize?: number;
  updatedAt?: string;
}

export interface AddStateLogInput {
  date: ISODate;
  selectedStates: EmotionalState[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** Alias used by localStorageRepository */
export type CreateStateLogInput = AddStateLogInput & {
  timestamp?: string;
};

export interface StateAnalytics {
  frequencies?: StateFrequency[];
  trends?: StateTrend[];
  correlations?: StateCorrelation[];
  mostCommonStates?: StateTrend[];
  highestRiskDays?: HighRiskDay[];
  stateTrends?: StateTrend[];
  mostEffectiveInterventions?: InterventionRecommendation[];
}

export interface DailyStateSummary {
  date: ISODate;
  selectedStates: EmotionalState[];
  riskScore: number;
  riskLevel: RiskLevel;
  dominantState: EmotionalState | null;
}

// ── Types used by calculations.ts and localStorageRepository ────

export interface BehaviorOutcome {
  id: string;
  date: ISODate;
  behavior: string;
  category: BehaviorCategory;
  occurred: boolean;
  notes?: string;
}

export type CreateBehaviorOutcomeInput = Omit<BehaviorOutcome, "id">;

export interface InterventionResult {
  id: string;
  triggerState: EmotionalState;
  recommendation: string;
  effective: boolean;
  timestamp: string;
}

export interface HighRiskDay {
  date: ISODate;
  riskScore: number;
  riskLevel: RiskLevel;
  selectedStates: EmotionalState[];
}
