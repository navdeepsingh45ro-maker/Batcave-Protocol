import type {
  CountermeasureDefinition,
  NeedDefinition,
  ThreatDefinition,
  ThreatNeedMapping,
  ThreatSeverity
} from "./types";

export const SEVERITY_WEIGHT: Record<ThreatSeverity, number> = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20,
  CRITICAL: 30
};

export const THREATS = [
  {
    id: "emotional_escape",
    name: "Emotional Escape",
    description: "A pull to leave discomfort quickly through numbing, scrolling, or sexual release.",
    severity: "HIGH",
    associatedStates: ["Lonely", "Heavy", "Overwhelmed", "Anxious"]
  },
  {
    id: "rumination",
    name: "Rumination",
    description: "Repeated thought loops that consume attention and intensify emotional load.",
    severity: "HIGH",
    associatedStates: ["Heavy", "Uncertain", "Frustrated", "Lonely", "Anxious"]
  },
  {
    id: "isolation",
    name: "Isolation",
    description: "Withdrawal from people or environment when connection would reduce risk.",
    severity: "MEDIUM",
    associatedStates: ["Lonely", "Heavy", "Uncertain"]
  },
  {
    id: "fatigue",
    name: "Fatigue",
    description: "Low physical or mental energy increasing impulsive or avoidant choices.",
    severity: "MEDIUM",
    associatedStates: ["Fatigued", "Heavy", "Overwhelmed"]
  },
  {
    id: "perfectionism",
    name: "Perfectionism",
    description: "All-or-nothing pressure that blocks minimum viable action.",
    severity: "MEDIUM",
    associatedStates: ["Uncertain", "Frustrated", "Overwhelmed", "Anxious"]
  },
  {
    id: "avoidance",
    name: "Avoidance",
    description: "A drift away from conscious action because the next step feels too loaded.",
    severity: "HIGH",
    associatedStates: ["Overwhelmed", "Uncertain", "Fatigued", "Anxious"]
  },
  {
    id: "digital_overstimulation",
    name: "Digital Overstimulation",
    description: "A pull toward high-stimulation digital input that fragments attention.",
    severity: "MEDIUM",
    associatedStates: ["Frustrated", "Curious", "Recovering"]
  }
] as const satisfies readonly ThreatDefinition[];

export const NEEDS = [
  { id: "connection",   name: "Connection",   description: "Contact, belonging, or being witnessed." },
  { id: "rest",         name: "Rest",         description: "Reduced load, sleep protection, or recovery." },
  { id: "validation",   name: "Validation",   description: "Acknowledgment that the emotion is real and workable." },
  { id: "certainty",    name: "Certainty",    description: "A clear next step that removes ambiguity." },
  { id: "progress",     name: "Progress",     description: "A small visible win that restores agency." },
  { id: "relief",       name: "Relief",       description: "A non-destructive release of emotional pressure." },
  { id: "stimulation",  name: "Stimulation",  description: "Healthy novelty, movement, or intensity." },
  { id: "momentum",     name: "Momentum",     description: "Continuation of productive flow and direction." },
] as const satisfies readonly NeedDefinition[];

export const THREAT_NEED_MAPPINGS = [
  { threatId: "emotional_escape",       need: "Connection",  priority: 10 },
  { threatId: "emotional_escape",       need: "Relief",      priority: 20 },
  { threatId: "emotional_escape",       need: "Validation",  priority: 30 },
  { threatId: "rumination",             need: "Relief",      priority: 10 },
  { threatId: "rumination",             need: "Certainty",   priority: 20 },
  { threatId: "rumination",             need: "Validation",  priority: 30 },
  { threatId: "isolation",              need: "Connection",  priority: 10 },
  { threatId: "isolation",              need: "Relief",      priority: 20 },
  { threatId: "fatigue",                need: "Rest",        priority: 10 },
  { threatId: "fatigue",                need: "Relief",      priority: 20 },
  { threatId: "perfectionism",          need: "Progress",    priority: 10 },
  { threatId: "perfectionism",          need: "Certainty",   priority: 20 },
  { threatId: "avoidance",              need: "Progress",    priority: 10 },
  { threatId: "avoidance",              need: "Certainty",   priority: 20 },
  { threatId: "digital_overstimulation",need: "Stimulation", priority: 10 },
  { threatId: "digital_overstimulation",need: "Relief",      priority: 20 },
] as const satisfies readonly ThreatNeedMapping[];

// ── V4.4: Categorised countermeasure library ─────────────────────

export const COUNTERMEASURE_CATEGORIES = {
  momentum:       "Momentum Protection",
  recovery:       "Recovery",
  connection:     "Connection",
  antiAvoidance:  "Anti-Avoidance",
  mentalReset:    "Mental Reset",
  digitalControl: "Digital Control",
} as const;

export const COUNTERMEASURES = [
  // ── Existing (kept for backward compat) ────────────────
  {
    id: "journal_dump",
    name: "Journal Dump",
    description: "Write thoughts without editing.",
    durationMinutes: 5,
    category: "Mental Reset",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["emotional_escape", "rumination", "isolation"],
    targetNeeds: ["Connection", "Relief", "Validation"],
    priority: 10
  },
  {
    id: "recovery_walk",
    name: "Recovery Walk",
    description: "Leave current environment and walk.",
    durationMinutes: 10,
    category: "Recovery",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "isolation", "digital_overstimulation"],
    targetNeeds: ["Rest", "Relief", "Stimulation"],
    priority: 20
  },
  {
    id: "deep_breath_reset",
    name: "Deep Breath Reset",
    description: "Controlled breathing protocol.",
    durationMinutes: 3,
    category: "Mental Reset",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "emotional_escape", "avoidance"],
    targetNeeds: ["Relief", "Certainty"],
    priority: 15
  },
  {
    id: "builder_sprint",
    name: "Builder Sprint",
    description: "20 minute focused work block.",
    durationMinutes: 20,
    category: "Builder Work",
    activatesIdentity: "Builder",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["avoidance", "perfectionism"],
    targetNeeds: ["Progress", "Certainty"],
    priority: 25
  },
  {
    id: "phone_exile",
    name: "Phone Exile",
    description: "Move the phone out of reach and remove the immediate trigger.",
    durationMinutes: 2,
    category: "Digital Control",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["digital_overstimulation", "emotional_escape"],
    targetNeeds: ["Relief", "Certainty"],
    priority: 12
  },
  {
    id: "one_step_mission",
    name: "One Step Mission",
    description: "Choose one tiny action and ignore secondary goals.",
    durationMinutes: 5,
    category: "Anti-Avoidance",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["avoidance", "perfectionism", "fatigue"],
    targetNeeds: ["Progress", "Certainty"],
    priority: 18
  },
  {
    id: "connection_ping",
    name: "Connection Ping",
    description: "Send one honest message or make one quick call.",
    durationMinutes: 5,
    category: "Connection",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["isolation", "emotional_escape"],
    targetNeeds: ["Connection", "Validation"],
    priority: 8
  },

  // ── V4.4: New momentum countermeasures ─────────────────
  {
    id: "continue_current_task",
    name: "Continue Current Task",
    description: "Stay on the current task. Protect the flow.",
    durationMinutes: 30,
    category: "Momentum Protection",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: [],
    targetNeeds: ["Momentum", "Progress"],
    priority: 5
  },
  {
    id: "deep_work_sprint",
    name: "Deep Work Sprint",
    description: "25-minute focused deep work block with no distractions.",
    durationMinutes: 25,
    category: "Momentum Protection",
    activatesIdentity: "Builder",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: [],
    targetNeeds: ["Momentum", "Progress"],
    priority: 6
  },
  {
    id: "mission_advancement",
    name: "Mission Advancement",
    description: "Push the primary mission forward while momentum is high.",
    durationMinutes: 45,
    category: "Momentum Protection",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: [],
    targetNeeds: ["Momentum", "Progress"],
    priority: 7
  },

  // ── V4.4: New connection countermeasures ────────────────
  {
    id: "call_friend",
    name: "Call Friend",
    description: "Reach out to someone meaningful.",
    durationMinutes: 10,
    category: "Connection",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["isolation", "emotional_escape"],
    targetNeeds: ["Connection", "Validation"],
    priority: 9
  },
  {
    id: "family_contact",
    name: "Family Contact",
    description: "Connect with family. One message or call.",
    durationMinutes: 10,
    category: "Connection",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["isolation"],
    targetNeeds: ["Connection", "Validation"],
    priority: 11
  },
  {
    id: "social_exposure",
    name: "Social Exposure",
    description: "Low-pressure social contact. Be around people.",
    durationMinutes: 15,
    category: "Connection",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["isolation", "emotional_escape"],
    targetNeeds: ["Connection", "Stimulation"],
    priority: 14
  },

  // ── V4.4: New recovery countermeasures ─────────────────
  {
    id: "sleep_reset",
    name: "Sleep Reset",
    description: "End the day early. Protect sleep cycle.",
    durationMinutes: 5,
    category: "Recovery",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue"],
    targetNeeds: ["Rest"],
    priority: 10
  },
  {
    id: "low_intensity_day",
    name: "Low Intensity Day",
    description: "Reduce expectations. Maintenance mode only.",
    durationMinutes: 5,
    category: "Recovery",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "avoidance"],
    targetNeeds: ["Rest", "Relief"],
    priority: 16
  },

  // ── V4.4: New anti-avoidance ───────────────────────────
  {
    id: "task_breakdown",
    name: "Task Breakdown",
    description: "Break the overwhelming task into 3 tiny steps.",
    durationMinutes: 5,
    category: "Anti-Avoidance",
    activatesIdentity: "Builder",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["avoidance", "perfectionism"],
    targetNeeds: ["Progress", "Certainty"],
    priority: 13
  },
] as const satisfies readonly CountermeasureDefinition[];

// ── V4.4: Cause → Countermeasure Affinity (expanded) ─────────────
export const CAUSE_COUNTERMEASURE_AFFINITY: Record<string, string[]> = {
  // Negative causes
  "Missing Connection": ["connection_ping", "call_friend", "family_contact", "social_exposure", "journal_dump"],
  "Fear Of Failure":    ["one_step_mission", "builder_sprint", "task_breakdown", "deep_breath_reset"],
  "Fatigue":            ["recovery_walk", "sleep_reset", "low_intensity_day", "deep_breath_reset"],
  "Lack Of Progress":   ["builder_sprint", "one_step_mission", "task_breakdown", "deep_work_sprint"],
  "Rejection Memory":   ["journal_dump", "connection_ping", "deep_breath_reset"],
  "Financial Stress":   ["builder_sprint", "one_step_mission", "journal_dump"],
  "Social Pressure":    ["journal_dump", "deep_breath_reset", "phone_exile"],
  "Identity Conflict":  ["journal_dump", "one_step_mission", "builder_sprint"],
  "Uncertainty":        ["one_step_mission", "deep_breath_reset", "task_breakdown"],
  // Positive causes → momentum actions
  "Momentum":           ["continue_current_task", "deep_work_sprint", "mission_advancement"],
  "Recent Progress":    ["deep_work_sprint", "continue_current_task", "mission_advancement"],
  "Mission Progress":   ["mission_advancement", "continue_current_task", "deep_work_sprint"],
  "Productive Session": ["continue_current_task", "deep_work_sprint"],
  "Strong Discipline":  ["mission_advancement", "deep_work_sprint", "continue_current_task"],
  "Physical Energy":    ["deep_work_sprint", "mission_advancement"],
  "Clear Direction":    ["continue_current_task", "mission_advancement", "deep_work_sprint"],
  // Neutral causes
  "Reflection":         ["journal_dump"],
  "Learning":           ["builder_sprint", "deep_work_sprint"],
  "Observation":        ["journal_dump"],
  "Processing":         ["deep_breath_reset", "journal_dump"],
  "Transition Period":  ["one_step_mission"],
  "Exploration":        ["deep_work_sprint"],
  "Other":              [],
};

// ── V4.4: Momentum countermeasure IDs (for quick filtering) ──────
export const MOMENTUM_COUNTERMEASURE_IDS = [
  "continue_current_task", "deep_work_sprint", "mission_advancement",
];
