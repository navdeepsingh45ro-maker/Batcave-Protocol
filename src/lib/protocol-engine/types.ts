import type { ISODate, ISODateTime } from "@/lib/foundation";
import type { BeliefState, BeliefCause } from "@/lib/belief-intelligence/types";

export type ProtocolCategory = 
  | "Recovery" 
  | "Execution" 
  | "Momentum" 
  | "Planning" 
  | "Mindset" 
  | "Environment" 
  | "Connection" 
  | "Health";

export type ProtocolStatus = 
  | "Triggered"
  | "Selected"
  | "Accepted"
  | "Active"
  | "Completed"
  | "Failed"
  | "Abandoned"
  | "Reviewed"
  | "Learned";

export interface ProtocolDefinition {
  id: string;
  name: string;
  category: ProtocolCategory;
  primaryAction: string;
  description?: string;
  requiresFocusSession?: boolean;
}

export type ProtocolSourceType = "NeuralIntelligence" | "ExecutionIntelligence" | "SleepIntelligence" | "SystemDefault";

export interface ProtocolLog {
  id: string;
  date: ISODate;
  timestamp: ISODateTime;
  
  // Protocol Definition
  protocolId: string;
  protocolName: string;
  category: ProtocolCategory;
  
  // Lifecycle
  status: ProtocolStatus;
  
  // Context
  source: ProtocolSourceType;
  associatedState?: BeliefState | string;
  associatedCause?: BeliefCause | string;
  associatedIdentity?: string;
  selectionReason: string;
  timeOfDayHour?: number;

  // Execution Metrics
  acceptedAt?: ISODateTime;
  startedAt?: ISODateTime;
  finishedAt?: ISODateTime;
  durationMinutes?: number;
  focusSessionId?: string;
  focusRating?: number;
}
