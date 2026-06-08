import { COUNTERMEASURES, NEEDS, SEVERITY_WEIGHT, THREAT_NEED_MAPPINGS, THREATS } from "./config";
import type {
  CountermeasureDefinition,
  CountermeasureEffectiveness,
  CountermeasureLog,
  CountermeasureRecommendation,
  CountermeasureRecommendationInput,
  CountermeasureStackItem,
  CountermeasureStackRecommendation,
  Need,
  NeedDefinition,
  ThreatDefinition
} from "./types";

// ─── Utilities ────────────────────────────────────────────────
function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ─── Cause → Countermeasure Affinity (Issue 4) ───────────────
const CAUSE_COUNTERMEASURE_AFFINITY: Record<string, string[]> = {
  "Missing Connection": ["connection_ping", "journal_dump", "recovery_walk"],
  "Fear Of Failure": ["one_step_mission", "builder_sprint", "deep_breath_reset"],
  "Purpose Drift": ["builder_sprint", "one_step_mission", "journal_dump"],
  "Rejection Memory": ["journal_dump", "connection_ping", "deep_breath_reset"],
  "Fatigue": ["recovery_walk", "deep_breath_reset", "one_step_mission"],
  "Uncertainty": ["one_step_mission", "deep_breath_reset", "builder_sprint"],
  "Lack Of Progress": ["builder_sprint", "one_step_mission", "recovery_walk"],
  "Financial Stress": ["builder_sprint", "one_step_mission", "journal_dump"],
  "Social Pressure": ["journal_dump", "deep_breath_reset", "phone_exile"],
  "Identity Conflict": ["journal_dump", "one_step_mission", "builder_sprint"],
  "Other": [],
};

// ─── Thought keyword → Countermeasure Affinity (Issue 4) ─────
const THOUGHT_KEYWORD_AFFINITY: Array<{ keywords: string[]; countermeasureIds: string[] }> = [
  { keywords: ["miss", "lonely", "alone", "connection"], countermeasureIds: ["connection_ping", "journal_dump"] },
  { keywords: ["fail", "behind", "losing", "slow", "progress"], countermeasureIds: ["one_step_mission", "builder_sprint"] },
  { keywords: ["overthink", "ruminate", "loop", "cannot stop"], countermeasureIds: ["deep_breath_reset", "journal_dump"] },
  { keywords: ["tired", "exhausted", "drain", "fatigue"], countermeasureIds: ["recovery_walk", "deep_breath_reset"] },
  { keywords: ["distract", "phone", "scroll", "waste"], countermeasureIds: ["phone_exile", "one_step_mission"] },
  { keywords: ["potential", "purpose", "meaning", "drift"], countermeasureIds: ["builder_sprint", "one_step_mission", "journal_dump"] },
];

function getThoughtBoost(thought: string | null | undefined, countermeasureId: string): number {
  if (!thought) return 0;
  const lower = thought.toLowerCase();
  for (const entry of THOUGHT_KEYWORD_AFFINITY) {
    if (entry.keywords.some((kw) => lower.includes(kw)) && entry.countermeasureIds.includes(countermeasureId)) {
      return 18;
    }
  }
  return 0;
}

function getCauseBoost(cause: string | null | undefined, countermeasureId: string): number {
  if (!cause) return 0;
  const preferred = CAUSE_COUNTERMEASURE_AFFINITY[cause] ?? [];
  const idx = preferred.indexOf(countermeasureId);
  if (idx === 0) return 22;
  if (idx === 1) return 14;
  if (idx === 2) return 8;
  return 0;
}

// ─── Threat Detection ─────────────────────────────────────────
export function detectThreat(selectedStates: CountermeasureRecommendationInput["selectedStates"]): ThreatDefinition {
  const stateSet = new Set(selectedStates);
  const scoredThreats = THREATS.map((threat) => {
    const matchCount = threat.associatedStates.filter((state) => stateSet.has(state)).length;
    return {
      threat,
      score: matchCount * 25 + SEVERITY_WEIGHT[threat.severity]
    };
  }).sort((left, right) => right.score - left.score);

  return scoredThreats[0]?.threat ?? THREATS[0];
}

export function detectNeed(threatId: string): NeedDefinition {
  const mapping = THREAT_NEED_MAPPINGS.filter((entry) => entry.threatId === threatId).sort(
    (left, right) => left.priority - right.priority
  )[0];

  return NEEDS.find((need) => need.name === mapping?.need) ?? NEEDS[0];
}

// ─── Effectiveness Calculation (Issue 5) ─────────────────────
export function calculateCountermeasureEffectiveness(logs: CountermeasureLog[]): CountermeasureEffectiveness[] {
  return COUNTERMEASURES.map((countermeasure) => {
    const matchingLogs = logs.filter((log) => log.countermeasureId === countermeasure.id);
    const recommendedCount = matchingLogs.length;
    const acceptedCount = matchingLogs.filter((log) => log.accepted).length;
    const completedCount = matchingLogs.filter((log) => log.completed).length;

    // Count skipped and failed from metadata
    const skippedCount = matchingLogs.filter((log) => {
      const outcome = (log.metadata?.outcome as string) || "";
      return outcome === "SKIPPED" || (!log.accepted && !log.completed);
    }).length;
    const failedCount = matchingLogs.filter((log) => {
      const outcome = (log.metadata?.outcome as string) || "";
      return outcome === "FAILED";
    }).length;

    const acceptanceRate = recommendedCount === 0 ? 0 : Math.round((acceptedCount / recommendedCount) * 100);
    const completionRate = recommendedCount === 0 ? 0 : Math.round((completedCount / recommendedCount) * 100);
    const skipRate = recommendedCount === 0 ? 0 : Math.round((skippedCount / recommendedCount) * 100);
    const failureRate = recommendedCount === 0 ? 0 : Math.round((failedCount / recommendedCount) * 100);

    return {
      countermeasureId: countermeasure.id,
      countermeasureName: countermeasure.name,
      recommendedCount,
      acceptedCount,
      completedCount,
      acceptanceRate,
      completionRate,
      effectivenessScore: completionRate - Math.round(skipRate * 0.4) - Math.round(failureRate * 0.5),
      skipRate,
      failureRate,
    } as CountermeasureEffectiveness;
  }).sort((left, right) => right.effectivenessScore - left.effectivenessScore);
}

// ─── Per-countermeasure score boost from history (Issue 5) ───
function getHistoricalBoost(countermeasureId: string, logs: CountermeasureLog[]): number {
  const effectiveness = calculateCountermeasureEffectiveness(logs).find(
    (entry) => entry.countermeasureId === countermeasureId
  );
  if (!effectiveness || effectiveness.recommendedCount === 0) return 0;
  // Positive: completion rate boost. Negative: skip/fail penalty.
  return Math.round(effectiveness.effectivenessScore / 8);
}

function getContextBoost(
  countermeasure: CountermeasureDefinition,
  input: CountermeasureRecommendationInput
): number {
  const missedFoundationCounts = input.context?.missedFoundationCounts ?? {};
  const category = countermeasure.category;
  const missedFoundationBoost =
    category in missedFoundationCounts
      ? Math.min((missedFoundationCounts[category as keyof typeof missedFoundationCounts] ?? 0) * 8, 24)
      : 0;
  const sleepDebtBoost =
    input.context?.sleepDebt &&
    (countermeasure.category === "Sleep Protection" || countermeasure.id === "recovery_walk")
      ? 18
      : 0;
  const recentThreatBoost = input.context?.recentThreatIds?.some((threatId) =>
    countermeasure.targetThreatIds.includes(threatId)
  )
    ? 8
    : 0;
  // Penalise if recently completed (avoid repetition)
  const recentlyCompletedPenalty = input.context?.recentCompletedCountermeasureIds?.includes(countermeasure.id) ? -6 : 0;

  return missedFoundationBoost + sleepDebtBoost + recentThreatBoost + recentlyCompletedPenalty;
}

// ─── Core Scoring Function (Issues 4 + 5) ────────────────────
function scoreCountermeasure(
  countermeasure: CountermeasureDefinition,
  threat: ThreatDefinition,
  need: Need,
  logs: CountermeasureLog[],
  input: CountermeasureRecommendationInput,
  cause?: string | null,
  thought?: string | null
): number {
  const targetThreatIds: readonly string[] = countermeasure.targetThreatIds;
  const targetNeeds: readonly Need[] = countermeasure.targetNeeds;

  const threatMatch = targetThreatIds.includes(threat.id) ? 35 : 0;
  const needMatch = targetNeeds.includes(need) ? 25 : 0;
  const missionMatch =
    input.preferredMission && countermeasure.recommendedMissionRedirect === input.preferredMission ? 10 : 0;
  const priorityScore = Math.max(0, 30 - countermeasure.priority);

  // Historical learning boost/penalty (Issue 5)
  const historicalBoost = getHistoricalBoost(countermeasure.id, logs);

  // Cause and thought context boosts (Issue 4)
  const causeBoost = getCauseBoost(cause, countermeasure.id);
  const thoughtBoost = getThoughtBoost(thought, countermeasure.id);

  return (
    threatMatch +
    needMatch +
    missionMatch +
    priorityScore +
    historicalBoost +
    causeBoost +
    thoughtBoost +
    getContextBoost(countermeasure, input)
  );
}

// ─── Stack Recommendation (Issue 3: deduplication) ───────────
export function recommendCountermeasureStack(
  input: CountermeasureRecommendationInput,
  logs: CountermeasureLog[] = [],
  cause?: string | null,
  thought?: string | null
): CountermeasureStackRecommendation {
  const selectedStates = unique(input.selectedStates);
  const detectedThreat = detectThreat(selectedStates);
  const recommendedNeed = detectNeed(detectedThreat.id);

  const scoredCountermeasures = COUNTERMEASURES.map((countermeasure) => ({
    countermeasure,
    score: scoreCountermeasure(countermeasure, detectedThreat, recommendedNeed.name, logs, input, cause, thought)
  })).sort((left, right) => right.score - left.score);

  // Deduplicate by ID (Issue 3) — pick top 3 unique countermeasures
  const uniqueScoredCountermeasures = uniqueById(scoredCountermeasures.map((s) => ({ id: s.countermeasure.id, ...s })));

  const primary = uniqueScoredCountermeasures[0]?.countermeasure ?? COUNTERMEASURES[0];
  const secondary = uniqueScoredCountermeasures[1]?.countermeasure ?? COUNTERMEASURES[1];

  // Emergency must be a quick-action protocol (< 10 min) and different from primary/secondary
  const emergencyCandidate = uniqueScoredCountermeasures.find(
    (s) =>
      s.countermeasure.id !== primary.id &&
      s.countermeasure.id !== secondary.id &&
      s.countermeasure.durationMinutes <= 10
  );
  const emergency = emergencyCandidate?.countermeasure ?? uniqueScoredCountermeasures[2]?.countermeasure ?? secondary;

  const stackDefinitions = [
    { role: "PRIMARY" as const, countermeasure: primary, baseConfidence: 78 },
    { role: "SECONDARY" as const, countermeasure: secondary, baseConfidence: 66 },
    { role: "EMERGENCY" as const, countermeasure: emergency, baseConfidence: 72 }
  ];

  // Final dedup across the three chosen roles
  const usedIds = new Set<string>();
  const stack: CountermeasureStackItem[] = stackDefinitions
    .filter((item) => {
      if (usedIds.has(item.countermeasure.id)) return false;
      usedIds.add(item.countermeasure.id);
      return true;
    })
    .map((item) => ({
      role: item.role,
      detectedThreat,
      recommendedNeed,
      countermeasure: item.countermeasure,
      identity: item.countermeasure.activatesIdentity,
      missionRedirect: item.countermeasure.recommendedMissionRedirect,
      confidenceScore: Math.min(
        98,
        item.baseConfidence +
          selectedStates.length * 3 +
          Math.round(scoreCountermeasure(item.countermeasure, detectedThreat, recommendedNeed.name, logs, input, cause, thought) / 10)
      ),
      reason: buildReason(item.countermeasure, detectedThreat, recommendedNeed.name, cause, thought),
    }));

  return {
    selectedStates,
    recommendedThreat: detectedThreat,
    recommendedNeed,
    stack,
    generatedAt: new Date().toISOString()
  };
}

function buildReason(
  cm: CountermeasureDefinition,
  threat: ThreatDefinition,
  need: Need,
  cause: string | null | undefined,
  thought: string | null | undefined
): string {
  const parts: string[] = [];
  if (thought) parts.push(`Thought pattern "${thought}" points here.`);
  if (cause) parts.push(`Cause "${cause}" favours this protocol.`);
  parts.push(`${cm.name} resolves ${threat.name} by addressing ${need}.`);
  return parts.join(" ");
}

export function recommendCountermeasure(
  input: CountermeasureRecommendationInput,
  logs: CountermeasureLog[] = [],
  cause?: string | null,
  thought?: string | null
): CountermeasureRecommendation {
  const selectedStates = unique(input.selectedStates);
  const detectedThreat = detectThreat(selectedStates);
  const recommendedNeed = detectNeed(detectedThreat.id);
  const stack = recommendCountermeasureStack(input, logs, cause, thought);
  const recommendedCountermeasure = stack.stack[0].countermeasure;

  return {
    detectedThreat,
    recommendedNeed,
    recommendedCountermeasure,
    recommendedIdentity: recommendedCountermeasure.activatesIdentity,
    missionRedirect: recommendedCountermeasure.recommendedMissionRedirect,
    explanation: buildReason(recommendedCountermeasure, detectedThreat, recommendedNeed.name, cause, thought),
    confidenceScore: Math.min(95, 50 + selectedStates.length * 10)
  };
}

export function createInterventionHistory(logs: CountermeasureLog[]) {
  return logs.flatMap((log) =>
    log.triggerStates.map((triggerState) => ({
      id: `${log.id}:${triggerState}`,
      userId: log.userId,
      date: log.date,
      triggerState,
      detectedThreatId: log.detectedThreatId,
      recommendedCountermeasureId: log.countermeasureId,
      accepted: log.accepted,
      completed: log.completed,
      createdAt: log.createdAt
    }))
  );
}
