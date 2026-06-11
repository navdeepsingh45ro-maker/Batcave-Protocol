import type { FoundationType, Identity, ISODate, ISODateTime } from "../foundation";
import type { EmotionalState } from "../state-detection";

export type ThreatSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Need =
  | "Connection"
  | "Rest"
  | "Validation"
  | "Certainty"
  | "Progress"
  | "Relief"
  | "Stimulation"
  | "Momentum";

export type MissionRedirect = "Primary Mission" | "Secondary Mission" | "Recovery Mission";

export type CountermeasureCategory =
  | FoundationType
  | "Connection"
  | "Environment Shift"
  | "Digital Control"
  | "Mission Simplification"
  | "Momentum Protection"
  | "Recovery"
  | "Anti-Avoidance"
  | "Custom";

export interface ThreatDefinition {
  id: string;
  name: string;
  description: string;
  severity: ThreatSeverity;
  associatedStates: EmotionalState[];
}

export interface NeedDefinition {
  id: string;
  name: Need;
  description: string;
}

export interface ThreatNeedMapping {
  threatId: string;
  need: Need;
  priority: number;
}

export interface CountermeasureDefinition {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  category: CountermeasureCategory;
  activatesIdentity: Identity;
  recommendedMissionRedirect: MissionRedirect;
  targetThreatIds: string[];
  targetNeeds: Need[];
  priority: number;
}

export interface CountermeasureRecommendationInput {
  selectedStates: EmotionalState[];
  date?: ISODate;
  preferredMission?: MissionRedirect;
  context?: {
    missedFoundationCounts?: Partial<Record<FoundationType, number>>;
    sleepDebt?: boolean;
    recentThreatIds?: string[];
    recentCompletedCountermeasureIds?: string[];
  };
}

export interface CountermeasureRecommendation {
  detectedThreat: ThreatDefinition;
  recommendedNeed: NeedDefinition;
  recommendedCountermeasure: CountermeasureDefinition;
  recommendedIdentity: Identity;
  missionRedirect: MissionRedirect;
  explanation: string;
  confidenceScore: number;
}

export type CountermeasureStackRole = "PRIMARY" | "SECONDARY" | "EMERGENCY";

export interface CountermeasureStackItem {
  role: CountermeasureStackRole;
  detectedThreat: ThreatDefinition;
  recommendedNeed: NeedDefinition;
  countermeasure: CountermeasureDefinition;
  identity: Identity;
  missionRedirect: MissionRedirect;
  confidenceScore: number;
  reason: string;
}

export interface CountermeasureStackRecommendation {
  selectedStates: EmotionalState[];
  recommendedThreat: ThreatDefinition;
  recommendedNeed: NeedDefinition;
  stack: CountermeasureStackItem[];
  generatedAt: ISODateTime;
}

export interface CountermeasureLog {
  id: string;
  userId?: string;
  date: ISODate;
  triggerStates: EmotionalState[];
  detectedThreatId: string;
  detectedNeed: Need;
  countermeasureId: string;
  identity: Identity;
  missionRedirect: MissionRedirect;
  accepted: boolean;
  completed: boolean;
  completedAt?: ISODateTime;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface InterventionHistory {
  id: string;
  userId?: string;
  date: ISODate;
  triggerState: EmotionalState;
  detectedThreatId: string;
  recommendedCountermeasureId: string;
  accepted: boolean;
  completed: boolean;
  createdAt: ISODateTime;
}

export interface CountermeasureEffectiveness {
  countermeasureId: string;
  countermeasureName: string;
  recommendedCount: number;
  acceptedCount: number;
  completedCount: number;
  acceptanceRate: number;
  completionRate: number;
  effectivenessScore: number;
  skipRate: number;
  failureRate: number;
}

export interface CompleteCountermeasureInput {
  logId?: string;
  date: ISODate;
  triggerStates: EmotionalState[];
  detectedThreatId: string;
  detectedNeed: Need;
  countermeasureId: string;
  identity: Identity;
  missionRedirect: MissionRedirect;
  accepted: boolean;
  completed: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ── V4.4: Custom Countermeasures ─────────────────────────────────

export type CountermeasureSource = "system" | "custom";

export interface CustomCountermeasure {
  id: string;
  name: string;
  description: string;
  triggerStates: EmotionalState[];
  triggerCauses: string[];
  category: string;
  durationMinutes: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateCustomCountermeasureInput {
  name: string;
  description: string;
  triggerStates: EmotionalState[];
  triggerCauses: string[];
  category: string;
  durationMinutes?: number;
}
