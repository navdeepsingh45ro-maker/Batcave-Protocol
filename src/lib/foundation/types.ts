export type Identity = "King" | "Builder" | "Striker" | "Guardian";

export type FoundationType =
  | "Striker Work"
  | "Builder Work"
  | "Mental Reset"
  | "Knowledge Intake"
  | "Sleep Protection";

export type ConstraintType = "No Porn";

export type StrikerSubtype = "Full Session" | "Ball Work" | "Sprint Work" | "Match" | "Mobility" | "Recovery Walk";
export type BuilderSubtype = "BudgetBuddy" | "Coding" | "Job Search" | "Learning" | "Other";
export type MentalResetSubtype = "Meditation" | "Simran" | "Breathing" | "Reflection" | "Quiet Walk";
export type KnowledgeIntakeSubtype = "Book" | "Course" | "Research" | "Useful Article" | "Podcast";
export type SleepProtectionSubtype = "Slept before target" | "Protected sleep routine" | "Recovery protocol followed";
export type NoPornSubtype = "Yes" | "No";

export type FoundationSubtype =
  | StrikerSubtype
  | BuilderSubtype
  | MentalResetSubtype
  | KnowledgeIntakeSubtype
  | SleepProtectionSubtype;

export type ConstraintSubtype = NoPornSubtype;

export type ISODate = `${number}-${number}-${number}`;
export type ISODateTime = string;

export interface FoundationDefinition {
  type: FoundationType;
  identity: Identity;
  minimumViableWin: string;
  subtypes: readonly FoundationSubtype[];
}

export interface ConstraintDefinition {
  type: ConstraintType;
  identity: Identity;
  subtypes: readonly ConstraintSubtype[];
}

export interface DailyFoundationLog {
  id: string;
  userId?: string;
  date: ISODate;
  foundation: FoundationType;
  subtype: FoundationSubtype;
  completed: boolean;
  durationMinutes?: number;
  notes?: string;
  source?: "quick-checkin" | "manual-edit" | "import" | "system";
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface FoundationActivityLog {
  id: string;
  userId?: string;
  date: ISODate;
  foundation: FoundationType;
  subtype: FoundationSubtype;
  durationMinutes?: number;
  notes?: string;
  source?: "quick-checkin" | "manual-edit" | "import" | "system";
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DailyFoundationActivitySummary {
  date: ISODate;
  foundation: FoundationType;
  completed: boolean;
  activityCount: number;
  totalDurationMinutes: number;
  activities: FoundationActivityLog[];
}

export interface DailyConstraintLog {
  id: string;
  userId?: string;
  date: ISODate;
  constraint: ConstraintType;
  subtype: ConstraintSubtype;
  completed: boolean;
  notes?: string;
  source?: "quick-checkin" | "manual-edit" | "import" | "system";
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DailyFoundationScore {
  date: ISODate;
  completedCount: number;
  totalFoundations: number;
  scorePercent: number;
  completedFoundations: FoundationType[];
  missedFoundations: FoundationType[];
  activitySummaries?: DailyFoundationActivitySummary[];
}

export interface WeeklyFoundationScore {
  startDate: ISODate;
  endDate: ISODate;
  dailyScores: DailyFoundationScore[];
  averageScorePercent: number;
}

export interface IdentityActivityScore {
  identity: Identity;
  startDate: ISODate;
  endDate: ISODate;
  activeDays: number;
  totalDays: number;
  scorePercent: number;
}

export interface ConsistencyScore {
  currentStreak: number;
  bestStreak: number;
  completionFrequencyPercent: number;
}

export interface FoundationAnalytics {
  completedToday: FoundationType[];
  missedToday: FoundationType[];
  weeklyScore: WeeklyFoundationScore;
  mostCommonSubtype?: {
    foundation: FoundationType;
    subtype: FoundationSubtype;
    count: number;
  };
  consistency: ConsistencyScore;
  identityParticipation: IdentityActivityScore[];
}

export interface CreateFoundationLogInput {
  date: ISODate;
  foundation: FoundationType;
  subtype: FoundationSubtype;
  completed?: boolean;
  durationMinutes?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateFoundationActivityInput {
  date: ISODate;
  foundation: FoundationType;
  subtype: FoundationSubtype;
  durationMinutes?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateFoundationActivityBatchInput {
  date: ISODate;
  foundation: FoundationType;
  activities: Array<{
    subtype: FoundationSubtype;
    durationMinutes?: number;
    notes?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface CreateConstraintLogInput {
  date: ISODate;
  constraint: ConstraintType;
  subtype: ConstraintSubtype;
  completed?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// New: Custom Activity types (backwards-compatible additions)
export interface ActivityDefinition {
  id: string;
  foundation: FoundationType;
  name: string;
  archived?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface CreateActivityInput {
  foundation: FoundationType;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateActivityInput {
  id: string;
  name?: string;
  archived?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogEntry {
  id: string;
  userId?: string;
  date: ISODate;
  activityId: string; // links to ActivityDefinition.id
  foundation: FoundationType;
  durationMinutes?: number;
  notes?: string;
  source?: "quick-checkin" | "manual-edit" | "import" | "system";
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
