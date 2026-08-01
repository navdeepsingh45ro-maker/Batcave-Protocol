import type { FocusSession } from "./types";

const SESSIONS_KEY = "batcave.focus_sessions";

class FocusSessionRepository {
  private get isClient(): boolean {
    return typeof window !== "undefined";
  }

  listSessions(): FocusSession[] {
    if (!this.isClient) return [];
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: FocusSession[]) {
    if (!this.isClient) return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  createSession(sessionData: Omit<FocusSession, "id" | "deepWorkScore" | "createdAt">): FocusSession {
    const sessions = this.listSessions();
    
    // Calculate Deep Work Score: Focus (max 50) + Energy (max 30) - Distraction penalty (max 20)
    // Scaled to a max score of 100
    // Example formula: (Focus * 5) + (Energy * 3) + ((10 - Distraction) * 2)
    const deepWorkScore = Math.round(
      (sessionData.focusRating * 5) +
      (sessionData.energyRating * 3) +
      ((10 - sessionData.distractionRating) * 2)
    );

    const newSession: FocusSession = {
      ...sessionData,
      id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deepWorkScore: Math.min(100, Math.max(0, deepWorkScore)), // clamp 0-100
      createdAt: new Date().toISOString(),
    };

    sessions.push(newSession);
    this.saveSessions(sessions);
    return newSession;
  }
}

export const focusSessionRepository = new FocusSessionRepository();
