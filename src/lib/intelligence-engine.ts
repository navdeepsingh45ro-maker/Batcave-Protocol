import { identityOperationsRepository, ProtocolIdentity, TaskHistoryRecord } from "./identity-operations";
import { focusSessionRepository, FocusSession } from "./focus-sessions";
import type { ISODate } from "./foundation/types";

export interface ExecutionMetrics {
  builderScore: number;
  strikerScore: number;
  kingScore: number;
  guardianScore: number;
  focusSessionsCount: number;
  deepWorkTimeMs: number;
  currentStreakDays: number;
}

export interface PatternInsight {
  description: string;
  evidence: string;
  confidence: number;
}

export interface BottleneckInsight {
  description: string;
  evidence: string;
  rawType: string;
  rawValue: string;
}

export interface MomentumInsight {
  description: string;
  evidence: string;
}

export interface CoachNote {
  evidence: string;
  observation: string;
  recommendation: string;
}

function subtractDays(dateStr: ISODate, days: number): ISODate {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as ISODate;
}

function getHourBlock(isoTime: string): string {
  const h = new Date(isoTime).getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 22) return "Evening";
  return "Night";
}

export class IntelligenceEngine {
  private get isClient(): boolean {
    return typeof window !== "undefined";
  }

  getTodaysExecution(date: ISODate): ExecutionMetrics {
    if (!this.isClient) {
      return { builderScore: 0, strikerScore: 0, kingScore: 0, guardianScore: 0, focusSessionsCount: 0, deepWorkTimeMs: 0, currentStreakDays: 0 };
    }

    const builder = identityOperationsRepository.getIdentityScore("Builder", date).score;
    const striker = identityOperationsRepository.getIdentityScore("Striker", date).score;
    const king = identityOperationsRepository.getIdentityScore("King", date).score;
    const guardian = identityOperationsRepository.getIdentityScore("Guardian", date).score;

    const todaySessions = focusSessionRepository.listSessions().filter(s => s.date === date);
    const focusSessionsCount = todaySessions.length;
    const deepWorkTimeMs = todaySessions.reduce((acc, s) => acc + (s.duration * 1000), 0);

    // Calculate Streak
    let streak = 0;
    let checkDate = date;
    const history = identityOperationsRepository.listHistory(1000);
    const sessions = focusSessionRepository.listSessions();

    while (true) {
      const hasHistory = history.some(h => (h.completedAt && h.completedAt.startsWith(checkDate)) || h.date === checkDate && h.skipReason === undefined);
      const hasSession = sessions.some(s => s.date === checkDate);
      
      if (hasHistory || hasSession) {
        streak++;
        checkDate = subtractDays(checkDate, 1);
      } else {
        // If today is empty, it might just be the start of the day. Check yesterday before breaking.
        if (checkDate === date && streak === 0) {
           checkDate = subtractDays(checkDate, 1);
           const yestHasHistory = history.some(h => (h.completedAt && h.completedAt.startsWith(checkDate)) || h.date === checkDate && h.skipReason === undefined);
           const yestHasSession = sessions.some(s => s.date === checkDate);
           if (!yestHasHistory && !yestHasSession) break;
           continue;
        }
        break;
      }
    }

    return { builderScore: builder, strikerScore: striker, kingScore: king, guardianScore: guardian, focusSessionsCount, deepWorkTimeMs, currentStreakDays: streak };
  }

  getPatternDiscovery(): PatternInsight | null {
    if (!this.isClient) return null;
    const sessions = focusSessionRepository.listSessions();
    if (sessions.length < 5) return null;

    // Check Time of Day patterns for Identities
    const identityBlocks: Record<string, Record<string, number>> = {};
    const identityTotals: Record<string, number> = {};

    sessions.forEach(s => {
      const block = getHourBlock(s.startTime);
      if (!identityBlocks[s.identity]) identityBlocks[s.identity] = {};
      identityBlocks[s.identity][block] = (identityBlocks[s.identity][block] || 0) + 1;
      identityTotals[s.identity] = (identityTotals[s.identity] || 0) + 1;
    });

    let bestPattern: PatternInsight | null = null;

    for (const [id, blocks] of Object.entries(identityBlocks)) {
      const total = identityTotals[id];
      if (total < 4) continue;

      for (const [block, count] of Object.entries(blocks)) {
        const conf = Math.round((count / total) * 100);
        if (conf >= 60) {
          if (!bestPattern || conf > bestPattern.confidence) {
            bestPattern = {
              description: `${id} operations are most successful in the ${block}.`,
              evidence: `(${count}/${total} sessions)`,
              confidence: conf
            };
          }
        }
      }
    }

    return bestPattern;
  }

  getBottleneck(date: ISODate): BottleneckInsight | null {
    if (!this.isClient) return null;
    
    // Check last 14 days
    const sessions = focusSessionRepository.listSessions().filter(s => s.date >= subtractDays(date, 14));
    const history = identityOperationsRepository.listHistory(200).filter(h => h.date >= subtractDays(date, 14));

    // 1. Most common interruption
    const interruptions: Record<string, number> = {};
    let totalBlocked = 0;
    sessions.forEach(s => {
      if (s.objectiveStatus === "Blocked" && s.interruptionReason) {
        interruptions[s.interruptionReason] = (interruptions[s.interruptionReason] || 0) + 1;
        totalBlocked++;
      }
    });

    let topInterruption = { reason: "", count: 0 };
    for (const [reason, count] of Object.entries(interruptions)) {
      if (count > topInterruption.count) topInterruption = { reason, count };
    }

    // 2. Most missed operation
    const missedOps: Record<string, number> = {};
    let totalMissed = 0;
    history.forEach(h => {
      if (h.skipReason !== undefined) {
        missedOps[h.taskName] = (missedOps[h.taskName] || 0) + 1;
        totalMissed++;
      }
    });

    let topMissed = { name: "", count: 0 };
    for (const [name, count] of Object.entries(missedOps)) {
      if (count > topMissed.count) topMissed = { name, count };
    }

    if (topInterruption.count >= 2 && topInterruption.count >= topMissed.count) {
      return {
        description: `Most common interruption: ${topInterruption.reason}`,
        evidence: `(${topInterruption.count} blocked sessions)`,
        rawType: "interruption",
        rawValue: topInterruption.reason
      };
    }

    if (topMissed.count >= 2) {
      return {
        description: `Most missed operation: ${topMissed.name}`,
        evidence: `(${topMissed.count} misses)`,
        rawType: "missed_op",
        rawValue: topMissed.name
      };
    }

    return null;
  }

  getMomentum(date: ISODate): MomentumInsight | null {
    if (!this.isClient) return null;

    const sessions = focusSessionRepository.listSessions();
    const last7 = sessions.filter(s => s.date >= subtractDays(date, 7) && s.date <= date);
    const prev7 = sessions.filter(s => s.date >= subtractDays(date, 14) && s.date < subtractDays(date, 7));

    if (last7.length >= 3 && prev7.length >= 3) {
      const avgLast = last7.reduce((acc, s) => acc + s.focusRating, 0) / last7.length;
      const avgPrev = prev7.reduce((acc, s) => acc + s.focusRating, 0) / prev7.length;

      if (avgLast > avgPrev + 0.5) {
        return {
          description: "Average Focus Rating improved",
          evidence: `(↑ ${(avgLast - avgPrev).toFixed(1)} pts)`
        };
      }
    }

    const { currentStreakDays } = this.getTodaysExecution(date);
    if (currentStreakDays >= 3) {
      return {
        description: "Current Execution Streak",
        evidence: `${currentStreakDays} Days`
      };
    }

    if (last7.length > prev7.length && last7.length >= 5) {
       return {
         description: "Focus Session Volume",
         evidence: `(↑ ${last7.length - prev7.length} sessions)`
       }
    }

    return null;
  }

  getCoachNote(pattern: PatternInsight | null, bottleneck: BottleneckInsight | null): CoachNote | null {
    if (bottleneck) {
      if (bottleneck.rawType === "interruption") {
        return {
          evidence: bottleneck.evidence,
          observation: `${bottleneck.rawValue} interruptions are destroying Deep Work.`,
          recommendation: `Isolate environment before starting focus sessions.`
        };
      }
      if (bottleneck.rawType === "missed_op") {
        return {
          evidence: bottleneck.evidence,
          observation: `${bottleneck.rawValue} is consistently failing execution.`,
          recommendation: `Reduce scope or schedule earlier in the day.`
        };
      }
    }

    if (pattern) {
      const timeMatch = pattern.description.match(/(Builder|Striker|King|Guardian).*?(Morning|Afternoon|Evening|Night)/);
      if (timeMatch) {
        const id = timeMatch[1];
        const time = timeMatch[2];
        return {
          evidence: pattern.evidence,
          observation: `${id} performance peaks in the ${time}.`,
          recommendation: `Schedule highest friction ${id} tasks during this block.`
        };
      }
    }

    return null;
  }
}

export const executionIntelligenceEngine = new IntelligenceEngine();
