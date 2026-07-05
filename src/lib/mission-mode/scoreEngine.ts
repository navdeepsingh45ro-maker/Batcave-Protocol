import type { MissionConfig, MissionCardState, MissionSubtask, MissionDayLog } from "./types";
import type { ISODate } from "../foundation/types";
import { localFoundationRepository } from "../foundation/localStorageRepository";
import { getMissionRating } from "./config";
import { createId, now } from "./repository";

// ── Score Engine ────────────────────────────────────────────────
// Computes mission scores by reading from the EXISTING foundation
// repository. No data duplication — scores are derived views.

/**
 * Calculate the mission score for a given day.
 * Reads foundation activities from existing repository and maps them
 * to mission score categories.
 *
 * @returns Score from 0 to config.scoringWeights.maxScore
 */
export function calculateMissionDayScore(config: MissionConfig, date: ISODate): number {
  const activities = localFoundationRepository.listFoundationActivities().filter(
    (a) => a.date === date
  );

  let totalScore = 0;

  for (const category of config.scoringWeights.categories) {
    const hasActivity = activities.some((a) => {
      // Must match one of the category's foundation types
      if (!category.foundationTypes.includes(a.foundation)) return false;
      // If qualifying subtypes specified, must also match subtype
      if (category.qualifyingSubtypes && category.qualifyingSubtypes.length > 0) {
        return category.qualifyingSubtypes.includes(a.subtype);
      }
      return true;
    });

    if (hasActivity) {
      totalScore += category.maxPoints;
    }
  }

  return Math.min(totalScore, config.scoringWeights.maxScore);
}

/**
 * Get the score breakdown for each category.
 */
export function getScoreBreakdown(
  config: MissionConfig,
  date: ISODate
): Array<{ id: string; label: string; earned: number; max: number; completed: boolean }> {
  const activities = localFoundationRepository.listFoundationActivities().filter(
    (a) => a.date === date
  );

  return config.scoringWeights.categories.map((category) => {
    const hasActivity = activities.some((a) => {
      if (!category.foundationTypes.includes(a.foundation)) return false;
      if (category.qualifyingSubtypes && category.qualifyingSubtypes.length > 0) {
        return category.qualifyingSubtypes.includes(a.subtype);
      }
      return true;
    });

    return {
      id: category.id,
      label: category.label,
      earned: hasActivity ? category.maxPoints : 0,
      max: category.maxPoints,
      completed: hasActivity,
    };
  });
}

/**
 * Build the card state for a specific mission card.
 * Maps foundation activity data to mission card status.
 */
/**
 * Build the card state for a specific mission card.
 * Maps foundation activity data to mission card status.
 */
export function getCardState(
  config: MissionConfig,
  date: ISODate,
  cardId: string,
  existingLog?: MissionDayLog | null
): MissionCardState {
  const card = config.cards.find((c) => c.id === cardId);
  if (!card) {
    return {
      cardId,
      status: "pending",
      score: 0,
      maxScore: 0,
      subtasks: [],
    };
  }

  const activities = localFoundationRepository.listFoundationActivities().filter(
    (a) => a.date === date && card.foundationTypes.includes(a.foundation)
  );

  // Build subtasks from activities
  const subtasks: MissionSubtask[] = activities.map((a) => ({
    id: a.id,
    label: `${a.subtype}${a.durationMinutes ? ` (${a.durationMinutes}m)` : ""}`,
    completed: true,
    completedAt: a.createdAt,
    durationMinutes: a.durationMinutes,
  }));

  // Append custom user-defined drills or tasks if they exist
  if (existingLog) {
    if (cardId === "athlete" && existingLog.athleteDrills) {
      existingLog.athleteDrills.forEach((drill) => {
        subtasks.push({
          id: drill.id,
          label: drill.name,
          completed: drill.completed,
        });
      });
    } else if (cardId === "anchor" && existingLog.anchorTasks) {
      existingLog.anchorTasks.forEach((task) => {
        subtasks.push({
          id: task.id,
          label: task.name,
          completed: task.completed,
        });
      });
    } else if (cardId === "builder" && existingLog.builderGoal) {
      subtasks.unshift({
        id: "builder_goal",
        label: `Goal: ${existingLog.builderGoal}`,
        completed: activities.length > 0, // Mark complete if any builder activity logged
      });
    }
  }

  // Calculate score for this card's categories
  const relatedCategories = config.scoringWeights.categories.filter((cat) =>
    cat.foundationTypes.some((ft) => card.foundationTypes.includes(ft))
  );

  let cardScore = 0;
  let cardMax = 0;
  for (const cat of relatedCategories) {
    cardMax += cat.maxPoints;
    const hasActivity = activities.some((a) => {
      if (!cat.foundationTypes.includes(a.foundation)) return false;
      if (cat.qualifyingSubtypes && cat.qualifyingSubtypes.length > 0) {
        return cat.qualifyingSubtypes.includes(a.subtype);
      }
      return true;
    });
    if (hasActivity) cardScore += cat.maxPoints;
  }

  // Determine status
  let status: MissionCardState["status"] = "pending";
  if (subtasks.length > 0 && cardScore >= cardMax) {
    status = "completed";
  } else if (subtasks.length > 0) {
    status = "in-progress";
  }

  if (existingLog?.manualStatuses?.[cardId]) {
    status = existingLog.manualStatuses[cardId];
  }

  const latestActivity = activities.length > 0
    ? activities.reduce((latest, a) =>
        a.createdAt > latest.createdAt ? a : latest
      )
    : null;

  return {
    cardId,
    status,
    score: cardScore,
    maxScore: cardMax,
    completedAt: status === "completed" ? latestActivity?.createdAt : undefined,
    subtasks,
  };
}

/**
 * Build the complete day log for a mission day.
 * This is the primary function Dashboard calls to get mission state.
 */
export function buildMissionDayLog(
  config: MissionConfig,
  date: ISODate,
  existingLog?: MissionDayLog | null
): MissionDayLog {
  const score = calculateMissionDayScore(config, date);
  const rating = getMissionRating(score, config.ratings);

  const cardStates = config.cards.map((card) =>
    getCardState(config, date, card.id, existingLog)
  );

  const baseLog: MissionDayLog = {
    id: existingLog?.id ?? createId("mday"),
    missionId: config.id,
    date,
    score,
    rating: rating.label,
    cardStates,
    momentumFlags: {
      builderCompleted: cardStates.find((c) => c.cardId === "builder")?.status === "completed",
      athleteCompleted: cardStates.find((c) => c.cardId === "athlete")?.status === "completed",
      consecutiveBuilderMisses: 0,
      consecutiveAthleteMisses: 0,
      momentumRisk: false,
    },
    createdAt: existingLog?.createdAt ?? now(),
    updatedAt: now(),
  };

  // Merge custom user fields if they exist
  if (existingLog) {
    return {
      ...baseLog,
      builderGoal: existingLog.builderGoal,
      athleteLocation: existingLog.athleteLocation,
      athleteDrills: existingLog.athleteDrills,
      anchorTasks: existingLog.anchorTasks,
      dayNotes: existingLog.dayNotes,
      shutdownReflection: existingLog.shutdownReflection,
      momentumFlags: {
        ...baseLog.momentumFlags,
        ...existingLog.momentumFlags,
      },
    };
  }

  return baseLog;
}
