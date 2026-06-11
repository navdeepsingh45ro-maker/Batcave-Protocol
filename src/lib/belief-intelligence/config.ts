import type { BeliefState, BeliefCause, StateCategory, PositiveCause, NeutralCause, NegativeCause } from "./types";

export const BELIEF_STORAGE_KEY = "batcave.belief.entries";
export const DECISION_STORAGE_KEY = "batcave.belief.decisions";
export const DECISION_USAGE_KEY = "batcave.belief.decisionUsage";

// ── V4.4: Categorised State Library (15 focused states) ─────────

export const POSITIVE_STATES: BeliefState[] = [
  "Focused", "Motivated", "Confident", "Energized", "Calm",
];

export const NEUTRAL_STATES: BeliefState[] = [
  "Reflective", "Curious", "Recovering", "Uncertain",
];

export const NEGATIVE_STATES: BeliefState[] = [
  "Heavy", "Lonely", "Anxious", "Overwhelmed", "Frustrated", "Fatigued",
];

/** Scalable combined array — add future states to the category arrays above */
export const ALL_BELIEF_STATES: BeliefState[] = [
  ...POSITIVE_STATES, ...NEUTRAL_STATES, ...NEGATIVE_STATES,
];

/** Deprecated aliases kept for old data compat */
export const DEPRECATED_STATES: BeliefState[] = ["Determined", "Restless", "Fired Up"];

/** @deprecated Use ALL_BELIEF_STATES instead */
export const BELIEF_STATES: BeliefState[] = ALL_BELIEF_STATES;

// ── State → Category mapping ────────────────────────────────────

export const STATE_CATEGORY_MAP: Record<string, StateCategory> = {};
POSITIVE_STATES.forEach((s) => { STATE_CATEGORY_MAP[s] = "positive"; });
NEUTRAL_STATES.forEach((s) => { STATE_CATEGORY_MAP[s] = "neutral"; });
NEGATIVE_STATES.forEach((s) => { STATE_CATEGORY_MAP[s] = "negative"; });
// Deprecated aliases
STATE_CATEGORY_MAP["Determined"] = "positive";
STATE_CATEGORY_MAP["Restless"] = "negative";
STATE_CATEGORY_MAP["Fired Up"] = "positive";

export function getStateCategory(state: BeliefState | string): StateCategory {
  return STATE_CATEGORY_MAP[state] ?? "neutral";
}

// ── V4.4: Categorised Cause Library ─────────────────────────────

export const POSITIVE_CAUSES: PositiveCause[] = [
  "Momentum", "Recent Progress", "Mission Progress", "Productive Session",
  "Strong Discipline", "Physical Energy", "Clear Direction",
];

export const NEUTRAL_CAUSES: NeutralCause[] = [
  "Reflection", "Learning", "Observation", "Processing",
  "Transition Period", "Exploration",
];

export const NEGATIVE_CAUSES: NegativeCause[] = [
  "Missing Connection", "Fear Of Failure", "Fatigue", "Lack Of Progress",
  "Rejection Memory", "Financial Stress", "Social Pressure",
  "Identity Conflict", "Uncertainty",
];

/** @deprecated Use getCausesForCategory instead */
export const BELIEF_CAUSES: BeliefCause[] = [
  ...NEGATIVE_CAUSES, "Other",
];

export function getCausesForCategory(category: StateCategory): BeliefCause[] {
  switch (category) {
    case "positive": return [...POSITIVE_CAUSES, "Other"];
    case "neutral":  return [...NEUTRAL_CAUSES, "Other"];
    case "negative": return [...NEGATIVE_CAUSES, "Other"];
    default:         return [...NEGATIVE_CAUSES, "Other"];
  }
}

// ── V4.4: Smart Thought Suggestions (State + Cause) ─────────────

const CONTEXTUAL_THOUGHTS: Record<string, string[]> = {
  // ── Positive: Focused ─────────────────────────
  "Focused|Momentum":          ["I am making progress", "I know what to do next", "I am building momentum", "I can handle this"],
  "Focused|Recent Progress":   ["Today's work is paying off", "I am moving in the right direction", "Each step counts"],
  "Focused|Mission Progress":  ["This is moving forward", "I am getting closer", "Today's work matters"],
  "Focused|Productive Session":["I am in the zone", "This session is going well", "I am producing quality work"],
  "Focused|Strong Discipline": ["My discipline is showing results", "I am staying on track", "I chose this and I am doing it"],
  "Focused|Physical Energy":   ["My body supports my mind right now", "I feel strong and alert", "Energy is high"],
  "Focused|Clear Direction":   ["I know exactly what to do", "The path is clear", "No confusion today"],

  // ── Positive: Motivated ───────────────────────
  "Motivated|Momentum":        ["I want to keep going", "I am fired up", "Nothing is stopping me today"],
  "Motivated|Recent Progress": ["I can see my progress", "I am proud of what I built", "Results are showing"],
  "Motivated|Mission Progress":["The mission is alive", "I believe in what I am building", "This matters"],
  "Motivated|Productive Session":["This session is powerful", "I am delivering", "High output today"],

  // ── Positive: Confident ───────────────────────
  "Confident|Momentum":        ["I trust my process", "I can do this", "I have earned this feeling"],
  "Confident|Recent Progress": ["My work speaks for itself", "I am capable", "I proved it to myself"],
  "Confident|Strong Discipline":["Discipline built this confidence", "I chose the hard path and it is working"],

  // ── Positive: Energized ───────────────────────
  "Energized|Physical Energy": ["I feel alive", "My body is ready", "Energy is high today"],
  "Energized|Momentum":        ["I have fuel and direction", "Let's go", "Ready to execute"],
  "Energized|Productive Session":["This energy is productive", "I am channeling this well"],

  // ── Positive: Calm ────────────────────────────
  "Calm|Clear Direction":      ["I am grounded", "I am in control", "Peace comes from clarity"],
  "Calm|Reflection":           ["I am processing well", "I feel balanced", "I can stay present"],
  "Calm|Strong Discipline":    ["Discipline brings calm", "I am handling this steadily"],

  // ── Neutral: Reflective ───────────────────────
  "Reflective|Reflection":     ["I am thinking things through", "Processing recent events", "Taking stock of where I am"],
  "Reflective|Learning":       ["I am learning from this", "There is a lesson here", "I am growing from this experience"],
  "Reflective|Observation":    ["I am observing my patterns", "Noticing without judging", "Watching how I respond"],

  // ── Neutral: Curious ──────────────────────────
  "Curious|Exploration":       ["I want to understand this better", "Something interesting is happening", "I am exploring"],
  "Curious|Learning":          ["I am absorbing new ideas", "This topic fascinates me", "I want to go deeper"],

  // ── Neutral: Recovering ───────────────────────
  "Recovering|Processing":     ["I am recharging", "I need this downtime", "Recovery is part of the process"],
  "Recovering|Transition Period":["Between phases right now", "Resetting before the next push", "This is temporary"],

  // ── Neutral: Uncertain ────────────────────────
  "Uncertain|Processing":      ["I am not sure what to do next", "I need more information", "Waiting for clarity"],
  "Uncertain|Transition Period":["Things are shifting", "I am between decisions", "The next step is unclear"],

  // ── Negative: Heavy ───────────────────────────
  "Heavy|Fatigue":             ["Everything feels harder today", "I need rest", "My energy is low"],
  "Heavy|Lack Of Progress":    ["I feel stuck", "Nothing is moving", "I am not getting anywhere"],
  "Heavy|Missing Connection":  ["I feel alone in this", "Nobody sees my effort", "I carry this alone"],
  "Heavy|Fear Of Failure":     ["I might not make it", "What if this is all for nothing", "The weight is real"],
  "Heavy|Identity Conflict":   ["I don't know who I am right now", "I feel disconnected from myself"],

  // ── Negative: Lonely ──────────────────────────
  "Lonely|Missing Connection": ["I miss her", "I feel disconnected", "I wish someone understood", "I wish someone was here"],
  "Lonely|Rejection Memory":   ["I was not enough", "They left", "I don't want to feel this again"],
  "Lonely|Social Pressure":    ["Everyone seems connected except me", "I don't fit in"],

  // ── Negative: Anxious ─────────────────────────
  "Anxious|Uncertainty":       ["What if this fails", "I don't know what happens next", "I might not be ready"],
  "Anxious|Fear Of Failure":   ["I might fail", "I am behind", "What if this doesn't work"],
  "Anxious|Financial Stress":  ["I am worried about money", "I don't know if I can afford this", "Financial pressure is mounting"],

  // ── Negative: Overwhelmed ─────────────────────
  "Overwhelmed|Lack Of Progress":["There is too much on my plate", "I can't keep up", "Everything is moving too fast"],
  "Overwhelmed|Fear Of Failure":["I am falling behind on everything", "I can't handle all of this"],
  "Overwhelmed|Fatigue":       ["I am exhausted and overloaded", "I need to slow down", "I cannot sustain this pace"],

  // ── Negative: Frustrated ──────────────────────
  "Frustrated|Lack Of Progress":["Nothing is working", "I keep hitting walls", "Why is this so hard"],
  "Frustrated|Identity Conflict":["I am not where I should be", "I expected more from myself"],
  "Frustrated|Social Pressure":["Others are ahead of me", "I am tired of comparing"],

  // ── Negative: Fatigued ────────────────────────
  "Fatigued|Fatigue":          ["I am tired", "I need more sleep", "My energy is gone", "I feel drained"],
  "Fatigued|Lack Of Progress": ["Too tired to keep pushing", "My body is saying stop"],
  "Fatigued|Missing Connection":["Loneliness is exhausting", "I have nothing left to give"],
};

/** Fallback suggestions per state (used when no cause match) */
const STATE_FALLBACK_THOUGHTS: Record<string, string[]> = {
  Focused:     ["I am making progress", "I know what to do next", "I can handle this"],
  Motivated:   ["I want to keep going", "Nothing is stopping me today", "I am fired up"],
  Confident:   ["I trust my process", "I can do this", "I am capable"],
  Energized:   ["I feel alive", "Energy is high today", "Ready to execute"],
  Calm:        ["I am grounded", "I feel balanced", "I am in control"],
  Reflective:  ["I am thinking things through", "Processing recent events"],
  Curious:     ["I want to understand this better", "Something interesting is happening"],
  Recovering:  ["I am recharging", "Recovery is part of the process"],
  Uncertain:   ["I am not sure what to do next", "Waiting for clarity"],
  Heavy:       ["Everything feels harder today", "I feel stuck"],
  Lonely:      ["I miss her", "I feel disconnected", "I wish someone was here"],
  Anxious:     ["I might fail", "I am behind", "What if this doesn't work"],
  Overwhelmed: ["There is too much on my plate", "I can't keep up"],
  Frustrated:  ["Nothing is working", "Why is this so hard"],
  Fatigued:    ["I am tired", "I need more sleep", "I feel drained"],
};

export function getThoughtSuggestions(state: BeliefState | string, cause: BeliefCause | string | null): string[] {
  if (cause) {
    const key = `${state}|${cause}`;
    if (CONTEXTUAL_THOUGHTS[key]) return CONTEXTUAL_THOUGHTS[key];
  }
  return STATE_FALLBACK_THOUGHTS[state] ?? ["I am processing", "Something is on my mind"];
}

/** @deprecated Use getThoughtSuggestions instead */
export const SAMPLE_RECURRING_THOUGHTS = [
  "I miss her", "I am behind", "I might fail",
  "Nobody understands me", "I am wasting my potential",
  "I cannot maintain consistency", "Other",
];
