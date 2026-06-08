import type { ConstraintType, FoundationType, ISODate, ISODateTime } from "../foundation";

export type { ISODate, ISODateTime };

export type EmotionalState =
  | "Focused"
  | "Determined"
  | "Calm"
  | "Energized"
  | "Curious"
  | "Restless"
  | "Lonely"
  | "Heavy"
  | "Fatigued"
  | "Overwhelmed"
  | "Uncertain"
  | "Frustrated"
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
  targetSystem?: "foundation" | "mission" | "recovery" | "weapon" | "threat-detection" | "manual";
  priority: number;
}

export interface DailyStateLog {
  id: string;
  userId?: string;
  date: ISODate;
  timestamp: ISODateTime;
  selectedStates: EmotionalState[];
  riskScore: number;
  riskLevel: RiskLevel;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface BehaviorOutcome {
  id: string;
  userId?: string;
  date: ISODate;
  behavior: string;
  category: BehaviorCategory;
  occurred: boolean;
  foundation?: FoundationType;
  constraint?: ConstraintType;
  sourceSystem: "foundation" | "constraint" | "threat-detection" | "mission" | "weapon" | "recovery" | "manual";
  timestamp?: ISODateTime;
  metadata?: Record<string, unknown>;
}

export interface StateCorrelation {
  state: EmotionalState;
  behavior: string;
  behaviorCategory: BehaviorCategory;
  occurrencesWithState: number;
  behaviorOccurrencesWithState: number;
  behaviorOccurrencesWithoutState: number;
  sampleSize: number;
  correlationStrength: number;
  updatedAt: ISODateTime;
}

export interface InterventionRecommendation {
  triggerState: EmotionalState;
  recommendation: string;
  priority: number;
  effectivenessScore?: number;
}

export interface InterventionResult {
  id: string;
  userId?: string;
  date: ISODate;
  triggerState: EmotionalState;
  recommendation: string;
  accepted: boolean;
  effective?: boolean;
  effectivenessScore?: number;
  timestamp: ISODateTime;
  metadata?: Record<string, unknown>;
}

export interface StateTrend {
  state: EmotionalState;
  count: number;
  firstSeen?: ISODate;
  lastSeen?: ISODate;
}

export interface HighRiskDay {
  date: ISODate;
  riskScore: number;
  riskLevel: RiskLevel;
  selectedStates: EmotionalState[];
}

export interface StateAnalytics {
  mostCommonStates: StateTrend[];
  highestRiskDays: HighRiskDay[];
  stateTrends: StateTrend[];
  correlations: StateCorrelation[];
  mostEffectiveInterventions: InterventionRecommendation[];
}

export interface CreateStateLogInput {
  date: ISODate;
  selectedStates: EmotionalState[];
  timestamp?: ISODateTime;
  metadata?: Record<string, unknown>;
}

export interface CreateBehaviorOutcomeInput {
  date: ISODate;
  behavior: string;
  category: BehaviorCategory;
  occurred: boolean;
  foundation?: FoundationType;
  constraint?: ConstraintType;
  sourceSystem: BehaviorOutcome["sourceSystem"];
  timestamp?: ISODateTime;
  metadata?: Record<string, unknown>;
}
