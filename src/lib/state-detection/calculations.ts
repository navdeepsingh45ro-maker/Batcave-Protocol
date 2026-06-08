import { RISK_THRESHOLDS, STATE_INTERVENTIONS, STATE_RISK_WEIGHT_MAP } from "./config";
import type {
  BehaviorOutcome,
  EmotionalState,
  HighRiskDay,
  InterventionRecommendation,
  InterventionResult,
  ISODate,
  RiskLevel,
  StateAnalytics,
  StateCorrelation,
  StateTrend,
  DailyStateLog
} from "./types";

function uniqueStates(states: EmotionalState[]): EmotionalState[] {
  return Array.from(new Set(states));
}

export function calculateRiskScore(
  selectedStates: EmotionalState[],
  weights: Record<EmotionalState, number> = STATE_RISK_WEIGHT_MAP
): number {
  return uniqueStates(selectedStates).reduce((total, state) => total + (weights[state] ?? 0), 0);
}

export function calculateRiskLevel(score: number): RiskLevel {
  return RISK_THRESHOLDS.reduce<RiskLevel>((currentLevel, threshold) => {
    return score >= threshold.minScore ? threshold.level : currentLevel;
  }, "GREEN");
}

export function scoreStateSelection(selectedStates: EmotionalState[]) {
  const riskScore = calculateRiskScore(selectedStates);
  return {
    riskScore,
    riskLevel: calculateRiskLevel(riskScore)
  };
}

export function getRecommendationsForStates(
  selectedStates: EmotionalState[],
  interventionResults: InterventionResult[] = []
): InterventionRecommendation[] {
  const stateSet = new Set(selectedStates);
  const effectivenessByRecommendation = calculateInterventionEffectiveness(interventionResults);

  return STATE_INTERVENTIONS.filter((intervention) => stateSet.has(intervention.triggerState))
    .map((intervention) => ({
      triggerState: intervention.triggerState,
      recommendation: intervention.recommendation,
      priority: intervention.priority,
      effectivenessScore: effectivenessByRecommendation.get(`${intervention.triggerState}:${intervention.recommendation}`)
    }))
    .sort((left, right) => {
      const effectivenessDelta = (right.effectivenessScore ?? 0) - (left.effectivenessScore ?? 0);
      return effectivenessDelta !== 0 ? effectivenessDelta : left.priority - right.priority;
    });
}

export function calculateMostCommonStates(logs: DailyStateLog[], limit = 5): StateTrend[] {
  const trends = new Map<EmotionalState, StateTrend>();

  logs.forEach((log) => {
    uniqueStates(log.selectedStates).forEach((state) => {
      const current = trends.get(state);
      trends.set(state, {
        state,
        count: current ? current.count + 1 : 1,
        firstSeen: current?.firstSeen && current.firstSeen < log.date ? current.firstSeen : log.date,
        lastSeen: current?.lastSeen && current.lastSeen > log.date ? current.lastSeen : log.date
      });
    });
  });

  return Array.from(trends.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function getHighestRiskDays(logs: DailyStateLog[], limit = 7): HighRiskDay[] {
  return logs
    .map((log) => ({
      date: log.date,
      riskScore: log.riskScore,
      riskLevel: log.riskLevel,
      selectedStates: log.selectedStates
    }))
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, limit);
}

export function calculateStateCorrelations(
  stateLogs: DailyStateLog[],
  behaviorOutcomes: BehaviorOutcome[]
): StateCorrelation[] {
  const statesByDate = new Map<ISODate, Set<EmotionalState>>();
  const allDates = new Set<ISODate>();

  stateLogs.forEach((log) => {
    allDates.add(log.date);
    const currentStates = statesByDate.get(log.date) ?? new Set<EmotionalState>();
    uniqueStates(log.selectedStates).forEach((state) => currentStates.add(state));
    statesByDate.set(log.date, currentStates);
  });

  behaviorOutcomes.forEach((outcome) => allDates.add(outcome.date));

  const behaviorKeys = Array.from(
    new Set(behaviorOutcomes.filter((outcome) => outcome.occurred).map((outcome) => outcome.behavior))
  );

  const stateSet = new Set<EmotionalState>();
  stateLogs.forEach((log) => uniqueStates(log.selectedStates).forEach((state) => stateSet.add(state)));

  const totalDays = allDates.size;
  const now = new Date().toISOString();

  return Array.from(stateSet).flatMap((state) =>
    behaviorKeys.map((behavior) => {
      const matchingOutcomes = behaviorOutcomes.filter((outcome) => outcome.behavior === behavior && outcome.occurred);
      const behaviorDates = new Set(matchingOutcomes.map((outcome) => outcome.date));
      const behaviorCategory = matchingOutcomes[0]?.category ?? "custom";

      let daysWithState = 0;
      let behaviorWithState = 0;
      let behaviorWithoutState = 0;

      Array.from(allDates).forEach((date) => {
        const hasState = statesByDate.get(date)?.has(state) ?? false;
        const hasBehavior = behaviorDates.has(date);

        if (hasState) {
          daysWithState += 1;
          if (hasBehavior) {
            behaviorWithState += 1;
          }
        } else if (hasBehavior) {
          behaviorWithoutState += 1;
        }
      });

      const rateWithState = daysWithState === 0 ? 0 : behaviorWithState / daysWithState;
      const daysWithoutState = totalDays - daysWithState;
      const rateWithoutState = daysWithoutState === 0 ? 0 : behaviorWithoutState / daysWithoutState;

      return {
        state,
        behavior,
        behaviorCategory,
        occurrencesWithState: daysWithState,
        behaviorOccurrencesWithState: behaviorWithState,
        behaviorOccurrencesWithoutState: behaviorWithoutState,
        sampleSize: totalDays,
        correlationStrength: Math.round((rateWithState - rateWithoutState) * 100),
        updatedAt: now
      };
    })
  );
}

export function calculateInterventionEffectiveness(results: InterventionResult[]): Map<string, number> {
  const grouped = new Map<string, { attempts: number; effective: number }>();

  results.forEach((result) => {
    const key = `${result.triggerState}:${result.recommendation}`;
    const current = grouped.get(key) ?? { attempts: 0, effective: 0 };
    grouped.set(key, {
      attempts: current.attempts + 1,
      effective: current.effective + (result.effective ? 1 : 0)
    });
  });

  return new Map(
    Array.from(grouped.entries()).map(([key, value]) => [
      key,
      value.attempts === 0 ? 0 : Math.round((value.effective / value.attempts) * 100)
    ])
  );
}

export function getMostEffectiveInterventions(results: InterventionResult[], limit = 5): InterventionRecommendation[] {
  const effectiveness = calculateInterventionEffectiveness(results);

  return Array.from(effectiveness.entries())
    .map(([key, effectivenessScore]) => {
      const [triggerState, recommendation] = key.split(":") as [EmotionalState, string];
      return {
        triggerState,
        recommendation,
        priority: 0,
        effectivenessScore
      };
    })
    .sort((left, right) => (right.effectivenessScore ?? 0) - (left.effectivenessScore ?? 0))
    .slice(0, limit);
}

export function calculateStateAnalytics(
  stateLogs: DailyStateLog[],
  behaviorOutcomes: BehaviorOutcome[],
  interventionResults: InterventionResult[]
): StateAnalytics {
  return {
    mostCommonStates: calculateMostCommonStates(stateLogs),
    highestRiskDays: getHighestRiskDays(stateLogs),
    stateTrends: calculateMostCommonStates(stateLogs, 20),
    correlations: calculateStateCorrelations(stateLogs, behaviorOutcomes).sort(
      (left, right) => right.correlationStrength - left.correlationStrength
    ),
    mostEffectiveInterventions: getMostEffectiveInterventions(interventionResults)
  };
}
