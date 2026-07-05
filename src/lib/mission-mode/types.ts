import type { ISODate, ISODateTime, FoundationType } from "../foundation/types";

// ── Mode System ─────────────────────────────────────────────────

export type BatcaveMode = "normal" | "launch" | "tournament" | "exam" | "recovery";

// ── Mission Configuration (Reusable Framework) ──────────────────

export interface MissionPriority {
  rank: number;
  label: string;
  foundationTypes: FoundationType[];
  description: string;
}

export interface MissionScoreCategory {
  id: string;
  label: string;
  maxPoints: number;
  /** Which existing foundation completions count toward this category */
  foundationTypes: FoundationType[];
  /** Optional: specific subtypes that qualify (if empty, any subtype counts) */
  qualifyingSubtypes?: string[];
}

export interface MissionScoringWeights {
  maxScore: number;
  categories: MissionScoreCategory[];
}

export interface MissionRatingThreshold {
  minScore: number;
  label: string;
  color: string;
}

export interface MissionCardConfig {
  id: string;
  label: string;
  icon: string;
  foundationTypes: FoundationType[];
  description: string;
}

export interface MissionConfig {
  id: string;
  name: string;
  objective: string;
  mode: BatcaveMode;
  startDate: ISODate;
  endDate: ISODate;
  priorities: MissionPriority[];
  scoringWeights: MissionScoringWeights;
  cards: MissionCardConfig[];
  ratings: MissionRatingThreshold[];
  shutdownQuestions: string[];
  // Editable properties:
  customName?: string;
  customObjective?: string;
  customEndDate?: ISODate;
  missionNotes?: string;
}

// ── Mission Day Tracking ────────────────────────────────────────

export type MissionCardStatus = "pending" | "in-progress" | "completed";

export interface MissionSubtask {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: ISODateTime;
  durationMinutes?: number;
}

export interface MissionCardState {
  cardId: string;
  status: MissionCardStatus;
  score: number;
  maxScore: number;
  completedAt?: ISODateTime;
  subtasks: MissionSubtask[];
}

export interface ShutdownReflection {
  builderForward: boolean;
  athleteForward: boolean;
  anchorComplete: boolean;
  tomorrowFirstTask: string;
  timestamp: ISODateTime;
}

export interface MomentumFlags {
  builderCompleted: boolean;
  athleteCompleted: boolean;
  consecutiveBuilderMisses: number;
  consecutiveAthleteMisses: number;
  momentumRisk: boolean;
  riskReason?: string;
}

export interface MissionDayLog {
  id: string;
  missionId: string;
  date: ISODate;
  score: number;
  rating: string;
  cardStates: MissionCardState[];
  shutdownReflection?: ShutdownReflection;
  momentumFlags: MomentumFlags;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  // Day-specific editable features:
  builderGoal?: string;
  athleteLocation?: "Home" | "Park";
  athleteDrills?: { id: string; name: string; completed: boolean }[];
  anchorTasks?: { id: string; name: string; completed: boolean }[];
  dayNotes?: string;
  manualStatuses?: Record<string, MissionCardStatus>;
}

// ── Mission Stability Metrics ───────────────────────────────────

export type MomentumTrend = "rising" | "stable" | "falling";

export interface MissionStability {
  missionId: string;
  stabilityPercent: number;
  rollingCompletionPercent: number;
  consistencyIndex: number;
  momentumTrend: MomentumTrend;
}

// ── Mission Archive ─────────────────────────────────────────────

export type MissionOutcome = "completed" | "abandoned" | "extended";

export interface MissionArchiveEntry {
  id: string;
  config: MissionConfig;
  dailyLogs: MissionDayLog[];
  finalScore: number;
  averageDailyScore: number;
  stability: MissionStability;
  lessonsLearned: string;
  outcome: MissionOutcome;
  archivedAt: ISODateTime;
}

// ── Active Mode State (persisted) ───────────────────────────────

export interface ActiveModeState {
  mode: BatcaveMode;
  activeMission: MissionConfig | null;
  activatedAt: ISODateTime;
}
