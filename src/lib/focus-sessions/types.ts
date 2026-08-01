import type { ProtocolIdentity } from "@/lib/identity-operations";

export type ObjectiveStatus = "Mission Complete" | "Significant Progress" | "Blocked";

export type InterruptionReason = 
  | "Phone"
  | "Social Media"
  | "Fatigue"
  | "Hunger"
  | "Work"
  | "Family"
  | "Other";

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  duration: number; // Duration in seconds
  identity: ProtocolIdentity;
  linkedTaskId: string | null;
  taskName: string;
  objectiveStatus: ObjectiveStatus;
  focusRating: number; // 1-10
  energyRating: number; // 1-10
  distractionRating: number; // 1-10
  deepWorkScore: number; // Calculated score
  interruptionReason?: InterruptionReason; // Optional, required if blocked
  notes?: string;
  breakCompleted: boolean;
  timerLength: number; // Original timer length in seconds
  createdAt: string; // ISO datetime string
}
