function generateId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

import type {
  BeliefEntry,
  CreateBeliefEntryInput,
  DecisionMatrixEntry,
  CreateDecisionInput,
  AddEvidenceInput,
  RemoveEvidenceInput,
  ArchiveEvidenceInput,
  UpdateDecisionInput,
  DecisionUsage,
} from "./types";
import { BELIEF_STORAGE_KEY, DECISION_STORAGE_KEY, DECISION_USAGE_KEY } from "./config";

function nowISO() {
  return new Date().toISOString();
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [] as T[];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [] as T[];
    return JSON.parse(raw) as T[];
  } catch (_e) {
    return [] as T[];
  }
}

function writeJson<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

/** Backfill old V1 entries missing recurringThought/archived fields */
function migrateDecisions(items: DecisionMatrixEntry[]): DecisionMatrixEntry[] {
  return items.map((d) => ({
    ...d,
    recurringThought: d.recurringThought ?? null,
    archivedEvidence: d.archivedEvidence ?? [],
    archived: d.archived ?? false,
  }));
}

export const beliefRepo = {
  list(): BeliefEntry[] {
    return readJson<BeliefEntry>(BELIEF_STORAGE_KEY);
  },
  create(input: CreateBeliefEntryInput): BeliefEntry {
    const items = readJson<BeliefEntry>(BELIEF_STORAGE_KEY);
    const id = generateId();
    const now = nowISO();
    const entry: BeliefEntry = {
      id,
      date: input.date,
      time: input.time,
      states: input.states,
      primaryCause: input.primaryCause ?? null,
      recurringThought: input.recurringThought ?? null,
      notes: input.notes,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    } as BeliefEntry;
    items.push(entry);
    writeJson(BELIEF_STORAGE_KEY, items);

    // Auto-snapshot after every check-in (fire and forget, no circular dep)
    if (typeof window !== "undefined") {
      import("@/lib/storage/manager").then(({ createSnapshot }) => {
        createSnapshot("After check-in");
      }).catch(() => {});
    }

    return entry;
  },
  clear() {
    writeJson(BELIEF_STORAGE_KEY, []);
  },
};

export const decisionRepo = {
  list(): DecisionMatrixEntry[] {
    return migrateDecisions(readJson<DecisionMatrixEntry>(DECISION_STORAGE_KEY));
  },

  create(input: CreateDecisionInput): DecisionMatrixEntry {
    const items = this.list();
    const id = generateId();
    const now = nowISO();
    const entry: DecisionMatrixEntry = {
      id,
      recurringThought: input.recurringThought ?? null,
      limitingBelief: input.limitingBelief,
      newDecision: input.newDecision,
      evidence: input.evidence ?? [],
      archivedEvidence: [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    } as DecisionMatrixEntry;
    items.push(entry);
    writeJson(DECISION_STORAGE_KEY, items);
    return entry;
  },

  update(input: UpdateDecisionInput): DecisionMatrixEntry {
    const items = this.list();
    const idx = items.findIndex((i) => i.id === input.id);
    if (idx === -1) throw new Error("Decision not found");
    const existing = items[idx];
    items[idx] = {
      ...existing,
      ...(input.recurringThought !== undefined ? { recurringThought: input.recurringThought } : {}),
      ...(input.limitingBelief !== undefined ? { limitingBelief: input.limitingBelief } : {}),
      ...(input.newDecision !== undefined ? { newDecision: input.newDecision } : {}),
      ...(input.archived !== undefined ? { archived: input.archived } : {}),
      updatedAt: nowISO(),
    };
    writeJson(DECISION_STORAGE_KEY, items);
    return items[idx];
  },

  addEvidence(input: AddEvidenceInput): DecisionMatrixEntry {
    const items = this.list();
    const idx = items.findIndex((i) => i.id === input.decisionId);
    if (idx === -1) throw new Error("Decision not found");
    items[idx].evidence.push(input.evidence);
    items[idx].updatedAt = nowISO();
    writeJson(DECISION_STORAGE_KEY, items);
    return items[idx];
  },

  removeEvidence(input: RemoveEvidenceInput): DecisionMatrixEntry {
    const items = this.list();
    const idx = items.findIndex((i) => i.id === input.decisionId);
    if (idx === -1) throw new Error("Decision not found");
    items[idx].evidence.splice(input.evidenceIndex, 1);
    items[idx].updatedAt = nowISO();
    writeJson(DECISION_STORAGE_KEY, items);
    return items[idx];
  },

  archiveEvidence(input: ArchiveEvidenceInput): DecisionMatrixEntry {
    const items = this.list();
    const idx = items.findIndex((i) => i.id === input.decisionId);
    if (idx === -1) throw new Error("Decision not found");
    const [removed] = items[idx].evidence.splice(input.evidenceIndex, 1);
    if (!items[idx].archivedEvidence) items[idx].archivedEvidence = [];
    items[idx].archivedEvidence!.push(removed);
    items[idx].updatedAt = nowISO();
    writeJson(DECISION_STORAGE_KEY, items);
    return items[idx];
  },
};

export const decisionUsageRepo = {
  list(): DecisionUsage[] {
    return readJson<DecisionUsage>(DECISION_USAGE_KEY);
  },
  track(usage: Omit<DecisionUsage, "id">) {
    const items = readJson<DecisionUsage>(DECISION_USAGE_KEY);
    const entry: DecisionUsage = { id: generateId(), ...usage } as DecisionUsage;
    items.push(entry);
    writeJson(DECISION_USAGE_KEY, items);
    return entry;
  },
  /** Returns usage count per decisionId */
  usageCountMap(): Record<string, number> {
    const usages = this.list();
    const counts: Record<string, number> = {};
    for (const u of usages) {
      counts[u.decisionId] = (counts[u.decisionId] || 0) + 1;
    }
    return counts;
  },
};
