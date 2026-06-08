import type {
  CreateFoundationActivityBatchInput,
  CreateFoundationActivityInput,
  CreateConstraintLogInput,
  CreateFoundationLogInput,
  DailyConstraintLog,
  FoundationActivityLog,
  DailyFoundationLog,
  ActivityDefinition,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityLogEntry,
  ISODate
} from "./types";
import { FOUNDATION_DEFINITIONS } from "./config";

const ACTIVITY_DEF_STORAGE_KEY = "batcave.foundation.activity_definitions";
const ACTIVITY_LOG_STORAGE_KEY = "batcave.foundation.activity_logs";

const FOUNDATION_STORAGE_KEY = "batcave.foundation.logs.v1";
const FOUNDATION_ACTIVITY_STORAGE_KEY = "batcave.foundation.activities.v2_5";
const CONSTRAINT_STORAGE_KEY = "batcave.constraint.logs.v1";

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

export const localFoundationRepository = {
  listFoundationActivities(): FoundationActivityLog[] {
    return readJson<FoundationActivityLog[]>(FOUNDATION_ACTIVITY_STORAGE_KEY, []);
  },

  addFoundationActivity(input: CreateFoundationActivityInput): FoundationActivityLog {
    const activities = this.listFoundationActivities();
    const timestamp = now();
    const activity: FoundationActivityLog = {
      id: createId("foundation_activity"),
      date: input.date,
      foundation: input.foundation,
      subtype: input.subtype,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      source: "quick-checkin",
      metadata: input.metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    writeJson(FOUNDATION_ACTIVITY_STORAGE_KEY, [...activities, activity]);
    return activity;
  },

  addFoundationActivityBatch(input: CreateFoundationActivityBatchInput): FoundationActivityLog[] {
    return input.activities.map((activity) =>
      this.addFoundationActivity({
        date: input.date,
        foundation: input.foundation,
        subtype: activity.subtype,
        durationMinutes: activity.durationMinutes,
        notes: activity.notes,
        metadata: activity.metadata
      })
    );
  },

  listFoundationLogs(): DailyFoundationLog[] {
    return readJson<DailyFoundationLog[]>(FOUNDATION_STORAGE_KEY, []);
  },

  upsertFoundationLog(input: CreateFoundationLogInput): DailyFoundationLog {
    const logs = this.listFoundationLogs();
    const timestamp = now();
    const completed = input.completed ?? true;
    const existingIndex = logs.findIndex(
      (log) => log.date === input.date && log.foundation === input.foundation && log.subtype === input.subtype
    );

    const nextLog: DailyFoundationLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : createId("foundation"),
      date: input.date,
      foundation: input.foundation,
      subtype: input.subtype,
      completed,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      source: "quick-checkin",
      metadata: input.metadata,
      createdAt: existingIndex >= 0 ? logs[existingIndex].createdAt : timestamp,
      updatedAt: timestamp
    };

    const nextLogs =
      existingIndex >= 0 ? logs.map((log, index) => (index === existingIndex ? nextLog : log)) : [...logs, nextLog];
    writeJson(FOUNDATION_STORAGE_KEY, nextLogs);
    return nextLog;
  },

  listConstraintLogs(): DailyConstraintLog[] {
    return readJson<DailyConstraintLog[]>(CONSTRAINT_STORAGE_KEY, []);
  },

  upsertConstraintLog(input: CreateConstraintLogInput): DailyConstraintLog {
    const logs = this.listConstraintLogs();
    const timestamp = now();
    const existingIndex = logs.findIndex((log) => log.date === input.date && log.constraint === input.constraint);

    const nextLog: DailyConstraintLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : createId("constraint"),
      date: input.date,
      constraint: input.constraint,
      subtype: input.subtype,
      completed: input.completed ?? input.subtype === "Yes",
      notes: input.notes,
      source: "quick-checkin",
      metadata: input.metadata,
      createdAt: existingIndex >= 0 ? logs[existingIndex].createdAt : timestamp,
      updatedAt: timestamp
    };

    const nextLogs =
      existingIndex >= 0 ? logs.map((log, index) => (index === existingIndex ? nextLog : log)) : [...logs, nextLog];
    writeJson(CONSTRAINT_STORAGE_KEY, nextLogs);
    return nextLog;
  },

  listActivities(): ActivityDefinition[] {
    const defaultDefs: ActivityDefinition[] = [];
    FOUNDATION_DEFINITIONS.forEach((def) => {
      def.subtypes.forEach((sub) => {
        defaultDefs.push({
          id: `${def.type.replace(/\s+/g, "_").toLowerCase()}_${sub.replace(/\s+/g, "_").toLowerCase()}`,
          foundation: def.type,
          name: sub,
          archived: false,
          createdAt: now(),
        });
      });
    });

    if (typeof window === "undefined") return defaultDefs;
    const raw = window.localStorage.getItem(ACTIVITY_DEF_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(ACTIVITY_DEF_STORAGE_KEY, JSON.stringify(defaultDefs));
      return defaultDefs;
    }
    return JSON.parse(raw) as ActivityDefinition[];
  },

  createActivity(input: CreateActivityInput): ActivityDefinition {
    const items = this.listActivities();
    const newDef: ActivityDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      foundation: input.foundation,
      name: input.name,
      archived: false,
      createdAt: now(),
    };
    items.push(newDef);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVITY_DEF_STORAGE_KEY, JSON.stringify(items));
    }
    return newDef;
  },

  updateActivity(input: UpdateActivityInput): ActivityDefinition {
    const items = this.listActivities();
    const idx = items.findIndex((i) => i.id === input.id);
    if (idx === -1) throw new Error("Activity not found");
    if (input.name !== undefined) items[idx].name = input.name;
    if (input.archived !== undefined) items[idx].archived = input.archived;
    items[idx].updatedAt = now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVITY_DEF_STORAGE_KEY, JSON.stringify(items));
    }
    return items[idx];
  },

  deleteActivity(id: string): void {
    const items = this.listActivities();
    const filtered = items.filter((i) => i.id !== id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVITY_DEF_STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  listActivityLogs(): ActivityLogEntry[] {
    return readJson<ActivityLogEntry[]>(ACTIVITY_LOG_STORAGE_KEY, []);
  },

  addActivityLog(input: { date: ISODate; activityId: string; durationMinutes?: number; notes?: string }): ActivityLogEntry {
    const activitiesList = this.listActivities();
    const def = activitiesList.find((a) => a.id === input.activityId);
    if (!def) throw new Error("Activity definition not found");

    const logs = this.listActivityLogs();
    const timestamp = now();
    const newEntry: ActivityLogEntry = {
      id: createId("actlog"),
      date: input.date,
      activityId: input.activityId,
      foundation: def.foundation,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      source: "quick-checkin",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    logs.push(newEntry);
    writeJson(ACTIVITY_LOG_STORAGE_KEY, logs);

    // Sync with FoundationActivityLog for calculations backward compatibility
    this.addFoundationActivity({
      date: input.date,
      foundation: def.foundation,
      subtype: def.name as any,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
    });

    // Sync with DailyFoundationLog
    this.upsertFoundationLog({
      date: input.date,
      foundation: def.foundation,
      subtype: def.name as any,
      completed: true,
    });

    return newEntry;
  },

  deleteActivityLog(id: string): void {
    const logs = this.listActivityLogs();
    const customLog = logs.find(l => l.id === id);
    const filtered = logs.filter((l) => l.id !== id);
    writeJson(ACTIVITY_LOG_STORAGE_KEY, filtered);

    // Also remove from FoundationActivityLog
    if (typeof window !== "undefined" && customLog) {
      const allActs = readJson<FoundationActivityLog[]>(FOUNDATION_ACTIVITY_STORAGE_KEY, []);
      const activitiesList = this.listActivities();
      const def = activitiesList.find(a => a.id === customLog.activityId);
      if (def) {
        const nextActs = allActs.filter(
          (act) => !(act.date === customLog.date && act.foundation === customLog.foundation && act.subtype === def.name)
        );
        writeJson(FOUNDATION_ACTIVITY_STORAGE_KEY, nextActs);
      }
    }
  }
};
