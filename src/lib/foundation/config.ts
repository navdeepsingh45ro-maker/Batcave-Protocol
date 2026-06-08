import type { ConstraintDefinition, FoundationDefinition, FoundationType, Identity } from "./types";

export const IDENTITIES = ["King", "Builder", "Striker", "Guardian"] as const satisfies readonly Identity[];

export const FOUNDATION_DEFINITIONS = [
  {
    type: "Striker Work",
    identity: "Striker",
    minimumViableWin: "Any honest body-forward action counts.",
    subtypes: ["Full Session", "Ball Work", "Sprint Work", "Match", "Mobility", "Recovery Walk"]
  },
  {
    type: "Builder Work",
    identity: "Builder",
    minimumViableWin: "Twenty focused minutes counts.",
    subtypes: ["BudgetBuddy", "Coding", "Job Search", "Learning", "Other"]
  },
  {
    type: "Mental Reset",
    identity: "King",
    minimumViableWin: "One deliberate reset counts.",
    subtypes: ["Meditation", "Simran", "Breathing", "Reflection", "Quiet Walk"]
  },
  {
    type: "Knowledge Intake",
    identity: "Builder",
    minimumViableWin: "One useful input counts.",
    subtypes: ["Book", "Course", "Research", "Useful Article", "Podcast"]
  },
  {
    type: "Sleep Protection",
    identity: "Guardian",
    minimumViableWin: "Protecting the routine counts, even after a rough day.",
    subtypes: ["Slept before target", "Protected sleep routine", "Recovery protocol followed"]
  }
] as const satisfies readonly FoundationDefinition[];

export const NO_PORN_CONSTRAINT = {
  type: "No Porn",
  identity: "Guardian",
  subtypes: ["Yes", "No"]
} as const satisfies ConstraintDefinition;

export const FOUNDATION_TYPES = FOUNDATION_DEFINITIONS.map((definition) => definition.type) as FoundationType[];

export const FOUNDATION_IDENTITY_MAP = FOUNDATION_DEFINITIONS.reduce(
  (accumulator, definition) => ({
    ...accumulator,
    [definition.type]: definition.identity
  }),
  {} as Record<FoundationType, Identity>
);

export const TOTAL_FOUNDATIONS = FOUNDATION_TYPES.length;

// Default activity seeds to support customizable activities per foundation.
export const DEFAULT_ACTIVITY_SEEDS: Record<FoundationType, readonly string[]> = FOUNDATION_DEFINITIONS.reduce(
  (accumulator, def) => ({
    ...accumulator,
    [def.type]: def.subtypes
  }),
  {} as Record<FoundationType, readonly string[]>
);
