import type { BatcaveBackupFile, BackupSnapshot, SnapshotStore, ImportValidationResult, ImportOptions } from "./types";
import { ALL_DATA_KEYS, BATCAVE_BACKUP_VERSION } from "./types";

// ── Storage key for snapshot store ───────────────────────────
const SNAPSHOTS_KEY = "batcave.backups.snapshots";
const MAX_SNAPSHOTS = 30;

// ── Helpers ───────────────────────────────────────────────────
function genId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeParseCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "SSR";
  return `${navigator.platform ?? "unknown"} / ${navigator.userAgent.split(" ").pop() ?? "browser"}`;
}

// ── Exporter ─────────────────────────────────────────────────
export function buildBackupFile(trigger = "manual"): BatcaveBackupFile {
  if (typeof window === "undefined") throw new Error("Export only available in browser");

  const data: Record<string, string> = {};
  for (const key of ALL_DATA_KEYS) {
    const val = window.localStorage.getItem(key);
    if (val !== null) data[key] = val;
  }

  const stats: BatcaveBackupFile["stats"] = {
    beliefEntries:        safeParseCount(data["batcave.belief.entries"] ?? null),
    foundationActivities: safeParseCount(data["batcave.foundation.activities.v2_5"] ?? null),
    countermeasureLogs:   safeParseCount(data["batcave.countermeasure.logs.v1"] ?? null),
    stateLogs:            safeParseCount(data["batcave.state.logs.v1"] ?? null),
    decisions:            safeParseCount(data["batcave.belief.decisions"] ?? null),
    timelineEvents:       safeParseCount(data["batcave.behavioral.timeline.v2_7"] ?? null),
  };

  return {
    version:    BATCAVE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    data,
    stats,
  };
}

export function downloadBackup(trigger = "manual"): void {
  const file = buildBackupFile(trigger);
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `batcave-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

// ── Snapshot Manager ─────────────────────────────────────────
function readSnapshots(): BackupSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    const store = JSON.parse(raw) as SnapshotStore;
    return store.snapshots ?? [];
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots: BackupSnapshot[]): void {
  if (typeof window === "undefined") return;
  const store: SnapshotStore = { snapshots };
  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(store));
}

export function createSnapshot(trigger: string): BackupSnapshot {
  const file    = buildBackupFile(trigger);
  const payload = JSON.stringify(file);
  const snap: BackupSnapshot = {
    id:        genId(),
    createdAt: new Date().toISOString(),
    trigger,
    payload,
    sizeBytes: new Blob([payload]).size,
  };

  const existing = readSnapshots();
  // Keep newest MAX_SNAPSHOTS, drop oldest
  const next = [snap, ...existing].slice(0, MAX_SNAPSHOTS);
  writeSnapshots(next);
  return snap;
}

export function listSnapshots(): BackupSnapshot[] {
  return readSnapshots().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteSnapshot(id: string): void {
  writeSnapshots(readSnapshots().filter((s) => s.id !== id));
}

export function restoreSnapshot(id: string): { ok: boolean; error?: string } {
  const snap = readSnapshots().find((s) => s.id === id);
  if (!snap) return { ok: false, error: "Snapshot not found" };
  try {
    const file = JSON.parse(snap.payload) as BatcaveBackupFile;
    applyBackup(file, { mode: "replace" });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Importer ─────────────────────────────────────────────────
export function validateBackupFile(raw: string): ImportValidationResult {
  const result: ImportValidationResult = {
    valid: false,
    version: null,
    keyCount: 0,
    stats: null,
    errors: [],
    warnings: [],
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    result.errors.push("File is not valid JSON.");
    return result;
  }

  if (typeof parsed !== "object" || parsed === null) {
    result.errors.push("File root must be a JSON object.");
    return result;
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== "string") {
    result.errors.push("Missing 'version' field.");
  } else {
    result.version = obj.version;
  }

  if (typeof obj.exportedAt !== "string") {
    result.warnings.push("Missing 'exportedAt' field.");
  }

  if (typeof obj.data !== "object" || obj.data === null) {
    result.errors.push("Missing 'data' object.");
    return result;
  }

  const data = obj.data as Record<string, unknown>;
  const foundKeys = Object.keys(data).filter((k) => ALL_DATA_KEYS.includes(k as any));
  result.keyCount = foundKeys.length;

  if (foundKeys.length === 0) {
    result.errors.push("No recognisable Batcave keys found in backup.");
    return result;
  }

  if (foundKeys.length < 3) {
    result.warnings.push(`Only ${foundKeys.length} data keys found. Backup may be incomplete.`);
  }

  if (obj.stats && typeof obj.stats === "object") {
    result.stats = obj.stats as BatcaveBackupFile["stats"];
  }

  if (result.errors.length === 0) result.valid = true;
  return result;
}

function applyBackup(file: BatcaveBackupFile, opts: ImportOptions): void {
  if (typeof window === "undefined") return;

  if (opts.mode === "replace") {
    // Wipe all known keys first
    for (const key of ALL_DATA_KEYS) {
      window.localStorage.removeItem(key);
    }
    // Write all backup keys
    for (const [key, value] of Object.entries(file.data)) {
      if (ALL_DATA_KEYS.includes(key as any)) {
        window.localStorage.setItem(key, value);
      }
    }
    return;
  }

  // MERGE mode: merge arrays by id, preserving existing items
  for (const [key, rawValue] of Object.entries(file.data)) {
    if (!ALL_DATA_KEYS.includes(key as any)) continue;
    const existing = window.localStorage.getItem(key);
    if (!existing) {
      window.localStorage.setItem(key, rawValue);
      continue;
    }
    try {
      const existingArr = JSON.parse(existing) as unknown[];
      const importArr   = JSON.parse(rawValue)  as unknown[];
      if (!Array.isArray(existingArr) || !Array.isArray(importArr)) {
        // Non-array (settings etc.) — import wins
        window.localStorage.setItem(key, rawValue);
        continue;
      }
      // Deduplicate by id field
      const existingIds = new Set(
        existingArr.map((x) => (typeof x === "object" && x !== null && "id" in x ? (x as { id: string }).id : null))
      );
      const newItems = importArr.filter(
        (x) =>
          typeof x === "object" &&
          x !== null &&
          "id" in x &&
          !existingIds.has((x as { id: string }).id)
      );
      window.localStorage.setItem(key, JSON.stringify([...existingArr, ...newItems]));
    } catch {
      // Fall back to setting raw value
      window.localStorage.setItem(key, rawValue);
    }
  }
}

export function importBackup(raw: string, opts: ImportOptions): { ok: boolean; errors: string[]; warnings: string[] } {
  const validation = validateBackupFile(raw);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors, warnings: validation.warnings };
  }

  try {
    // Snapshot before applying (safety net)
    createSnapshot("pre-import-safety");
    const file = JSON.parse(raw) as BatcaveBackupFile;
    applyBackup(file, opts);
    return { ok: true, errors: [], warnings: validation.warnings };
  } catch (e) {
    return { ok: false, errors: [String(e)], warnings: [] };
  }
}

// ── Storage Stats ─────────────────────────────────────────────
export function getStorageStats(): {
  totalKeys: number;
  populatedKeys: number;
  estimatedSizeBytes: number;
  keys: { key: string; sizeBytes: number; itemCount: number }[];
} {
  if (typeof window === "undefined") {
    return { totalKeys: 0, populatedKeys: 0, estimatedSizeBytes: 0, keys: [] };
  }

  const keys = ALL_DATA_KEYS.map((key) => {
    const raw  = window.localStorage.getItem(key);
    const size = raw ? new Blob([raw]).size : 0;
    return { key, sizeBytes: size, itemCount: safeParseCount(raw) };
  });

  return {
    totalKeys:          ALL_DATA_KEYS.length,
    populatedKeys:      keys.filter((k) => k.sizeBytes > 0).length,
    estimatedSizeBytes: keys.reduce((t, k) => t + k.sizeBytes, 0),
    keys,
  };
}
