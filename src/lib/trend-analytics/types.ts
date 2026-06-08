import type { FoundationActivityLog, FoundationType, Identity, ISODate } from "../foundation";
import type { CountermeasureEffectiveness, CountermeasureLog } from "../countermeasures";

export type HeatmapLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface FoundationHeatmapCell {
  date: ISODate;
  scorePercent: number;
  level: HeatmapLevel;
}

export interface FoundationTrendPoint {
  label: string;
  startDate: ISODate;
  endDate: ISODate;
  scorePercent: number;
}

export interface IdentityParticipationTrend {
  identity: Identity;
  activeDays: number;
  totalDays: number;
  scorePercent: number;
}

export interface ThreatFrequency {
  threatId: string;
  count: number;
  direction: "up" | "down" | "flat";
}

export interface TrendAnalyticsReport {
  weeklyFoundationScore: number;
  monthlyFoundationScore: number;
  weeklyFoundationHeatmap: FoundationHeatmapCell[];
  foundationTrends: FoundationTrendPoint[];
  identityParticipation: IdentityParticipationTrend[];
  threatFrequency: ThreatFrequency[];
  countermeasureSuccessRate: CountermeasureEffectiveness[];
}

export interface TrendAnalyticsInput {
  foundationActivities: FoundationActivityLog[];
  countermeasureLogs: CountermeasureLog[];
  startDate: ISODate;
  endDate: ISODate;
}
