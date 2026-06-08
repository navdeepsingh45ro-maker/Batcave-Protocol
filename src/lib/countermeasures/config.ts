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
    associatedStates: ["Lonely", "Heavy", "Overwhelmed", "Restless"]
  },
  {
    id: "rumination",
    name: "Rumination",
    description: "Repeated thought loops that consume attention and intensify emotional load.",
    severity: "HIGH",
    associatedStates: ["Heavy", "Uncertain", "Frustrated", "Lonely"]
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
    associatedStates: ["Uncertain", "Frustrated", "Overwhelmed"]
  },
  {
    id: "avoidance",
    name: "Avoidance",
    description: "A drift away from conscious action because the next step feels too loaded.",
    severity: "HIGH",
    associatedStates: ["Overwhelmed", "Uncertain", "Fatigued", "Restless"]
  },
  {
    id: "digital_overstimulation",
    name: "Digital Overstimulation",
    description: "A pull toward high-stimulation digital input that fragments attention.",
    severity: "MEDIUM",
    associatedStates: ["Restless", "Frustrated", "Fired Up", "Curious"]
  }
] as const satisfies readonly ThreatDefinition[];

export const NEEDS = [
  { id: "connection", name: "Connection", description: "Contact, belonging, or being witnessed." },
  { id: "rest", name: "Rest", description: "Reduced load, sleep protection, or recovery." },
  { id: "validation", name: "Validation", description: "Acknowledgment that the emotion is real and workable." },
  { id: "certainty", name: "Certainty", description: "A clear next step that removes ambiguity." },
  { id: "progress", name: "Progress", description: "A small visible win that restores agency." },
  { id: "relief", name: "Relief", description: "A non-destructive release of emotional pressure." },
  { id: "stimulation", name: "Stimulation", description: "Healthy novelty, movement, or intensity." }
] as const satisfies readonly NeedDefinition[];

export const THREAT_NEED_MAPPINGS = [
  { threatId: "emotional_escape", need: "Connection", priority: 10 },
  { threatId: "emotional_escape", need: "Relief", priority: 20 },
  { threatId: "emotional_escape", need: "Validation", priority: 30 },
  { threatId: "rumination", need: "Relief", priority: 10 },
  { threatId: "rumination", need: "Certainty", priority: 20 },
  { threatId: "rumination", need: "Validation", priority: 30 },
  { threatId: "isolation", need: "Connection", priority: 10 },
  { threatId: "isolation", need: "Relief", priority: 20 },
  { threatId: "fatigue", need: "Rest", priority: 10 },
  { threatId: "fatigue", need: "Relief", priority: 20 },
  { threatId: "perfectionism", need: "Progress", priority: 10 },
  { threatId: "perfectionism", need: "Certainty", priority: 20 },
  { threatId: "avoidance", need: "Progress", priority: 10 },
  { threatId: "avoidance", need: "Certainty", priority: 20 },
  { threatId: "digital_overstimulation", need: "Stimulation", priority: 10 },
  { threatId: "digital_overstimulation", need: "Relief", priority: 20 }
] as const satisfies readonly ThreatNeedMapping[];

export const COUNTERMEASURES = [
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
    category: "Striker Work",
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
    category: "Mission Simplification",
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
  }
] as const satisfies readonly CountermeasureDefinition[];
