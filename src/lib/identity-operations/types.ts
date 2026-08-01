export type ProtocolIdentity = "Builder" | "Striker" | "King" | "Guardian";

export interface PermanentOperation {
  id: string;
  name: string;
  description?: string;
  identity: ProtocolIdentity;
  order: number;
  archived: boolean;
  createdAt: string;
  dailyGoal?: string; // Optional user-defined goal (e.g. "2 Focus Sessions")
}

export type OperationStatus = "pending" | "active" | "completed" | "skipped";

// Tracks daily progress for Permanent Operations (preserves backward compatibility)
export interface OperationLog {
  id: string;
  operationId: string;
  date: string; // YYYY-MM-DD
  status: OperationStatus;
  startedAt?: string; // ISO datetime string of first start
  completedAt?: string; // ISO datetime string of completion
  lastResumedAt?: string; // ISO datetime string, tracks current active session
  durationMs: number; // Accumulated duration in ms
  skipReason?: string;
}

export interface TodayMission {
  id: string;
  name: string;
  identity: ProtocolIdentity;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

export interface TaskHistoryRecord {
  id: string;
  taskName: string;
  identity: ProtocolIdentity;
  date: string;
  startedAt?: string;
  completedAt?: string;
  durationMs: number;
  skipReason?: string;
  completionSource: "Manual" | "Focus Timer" | "Future Automation";
  taskType: "PermanentOperation" | "TodayMission";
}
