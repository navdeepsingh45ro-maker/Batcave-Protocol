import type {
  ActiveModeState,
  MissionArchiveEntry,
  MissionConfig,
  MissionDayLog,
} from "./types";

// ── Storage Keys ────────────────────────────────────────────────

const ACTIVE_MODE_KEY = "batcave.mission.active";
const DAY_LOGS_KEY = "batcave.mission.dayLogs";
const ARCHIVE_KEY = "batcave.mission.archive";
const SHUTDOWN_DISMISSED_KEY = "batcave.mission.shutdownDismissed";

// ── Helpers ─────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ── Active Mode ─────────────────────────────────────────────────

export function getActiveModeState(): ActiveModeState | null {
  return readJson<ActiveModeState | null>(ACTIVE_MODE_KEY, null);
}

export function setActiveModeState(state: ActiveModeState): void {
  writeJson(ACTIVE_MODE_KEY, state);
}

export function clearActiveModeState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_MODE_KEY);
}

// ── Day Logs ────────────────────────────────────────────────────

export function listDayLogs(): MissionDayLog[] {
  return readJson<MissionDayLog[]>(DAY_LOGS_KEY, []);
}

export function getDayLogsForMission(missionId: string): MissionDayLog[] {
  return listDayLogs().filter((log) => log.missionId === missionId);
}

export function getDayLog(missionId: string, date: string): MissionDayLog | null {
  return listDayLogs().find((log) => log.missionId === missionId && log.date === date) ?? null;
}

export function upsertDayLog(dayLog: MissionDayLog): MissionDayLog {
  const logs = listDayLogs();
  const existingIndex = logs.findIndex(
    (log) => log.missionId === dayLog.missionId && log.date === dayLog.date
  );

  if (existingIndex >= 0) {
    logs[existingIndex] = { ...dayLog, updatedAt: now() };
  } else {
    logs.push({ ...dayLog, createdAt: now(), updatedAt: now() });
  }

  writeJson(DAY_LOGS_KEY, logs);
  return dayLog;
}

// ── Mission Archive ─────────────────────────────────────────────

export function listArchivedMissions(): MissionArchiveEntry[] {
  return readJson<MissionArchiveEntry[]>(ARCHIVE_KEY, []);
}

export function getArchivedMission(id: string): MissionArchiveEntry | null {
  return listArchivedMissions().find((entry) => entry.id === id) ?? null;
}

export function addArchivedMission(entry: MissionArchiveEntry): void {
  const archive = listArchivedMissions();
  archive.push(entry);
  writeJson(ARCHIVE_KEY, archive);
}

export function updateArchivedMission(entry: MissionArchiveEntry): void {
  const archive = listArchivedMissions();
  const index = archive.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    archive[index] = entry;
    writeJson(ARCHIVE_KEY, archive);
  }
}

// ── Shutdown Dismissed Tracker ──────────────────────────────────

export function getShutdownDismissedDate(): string | null {
  return readJson<string | null>(SHUTDOWN_DISMISSED_KEY, null);
}

export function setShutdownDismissedDate(date: string): void {
  writeJson(SHUTDOWN_DISMISSED_KEY, date);
}

// ── Utility ─────────────────────────────────────────────────────

export { createId, now };
