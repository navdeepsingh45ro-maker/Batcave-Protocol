import type { MissionConfig, MissionRatingThreshold } from "./types";
import type { ISODate } from "../foundation/types";

// ── Mission Rating Thresholds ───────────────────────────────────

export const MISSION_RATINGS: MissionRatingThreshold[] = [
  { minScore: 90, label: "Excellent", color: "emerald" },
  { minScore: 75, label: "Good", color: "blue" },
  { minScore: 60, label: "Recover Tomorrow", color: "amber" },
  { minScore: 0, label: "Diagnose the System", color: "red" },
];

// ── Momentum System v1.0 — Launch Week ──────────────────────────

export const MOMENTUM_SYSTEM_V1: MissionConfig = {
  id: "momentum-system-v1",
  name: "Momentum System v1.0",
  objective: "Launch BudgetBuddy V1",
  mode: "launch",
  startDate: "2026-07-06" as ISODate,
  endDate: "2026-07-09" as ISODate,

  priorities: [
    {
      rank: 1,
      label: "Builder",
      foundationTypes: ["Builder Work"],
      description: "Ship BudgetBuddy Version 1. This is the primary mission objective.",
    },
    {
      rank: 2,
      label: "Athlete",
      foundationTypes: ["Striker Work"],
      description: "Maintain physical momentum. Movement protects cognition.",
    },
    {
      rank: 3,
      label: "Anchor",
      foundationTypes: ["Mental Reset"],
      description: "One deliberate reset per day. Minimum effective discipline.",
    },
  ],

  scoringWeights: {
    maxScore: 100,
    categories: [
      {
        id: "anchor",
        label: "Anchor",
        maxPoints: 20,
        foundationTypes: ["Mental Reset"],
      },
      {
        id: "athlete",
        label: "Athlete",
        maxPoints: 30,
        foundationTypes: ["Striker Work"],
      },
      {
        id: "builder",
        label: "Builder",
        maxPoints: 30,
        foundationTypes: ["Builder Work"],
      },
      {
        id: "workout",
        label: "Workout",
        maxPoints: 10,
        foundationTypes: ["Striker Work"],
        qualifyingSubtypes: ["Full Session", "Ball Work", "Sprint Work", "Match"],
      },
      {
        id: "sleep",
        label: "Sleep",
        maxPoints: 10,
        foundationTypes: ["Sleep Protection"],
      },
    ],
  },

  cards: [
    {
      id: "builder",
      label: "Builder",
      icon: "⚡",
      foundationTypes: ["Builder Work"],
      description: "Ship BudgetBuddy V1",
    },
    {
      id: "athlete",
      label: "Athlete",
      icon: "◆",
      foundationTypes: ["Striker Work"],
      description: "Movement & physical momentum",
    },
    {
      id: "anchor",
      label: "Anchor",
      icon: "◈",
      foundationTypes: ["Mental Reset"],
      description: "Deliberate daily reset",
    },
  ],

  ratings: MISSION_RATINGS,

  shutdownQuestions: [
    "Did I move Builder forward?",
    "Did I move Athlete forward?",
    "Did I complete my Anchor?",
    "What is tomorrow's first Builder task?",
  ],
};

// ── Available Mission Templates ─────────────────────────────────
// Future missions can be added here as configuration objects.

export const AVAILABLE_MISSIONS: MissionConfig[] = [
  MOMENTUM_SYSTEM_V1,
];

/**
 * Get the rating label for a given score.
 */
export function getMissionRating(score: number, ratings: MissionRatingThreshold[] = MISSION_RATINGS): MissionRatingThreshold {
  for (const rating of ratings) {
    if (score >= rating.minScore) {
      return rating;
    }
  }
  return ratings[ratings.length - 1];
}
