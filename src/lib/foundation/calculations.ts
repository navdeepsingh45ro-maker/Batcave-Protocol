import { FOUNDATION_IDENTITY_MAP, FOUNDATION_TYPES, IDENTITIES, TOTAL_FOUNDATIONS } from "./config";
import type {
  ConsistencyScore,
  DailyFoundationActivitySummary,
  FoundationActivityLog,
  DailyFoundationLog,
  DailyFoundationScore,
  FoundationSubtype,
  FoundationType,
  Identity,
  IdentityActivityScore,
  ISODate,
  WeeklyFoundationScore
} from "./types";

const MS_PER_DAY = 86_400_000;

function toDate(date: ISODate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatDate(date: Date): ISODate {
  return date.toISOString().slice(0, 10) as ISODate;
}

export function addDays(date: ISODate, days: number): ISODate {
  return formatDate(new Date(toDate(date).getTime() + days * MS_PER_DAY));
}

export function getDateRange(startDate: ISODate, endDate: ISODate): ISODate[] {
  const dates: ISODate[] = [];
  for (let current = startDate; current <= endDate; current = addDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

export function getCompletedFoundationTypes(logs: DailyFoundationLog[], date: ISODate): FoundationType[] {
  const completed = new Set<FoundationType>();

  logs.forEach((log) => {
    if (log.date === date && log.completed) {
      completed.add(log.foundation);
    }
  });

  return FOUNDATION_TYPES.filter((foundation) => completed.has(foundation));
}

export function getCompletedFoundationTypesFromActivities(
  activities: FoundationActivityLog[],
  date: ISODate
): FoundationType[] {
  const completed = new Set<FoundationType>();

  activities.forEach((activity) => {
    if (activity.date === date) {
      completed.add(activity.foundation);
    }
  });

  return FOUNDATION_TYPES.filter((foundation) => completed.has(foundation));
}

export function summarizeFoundationActivities(
  activities: FoundationActivityLog[],
  date: ISODate
): DailyFoundationActivitySummary[] {
  return FOUNDATION_TYPES.map((foundation) => {
    const foundationActivities = activities.filter(
      (activity) => activity.date === date && activity.foundation === foundation
    );

    return {
      date,
      foundation,
      completed: foundationActivities.length > 0,
      activityCount: foundationActivities.length,
      totalDurationMinutes: foundationActivities.reduce(
        (total, activity) => total + (activity.durationMinutes ?? 0),
        0
      ),
      activities: foundationActivities
    };
  });
}

export function calculateDailyFoundationScoreFromActivities(
  activities: FoundationActivityLog[],
  date: ISODate
): DailyFoundationScore {
  const activitySummaries = summarizeFoundationActivities(activities, date);
  const completedFoundations = activitySummaries
    .filter((summary) => summary.completed)
    .map((summary) => summary.foundation);
  const missedFoundations = FOUNDATION_TYPES.filter((foundation) => !completedFoundations.includes(foundation));
  const completedCount = completedFoundations.length;

  return {
    date,
    completedCount,
    totalFoundations: TOTAL_FOUNDATIONS,
    scorePercent: Math.round((completedCount / TOTAL_FOUNDATIONS) * 100),
    completedFoundations,
    missedFoundations,
    activitySummaries
  };
}

export function getMissedFoundationTypes(logs: DailyFoundationLog[], date: ISODate): FoundationType[] {
  const completed = new Set(getCompletedFoundationTypes(logs, date));
  return FOUNDATION_TYPES.filter((foundation) => !completed.has(foundation));
}

export function calculateDailyFoundationScore(logs: DailyFoundationLog[], date: ISODate): DailyFoundationScore {
  const completedFoundations = getCompletedFoundationTypes(logs, date);
  const missedFoundations = getMissedFoundationTypes(logs, date);
  const completedCount = completedFoundations.length;

  return {
    date,
    completedCount,
    totalFoundations: TOTAL_FOUNDATIONS,
    scorePercent: Math.round((completedCount / TOTAL_FOUNDATIONS) * 100),
    completedFoundations,
    missedFoundations
  };
}

export function calculateWeeklyFoundationScore(
  logs: DailyFoundationLog[],
  startDate: ISODate,
  endDate: ISODate
): WeeklyFoundationScore {
  const dailyScores = getDateRange(startDate, endDate).map((date) => calculateDailyFoundationScore(logs, date));
  const averageScorePercent =
    dailyScores.length === 0
      ? 0
      : Math.round(dailyScores.reduce((total, score) => total + score.scorePercent, 0) / dailyScores.length);

  return {
    startDate,
    endDate,
    dailyScores,
    averageScorePercent
  };
}

export function calculateWeeklyFoundationScoreFromActivities(
  activities: FoundationActivityLog[],
  startDate: ISODate,
  endDate: ISODate
): WeeklyFoundationScore {
  const dailyScores = getDateRange(startDate, endDate).map((date) =>
    calculateDailyFoundationScoreFromActivities(activities, date)
  );
  const averageScorePercent =
    dailyScores.length === 0
      ? 0
      : Math.round(dailyScores.reduce((total, score) => total + score.scorePercent, 0) / dailyScores.length);

  return {
    startDate,
    endDate,
    dailyScores,
    averageScorePercent
  };
}

export function calculateIdentityActivityScore(
  logs: DailyFoundationLog[],
  identity: Identity,
  startDate: ISODate,
  endDate: ISODate
): IdentityActivityScore {
  const dateRange = getDateRange(startDate, endDate);
  const activeDates = new Set(
    logs
      .filter((log) => log.completed)
      .filter((log) => log.date >= startDate && log.date <= endDate)
      .filter((log) => FOUNDATION_IDENTITY_MAP[log.foundation] === identity)
      .map((log) => log.date)
  );

  return {
    identity,
    startDate,
    endDate,
    activeDays: activeDates.size,
    totalDays: dateRange.length,
    scorePercent: dateRange.length === 0 ? 0 : Math.round((activeDates.size / dateRange.length) * 100)
  };
}

export function calculateAllIdentityActivityScores(
  logs: DailyFoundationLog[],
  startDate: ISODate,
  endDate: ISODate
): IdentityActivityScore[] {
  return IDENTITIES.map((identity) => calculateIdentityActivityScore(logs, identity, startDate, endDate));
}

export function getMostCommonFoundationSubtype(
  logs: DailyFoundationLog[],
  foundation?: FoundationType
): { foundation: FoundationType; subtype: FoundationSubtype; count: number } | undefined {
  const counts = new Map<string, { foundation: FoundationType; subtype: FoundationSubtype; count: number }>();

  logs
    .filter((log) => log.completed)
    .filter((log) => (foundation ? log.foundation === foundation : true))
    .forEach((log) => {
      const key = `${log.foundation}:${log.subtype}`;
      const current = counts.get(key);
      counts.set(key, {
        foundation: log.foundation,
        subtype: log.subtype,
        count: current ? current.count + 1 : 1
      });
    });

  return Array.from(counts.values()).sort((left, right) => right.count - left.count)[0];
}

export function calculateConsistencyScore(
  logs: DailyFoundationLog[],
  startDate: ISODate,
  endDate: ISODate
): ConsistencyScore {
  const dateRange = getDateRange(startDate, endDate);
  const showingUpByDate = new Map<ISODate, boolean>();

  dateRange.forEach((date) => {
    showingUpByDate.set(date, getCompletedFoundationTypes(logs, date).length > 0);
  });

  let bestStreak = 0;
  let runningStreak = 0;

  dateRange.forEach((date) => {
    if (showingUpByDate.get(date)) {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  });

  let currentStreak = 0;
  for (let index = dateRange.length - 1; index >= 0; index -= 1) {
    if (!showingUpByDate.get(dateRange[index])) {
      break;
    }
    currentStreak += 1;
  }

  const possibleCompletions = dateRange.length * TOTAL_FOUNDATIONS;
  const completedCompletions = dateRange.reduce(
    (total, date) => total + getCompletedFoundationTypes(logs, date).length,
    0
  );

  return {
    currentStreak,
    bestStreak,
    completionFrequencyPercent:
      possibleCompletions === 0 ? 0 : Math.round((completedCompletions / possibleCompletions) * 100)
  };
}
