import type { EmotionalState, RiskThreshold, StateInterventionDefinition, StateRiskWeight } from "./types";

export const EMOTIONAL_STATES = [
  "Focused",
  "Determined",
  "Calm",
  "Energized",
  "Curious",
  "Restless",
  "Lonely",
  "Heavy",
  "Fatigued",
  "Overwhelmed",
  "Uncertain",
  "Frustrated",
  "Fired Up"
] as const satisfies readonly EmotionalState[];

export const STATE_RISK_WEIGHTS = [
  { state: "Focused", weight: -10 },
  { state: "Determined", weight: -10 },
  { state: "Calm", weight: -10 },
  { state: "Energized", weight: -5 },
  { state: "Curious", weight: -5 },
  { state: "Fired Up", weight: -5 },
  { state: "Restless", weight: 10 },
  { state: "Lonely", weight: 20 },
  { state: "Heavy", weight: 15 },
  { state: "Fatigued", weight: 15 },
  { state: "Overwhelmed", weight: 20 },
  { state: "Uncertain", weight: 8 },
  { state: "Frustrated", weight: 12 }
] as const satisfies readonly StateRiskWeight[];

export const RISK_THRESHOLDS = [
  { level: "GREEN", minScore: -999 },
  { level: "YELLOW", minScore: 10 },
  { level: "ORANGE", minScore: 25 },
  { level: "RED", minScore: 45 }
] as const satisfies readonly RiskThreshold[];

export const STATE_INTERVENTIONS = [
  { triggerState: "Lonely", recommendation: "Journal", targetSystem: "manual", priority: 10 },
  { triggerState: "Lonely", recommendation: "Call someone", targetSystem: "recovery", priority: 20 },
  { triggerState: "Lonely", recommendation: "Go outside", targetSystem: "recovery", priority: 30 },
  { triggerState: "Lonely", recommendation: "Mental Reset", targetSystem: "foundation", priority: 40 },
  { triggerState: "Fatigued", recommendation: "Sleep Protection", targetSystem: "foundation", priority: 10 },
  { triggerState: "Fatigued", recommendation: "Recovery Walk", targetSystem: "foundation", priority: 20 },
  { triggerState: "Fatigued", recommendation: "Reduce workload", targetSystem: "mission", priority: 30 },
  { triggerState: "Overwhelmed", recommendation: "Focus on one mission", targetSystem: "mission", priority: 10 },
  { triggerState: "Overwhelmed", recommendation: "Ignore secondary goals", targetSystem: "mission", priority: 20 },
  { triggerState: "Overwhelmed", recommendation: "Builder minimum viable win", targetSystem: "foundation", priority: 30 },
  { triggerState: "Restless", recommendation: "Move for ten minutes", targetSystem: "recovery", priority: 10 },
  { triggerState: "Heavy", recommendation: "Quiet Walk", targetSystem: "foundation", priority: 10 },
  { triggerState: "Frustrated", recommendation: "Breathing reset", targetSystem: "foundation", priority: 10 },
  { triggerState: "Uncertain", recommendation: "Choose the smallest next action", targetSystem: "mission", priority: 10 }
] as const satisfies readonly StateInterventionDefinition[];

export const STATE_RISK_WEIGHT_MAP = STATE_RISK_WEIGHTS.reduce(
  (accumulator, entry) => ({
    ...accumulator,
    [entry.state]: entry.weight
  }),
  {} as Record<EmotionalState, number>
);
