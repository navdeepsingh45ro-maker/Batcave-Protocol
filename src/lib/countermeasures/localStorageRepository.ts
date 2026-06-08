import type { CompleteCountermeasureInput, CountermeasureLog } from "./types";

const COUNTERMEASURE_LOG_STORAGE_KEY = "batcave.countermeasure.logs.v1";

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  return rawValue ? (JSON.parse(rawValue) as T) : fallback;
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const localCountermeasureRepository = {
  listLogs(): CountermeasureLog[] {
    return readJson<CountermeasureLog[]>(COUNTERMEASURE_LOG_STORAGE_KEY, []);
  },

  complete(input: CompleteCountermeasureInput): CountermeasureLog {
    const logs = this.listLogs();
    const timestamp = now();
    const existingIndex = input.logId ? logs.findIndex((log) => log.id === input.logId) : -1;

    const nextLog: CountermeasureLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : createId("countermeasure"),
      date: input.date,
      triggerStates: Array.from(new Set(input.triggerStates)),
      detectedThreatId: input.detectedThreatId,
      detectedNeed: input.detectedNeed,
      countermeasureId: input.countermeasureId,
      identity: input.identity,
      missionRedirect: input.missionRedirect,
      accepted: input.accepted,
      completed: input.completed,
      completedAt: input.completed ? timestamp : undefined,
      notes: input.notes,
      metadata: input.metadata,
      createdAt: existingIndex >= 0 ? logs[existingIndex].createdAt : timestamp,
      updatedAt: timestamp
    };

    const nextLogs =
      existingIndex >= 0 ? logs.map((log, index) => (index === existingIndex ? nextLog : log)) : [...logs, nextLog];
    writeJson(COUNTERMEASURE_LOG_STORAGE_KEY, nextLogs);
    return nextLog;
  }
};
