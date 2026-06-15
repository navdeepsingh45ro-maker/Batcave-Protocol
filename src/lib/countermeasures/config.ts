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

// ── V4.5: Expanded category registry ─────────────────────────────

export const COUNTERMEASURE_CATEGORIES = {
  momentum:             "Momentum Protection",
  recovery:             "Recovery",
  connection:           "Connection",
  antiAvoidance:        "Anti-Avoidance",
  mentalReset:          "Mental Reset",
  digitalControl:       "Digital Control",
  builderWork:          "Builder Work",
  emotionalProcessing:  "Emotional Processing",
  physicalReset:        "Physical Reset",
  environmentShift:     "Environment Shift",
} as const;

// ── V4.5: Expected outcomes per category ─────────────────────────

export const EXPECTED_OUTCOMES: Record<string, string> = {
  "Mental Reset":          "Clarity Reclamation",
  "Recovery":              "Energy Restoration",
  "Momentum Protection":   "Flow Preservation",
  "Anti-Avoidance":        "Action Initiation",
  "Connection":            "Relational Alignment",
  "Digital Control":       "Attention Isolation",
  "Builder Work":          "Momentum Recovery",
  "Emotional Processing":  "Emotional Release",
  "Physical Reset":        "Somatic Regulation",
  "Environment Shift":     "Context Reset",
  "Sleep Protection":      "Circadian Defense",
  "Knowledge Intake":      "Cognitive Calibration",
  "Mission Simplification":"Action Clarification",
};

// ── V4.5: 30-Protocol Library ────────────────────────────────────

export const COUNTERMEASURES = [
  // ══════════════════════════════════════════════════════════════
  // MENTAL RESET (4 protocols)
  // ══════════════════════════════════════════════════════════════
  {
    id: "journal_dump",
    name: "Journal Dump",
    description: "Write thoughts without editing. Get it out of your head.",
    durationMinutes: 5,
    category: "Mental Reset",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["emotional_escape", "rumination", "isolation"],
    targetNeeds: ["Connection", "Relief", "Validation"],
    priority: 10
  },
  {
    id: "deep_breath_reset",
    name: "Deep Breath Reset",
    description: "4-7-8 controlled breathing protocol. Reset the nervous system.",
    durationMinutes: 3,
    category: "Mental Reset",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "emotional_escape", "avoidance"],
    targetNeeds: ["Relief", "Certainty"],
    priority: 15
  },
  {
    id: "brain_dump",
    name: "Brain Dump",
    description: "List every thought, worry, and task on paper. Empty the mental buffer.",
    durationMinutes: 10,
    category: "Mental Reset",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "avoidance", "perfectionism"],
    targetNeeds: ["Relief", "Certainty"],
    priority: 17
  },
  {
    id: "thought_audit",
    name: "Thought Audit",
    description: "Identify and challenge the top 3 thoughts driving current state.",
    durationMinutes: 7,
    category: "Mental Reset",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "emotional_escape"],
    targetNeeds: ["Validation", "Certainty"],
    priority: 19
  },

  // ══════════════════════════════════════════════════════════════
  // RECOVERY (5 protocols)
  // ══════════════════════════════════════════════════════════════
  {
    id: "recovery_walk",
    name: "Recovery Walk",
    description: "Leave current environment and walk. Change your physical state.",
    durationMinutes: 10,
    category: "Recovery",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "isolation", "digital_overstimulation"],
    targetNeeds: ["Rest", "Relief", "Stimulation"],
    priority: 20
  },
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
  {
    id: "stretch_session",
    name: "Stretch Session",
    description: "5-minute full-body stretch. Release physical tension.",
    durationMinutes: 5,
    category: "Recovery",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "rumination"],
    targetNeeds: ["Rest", "Relief"],
    priority: 14
  },
  {
    id: "hydration_protocol",
    name: "Hydration Protocol",
    description: "Drink water. Physical state check. Fuel the machine.",
    durationMinutes: 2,
    category: "Recovery",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue"],
    targetNeeds: ["Rest"],
    priority: 8
  },

  // ══════════════════════════════════════════════════════════════
  // MOMENTUM PROTECTION (3 protocols — unchanged)
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // ANTI-AVOIDANCE (2 protocols — unchanged)
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // CONNECTION (4 protocols — unchanged)
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // DIGITAL CONTROL (3 protocols)
  // ══════════════════════════════════════════════════════════════
  {
    id: "phone_exile",
    name: "Phone Exile",
    description: "Move the phone out of reach. Remove the immediate trigger.",
    durationMinutes: 2,
    category: "Digital Control",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["digital_overstimulation", "emotional_escape"],
    targetNeeds: ["Relief", "Certainty"],
    priority: 12
  },
  {
    id: "screen_boundary",
    name: "Screen Boundary",
    description: "Set a 30-minute screen-free zone. No exceptions.",
    durationMinutes: 5,
    category: "Digital Control",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["digital_overstimulation", "rumination"],
    targetNeeds: ["Relief", "Rest"],
    priority: 15
  },
  {
    id: "app_lockdown",
    name: "App Lockdown",
    description: "Close all non-essential apps. One task. One screen.",
    durationMinutes: 2,
    category: "Digital Control",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["digital_overstimulation", "avoidance"],
    targetNeeds: ["Certainty", "Progress"],
    priority: 11
  },

  // ══════════════════════════════════════════════════════════════
  // BUILDER WORK (1 protocol — unchanged)
  // ══════════════════════════════════════════════════════════════
  {
    id: "builder_sprint",
    name: "Builder Sprint",
    description: "20-minute focused work block. Ship something.",
    durationMinutes: 20,
    category: "Builder Work",
    activatesIdentity: "Builder",
    recommendedMissionRedirect: "Primary Mission",
    targetThreatIds: ["avoidance", "perfectionism"],
    targetNeeds: ["Progress", "Certainty"],
    priority: 25
  },

  // ══════════════════════════════════════════════════════════════
  // EMOTIONAL PROCESSING (3 protocols — NEW)
  // ══════════════════════════════════════════════════════════════
  {
    id: "emotional_processing",
    name: "Emotional Processing",
    description: "Sit with the feeling. Name it. Let it pass without acting on it.",
    durationMinutes: 10,
    category: "Emotional Processing",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["emotional_escape", "rumination"],
    targetNeeds: ["Validation", "Relief"],
    priority: 12
  },
  {
    id: "reflection_session",
    name: "Reflection Session",
    description: "Ask: What triggered this? What do I actually need right now?",
    durationMinutes: 7,
    category: "Emotional Processing",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "emotional_escape", "isolation"],
    targetNeeds: ["Validation", "Certainty"],
    priority: 14
  },
  {
    id: "acceptance_exercise",
    name: "Acceptance Exercise",
    description: "Accept the current state without resistance. Release the need to fix it now.",
    durationMinutes: 5,
    category: "Emotional Processing",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "perfectionism"],
    targetNeeds: ["Relief", "Validation"],
    priority: 16
  },

  // ══════════════════════════════════════════════════════════════
  // PHYSICAL RESET (3 protocols — NEW)
  // ══════════════════════════════════════════════════════════════
  {
    id: "movement_burst",
    name: "Movement Burst",
    description: "30 seconds of high-intensity movement. Pushups, jumping jacks, anything.",
    durationMinutes: 2,
    category: "Physical Reset",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "avoidance", "rumination"],
    targetNeeds: ["Stimulation", "Relief"],
    priority: 9
  },
  {
    id: "cold_exposure",
    name: "Cold Exposure",
    description: "Cold water on face or cold shower. Shock the system back online.",
    durationMinutes: 3,
    category: "Physical Reset",
    activatesIdentity: "Striker",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["fatigue", "emotional_escape", "rumination"],
    targetNeeds: ["Stimulation", "Relief"],
    priority: 13
  },
  {
    id: "walking_meditation",
    name: "Walking Meditation",
    description: "Walk slowly with full attention on each step. No phone.",
    durationMinutes: 10,
    category: "Physical Reset",
    activatesIdentity: "Guardian",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "fatigue"],
    targetNeeds: ["Relief", "Rest"],
    priority: 18
  },

  // ══════════════════════════════════════════════════════════════
  // ENVIRONMENT SHIFT (2 protocols — NEW)
  // ══════════════════════════════════════════════════════════════
  {
    id: "change_location",
    name: "Change Location",
    description: "Move to a different room or space. Break the environmental loop.",
    durationMinutes: 3,
    category: "Environment Shift",
    activatesIdentity: "King",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["rumination", "digital_overstimulation", "avoidance"],
    targetNeeds: ["Stimulation", "Relief"],
    priority: 10
  },
  {
    id: "clean_space",
    name: "Clean Space",
    description: "Spend 5 minutes cleaning your immediate workspace. Order creates clarity.",
    durationMinutes: 5,
    category: "Environment Shift",
    activatesIdentity: "Builder",
    recommendedMissionRedirect: "Recovery Mission",
    targetThreatIds: ["avoidance", "perfectionism"],
    targetNeeds: ["Progress", "Certainty"],
    priority: 15
  },
] as const satisfies readonly CountermeasureDefinition[];

// ── V4.5: Cause → Countermeasure Affinity (expanded for 30 protocols) ──

export const CAUSE_COUNTERMEASURE_AFFINITY: Record<string, string[]> = {
  // Negative causes
  "Missing Connection": ["connection_ping", "call_friend", "family_contact", "social_exposure", "journal_dump", "emotional_processing"],
  "Fear Of Failure":    ["one_step_mission", "builder_sprint", "task_breakdown", "deep_breath_reset", "acceptance_exercise", "thought_audit"],
  "Fatigue":            ["recovery_walk", "sleep_reset", "low_intensity_day", "hydration_protocol", "stretch_session", "deep_breath_reset"],
  "Lack Of Progress":   ["builder_sprint", "one_step_mission", "task_breakdown", "deep_work_sprint", "clean_space"],
  "Rejection Memory":   ["journal_dump", "connection_ping", "deep_breath_reset", "emotional_processing", "reflection_session"],
  "Financial Stress":   ["builder_sprint", "one_step_mission", "journal_dump", "brain_dump", "task_breakdown"],
  "Social Pressure":    ["journal_dump", "deep_breath_reset", "phone_exile", "acceptance_exercise", "reflection_session"],
  "Identity Conflict":  ["journal_dump", "one_step_mission", "builder_sprint", "thought_audit", "reflection_session"],
  "Uncertainty":        ["one_step_mission", "deep_breath_reset", "task_breakdown", "brain_dump", "reflection_session"],
  // Positive causes → momentum actions
  "Momentum":           ["continue_current_task", "deep_work_sprint", "mission_advancement"],
  "Recent Progress":    ["deep_work_sprint", "continue_current_task", "mission_advancement"],
  "Mission Progress":   ["mission_advancement", "continue_current_task", "deep_work_sprint"],
  "Productive Session": ["continue_current_task", "deep_work_sprint"],
  "Strong Discipline":  ["mission_advancement", "deep_work_sprint", "continue_current_task"],
  "Physical Energy":    ["deep_work_sprint", "mission_advancement", "movement_burst"],
  "Clear Direction":    ["continue_current_task", "mission_advancement", "deep_work_sprint"],
  // Neutral causes
  "Reflection":         ["journal_dump", "reflection_session"],
  "Learning":           ["builder_sprint", "deep_work_sprint"],
  "Observation":        ["journal_dump", "walking_meditation"],
  "Processing":         ["deep_breath_reset", "journal_dump", "emotional_processing"],
  "Transition Period":  ["one_step_mission", "change_location"],
  "Exploration":        ["deep_work_sprint", "change_location"],
  "Other":              [],
};

// ── Momentum countermeasure IDs (for quick filtering) ────────────
export const MOMENTUM_COUNTERMEASURE_IDS = [
  "continue_current_task", "deep_work_sprint", "mission_advancement",
];
