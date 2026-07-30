import type { PermanentOperation, OperationLog, OperationStatus, ProtocolIdentity } from "./types";

const OPS_KEY = "batcave.permanent_operations.defs";
const LOGS_KEY = "batcave.permanent_operations.logs";

const DEFAULT_OPERATIONS: Partial<PermanentOperation>[] = [
  { name: "Builder Work", description: "Deep work session for primary projects", identity: "Builder" },
  { name: "Learning", description: "Skill acquisition and mastery", identity: "Builder" },
  { name: "Football Training", description: "Technical and physical training", identity: "Striker" },
  { name: "Workout", description: "Physical conditioning", identity: "Striker" },
  { name: "Reading / Reflection", description: "Mental growth and journaling", identity: "King" },
  { name: "Sleep Protection", description: "8 hours of protected rest", identity: "Guardian" },
  { name: "Digital Discipline", description: "No phone / social media distractions", identity: "Guardian" },
];

class PermanentOperationsRepository {
  private get isClient(): boolean {
    return typeof window !== "undefined";
  }

  // --- Operations ---

  listOperations(): PermanentOperation[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(OPS_KEY);
      if (!raw) return this.seedDefaultOperations();
      const parsed: PermanentOperation[] = JSON.parse(raw);
      // Migrate missing identity fields to 'Builder' by default
      return parsed.map((op) => ({ ...op, identity: op.identity || "Builder" }));
    } catch {
      return this.seedDefaultOperations();
    }
  }

  private saveOperations(ops: PermanentOperation[]) {
    if (!this.isClient) return;
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  }

  private seedDefaultOperations(): PermanentOperation[] {
    const now = new Date().toISOString();
    const ops: PermanentOperation[] = DEFAULT_OPERATIONS.map((def, idx) => ({
      id: `op_${Date.now()}_${idx}`,
      name: def.name!,
      description: def.description,
      identity: def.identity as ProtocolIdentity,
      order: idx,
      archived: false,
      createdAt: now,
    }));
    this.saveOperations(ops);
    return ops;
  }

  createOperation(name: string, description?: string, identity: ProtocolIdentity = "Builder"): PermanentOperation {
    const ops = this.listOperations();
    const newOp: PermanentOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      identity,
      order: ops.length,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    ops.push(newOp);
    this.saveOperations(ops);
    return newOp;
  }

  updateOperation(id: string, updates: Partial<PermanentOperation>): PermanentOperation | null {
    const ops = this.listOperations();
    const idx = ops.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    ops[idx] = { ...ops[idx], ...updates };
    this.saveOperations(ops);
    return ops[idx];
  }

  deleteOperation(id: string) {
    const ops = this.listOperations();
    this.saveOperations(ops.filter((o) => o.id !== id));
  }

  reorderOperations(operationIds: string[]) {
    const ops = this.listOperations();
    const updatedOps = ops.map((op) => {
      const newOrder = operationIds.indexOf(op.id);
      return { ...op, order: newOrder !== -1 ? newOrder : op.order };
    });
    // Sort by order to ensure consistency
    updatedOps.sort((a, b) => a.order - b.order);
    this.saveOperations(updatedOps);
  }

  // --- Logs ---

  listLogsForDate(date: string): OperationLog[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      if (!raw) return [];
      const allLogs: OperationLog[] = JSON.parse(raw);
      return allLogs.filter((log) => log.date === date);
    } catch {
      return [];
    }
  }

  private saveLogs(logs: OperationLog[]) {
    if (!this.isClient) return;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }

  getOrCreateLog(operationId: string, date: string): OperationLog {
    if (!this.isClient) {
      return { id: "temp", operationId, date, status: "pending", durationMs: 0 };
    }
    
    let allLogs: OperationLog[] = [];
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      if (raw) allLogs = JSON.parse(raw);
    } catch (e) {}

    const existing = allLogs.find((l) => l.operationId === operationId && l.date === date);
    if (existing) return existing;

    const newLog: OperationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationId,
      date,
      status: "pending",
      durationMs: 0,
    };
    allLogs.push(newLog);
    this.saveLogs(allLogs);
    return newLog;
  }

  updateLogStatus(
    logId: string, 
    status: OperationStatus, 
    skipReason?: string
  ): OperationLog | null {
    if (!this.isClient) return null;
    let allLogs: OperationLog[] = [];
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      if (raw) allLogs = JSON.parse(raw);
    } catch (e) {}

    const idx = allLogs.findIndex((l) => l.id === logId);
    if (idx === -1) return null;

    const log = allLogs[idx];
    const now = new Date().toISOString();
    let newDuration = log.durationMs;
    let newStartedAt = log.startedAt;
    let newCompletedAt = log.completedAt;
    let newLastResumedAt = log.lastResumedAt;

    // If we are leaving the "active" state, accumulate the duration
    if (log.status === "active" && status !== "active" && log.lastResumedAt) {
      const elapsed = new Date(now).getTime() - new Date(log.lastResumedAt).getTime();
      newDuration += Math.max(0, elapsed);
      newLastResumedAt = undefined;
    }

    // Entering active state
    if (status === "active") {
      if (!newStartedAt) newStartedAt = now;
      newLastResumedAt = now;
    }

    // Entering completed or skipped
    if (status === "completed" || status === "skipped") {
      if (!newCompletedAt) newCompletedAt = now;
    }

    // Resetting to pending
    if (status === "pending") {
      newLastResumedAt = undefined;
    }

    allLogs[idx] = {
      ...log,
      status,
      durationMs: newDuration,
      startedAt: newStartedAt,
      completedAt: newCompletedAt,
      lastResumedAt: newLastResumedAt,
      ...(skipReason !== undefined ? { skipReason } : {}),
    };

    this.saveLogs(allLogs);
    return allLogs[idx];
  }
}

export const permanentOperationsRepository = new PermanentOperationsRepository();
