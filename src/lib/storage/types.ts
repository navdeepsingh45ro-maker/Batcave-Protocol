export const BATCAVE_BACKUP_VERSION = "4.0.0";

/** All known data keys that belong in a full backup */
export const ALL_DATA_KEYS: readonly string[] = [
  // Belief Intelligence
  "batcave.belief.entries",
  "batcave.belief.decisions",
  "batcave.belief.decisionUsage",
  // Foundation
  "batcave.foundation.logs.v1",
  "batcave.foundation.activities.v2_5",
  "batcave.foundation.activity_definitions",
  "batcave.foundation.activity_logs",
  "batcave.constraint.logs.v1",
  // State Detection
  "batcave.state.logs.v1",
  "batcave.behavior.outcomes.v1",
  "batcave.intervention.results.v1",
  // Countermeasures
  "batcave.countermeasure.logs.v1",
  // Timeline
  "batcave.behavioral.timeline.v2_7",
] as const;

/** Full backup file structure (exported JSON) */
export interface BatcaveBackupFile {
  /** Schema version */
  version: string;
  /** ISO timestamp */
  exportedAt: string;
  /** Short description of the device/browser at export time */
  deviceInfo: string;
  /** Map of localStorage key → raw JSON string value */
  data: Record<string, string>;
  /** Lightweight stats for quick preview */
  stats: {
    beliefEntries: number;
    foundationActivities: number;
    countermeasureLogs: number;
    stateLogs: number;
    decisions: number;
    timelineEvents: number;
  };
}

/** Snapshot stored inside localStorage (rolling 30) */
export interface BackupSnapshot {
  id: string;
  createdAt: string;
  /** Human-readable label: "After check-in", "Manual", etc. */
  trigger: string;
  /** Serialised backup file (stringified JSON) */
  payload: string;
  /** Approximate size in bytes */
  sizeBytes: number;
}

/** Container stored in localStorage under SNAPSHOTS_KEY */
export interface SnapshotStore {
  snapshots: BackupSnapshot[];
}

/** Validation result from importer */
export interface ImportValidationResult {
  valid: boolean;
  version: string | null;
  keyCount: number;
  stats: BatcaveBackupFile["stats"] | null;
  errors: string[];
  warnings: string[];
}

/** Options for the import operation */
export interface ImportOptions {
  mode: "merge" | "replace";
}
