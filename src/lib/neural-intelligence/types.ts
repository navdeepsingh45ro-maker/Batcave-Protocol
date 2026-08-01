import type { BeliefState } from "@/lib/belief-intelligence/types";

export type NeuralCategory = "Recovery" | "Execution" | "Mindset" | "Environment" | "Social" | "Health" | "Planning";

export interface NeuralCountermeasure {
  id: string;
  category: NeuralCategory;
  name: string;
  description: string;
}

export interface NeuralIntervention {
  type: "DecisionMatrix" | "Countermeasure";
  primaryThreat: string;
  need: string;
  action: string;
}

export interface StateSuggestions {
  thoughts: string[];
  causes: string[];
}
