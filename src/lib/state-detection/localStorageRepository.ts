import { scoreStateSelection } from "./calculations";
import type {
  BehaviorOutcome,
  CreateBehaviorOutcomeInput,
  CreateStateLogInput,
  DailyStateLog,
  InterventionResult,
  ISODate
} from "./types";

const STATE_LOG_STORAGE_KEY = "batcave.state.logs.v1";
const BEHAVIOR_OUTCOME_STORAGE_KEY = "batcave.behavior.outcomes.v1";
const INTERVENTION_RESULT_STORAGE_KEY = "batcave.intervention.results.v1";

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  return rawValue ? (JSON.parse(rawValue) as T) : fallback;
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const localStateDetectionRepository = {
  listStateLogs(): DailyStateLog[] {
    return readJson<DailyStateLog[]>(STATE_LOG_STORAGE_KEY, []);
  },

  getStateLogsForDate(date: ISODate): DailyStateLog[] {
    return this.listStateLogs()
      .filter((log) => log.date === date)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  getLatestStateLogForDate(date: ISODate): DailyStateLog | undefined {
    const logsForDate = this.getStateLogsForDate(date);
    return logsForDate.length > 0 ? logsForDate[logsForDate.length - 1] : undefined;
  },

  addStateLog(input: CreateStateLogInput): DailyStateLog {
    const logs = this.listStateLogs();
    const timestamp = now();
    const stateScore = scoreStateSelection(input.selectedStates);

    const nextLog: DailyStateLog = {
      id: createId("state"),
      date: input.date,
      timestamp: input.timestamp ?? timestamp,
      selectedStates: Array.from(new Set(input.selectedStates)),
      riskScore: stateScore.riskScore,
      riskLevel: stateScore.riskLevel,
      metadata: input.metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    writeJson(STATE_LOG_STORAGE_KEY, [...logs, nextLog]);
    return nextLog;
  },

  listBehaviorOutcomes(): BehaviorOutcome[] {
    return readJson<BehaviorOutcome[]>(BEHAVIOR_OUTCOME_STORAGE_KEY, []);
  },

  addBehaviorOutcome(input: CreateBehaviorOutcomeInput): BehaviorOutcome {
    const outcome: BehaviorOutcome = {
      id: createId("behavior"),
      ...input
    };

    writeJson(BEHAVIOR_OUTCOME_STORAGE_KEY, [...this.listBehaviorOutcomes(), outcome]);
    return outcome;
  },

  listInterventionResults(): InterventionResult[] {
    return readJson<InterventionResult[]>(INTERVENTION_RESULT_STORAGE_KEY, []);
  },

  addInterventionResult(result: Omit<InterventionResult, "id" | "timestamp"> & { timestamp?: string }): InterventionResult {
    const interventionResult: InterventionResult = {
      id: createId("intervention"),
      ...result,
      timestamp: result.timestamp ?? now()
    };

    writeJson(INTERVENTION_RESULT_STORAGE_KEY, [...this.listInterventionResults(), interventionResult]);
    return interventionResult;
  }
};
