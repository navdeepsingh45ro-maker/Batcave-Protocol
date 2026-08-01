import type { BehavioralTimelineEvent, CreateTimelineEventInput } from "./types";

const TIMELINE_STORAGE_KEY = "batcave.behavioral.timeline.v2_7";

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

export const localBehavioralTimelineRepository = {
  listEvents(): BehavioralTimelineEvent[] {
    return readJson<BehavioralTimelineEvent[]>(TIMELINE_STORAGE_KEY, []);
  },

  addEvent(input: CreateTimelineEventInput): BehavioralTimelineEvent {
    const event: BehavioralTimelineEvent = {
      id: createId("timeline"),
      timestamp: input.timestamp ?? now(),
      ...input
    };

    writeJson(TIMELINE_STORAGE_KEY, [...this.listEvents(), event]);
    return event;
  }
};
