import type {
  CreateBeliefEntryInput,
  CreateDecisionInput,
  AddEvidenceInput,
  PatternReport,
  BeliefEntry,
  DecisionMatrixEntry,
} from "./types";

export interface BeliefService {
  listEntries(): Promise<BeliefEntry[]>;
  createEntry(input: CreateBeliefEntryInput): Promise<BeliefEntry>;
  patternReport(): Promise<PatternReport>;
}

export interface DecisionService {
  list(): Promise<DecisionMatrixEntry[]>;
  create(input: CreateDecisionInput): Promise<DecisionMatrixEntry>;
  addEvidence(input: AddEvidenceInput): Promise<DecisionMatrixEntry>;
}
