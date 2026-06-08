import type { BeliefState, BeliefCause } from "./types";

export const BELIEF_STORAGE_KEY = "batcave.belief.entries";
export const DECISION_STORAGE_KEY = "batcave.belief.decisions";
export const DECISION_USAGE_KEY = "batcave.belief.decisionUsage";

export const BELIEF_STATES: BeliefState[] = [
  "Focused",
  "Lonely",
  "Heavy",
  "Fatigued",
  "Overwhelmed",
  "Determined",
  "Restless",
  "Calm",
];

export const BELIEF_CAUSES: BeliefCause[] = [
  "Missing Connection",
  "Fear Of Failure",
  "Purpose Drift",
  "Rejection Memory",
  "Fatigue",
  "Uncertainty",
  "Lack Of Progress",
  "Financial Stress",
  "Social Pressure",
  "Identity Conflict",
  "Other",
];

export const SAMPLE_RECURRING_THOUGHTS = [
  "I miss her",
  "I am behind",
  "I might fail",
  "Nobody understands me",
  "I am wasting my potential",
  "I cannot maintain consistency",
  "Other",
];
