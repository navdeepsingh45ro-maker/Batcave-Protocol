export interface PermanentOperation {
  id: string;
  name: string;
  description?: string;
  order: number;
  archived: boolean;
  createdAt: string;
}

export type OperationStatus = "pending" | "active" | "completed" | "skipped";

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
