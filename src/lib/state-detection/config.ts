import type { EmotionalState, RiskThreshold, StateInterventionDefinition, StateRiskWeight } from "./types";

// ── V4.4: Expanded 15-state library ─────────────────────────────
export const EMOTIONAL_STATES = [
  // Positive
  "Focused", "Motivated", "Confident", "Energized", "Calm",
  // Neutral
  "Reflective", "Curious", "Recovering", "Uncertain",
  // Negative
  "Heavy", "Lonely", "Anxious", "Overwhelmed", "Frustrated", "Fatigued",
] as const satisfies readonly EmotionalState[];

export const STATE_RISK_WEIGHTS = [
  // Positive (negative weight = reduces risk)
  { state: "Focused",    weight: -10 },
  { state: "Motivated",  weight: -10 },
  { state: "Confident",  weight: -8 },
  { state: "Energized",  weight: -8 },
  { state: "Calm",       weight: -10 },
  // Neutral (near-zero weight)
  { state: "Reflective", weight: -2 },
  { state: "Curious",    weight: -3 },
  { state: "Recovering", weight: 2 },
  { state: "Uncertain",  weight: 5 },
  // Negative (positive weight = increases risk)
  { state: "Heavy",       weight: 15 },
  { state: "Lonely",      weight: 20 },
  { state: "Anxious",     weight: 18 },
  { state: "Overwhelmed", weight: 20 },
  { state: "Frustrated",  weight: 12 },
  { state: "Fatigued",    weight: 15 },
  // Deprecated
  { state: "Determined", weight: -10 },
  { state: "Restless",   weight: 10 },
  { state: "Fired Up",   weight: -5 },
] as const satisfies readonly StateRiskWeight[];

export const RISK_THRESHOLDS = [
  { level: "GREEN",  minScore: -999 },
  { level: "YELLOW", minScore: 10 },
  { level: "ORANGE", minScore: 25 },
  { level: "RED",    minScore: 45 },
] as const satisfies readonly RiskThreshold[];

export const STATE_INTERVENTIONS = [
  { triggerState: "Lonely",      recommendation: "Journal",                      targetSystem: "manual",     priority: 10 },
  { triggerState: "Lonely",      recommendation: "Call someone",                 targetSystem: "recovery",   priority: 20 },
  { triggerState: "Lonely",      recommendation: "Go outside",                   targetSystem: "recovery",   priority: 30 },
  { triggerState: "Lonely",      recommendation: "Mental Reset",                 targetSystem: "foundation", priority: 40 },
  { triggerState: "Fatigued",    recommendation: "Sleep Protection",             targetSystem: "foundation", priority: 10 },
  { triggerState: "Fatigued",    recommendation: "Recovery Walk",                targetSystem: "foundation", priority: 20 },
  { triggerState: "Fatigued",    recommendation: "Reduce workload",              targetSystem: "mission",    priority: 30 },
  { triggerState: "Overwhelmed", recommendation: "Focus on one mission",         targetSystem: "mission",    priority: 10 },
  { triggerState: "Overwhelmed", recommendation: "Ignore secondary goals",       targetSystem: "mission",    priority: 20 },
  { triggerState: "Overwhelmed", recommendation: "Builder minimum viable win",   targetSystem: "foundation", priority: 30 },
  { triggerState: "Anxious",     recommendation: "Breathing reset",              targetSystem: "foundation", priority: 10 },
  { triggerState: "Anxious",     recommendation: "Choose the smallest next step",targetSystem: "mission",    priority: 20 },
  { triggerState: "Heavy",       recommendation: "Quiet Walk",                   targetSystem: "foundation", priority: 10 },
  { triggerState: "Frustrated",  recommendation: "Breathing reset",              targetSystem: "foundation", priority: 10 },
  { triggerState: "Uncertain",   recommendation: "Choose the smallest next action", targetSystem: "mission", priority: 10 },
] as const satisfies readonly StateInterventionDefinition[];

export const STATE_RISK_WEIGHT_MAP = STATE_RISK_WEIGHTS.reduce(
  (accumulator, entry) => ({
    ...accumulator,
    [entry.state]: entry.weight,
  }),
  {} as Record<EmotionalState, number>
);
