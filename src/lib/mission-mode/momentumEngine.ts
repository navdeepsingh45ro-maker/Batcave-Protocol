import type {
  MissionConfig,
  MissionDayLog,
  MissionStability,
  MomentumFlags,
  MomentumTrend,
} from "./types";
import type { ISODate } from "../foundation/types";
import { addDays, getDateRange } from "../foundation/calculations";
import { localFoundationRepository } from "../foundation/localStorageRepository";

// ── Momentum Engine ─────────────────────────────────────────────
// Measures consistency instead of perfection.
// No punishment. No streak resets. Only system diagnostics.

/**
 * Check if a specific card's foundation types were completed on a given date.
 */
function wasCardCompleted(
  date: ISODate,
  foundationTypes: string[]
): boolean {
  const activities = localFoundationRepository.listFoundationActivities();
  return activities.some(
    (a) => a.date === date && foundationTypes.includes(a.foundation)
  );
}

/**
 * Calculate consecutive misses for a card going backward from a date.
 */
function getConsecutiveMisses(
  config: MissionConfig,
  date: ISODate,
  cardId: string
): number {
  const card = config.cards.find((c) => c.id === cardId);
  if (!card) return 0;

  let misses = 0;
  let checkDate = date;

  // Check up to the mission duration going backward
  for (let i = 0; i < 10; i++) {
    const prevDate = addDays(checkDate, -1);
    if (prevDate < config.startDate) break;

    if (!wasCardCompleted(prevDate, card.foundationTypes)) {
      misses++;
    } else {
      break; // Chain broken — no longer consecutive
    }
    checkDate = prevDate;
  }

  return misses;
}

/**
 * Check momentum risk for the current day.
 * Returns updated MomentumFlags.
 *
 * Critical Rules:
 * - Never miss Builder two consecutive days → risk
 * - Never miss Athlete two consecutive days → risk
 */
export function checkMomentumFlags(
  config: MissionConfig,
  date: ISODate
): MomentumFlags {
  const builderCard = config.cards.find((c) => c.id === "builder");
  const athleteCard = config.cards.find((c) => c.id === "athlete");

  const builderCompleted = builderCard
    ? wasCardCompleted(date, builderCard.foundationTypes)
    : false;
  const athleteCompleted = athleteCard
    ? wasCardCompleted(date, athleteCard.foundationTypes)
    : false;

  // Count consecutive misses (not counting today if incomplete)
  const consecutiveBuilderMisses = builderCompleted
    ? 0
    : getConsecutiveMisses(config, date, "builder") + (builderCompleted ? 0 : 1);
  const consecutiveAthleteMisses = athleteCompleted
    ? 0
    : getConsecutiveMisses(config, date, "athlete") + (athleteCompleted ? 0 : 1);

  let momentumRisk = false;
  let riskReason: string | undefined;

  if (consecutiveBuilderMisses >= 2) {
    momentumRisk = true;
    riskReason = "Builder missed 2 consecutive days. Primary mission objective at risk.";
  } else if (consecutiveAthleteMisses >= 2) {
    momentumRisk = true;
    riskReason = "Athlete missed 2 consecutive days. Physical momentum declining.";
  }

  // If both are at risk
  if (consecutiveBuilderMisses >= 2 && consecutiveAthleteMisses >= 2) {
    riskReason = "Both Builder and Athlete missed 2+ consecutive days. System momentum critical.";
  }

  return {
    builderCompleted,
    athleteCompleted,
    consecutiveBuilderMisses,
    consecutiveAthleteMisses,
    momentumRisk,
    riskReason,
  };
}

/**
 * Calculate Mission Stability metrics.
 */
export function calculateMissionStability(
  config: MissionConfig,
  dayLogs: MissionDayLog[]
): MissionStability {
  const logsWithScores = dayLogs.filter((log) => log.score > 0 || dayLogs.length > 0);

  if (logsWithScores.length === 0) {
    return {
      missionId: config.id,
      stabilityPercent: 0,
      rollingCompletionPercent: 0,
      consistencyIndex: 0,
      momentumTrend: "stable",
    };
  }

  // Stability %: How many days hit >= 60% of max score
  const threshold = config.scoringWeights.maxScore * 0.6;
  const stableDays = logsWithScores.filter((log) => log.score >= threshold).length;
  const stabilityPercent = Math.round((stableDays / logsWithScores.length) * 100);

  // Rolling Completion %: Average score as percentage of max
  const totalScorePercent = logsWithScores.reduce(
    (sum, log) => sum + (log.score / config.scoringWeights.maxScore) * 100,
    0
  );
  const rollingCompletionPercent = Math.round(totalScorePercent / logsWithScores.length);

  // Consistency Index: Lower = more consistent (std deviation of scores)
  const scores = logsWithScores.map((log) => log.score);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  // Normalize to 0-100 where 100 = perfectly consistent
  const consistencyIndex = Math.max(
    0,
    Math.round(100 - (stdDev / config.scoringWeights.maxScore) * 100)
  );

  // Momentum Trend: compare recent performance vs earlier
  let momentumTrend: MomentumTrend = "stable";
  if (logsWithScores.length >= 2) {
    const half = Math.ceil(logsWithScores.length / 2);
    const firstHalf = logsWithScores.slice(0, half);
    const secondHalf = logsWithScores.slice(half);

    const firstAvg = firstHalf.reduce((s, l) => s + l.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, l) => s + l.score, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 5) momentumTrend = "rising";
    else if (diff < -5) momentumTrend = "falling";
  }

  return {
    missionId: config.id,
    stabilityPercent,
    rollingCompletionPercent,
    consistencyIndex,
    momentumTrend,
  };
}

/**
 * Generate a corrective action suggestion based on the risk type.
 */
export function suggestCorrectiveAction(flags: MomentumFlags): string {
  if (flags.consecutiveBuilderMisses >= 2 && flags.consecutiveAthleteMisses >= 2) {
    return "Start tomorrow with the smallest possible Builder task — 20 minutes of focused work. Then move your body for 15 minutes. Minimum effective dose.";
  }
  if (flags.consecutiveBuilderMisses >= 2) {
    return "Start tomorrow with the smallest possible Builder task. Even 20 focused minutes counts. The goal is to restart the chain, not catch up.";
  }
  if (flags.consecutiveAthleteMisses >= 2) {
    return "Tomorrow, move your body first thing. A 15-minute walk or mobility session counts. Restart the physical chain before anything else.";
  }
  return "System operating normally. Continue current protocol.";
}
