import type { ProtocolLog, ProtocolStatus, ProtocolCategory } from "./types";


const STORAGE_KEY = "batcave.protocol_logs";

export class ProtocolRepository {
  list(): ProtocolLog[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  save(logs: ProtocolLog[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event("protocol_logs_updated"));
  }

  getProtocol(id: string): ProtocolLog | undefined {
    return this.list().find(l => l.id === id);
  }

  addProtocol(log: ProtocolLog): void {
    const logs = this.list();
    logs.push(log);
    this.save(logs);
  }

  updateProtocolStatus(id: string, status: ProtocolStatus, updates?: Partial<ProtocolLog>): void {
    const logs = this.list();
    const index = logs.findIndex(l => l.id === id);
    if (index >= 0) {
      logs[index] = { ...logs[index], ...updates, status };
      this.save(logs);
    }
  }

  getActiveProtocol(): ProtocolLog | undefined {
    // Return any protocol that is Triggered, Selected, Accepted, or Active.
    return this.list().find(l => ["Triggered", "Selected", "Accepted", "Active"].includes(l.status));
  }

  getHistoricalSuccess(protocolId: string): { total: number; completed: number; rate: number } {
    const logs = this.list().filter(l => l.protocolId === protocolId && ["Completed", "Failed", "Abandoned"].includes(l.status));
    const total = logs.length;
    const completed = logs.filter(l => l.status === "Completed").length;
    return {
      total,
      completed,
      rate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  getBestProtocolForContext(state?: string, cause?: string): string | null {
    // Finds the protocol ID with the highest completion rate for this state/cause context.
    const logs = this.list().filter(l => 
      ["Completed", "Failed", "Abandoned"].includes(l.status) &&
      (state ? l.associatedState === state : true) &&
      (cause ? l.associatedCause === cause : true)
    );

    const stats: Record<string, { total: number; completed: number }> = {};
    for (const log of logs) {
      if (!stats[log.protocolId]) stats[log.protocolId] = { total: 0, completed: 0 };
      stats[log.protocolId].total++;
      if (log.status === "Completed") stats[log.protocolId].completed++;
    }

    let bestId: string | null = null;
    let bestRate = 0;

    for (const [id, s] of Object.entries(stats)) {
      if (s.total >= 2) { // Need at least 2 attempts to form a historical pattern
        const rate = (s.completed / s.total) * 100;
        if (rate > bestRate) {
          bestRate = rate;
          bestId = id;
        }
      }
    }

    return bestId;
  }
}

export const protocolRepository = new ProtocolRepository();
