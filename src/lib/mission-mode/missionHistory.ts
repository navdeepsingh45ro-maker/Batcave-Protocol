import type {
  MissionArchiveEntry,
  MissionConfig,
  MissionDayLog,
  MissionOutcome,
  MissionStability,
} from "./types";
import { addArchivedMission, listArchivedMissions, createId } from "./repository";

// ── Mission History ─────────────────────────────────────────────
// Archives completed missions. Every mission becomes part of
// the Batcave's operational history.

/**
 * Archive a completed mission with its daily logs and metrics.
 */
export function archiveMission(
  config: MissionConfig,
  dailyLogs: MissionDayLog[],
  stability: MissionStability,
  lessons: string = "",
  outcome: MissionOutcome = "completed"
): MissionArchiveEntry {
  const scores = dailyLogs.map((log) => log.score);
  const finalScore = scores.length > 0 ? scores[scores.length - 1] : 0;
  const averageDailyScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

  const entry: MissionArchiveEntry = {
    id: createId("march"),
    config,
    dailyLogs,
    finalScore,
    averageDailyScore,
    stability,
    lessonsLearned: lessons,
    outcome,
    archivedAt: new Date().toISOString(),
  };

  addArchivedMission(entry);
  return entry;
}

/**
 * Get all archived missions, sorted newest first.
 */
export function getMissionHistory(): MissionArchiveEntry[] {
  return listArchivedMissions().sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

/**
 * Get a summary of mission history for the dashboard.
 */
export function getMissionHistorySummary(): {
  totalMissions: number;
  completedMissions: number;
  averageScore: number;
  bestMission: MissionArchiveEntry | null;
} {
  const history = getMissionHistory();
  const completed = history.filter((m) => m.outcome === "completed");

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, m) => sum + m.averageDailyScore, 0) / completed.length
        )
      : 0;

  const bestMission =
    completed.length > 0
      ? completed.reduce((best, m) =>
          m.averageDailyScore > best.averageDailyScore ? m : best
        )
      : null;

  return {
    totalMissions: history.length,
    completedMissions: completed.length,
    averageScore: avgScore,
    bestMission,
  };
}
