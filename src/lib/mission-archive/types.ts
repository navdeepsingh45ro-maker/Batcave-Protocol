import type { ISODate } from "../foundation/types";
import type { FoundationType } from "../foundation/types";
import type { RiskLevel } from "../state-detection/types";
import type { EmotionalState } from "../state-detection/types";
import type { ThreatDefinition, NeedDefinition, Need } from "../countermeasures/types";

export type ArchiveWindow = "7d" | "30d" | "all";

export interface DailyMissionSnapshot {
  date: ISODate;
  // State data
  checkInCount: number;
  peakRiskLevel: RiskLevel | null;
  allStates: EmotionalState[];
  // Belief data
  beliefEntryCount: number;
  causes: string[];
  thoughts: string[];
  // Foundation data
  completedFoundations: FoundationType[];
  missedFoundations: FoundationType[];
  foundationScore: number; // 0-100
  totalActivityDurationMinutes: number;
  // Countermeasure data
  countermeasureAccepted: number;
  countermeasureCompleted: number;
  countermeasureFailed: number;
  countermeasureSkipped: number;
  dominantThreat: ThreatDefinition | null;
  dominantNeed: NeedDefinition | null;
}

export interface ThreatFrequencyEntry {
  threat: ThreatDefinition;
  count: number;
  daysActive: number;
}

export interface NeedFrequencyEntry {
  need: Need;
  count: number;
}

export interface ThreatFoundationCorrelation {
  threatId: string;
  threatName: string;
  foundation: FoundationType;
  totalDaysWithThreat: number;
  daysFoundationSkipped: number;
  skipPercent: number;
}

export interface ThreatCountermeasureCorrelation {
  threatId: string;
  threatName: string;
  totalActions: number;
  accepted: number;
  completed: number;
  acceptedPercent: number;
  completedPercent: number;
}

export interface ThreatIdentityCorrelation {
  threatId: string;
  threatName: string;
  identity: string;
  daysWithThreat: number;
  daysIdentityActive: number;
  participationPercent: number;
}

export interface ThoughtFrequencyEntry {
  thought: string;
  period: string; // "2024-W23" for week, "2024-06" for month
  count: number;
}

export interface ArchiveSummary {
  totalDays: number;
  hasEnoughData: boolean; // true when >= 5 days with foundation data
  daysWithFoundationData: number;
  earliestDate: ISODate | null;
  latestDate: ISODate | null;
  allDates: ISODate[]; // all dates with ANY data, newest first
  datesWithFoundationData: ISODate[]; // dates with >= 1 foundation completed
}
