import {
  FOUNDATION_IDENTITY_MAP,
  IDENTITIES,
  calculateAllIdentityActivityScores,
  calculateDailyFoundationScoreFromActivities,
  calculateWeeklyFoundationScoreFromActivities,
  getDateRange
} from "../foundation";
import { calculateCountermeasureEffectiveness } from "../countermeasures";
import type { CountermeasureLog } from "../countermeasures";
import type { FoundationActivityLog, ISODate } from "../foundation";
import type {
  FoundationHeatmapCell,
  FoundationTrendPoint,
  HeatmapLevel,
  ThreatFrequency,
  TrendAnalyticsInput,
  TrendAnalyticsReport
} from "./types";

function getHeatmapLevel(scorePercent: number): HeatmapLevel {
  if (scorePercent === 0) return "NONE";
  if (scorePercent < 40) return "LOW";
  if (scorePercent < 80) return "MEDIUM";
  return "HIGH";
}

function addDays(date: ISODate, days: number): ISODate {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10) as ISODate;
}

export function createWeeklyFoundationHeatmap(
  foundationActivities: FoundationActivityLog[],
  startDate: ISODate,
  endDate: ISODate
): FoundationHeatmapCell[] {
  return getDateRange(startDate, endDate).map((date) => {
    const score = calculateDailyFoundationScoreFromActivities(foundationActivities, date);
    return {
      date,
      scorePercent: score.scorePercent,
      level: getHeatmapLevel(score.scorePercent)
    };
  });
}

export function calculateFoundationTrends(
  foundationActivities: FoundationActivityLog[],
  startDate: ISODate,
  endDate: ISODate,
  periodDays = 7
): FoundationTrendPoint[] {
  const trends: FoundationTrendPoint[] = [];
  let periodStart = startDate;
  let index = 1;

  while (periodStart <= endDate) {
    const periodEnd = addDays(periodStart, periodDays - 1) > endDate ? endDate : addDays(periodStart, periodDays - 1);
    const score = calculateWeeklyFoundationScoreFromActivities(foundationActivities, periodStart, periodEnd);
    trends.push({
      label: `Week ${index}`,
      startDate: periodStart,
      endDate: periodEnd,
      scorePercent: score.averageScorePercent
    });
    periodStart = addDays(periodEnd, 1);
    index += 1;
  }

  return trends;
}

export function calculateThreatFrequency(countermeasureLogs: CountermeasureLog[]): ThreatFrequency[] {
  const midpoint = Math.floor(countermeasureLogs.length / 2);
  const firstHalf = countermeasureLogs.slice(0, midpoint);
  const secondHalf = countermeasureLogs.slice(midpoint);
  const threatIds = Array.from(new Set(countermeasureLogs.map((log) => log.detectedThreatId)));

  return threatIds
    .map((threatId) => {
      const firstCount = firstHalf.filter((log) => log.detectedThreatId === threatId).length;
      const secondCount = secondHalf.filter((log) => log.detectedThreatId === threatId).length;
      return {
        threatId,
        count: firstCount + secondCount,
        direction: secondCount > firstCount ? "up" : secondCount < firstCount ? "down" : "flat"
      } satisfies ThreatFrequency;
    })
    .sort((left, right) => right.count - left.count);
}

export function calculateTrendAnalytics(input: TrendAnalyticsInput): TrendAnalyticsReport {
  const weeklyScore = calculateWeeklyFoundationScoreFromActivities(
    input.foundationActivities,
    input.startDate,
    input.endDate
  );
  const monthlyScore = calculateWeeklyFoundationScoreFromActivities(
    input.foundationActivities,
    input.startDate,
    input.endDate
  );
  const syntheticDailyLogs = input.foundationActivities.map((activity) => ({
    id: activity.id,
    userId: activity.userId,
    date: activity.date,
    foundation: activity.foundation,
    subtype: activity.subtype,
    completed: true,
    durationMinutes: activity.durationMinutes,
    notes: activity.notes,
    source: activity.source,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt
  }));

  return {
    weeklyFoundationScore: weeklyScore.averageScorePercent,
    monthlyFoundationScore: monthlyScore.averageScorePercent,
    weeklyFoundationHeatmap: createWeeklyFoundationHeatmap(input.foundationActivities, input.startDate, input.endDate),
    foundationTrends: calculateFoundationTrends(input.foundationActivities, input.startDate, input.endDate),
    identityParticipation: calculateAllIdentityActivityScores(syntheticDailyLogs, input.startDate, input.endDate),
    threatFrequency: calculateThreatFrequency(input.countermeasureLogs),
    countermeasureSuccessRate: calculateCountermeasureEffectiveness(input.countermeasureLogs)
  };
}

export function getFoundationActivityCountsByIdentity(foundationActivities: FoundationActivityLog[]) {
  return IDENTITIES.map((identity) => ({
    identity,
    activityCount: foundationActivities.filter((activity) => FOUNDATION_IDENTITY_MAP[activity.foundation] === identity)
      .length
  }));
}
