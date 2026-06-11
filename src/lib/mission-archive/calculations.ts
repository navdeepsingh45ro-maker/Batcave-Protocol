import type { ISODate } from "../foundation/types";
import type { FoundationType } from "../foundation/types";
import { FOUNDATION_TYPES, FOUNDATION_IDENTITY_MAP, TOTAL_FOUNDATIONS } from "../foundation/config";
import { getCompletedFoundationTypesFromActivities } from "../foundation/calculations";
import { localStateDetectionRepository } from "../state-detection/localStorageRepository";
import { beliefRepo } from "../belief-intelligence/localStorageRepository";
import { localCountermeasureRepository } from "../countermeasures/localStorageRepository";
import { localFoundationRepository } from "../foundation/localStorageRepository";
import { THREATS, NEEDS } from "../countermeasures/config";
import { detectThreat, detectNeed } from "../countermeasures/calculations";
import type {
  ArchiveSummary,
  ArchiveWindow,
  DailyMissionSnapshot,
  NeedFrequencyEntry,
  ThreatCountermeasureCorrelation,
  ThreatFoundationCorrelation,
  ThreatFrequencyEntry,
  ThreatIdentityCorrelation,
  ThoughtFrequencyEntry,
} from "./types";
import type { EmotionalState, RiskLevel } from "../state-detection/types";

// ─── Date helpers ──────────────────────────────────────────────
function subtractDays(dateStr: ISODate, days: number): ISODate {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as ISODate;
}

function getISOWeek(dateStr: ISODate): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getYearMonth(dateStr: ISODate): string {
  return dateStr.slice(0, 7); // "2024-06"
}

const RISK_ORDER: Record<RiskLevel, number> = { GREEN: 1, YELLOW: 2, ORANGE: 3, RED: 4 };

// ─── Archive Summary ────────────────────────────────────────────
export function getArchiveSummary(): ArchiveSummary {
  const stateLogs = localStateDetectionRepository.listStateLogs();
  const beliefs = beliefRepo.list();
  const cmLogs = localCountermeasureRepository.listLogs();
  const activityLogs = localFoundationRepository.listFoundationActivities();

  const allDatesSet = new Set<string>();
  stateLogs.forEach((l) => allDatesSet.add(l.date));
  beliefs.forEach((b) => allDatesSet.add(b.date));
  cmLogs.forEach((l) => allDatesSet.add(l.date));
  activityLogs.forEach((l) => allDatesSet.add(l.date));

  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a)) as ISODate[];

  // Foundation data = dates where at least 1 activity was logged
  const datesWithFoundation = allDates.filter((d) => {
    return activityLogs.some((l) => l.date === d);
  });

  return {
    totalDays: allDates.length,
    hasEnoughData: datesWithFoundation.length >= 5,
    daysWithFoundationData: datesWithFoundation.length,
    earliestDate: allDates.length > 0 ? (allDates[allDates.length - 1] as ISODate) : null,
    latestDate: allDates.length > 0 ? (allDates[0] as ISODate) : null,
    allDates: allDates as ISODate[],
    datesWithFoundationData: datesWithFoundation as ISODate[],
  };
}

// ─── Build Daily Snapshot ────────────────────────────────────────
export function buildDailySnapshot(date: ISODate): DailyMissionSnapshot {
  const stateLogs = localStateDetectionRepository.getStateLogsForDate(date);
  const beliefs = beliefRepo.list().filter((b) => b.date === date);
  const cmLogs = localCountermeasureRepository.listLogs().filter((l) => l.date === date);
  const activityLogs = localFoundationRepository.listFoundationActivities().filter((l) => l.date === date);

  // States
  const allStates = Array.from(
    new Set(stateLogs.flatMap((l) => l.selectedStates))
  ) as EmotionalState[];

  let peakRiskLevel: RiskLevel | null = null;
  for (const log of stateLogs) {
    if (!peakRiskLevel || RISK_ORDER[log.riskLevel] > RISK_ORDER[peakRiskLevel]) {
      peakRiskLevel = log.riskLevel;
    }
  }

  // Dominant threat/need from highest risk check-in
  let dominantThreat = null;
  let dominantNeed = null;
  // V4.2: Only run threat detection on check-ins that were classified as 'limiting'
  const limitingStates = Array.from(
    new Set(stateLogs.filter((l) => l.metadata?.thoughtType === "limiting").flatMap((l) => l.selectedStates))
  ) as EmotionalState[];
  if (limitingStates.length > 0) {
    const threat = detectThreat(limitingStates);
    const need = detectNeed(threat.id);
    dominantThreat = threat;
    dominantNeed = need;
  }

  // Foundations
  const completedFoundations = getCompletedFoundationTypesFromActivities(activityLogs, date);
  const missedFoundations = FOUNDATION_TYPES.filter((f) => !completedFoundations.includes(f));
  const foundationScore = Math.round((completedFoundations.length / TOTAL_FOUNDATIONS) * 100);
  const totalActivityDurationMinutes = activityLogs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);

  // Countermeasures
  const outcomes = cmLogs.map((l) => (l.metadata?.outcome as string) || (l.completed ? "COMPLETED" : l.accepted ? "ACCEPTED" : "SKIPPED"));
  const countermeasureAccepted = outcomes.filter((o) => o === "ACCEPTED").length;
  const countermeasureCompleted = outcomes.filter((o) => o === "COMPLETED").length;
  const countermeasureFailed = outcomes.filter((o) => o === "FAILED").length;
  const countermeasureSkipped = outcomes.filter((o) => o === "SKIPPED").length;

  return {
    date,
    checkInCount: stateLogs.length,
    peakRiskLevel,
    allStates,
    beliefEntryCount: beliefs.length,
    causes: Array.from(new Set(beliefs.map((b) => b.primaryCause).filter(Boolean))) as string[],
    thoughts: Array.from(new Set(beliefs.map((b) => b.recurringThought).filter(Boolean))) as string[],
    completedFoundations,
    missedFoundations,
    foundationScore,
    totalActivityDurationMinutes,
    countermeasureAccepted,
    countermeasureCompleted,
    countermeasureFailed,
    countermeasureSkipped,
    dominantThreat,
    dominantNeed,
  };
}

// ─── Threat Frequency ───────────────────────────────────────────
export function getThreatFrequency(window: ArchiveWindow, todaysDate: ISODate): ThreatFrequencyEntry[] {
  const cmLogs = localCountermeasureRepository.listLogs();

  let cutoff: ISODate | null = null;
  if (window === "7d") cutoff = subtractDays(todaysDate, 7);
  else if (window === "30d") cutoff = subtractDays(todaysDate, 30);

  const filtered = cutoff ? cmLogs.filter((l) => l.date >= cutoff!) : cmLogs;

  const counts: Record<string, { count: number; dates: Set<string> }> = {};
  for (const log of filtered) {
    if (!counts[log.detectedThreatId]) counts[log.detectedThreatId] = { count: 0, dates: new Set() };
    counts[log.detectedThreatId].count++;
    counts[log.detectedThreatId].dates.add(log.date);
  }

  return THREATS.map((threat) => ({
    threat,
    count: counts[threat.id]?.count ?? 0,
    daysActive: counts[threat.id]?.dates.size ?? 0,
  }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ─── Need Frequency ────────────────────────────────────────────
export function getUnmetNeedFrequency(window: ArchiveWindow, todaysDate: ISODate): NeedFrequencyEntry[] {
  const cmLogs = localCountermeasureRepository.listLogs();

  let cutoff: ISODate | null = null;
  if (window === "7d") cutoff = subtractDays(todaysDate, 7);
  else if (window === "30d") cutoff = subtractDays(todaysDate, 30);

  const filtered = cutoff ? cmLogs.filter((l) => l.date >= cutoff!) : cmLogs;

  const counts: Record<string, number> = {};
  for (const log of filtered) {
    counts[log.detectedNeed] = (counts[log.detectedNeed] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([need, count]) => ({ need: need as any, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Threat → Foundation Skip % ────────────────────────────────
export function getThreatToFoundationSkipCorrelation(): ThreatFoundationCorrelation[] {
  const cmLogs = localCountermeasureRepository.listLogs();
  const activityLogs = localFoundationRepository.listFoundationActivities();

  const result: ThreatFoundationCorrelation[] = [];

  for (const threat of THREATS) {
    const daysWithThreat = Array.from(
      new Set(cmLogs.filter((l) => l.detectedThreatId === threat.id).map((l) => l.date))
    );

    if (daysWithThreat.length === 0) continue;

    for (const foundation of FOUNDATION_TYPES) {
      let skipped = 0;
      for (const date of daysWithThreat) {
        const done = activityLogs.some((a) => a.date === date && a.foundation === foundation);
        if (!done) skipped++;
      }
      const skipPercent = Math.round((skipped / daysWithThreat.length) * 100);
      result.push({
        threatId: threat.id,
        threatName: threat.name,
        foundation: foundation as FoundationType,
        totalDaysWithThreat: daysWithThreat.length,
        daysFoundationSkipped: skipped,
        skipPercent,
      });
    }
  }

  return result.sort((a, b) => b.skipPercent - a.skipPercent);
}

// ─── Threat → Countermeasure Success % ─────────────────────────
export function getThreatToCountermeasureSuccessRate(): ThreatCountermeasureCorrelation[] {
  const cmLogs = localCountermeasureRepository.listLogs();

  return THREATS.map((threat) => {
    const logs = cmLogs.filter((l) => l.detectedThreatId === threat.id);
    const total = logs.length;
    const accepted = logs.filter((l) => l.accepted).length;
    const completed = logs.filter((l) => l.completed).length;

    return {
      threatId: threat.id,
      threatName: threat.name,
      totalActions: total,
      accepted,
      completed,
      acceptedPercent: total === 0 ? 0 : Math.round((accepted / total) * 100),
      completedPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }).filter((e) => e.totalActions > 0);
}

// ─── Threat → Identity Participation % ─────────────────────────
export function getThreatToIdentityParticipation(): ThreatIdentityCorrelation[] {
  const cmLogs = localCountermeasureRepository.listLogs();
  const activityLogs = localFoundationRepository.listFoundationActivities();
  const identities = ["King", "Builder", "Striker", "Guardian"];

  const result: ThreatIdentityCorrelation[] = [];

  for (const threat of THREATS) {
    const daysWithThreat = Array.from(
      new Set(cmLogs.filter((l) => l.detectedThreatId === threat.id).map((l) => l.date))
    );
    if (daysWithThreat.length === 0) continue;

    for (const identity of identities) {
      // Find foundations that give this identity
      const foundationsForIdentity = FOUNDATION_TYPES.filter(
        (f) => FOUNDATION_IDENTITY_MAP[f] === identity
      );
      let activeDays = 0;
      for (const date of daysWithThreat) {
        const hasActivity = foundationsForIdentity.some((f) =>
          activityLogs.some((a) => a.date === date && a.foundation === f)
        );
        if (hasActivity) activeDays++;
      }

      result.push({
        threatId: threat.id,
        threatName: threat.name,
        identity,
        daysWithThreat: daysWithThreat.length,
        daysIdentityActive: activeDays,
        participationPercent: Math.round((activeDays / daysWithThreat.length) * 100),
      });
    }
  }

  return result;
}

// ─── Thought Frequency — Weekly ─────────────────────────────────
export function getThoughtFrequencyByWeek(nWeeks = 4): ThoughtFrequencyEntry[] {
  const beliefs = beliefRepo.list();
  const counts: Record<string, number> = {};

  for (const b of beliefs) {
    if (!b.recurringThought) continue;
    const key = `${getISOWeek(b.date)}||${b.recurringThought.toLowerCase().trim()}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([key, count]) => {
      const [period, thought] = key.split("||");
      return { thought, period, count };
    })
    .filter((e) => {
      // Keep only last nWeeks (approximate)
      return true;
    })
    .sort((a, b) => b.period.localeCompare(a.period) || b.count - a.count)
    .slice(0, nWeeks * 3);
}

// ─── Thought Frequency — Monthly ────────────────────────────────
export function getThoughtFrequencyByMonth(nMonths = 3): ThoughtFrequencyEntry[] {
  const beliefs = beliefRepo.list();
  const counts: Record<string, number> = {};

  for (const b of beliefs) {
    if (!b.recurringThought) continue;
    const key = `${getYearMonth(b.date)}||${b.recurringThought.toLowerCase().trim()}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([key, count]) => {
      const [period, thought] = key.split("||");
      return { thought, period, count };
    })
    .sort((a, b) => b.period.localeCompare(a.period) || b.count - a.count)
    .slice(0, nMonths * 3);
}
