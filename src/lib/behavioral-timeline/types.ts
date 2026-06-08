import type { FoundationType, ISODate, ISODateTime } from "../foundation";
import type { EmotionalState } from "../state-detection";
import type { MissionRedirect, Need } from "../countermeasures";

export type TimelineEventType =
  | "state-check-in"
  | "threat-detected"
  | "countermeasure-recommended"
  | "countermeasure-accepted"
  | "countermeasure-completed"
  | "foundation-activity-completed"
  | "mission-redirected"
  | "behavior-outcome";

export interface BehavioralTimelineEvent {
  id: string;
  userId?: string;
  date: ISODate;
  timestamp: ISODateTime;
  eventType: TimelineEventType;
  states?: EmotionalState[];
  threatId?: string;
  need?: Need;
  countermeasureId?: string;
  foundation?: FoundationType;
  missionRedirect?: MissionRedirect;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

export interface BehavioralChain {
  date: ISODate;
  events: BehavioralTimelineEvent[];
  states: EmotionalState[];
  detectedThreatIds: string[];
  countermeasureIds: string[];
  completedFoundations: FoundationType[];
  missionRedirects: MissionRedirect[];
  outcomes: string[];
}

export interface CreateTimelineEventInput extends Omit<BehavioralTimelineEvent, "id" | "timestamp"> {
  timestamp?: ISODateTime;
}
