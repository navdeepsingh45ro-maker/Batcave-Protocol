import {
  COUNTERMEASURES,
  NEEDS,
  SEVERITY_WEIGHT,
  THREAT_NEED_MAPPINGS,
  THREATS,
  CAUSE_COUNTERMEASURE_AFFINITY,
  MOMENTUM_COUNTERMEASURE_IDS,
} from "./config";
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
  ThreatDefinition,
} from "./types";
import type { StateCategory } from "../belief-intelligence/types";

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

// ─── Thought keyword → Countermeasure Affinity ───────────────
const THOUGHT_KEYWORD_AFFINITY: Array<{ keywords: string[]; countermeasureIds: string[] }> = [
  { keywords: ["miss", "lonely", "alone", "connection"], countermeasureIds: ["connection_ping", "call_friend", "journal_dump"] },
  { keywords: ["fail", "behind", "losing", "slow", "progress"], countermeasureIds: ["one_step_mission", "builder_sprint", "task_breakdown"] },
  { keywords: ["overthink", "ruminate", "loop", "cannot stop"], countermeasureIds: ["deep_breath_reset", "journal_dump"] },
  { keywords: ["tired", "exhausted", "drain", "fatigue"], countermeasureIds: ["recovery_walk", "sleep_reset", "low_intensity_day"] },
  { keywords: ["distract", "phone", "scroll", "waste"], countermeasureIds: ["phone_exile", "one_step_mission"] },
  { keywords: ["potential", "purpose", "meaning", "drift"], countermeasureIds: ["builder_sprint", "one_step_mission", "journal_dump"] },
  { keywords: ["momentum", "progress", "making progress", "moving"], countermeasureIds: ["continue_current_task", "deep_work_sprint", "mission_advancement"] },
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
  if (idx >= 3) return 4;
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

// ─── Effectiveness Calculation ───────────────────────────────
export function calculateCountermeasureEffectiveness(logs: CountermeasureLog[]): CountermeasureEffectiveness[] {
  return COUNTERMEASURES.map((countermeasure) => {
    const matchingLogs = logs.filter((log) => log.countermeasureId === countermeasure.id);
    const recommendedCount = matchingLogs.length;
    const acceptedCount = matchingLogs.filter((log) => log.accepted).length;
    const completedCount = matchingLogs.filter((log) => log.completed).length;

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

// ─── Per-countermeasure score boost from history ──────────────
function getHistoricalBoost(countermeasureId: string, logs: CountermeasureLog[]): number {
  const effectiveness = calculateCountermeasureEffectiveness(logs).find(
    (entry) => entry.countermeasureId === countermeasureId
  );
  if (!effectiveness || effectiveness.recommendedCount === 0) return 0;
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
    (countermeasure.category === "Sleep Protection" || countermeasure.id === "recovery_walk" || countermeasure.id === "sleep_reset")
      ? 18
      : 0;
  const recentThreatBoost = input.context?.recentThreatIds?.some((threatId) =>
    countermeasure.targetThreatIds.includes(threatId)
  )
    ? 8
    : 0;
  const recentlyCompletedPenalty = input.context?.recentCompletedCountermeasureIds?.includes(countermeasure.id) ? -6 : 0;

  return missedFoundationBoost + sleepDebtBoost + recentThreatBoost + recentlyCompletedPenalty;
}

// ─── Core Scoring Function ───────────────────────────────────
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

  const historicalBoost = getHistoricalBoost(countermeasure.id, logs);
  const causeBoost = getCauseBoost(cause, countermeasure.id);
  const thoughtBoost = getThoughtBoost(thought, countermeasure.id);

  return (
    threatMatch + needMatch + missionMatch + priorityScore +
    historicalBoost + causeBoost + thoughtBoost +
    getContextBoost(countermeasure, input)
  );
}

// ─── Stack Recommendation ────────────────────────────────────
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

  const uniqueScoredCountermeasures = uniqueById(scoredCountermeasures.map((s) => ({ id: s.countermeasure.id, ...s })));

  const primary = uniqueScoredCountermeasures[0]?.countermeasure ?? COUNTERMEASURES[0];
  const secondary = uniqueScoredCountermeasures[1]?.countermeasure ?? COUNTERMEASURES[1];

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

// ── V4.4: Contextual Recommendations (State-Category-Aware) ─────
export interface MomentumRecommendation {
  type: "momentum";
  state: string;
  thought: string | null;
  suggestedActions: CountermeasureDefinition[];
  message: string;
}

export function getMomentumRecommendations(): CountermeasureDefinition[] {
  return COUNTERMEASURES.filter((cm) => MOMENTUM_COUNTERMEASURE_IDS.includes(cm.id));
}

export function getContextualRecommendations(
  state: string,
  cause: string | null,
  classification: string | null,
  stateCategory: StateCategory,
): {
  mode: "momentum" | "observation" | "intervention";
  momentumActions?: CountermeasureDefinition[];
  message?: string;
} {
  // Positive + Strengthening → Momentum Mode
  if (stateCategory === "positive" && classification === "strengthening") {
    return {
      mode: "momentum",
      momentumActions: getMomentumRecommendations(),
      message: "Current trajectory is positive. Protect momentum.",
    };
  }

  // Neutral → Observation (no intervention)
  if (stateCategory === "neutral" && classification !== "limiting") {
    return {
      mode: "observation",
      message: "Observation logged. No intervention required.",
    };
  }

  // Negative / Limiting → Full intervention pipeline
  return { mode: "intervention" };
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

// ── V4.5: Protocol Analytics ─────────────────────────────────────
import type { MissionState, ProtocolAnalytics, ActiveProtocol, MissionResolutionState } from "./types";

export function calculateProtocolAnalytics(logs: CountermeasureLog[]): ProtocolAnalytics[] {
  const byProtocol: Record<string, CountermeasureLog[]> = {};
  for (const log of logs) {
    if (!byProtocol[log.countermeasureId]) byProtocol[log.countermeasureId] = [];
    byProtocol[log.countermeasureId].push(log);
  }

  return Object.entries(byProtocol).map(([protocolId, protocolLogs]) => {
    const total = protocolLogs.length;
    const completed = protocolLogs.filter((l) => l.metadata?.outcome === "COMPLETED" || l.completed).length;
    const failed = protocolLogs.filter((l) => l.metadata?.outcome === "FAILED").length;
    const skipped = protocolLogs.filter((l) => l.metadata?.outcome === "SKIPPED" || (!l.accepted && !l.completed)).length;
    const cm = COUNTERMEASURES.find((c) => c.id === protocolId);
    const lastLog = protocolLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return {
      protocolId,
      protocolName: cm?.name ?? protocolId.replace(/_/g, " "),
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      skipRate: total > 0 ? Math.round((skipped / total) * 100) : 0,
      totalUses: total,
      lastUsed: lastLog?.createdAt,
    };
  }).sort((a, b) => b.totalUses - a.totalUses);
}

export function getSuccessBoost(cmId: string, logs: CountermeasureLog[]): number {
  const analytics = calculateProtocolAnalytics(logs).find((a) => a.protocolId === cmId);
  if (!analytics || analytics.totalUses < 2) return 0;

  if (analytics.successRate > 70) return 15;
  if (analytics.successRate > 50) return 8;
  if (analytics.skipRate > 50) return -12;
  if (analytics.failureRate > 50) return -8;
  return 0;
}

// ── V4.5: Emergency Escalation Logic ────────────────────────────

export function shouldEscalateToEmergency(
  failureCount: number,
  riskScore: number,
  threatRepeatCount: number = 0,
): boolean {
  // Show emergency if: 2+ failures, or risk score > 30, or same threat 3+ times today
  return failureCount >= 2 || riskScore > 30 || threatRepeatCount >= 3;
}

// ── V4.5: Mission State Machine ─────────────────────────────────

export function buildMissionState(
  stack: CountermeasureStackRecommendation,
): MissionState {
  const primary = stack.stack.find((s) => s.role === "PRIMARY") ?? stack.stack[0];
  const fallback = stack.stack
    .filter((s) => s.role !== "PRIMARY")
    .map((s) => ({
      role: s.role,
      cmId: s.countermeasure.id,
      cmName: s.countermeasure.name,
      durationMinutes: s.countermeasure.durationMinutes,
    }));

  return {
    sessionId: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    threatId: stack.recommendedThreat.id,
    threatName: stack.recommendedThreat.name,
    needId: stack.recommendedNeed.id,
    needName: stack.recommendedNeed.name,
    activeProtocol: {
      role: primary.role,
      cmId: primary.countermeasure.id,
      cmName: primary.countermeasure.name,
      status: "PENDING",
      durationMinutes: primary.countermeasure.durationMinutes,
    },
    fallbackQueue: fallback,
    resolutionState: "ACTIVE",
    failureCount: 0,
    startedAt: new Date().toISOString(),
  };
}

export function advanceMission(
  mission: MissionState,
  outcome: "COMPLETED" | "FAILED" | "SKIPPED",
): MissionState {
  const now = new Date().toISOString();

  if (outcome === "COMPLETED") {
    return {
      ...mission,
      activeProtocol: { ...mission.activeProtocol, status: "COMPLETED", completedAt: now },
      resolutionState: "RESOLVED",
      resolvedAt: now,
    };
  }

  // FAILED or SKIPPED — try next in fallback queue
  const newFailureCount = outcome === "FAILED" ? mission.failureCount + 1 : mission.failureCount;
  const next = mission.fallbackQueue[0];

  if (!next) {
    // No fallback left
    return {
      ...mission,
      activeProtocol: { ...mission.activeProtocol, status: outcome, completedAt: now },
      resolutionState: "ABANDONED",
      failureCount: newFailureCount,
      resolvedAt: now,
    };
  }

  // Promote next from queue
  return {
    ...mission,
    activeProtocol: {
      role: next.role,
      cmId: next.cmId,
      cmName: next.cmName,
      status: "PENDING",
      durationMinutes: next.durationMinutes,
    },
    fallbackQueue: mission.fallbackQueue.slice(1),
    resolutionState: newFailureCount >= 2 ? "ESCALATED" : "ACTIVE",
    failureCount: newFailureCount,
  };
}

