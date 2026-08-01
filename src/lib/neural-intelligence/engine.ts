import type { BeliefState } from "@/lib/belief-intelligence/types";
import { decisionRepo } from "@/lib/belief-intelligence";
import { NEURAL_COUNTERMEASURES } from "./config";
import type { NeuralIntervention } from "./types";

export class NeuralIntelligenceEngine {
  
  getMomentumResponse(state: BeliefState): string {
    switch (state) {
      case "Focused":
        return "Start a Focus Session.";
      case "Motivated":
        return "Tackle today's hardest mission.";
      case "Confident":
        return "Attempt higher difficulty work.";
      case "Flow State":
        return "Protect this state. Avoid all interruptions.";
      case "Disciplined":
        return "Execute exactly as planned. No deviations.";
      case "Calm":
        return "Maintain current velocity. Do not rush.";
      default:
        return "Continue today's execution. Protect momentum.";
    }
  }

  getIntervention(state: BeliefState, cause: string, thought: string): NeuralIntervention | null {
    // 1. Decision Matrix Priority
    if (thought) {
      const decision = decisionRepo.list().find(d => d.recurringThought?.toLowerCase() === thought.toLowerCase());
      if (decision) {
        return {
          type: "DecisionMatrix",
          primaryThreat: decision.limitingBelief,
          need: "Belief Transformation",
          action: decision.newEmpoweringBelief || decision.newDecision || "Action"
        };
      }
    }

    // 2. Map Countermeasure to Cause + State
    // If we have "Heavy" + "Burnout" -> Break Task or Reprioritize
    // Using simple deterministic rules
    const cLow = cause.toLowerCase();

    if (state === "Anxious" && (cLow.includes("fear") || cLow.includes("uncertainty") || cLow.includes("deadline"))) {
      return this.mapCm("cm_one_small_step", "Fear / Uncertainty", "Action Bias");
    }

    if ((state === "Heavy" || state === "Fatigued") && (cLow.includes("sleep") || cLow.includes("exhaustion"))) {
      return this.mapCm("cm_tactical_nap", "Physical Exhaustion", "Mental Recovery");
    }

    if (state === "Heavy" && cLow.includes("burnout")) {
      return this.mapCm("cm_reprioritize", "Burnout", "Reduced Scope");
    }

    if (state === "Lonely" || cLow.includes("connection") || cLow.includes("isolation")) {
      return this.mapCm("cm_call_friend", "Isolation", "Social Connection");
    }

    if (state === "Frustrated" && (cLow.includes("blocked") || cLow.includes("stuck"))) {
      return this.mapCm("cm_break_task", "Blocked Progress", "Micro-execution");
    }

    if (state === "Overwhelmed" || cLow.includes("too many")) {
      return this.mapCm("cm_reprioritize", "Cognitive Overload", "Prioritization");
    }

    if (state === "Disconnected" || cLow.includes("purpose")) {
      return this.mapCm("cm_decision_matrix", "Misalignment", "Reconnection with Purpose");
    }

    // Fallbacks
    if (["Anxious", "Overwhelmed", "Frustrated"].includes(state)) {
      return this.mapCm("cm_recovery_walk", "Agitation", "State Reset");
    }

    return this.mapCm("cm_five_min_rule", "Friction", "Momentum Generation");
  }

  private mapCm(cmId: string, threat: string, need: string): NeuralIntervention {
    const cm = NEURAL_COUNTERMEASURES.find(c => c.id === cmId);
    return {
      type: "Countermeasure",
      primaryThreat: threat,
      need: need,
      action: cm ? cm.name : "Action"
    };
  }
}

export const neuralIntelligenceEngine = new NeuralIntelligenceEngine();
