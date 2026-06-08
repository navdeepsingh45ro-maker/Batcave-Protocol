import type { BeliefEntry, PatternReport, DecisionMatrixEntry } from "./types";
import type { FoundationActivityLog } from "../foundation/types";

function topCounts<T extends Record<string, number>>(counts: T, limit = 10) {
  return Object.entries(counts)
    .map(([k, v]) => ({ key: k, count: v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function generatePatternReport(entries: BeliefEntry[]): PatternReport {
  const totalEntries = entries.length;
  const stateCounts: Record<string, number> = {};
  const causeCounts: Record<string, number> = {};
  const thoughtCounts: Record<string, number> = {};
  const stateThoughtPairs: Record<string, number> = {};
  const stateCausePairs: Record<string, number> = {};

  for (const e of entries) {
    for (const s of e.states) {
      stateCounts[s] = (stateCounts[s] || 0) + 1;
      if (e.primaryCause) {
        const key = `${s}||${e.primaryCause}`;
        stateCausePairs[key] = (stateCausePairs[key] || 0) + 1;
      }
      if (e.recurringThought) {
        const key = `${s}||${e.recurringThought}`;
        stateThoughtPairs[key] = (stateThoughtPairs[key] || 0) + 1;
      }
    }
    if (e.primaryCause) {
      causeCounts[e.primaryCause] = (causeCounts[e.primaryCause] || 0) + 1;
    }
    if (e.recurringThought) {
      thoughtCounts[e.recurringThought] = (thoughtCounts[e.recurringThought] || 0) + 1;
    }
  }

  const topStates = topCounts(stateCounts).map((s) => ({ state: s.key, count: s.count }));
  const topCauses = topCounts(causeCounts).map((c) => ({ cause: c.key, count: c.count }));
  const topThoughts = topCounts(thoughtCounts).map((t) => ({ thought: t.key, count: t.count }));

  const stateThoughtPairsArr = Object.entries(stateThoughtPairs).map(([k, count]) => {
    const [state, thought] = k.split("||");
    return { state, thought, count };
  });

  const stateCausePairsArr = Object.entries(stateCausePairs).map(([k, count]) => {
    const [state, cause] = k.split("||");
    return { state, cause, count };
  });

  return {
    totalEntries,
    topStates,
    topCauses,
    topThoughts,
    stateThoughtPairs: stateThoughtPairsArr,
    stateCausePairs: stateCausePairsArr,
  } as PatternReport;
}

export function analyzeDecisionUsage(decisions: DecisionMatrixEntry[], usages: { decisionId: string }[]) {
  const usageCounts: Record<string, number> = {};
  for (const u of usages) {
    usageCounts[u.decisionId] = (usageCounts[u.decisionId] || 0) + 1;
  }
  return decisions.map((d) => ({ decision: d, usageCount: usageCounts[d.id] || 0 }));
}

export interface BeliefCorrelation {
  cause: string;
  foundation: string;
  skipPercent: number;
  occurrences: number;
}

export function calculateBeliefCorrelations(
  beliefs: BeliefEntry[],
  activities: FoundationActivityLog[]
): BeliefCorrelation[] {
  const causes = Array.from(new Set(beliefs.map((b) => b.primaryCause).filter(Boolean))) as string[];
  const foundations = ["Builder Work", "Striker Work", "Knowledge Intake", "Mental Reset", "Sleep Protection"];
  const correlations: BeliefCorrelation[] = [];

  for (const cause of causes) {
    const datesWithCause = Array.from(new Set(beliefs.filter((b) => b.primaryCause === cause).map((b) => b.date)));
    if (datesWithCause.length === 0) continue;

    for (const foundation of foundations) {
      let completedCount = 0;
      for (const date of datesWithCause) {
        const hasActivity = activities.some((act) => act.date === date && act.foundation === foundation);
        if (hasActivity) {
          completedCount++;
        }
      }
      const totalCount = datesWithCause.length;
      const skipCount = totalCount - completedCount;
      const skipPercent = Math.round((skipCount / totalCount) * 100);

      correlations.push({
        cause,
        foundation,
        skipPercent,
        occurrences: totalCount
      });
    }
  }

  return correlations.sort((a, b) => b.skipPercent - a.skipPercent);
}
