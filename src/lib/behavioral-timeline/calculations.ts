import type { BehavioralChain, BehavioralTimelineEvent } from "./types";

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function getTimelineForDate(events: BehavioralTimelineEvent[], date: string): BehavioralTimelineEvent[] {
  return events
    .filter((event) => event.date === date)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export function buildBehavioralChain(events: BehavioralTimelineEvent[], date: string): BehavioralChain {
  const dayEvents = getTimelineForDate(events, date);

  return {
    date: date as BehavioralChain["date"],
    events: dayEvents,
    states: unique(dayEvents.flatMap((event) => event.states ?? [])),
    detectedThreatIds: unique(dayEvents.flatMap((event) => (event.threatId ? [event.threatId] : []))),
    countermeasureIds: unique(dayEvents.flatMap((event) => (event.countermeasureId ? [event.countermeasureId] : []))),
    completedFoundations: unique(dayEvents.flatMap((event) => (event.foundation ? [event.foundation] : []))),
    missionRedirects: unique(dayEvents.flatMap((event) => (event.missionRedirect ? [event.missionRedirect] : []))),
    outcomes: unique(dayEvents.flatMap((event) => (event.outcome ? [event.outcome] : [])))
  };
}

export function findWorkingChains(events: BehavioralTimelineEvent[]): BehavioralChain[] {
  const dates = unique(events.map((event) => event.date));

  return dates
    .map((date) => buildBehavioralChain(events, date))
    .filter((chain) => chain.countermeasureIds.length > 0 && chain.completedFoundations.length > 0);
}
