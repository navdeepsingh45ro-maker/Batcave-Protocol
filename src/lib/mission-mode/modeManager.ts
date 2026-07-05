import type { ActiveModeState, BatcaveMode, MissionConfig, MissionDayLog } from "./types";
import type { ISODate } from "../foundation/types";
import {
  getActiveModeState,
  setActiveModeState,
  clearActiveModeState,
  getDayLogsForMission,
} from "./repository";
import { archiveMission } from "./missionHistory";
import { calculateMissionStability } from "./momentumEngine";

// ── Mode Manager ────────────────────────────────────────────────
// Controls the active operating mode of the Batcave.
// Only one mode may be active at a time.

/**
 * Get the currently active Batcave mode.
 */
export function getActiveMode(): BatcaveMode {
  const state = getActiveModeState();
  return state?.mode ?? "normal";
}

/**
 * Get the currently active mission configuration, if any.
 */
export function getActiveMission(): MissionConfig | null {
  const state = getActiveModeState();
  return state?.activeMission ?? null;
}

/**
 * Check if any mission is currently active.
 */
export function isMissionActive(): boolean {
  return getActiveMission() !== null;
}

/**
 * Activate a mission. Sets the Batcave mode and persists the configuration.
 */
export function activateMission(config: MissionConfig): void {
  const state: ActiveModeState = {
    mode: config.mode,
    activeMission: config,
    activatedAt: new Date().toISOString(),
  };
  setActiveModeState(state);
}

/**
 * Deactivate the current mission and return to normal mode.
 * Archives the mission with its daily logs and stability metrics.
 */
export function deactivateMission(
  lessons: string = "",
  outcome: "completed" | "abandoned" | "extended" = "completed"
): void {
  const mission = getActiveMission();
  if (!mission) return;

  const dayLogs = getDayLogsForMission(mission.id);
  const stability = calculateMissionStability(mission, dayLogs);

  archiveMission(mission, dayLogs, stability, lessons, outcome);
  clearActiveModeState();
}

/**
 * Get the 1-based day number within the mission (Day 1, Day 2, etc.)
 */
export function getMissionDayNumber(config: MissionConfig, date: ISODate): number {
  const start = new Date(`${config.startDate}T00:00:00.000Z`);
  const current = new Date(`${date}T00:00:00.000Z`);
  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  return Math.max(1, diffDays + 1);
}

/**
 * Get the total number of days in the mission.
 */
export function getMissionTotalDays(config: MissionConfig): number {
  const start = new Date(`${config.startDate}T00:00:00.000Z`);
  const end = new Date(`${config.endDate}T00:00:00.000Z`);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * Get days remaining in the mission.
 */
export function getMissionDaysRemaining(config: MissionConfig, date: ISODate): number {
  const end = new Date(`${config.endDate}T00:00:00.000Z`);
  const current = new Date(`${date}T00:00:00.000Z`);
  const diffMs = end.getTime() - current.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

/**
 * Get mission progress as a percentage (0–100).
 */
export function getMissionProgress(config: MissionConfig, date: ISODate): number {
  const totalDays = getMissionTotalDays(config);
  const dayNumber = getMissionDayNumber(config, date);
  return Math.min(100, Math.round((dayNumber / totalDays) * 100));
}

/**
 * Check if the mission has expired (current date is past end date).
 */
export function isMissionExpired(config: MissionConfig, date: ISODate): boolean {
  return date > config.endDate;
}

/**
 * Check if the mission has started (current date is on or after start date).
 */
export function isMissionStarted(config: MissionConfig, date: ISODate): boolean {
  return date >= config.startDate;
}

/**
 * Get the mission status label.
 */
export function getMissionStatus(config: MissionConfig, date: ISODate): string {
  if (isMissionExpired(config, date)) return "COMPLETED";
  if (!isMissionStarted(config, date)) return "PENDING";
  return "ACTIVE";
}
