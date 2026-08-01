import type { CompleteCountermeasureInput, CountermeasureLog, CustomCountermeasure, CreateCustomCountermeasureInput } from "./types";

const COUNTERMEASURE_LOG_STORAGE_KEY = "batcave.countermeasure.logs.v1";
const CUSTOM_CM_STORAGE_KEY = "batcave.countermeasures.custom";

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
  try {
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const localCountermeasureRepository = {
  // ── Standard CM logs ───────────────────────────────────
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
  },

  // ── V4.4: Custom Countermeasures ───────────────────────
  listCustom(): CustomCountermeasure[] {
    return readJson<CustomCountermeasure[]>(CUSTOM_CM_STORAGE_KEY, []);
  },

  createCustom(input: CreateCustomCountermeasureInput): CustomCountermeasure {
    const customs = this.listCustom();
    const timestamp = now();
    const entry: CustomCountermeasure = {
      id: createId("custom_cm"),
      name: input.name,
      description: input.description,
      triggerStates: input.triggerStates,
      triggerCauses: input.triggerCauses,
      category: input.category,
      durationMinutes: input.durationMinutes ?? 10,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeJson(CUSTOM_CM_STORAGE_KEY, [...customs, entry]);
    return entry;
  },

  deleteCustom(id: string): void {
    const customs = this.listCustom().filter((c) => c.id !== id);
    writeJson(CUSTOM_CM_STORAGE_KEY, customs);
  },
};
