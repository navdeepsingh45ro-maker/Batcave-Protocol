import type { PermanentOperation, OperationLog, OperationStatus, ProtocolIdentity, TodayMission, TaskHistoryRecord, Restriction, RestrictionLog, RestrictionSeverity } from "./types";
import { focusSessionRepository } from "@/lib/focus-sessions";

const OPS_KEY = "batcave.permanent_operations.defs";
const LOGS_KEY = "batcave.permanent_operations.logs";
const MISSIONS_KEY = "batcave.today_missions";
const HISTORY_KEY = "batcave.task_history";
const ACCOUNTABILITY_KEY = "batcave.accountability_review";
const RESTRICTIONS_KEY = "batcave.restrictions.defs";
const RESTRICTION_LOGS_KEY = "batcave.restrictions.logs";

const DEFAULT_OPERATIONS: Partial<PermanentOperation>[] = [
  { name: "Builder Work", description: "Deep work session for primary projects", identity: "Builder" },
  { name: "Learning", description: "Skill acquisition and mastery", identity: "Builder" },
  { name: "Football Training", description: "Technical and physical training", identity: "Striker" },
  { name: "Workout", description: "Physical conditioning", identity: "Striker" },
  { name: "Reading / Reflection", description: "Mental growth and journaling", identity: "King" },
  { name: "Sleep Protection", description: "8 hours of protected rest", identity: "Guardian" },
  { name: "Digital Discipline", description: "No phone / social media distractions", identity: "Guardian" },
];

class IdentityOperationsRepository {
  private get isClient(): boolean {
    return typeof window !== "undefined";
  }

  private notifyListeners() {
    if (this.isClient) {
      window.dispatchEvent(new Event("batcave-ops-updated"));
    }
  }

  // --- Identity Scores ---
  
  getIdentityScore(identity: ProtocolIdentity, date: string): { score: number, status: string } {
    if (!this.isClient) return { score: 100, status: "Operational" };

    const ops = this.listOperations().filter(o => o.identity === identity && !o.archived);
    const logs = this.listLogsForDate(date);
    
    let totalPoints = 0;
    let earnedPoints = 0;

    // Evaluate Permanent Operations
    ops.forEach(op => {
      const log = logs.find(l => l.operationId === op.id);
      totalPoints += 10; // Each op is worth 10 points
      if (log?.status === "completed") {
        earnedPoints += 10;
      } else if (log?.status === "skipped" || log?.status === "missed") {
        earnedPoints += 2; // Marginal credit for accountability
      }
    });

    // Evaluate Today's Missions
    const missions = this.listTodayMissions(date).filter(m => m.identity === identity);
    missions.forEach(m => {
      totalPoints += 5; // Missions are worth 5 points
      if (m.status === "completed") earnedPoints += 5;
    });

    // Evaluate Focus Sessions
    const sessions = focusSessionRepository.listSessions().filter(s => s.date === date && s.identity === identity);
    sessions.forEach(s => {
      // Bonus points for deep work
      if (s.deepWorkScore >= 80) earnedPoints += 3;
      else if (s.deepWorkScore >= 50) earnedPoints += 1;
    });

    // Evaluate Restrictions
    const restrictions = this.listRestrictions().filter(r => r.identity === identity && !r.archived);
    const restrictionLogs = this.listRestrictionLogsForDate(date);
    restrictions.forEach(r => {
      const log = restrictionLogs.find(l => l.restrictionId === r.id);
      if (log?.status === "violated") {
        const penalty = r.severity === "High" ? 20 : r.severity === "Medium" ? 10 : 5;
        earnedPoints -= penalty;
      }
    });

    const score = totalPoints === 0 ? 100 : Math.min(100, Math.round((earnedPoints / totalPoints) * 100));

    let status = "Operational";
    if (score < 50) status = "Needs Attention";
    else if (score < 80) status = "Stable";

    return { score, status };
  }

  // --- Permanent Operations ---

  listOperations(): PermanentOperation[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(OPS_KEY);
      if (!raw) return this.seedDefaultOperations();
      const parsed: PermanentOperation[] = JSON.parse(raw);
      return parsed.map((op) => ({ ...op, identity: op.identity || "Builder" }));
    } catch {
      return this.seedDefaultOperations();
    }
  }

  private saveOperations(ops: PermanentOperation[]) {
    if (!this.isClient) return;
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
    this.notifyListeners();
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

  createOperation(name: string, description?: string, identity: ProtocolIdentity = "Builder", dailyGoal?: string, isOptional: boolean = false, focusTimerEligible: boolean = true): PermanentOperation {
    const ops = this.listOperations();
    const newOp: PermanentOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      identity,
      order: ops.length,
      archived: false,
      createdAt: new Date().toISOString(),
      dailyGoal,
      isOptional,
      focusTimerEligible,
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

  reorderOperations(operationIds: string[]) {
    const ops = this.listOperations();
    const updatedOps = ops.map((op) => {
      const newOrder = operationIds.indexOf(op.id);
      return { ...op, order: newOrder !== -1 ? newOrder : op.order };
    });
    updatedOps.sort((a, b) => a.order - b.order);
    this.saveOperations(updatedOps);
  }

  // --- Operation Logs (Backwards Compatibility) ---

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
    this.notifyListeners();
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
    skipReason?: string,
    source: "Manual" | "Focus Timer" | "Future Automation" = "Manual",
    durationMs?: number,
    notes?: string
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
    
    // Default to the previous duration if none provided
    const finalDuration = durationMs !== undefined ? durationMs : log.durationMs;

    let newCompletedAt = log.completedAt;
    if (status === "completed" || status === "skipped" || status === "missed") {
      if (!newCompletedAt) newCompletedAt = now;
      
      // Also log to history
      const op = this.listOperations().find(o => o.id === log.operationId);
      if (op) {
        this.addHistoryRecord({
          taskName: op.name,
          identity: op.identity,
          date: log.date,
          completedAt: newCompletedAt,
          durationMs: finalDuration,
          skipReason,
          completionSource: source,
          taskType: "PermanentOperation"
        });
      }
    } else if (status === "pending") {
      newCompletedAt = undefined;
    }

    allLogs[idx] = { 
      ...log, 
      status, 
      completedAt: newCompletedAt,
      durationMs: finalDuration,
      skipReason: skipReason || log.skipReason,
      notes: notes || log.notes
    };
    this.saveLogs(allLogs);
    return allLogs[idx];
  }

  // --- Today's Missions ---

  listTodayMissions(date: string): TodayMission[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(MISSIONS_KEY);
      if (!raw) return [];
      const all: TodayMission[] = JSON.parse(raw);
      // Basic approach: missions exist if created today, OR if created previously but NOT completed.
      // The requirement says: "These disappear after completion or become historical records. Do NOT reset."
      // So we just return missions that are pending, or completed today.
      return all.filter(m => m.status === "pending" || (m.completedAt && m.completedAt.startsWith(date)));
    } catch {
      return [];
    }
  }

  private saveTodayMissions(missions: TodayMission[]) {
    if (!this.isClient) return;
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
    this.notifyListeners();
  }

  createTodayMission(name: string, identity: ProtocolIdentity): TodayMission {
    let all: TodayMission[] = [];
    try {
      const raw = localStorage.getItem(MISSIONS_KEY);
      if (raw) all = JSON.parse(raw);
    } catch {}

    const newMission: TodayMission = {
      id: `miss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      identity,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    all.push(newMission);
    this.saveTodayMissions(all);
    return newMission;
  }

  updateTodayMission(id: string, updates: Partial<TodayMission>, date: string, source: "Manual" | "Focus Timer" | "Future Automation" = "Manual"): TodayMission | null {
    let all: TodayMission[] = [];
    try {
      const raw = localStorage.getItem(MISSIONS_KEY);
      if (raw) all = JSON.parse(raw);
    } catch {}

    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const previousStatus = all[idx].status;
    all[idx] = { ...all[idx], ...updates };

    if (previousStatus === "pending" && (all[idx].status === "completed" || all[idx].status === "missed")) {
      all[idx].completedAt = new Date().toISOString();
      this.addHistoryRecord({
        taskName: all[idx].name,
        identity: all[idx].identity,
        date: date,
        completedAt: all[idx].completedAt,
        durationMs: 0,
        skipReason: all[idx].status === "missed" ? (updates as any).skipReason : undefined,
        completionSource: source,
        taskType: "TodayMission"
      });
    }

    this.saveTodayMissions(all);
    return all[idx];
  }
  
  deleteTodayMission(id: string) {
    let all: TodayMission[] = [];
    try {
      const raw = localStorage.getItem(MISSIONS_KEY);
      if (raw) all = JSON.parse(raw);
    } catch {}
    this.saveTodayMissions(all.filter(m => m.id !== id));
  }

  // --- Task History ---

  listHistory(limit: number = 50): TaskHistoryRecord[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const history: TaskHistoryRecord[] = JSON.parse(raw);
      return history.sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime()).slice(0, limit);
    } catch {
      return [];
    }
  }

  private addHistoryRecord(record: Omit<TaskHistoryRecord, "id">) {
    if (!this.isClient) return;
    let history: TaskHistoryRecord[] = [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) history = JSON.parse(raw);
    } catch {}

    history.push({
      ...record,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  // --- Accountability Engine ---

  hasCompletedAccountabilityReview(date: string): boolean {
    if (!this.isClient) return true;
    try {
      const raw = localStorage.getItem(ACCOUNTABILITY_KEY);
      if (!raw) return false;
      const reviews: string[] = JSON.parse(raw);
      return reviews.includes(date);
    } catch {
      return false;
    }
  }

  markAccountabilityReviewCompleted(date: string) {
    if (!this.isClient) return;
    try {
      let reviews: string[] = [];
      const raw = localStorage.getItem(ACCOUNTABILITY_KEY);
      if (raw) reviews = JSON.parse(raw);
      if (!reviews.includes(date)) {
        reviews.push(date);
        localStorage.setItem(ACCOUNTABILITY_KEY, JSON.stringify(reviews));
      }
    } catch {}
  }

  getUnfinishedTasks(yesterday: string): Array<{ id: string; name: string; identity: ProtocolIdentity; type: "PermanentOperation" | "TodayMission" }> {
    const unfinished: Array<{ id: string; name: string; identity: ProtocolIdentity; type: "PermanentOperation" | "TodayMission" }> = [];
    
    // Permanent Operations
    const ops = this.listOperations().filter(o => !o.archived);
    const logs = this.listLogsForDate(yesterday);
    
    ops.forEach(op => {
      const log = logs.find(l => l.operationId === op.id);
      if (!log || log.status === "pending" || (log.status as string) === "active") {
        unfinished.push({
          id: op.id,
          name: op.name,
          identity: op.identity,
          type: "PermanentOperation"
        });
      }
    });

    // Today's Missions from yesterday
    const missions = this.listTodayMissions(yesterday);
    missions.forEach(m => {
      if (m.status === "pending" && m.createdAt.startsWith(yesterday)) {
        unfinished.push({
          id: m.id,
          name: m.name,
          identity: m.identity,
          type: "TodayMission"
        });
      }
    });

    return unfinished;
  }

  logUnfinishedTaskReason(taskId: string, type: "PermanentOperation" | "TodayMission", date: string, reason: string) {
    if (type === "PermanentOperation") {
      const log = this.getOrCreateLog(taskId, date);
      this.updateLogStatus(log.id, "missed", reason, "Manual");
    } else {
      // For TodayMission we update its status and include the reason
      this.updateTodayMission(taskId, { status: "missed", skipReason: reason } as any, date, "Manual");
    }
  }

  // --- Restrictions ---

  listRestrictions(): Restriction[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(RESTRICTIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveRestrictions(restrictions: Restriction[]) {
    if (!this.isClient) return;
    localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(restrictions));
    this.notifyListeners();
  }

  createRestriction(name: string, description: string | undefined, identity: ProtocolIdentity, severity: RestrictionSeverity, trackDaily: boolean, askReasonWhenBroken: boolean): Restriction {
    const restrictions = this.listRestrictions();
    const newRestriction: Restriction = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      identity,
      severity,
      trackDaily,
      askReasonWhenBroken,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    restrictions.push(newRestriction);
    this.saveRestrictions(restrictions);
    return newRestriction;
  }

  updateRestriction(id: string, updates: Partial<Restriction>): Restriction | null {
    const restrictions = this.listRestrictions();
    const idx = restrictions.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    restrictions[idx] = { ...restrictions[idx], ...updates };
    this.saveRestrictions(restrictions);
    return restrictions[idx];
  }

  // --- Restriction Logs ---

  listRestrictionLogsForDate(date: string): RestrictionLog[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(RESTRICTION_LOGS_KEY);
      if (!raw) return [];
      const allLogs: RestrictionLog[] = JSON.parse(raw);
      return allLogs.filter((log) => log.date === date);
    } catch {
      return [];
    }
  }

  listAllRestrictionLogs(): RestrictionLog[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(RESTRICTION_LOGS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveRestrictionLogs(logs: RestrictionLog[]) {
    if (!this.isClient) return;
    localStorage.setItem(RESTRICTION_LOGS_KEY, JSON.stringify(logs));
    this.notifyListeners();
  }

  getOrCreateRestrictionLog(restrictionId: string, date: string): RestrictionLog {
    if (!this.isClient) {
      return { id: "temp", restrictionId, date, status: "protected" };
    }
    
    const allLogs = this.listAllRestrictionLogs();
    const existing = allLogs.find((l) => l.restrictionId === restrictionId && l.date === date);
    if (existing) return existing;

    const newLog: RestrictionLog = {
      id: `rlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restrictionId,
      date,
      status: "protected",
    };
    allLogs.push(newLog);
    this.saveRestrictionLogs(allLogs);
    return newLog;
  }

  logRestrictionViolation(restrictionId: string, date: string, reason?: string): RestrictionLog | null {
    if (!this.isClient) return null;
    const allLogs = this.listAllRestrictionLogs();
    const idx = allLogs.findIndex((l) => l.restrictionId === restrictionId && l.date === date);
    
    let log: RestrictionLog;
    if (idx === -1) {
      log = {
        id: `rlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        restrictionId,
        date,
        status: "violated",
        violationReason: reason,
        violationTime: new Date().toISOString(),
      };
      allLogs.push(log);
    } else {
      log = {
        ...allLogs[idx],
        status: "violated",
        violationReason: reason,
        violationTime: new Date().toISOString(),
      };
      allLogs[idx] = log;
    }

    this.saveRestrictionLogs(allLogs);
    return log;
  }
}

export const identityOperationsRepository = new IdentityOperationsRepository();
