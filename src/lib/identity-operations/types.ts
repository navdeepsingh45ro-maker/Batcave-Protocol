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
  isOptional?: boolean; // Replaces Daily/Optional. If false or undefined, it's a daily active task.
  focusTimerEligible?: boolean; // Determines if it appears in Focus Timer. Default true.
}

export type OperationStatus = "pending" | "active" | "completed" | "skipped" | "missed";

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
  status: "pending" | "completed" | "missed";
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

export type RestrictionSeverity = "Low" | "Medium" | "High";

export interface Restriction {
  id: string;
  name: string;
  description?: string;
  identity: ProtocolIdentity;
  severity: RestrictionSeverity;
  trackDaily: boolean;
  askReasonWhenBroken: boolean;
  createdAt: string;
  archived: boolean;
}

export interface RestrictionLog {
  id: string;
  restrictionId: string;
  date: string; // YYYY-MM-DD
  status: "protected" | "violated";
  violationReason?: string;
  violationTime?: string; // ISO datetime
}
