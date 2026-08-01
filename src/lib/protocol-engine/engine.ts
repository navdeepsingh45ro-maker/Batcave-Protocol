import { protocolRepository } from "./repository";
import { decisionRepo } from "@/lib/belief-intelligence";
import { NEURAL_COUNTERMEASURES } from "@/lib/neural-intelligence/config";
import type { ProtocolDefinition, ProtocolSourceType, ProtocolCategory } from "./types";
function getTodayISO() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + offset);
  return ist.toISOString().slice(0, 10) as any;
}
export class ProtocolEngine {
  
  public triggerProtocol(
    source: ProtocolSourceType,
    state: string,
    cause: string,
    thought?: string
  ): void {
    // 1. Only ONE active protocol allowed. If one is pending/active, ignore new triggers.
    if (protocolRepository.getActiveProtocol()) {
      return;
    }

    let selectedProtocol: ProtocolDefinition | null = null;
    let reason = "";

    // PRIORITY 1: Personal Decision Matrix
    if (thought) {
      const decision = decisionRepo.list().find(d => d.recurringThought?.toLowerCase() === thought.toLowerCase());
      if (decision) {
        selectedProtocol = {
          id: `dm_${decision.id}`,
          name: decision.newEmpoweringBelief || decision.newDecision || "Execute Decision",
          category: "Mindset",
          primaryAction: "Re-read and Internalize",
          requiresFocusSession: false,
        };
        reason = "Personal Decision Matrix Match";
      }
    }

    // PRIORITY 2: Historically Successful Protocol
    if (!selectedProtocol) {
      const bestId = protocolRepository.getBestProtocolForContext(state, cause);
      if (bestId) {
        const cm = NEURAL_COUNTERMEASURES.find(c => c.id === bestId);
        if (cm) {
          selectedProtocol = {
            id: cm.id,
            name: cm.name,
            category: cm.category as ProtocolCategory,
            primaryAction: cm.description,
            requiresFocusSession: ["Execution", "Planning"].includes(cm.category),
          };
          const success = protocolRepository.getHistoricalSuccess(bestId);
          reason = `Historically Successful (${Math.round(success.rate)}% completion)`;
        }
      }
    }

    // PRIORITY 3: System Default
    if (!selectedProtocol) {
      const cm = this.getFallbackSystemDefault(state, cause);
      selectedProtocol = {
        id: cm.id,
        name: cm.name,
        category: cm.category as ProtocolCategory,
        primaryAction: cm.description,
        requiresFocusSession: ["Execution", "Planning"].includes(cm.category),
      };
      reason = "System Default Match";
    }

    // Log the Triggered protocol
    const newLog = {
      id: crypto.randomUUID(),
      date: getTodayISO(),
      timestamp: new Date().toISOString(),
      protocolId: selectedProtocol.id,
      protocolName: selectedProtocol.name,
      category: selectedProtocol.category,
      status: "Triggered" as const,
      source,
      associatedState: state,
      associatedCause: cause,
      selectionReason: reason,
      timeOfDayHour: new Date().getHours(),
    };

    protocolRepository.addProtocol(newLog);
  }

  private getFallbackSystemDefault(state: string, cause: string) {
    const cLow = cause.toLowerCase();
    let cmId = "cm_five_min_rule"; // default

    if (state === "Anxious" && (cLow.includes("fear") || cLow.includes("uncertainty") || cLow.includes("deadline"))) {
      cmId = "cm_one_small_step";
    } else if ((state === "Heavy" || state === "Fatigued") && (cLow.includes("sleep") || cLow.includes("exhaustion"))) {
      cmId = "cm_tactical_nap";
    } else if (state === "Heavy" && cLow.includes("burnout")) {
      cmId = "cm_reprioritize";
    } else if (state === "Lonely" || cLow.includes("connection") || cLow.includes("isolation")) {
      cmId = "cm_call_friend";
    } else if (state === "Frustrated" && (cLow.includes("blocked") || cLow.includes("stuck"))) {
      cmId = "cm_break_task";
    } else if (state === "Overwhelmed" || cLow.includes("too many")) {
      cmId = "cm_reprioritize";
    } else if (state === "Disconnected" || cLow.includes("purpose")) {
      cmId = "cm_decision_matrix";
    } else if (["Anxious", "Overwhelmed", "Frustrated"].includes(state)) {
      cmId = "cm_recovery_walk";
    }

    return NEURAL_COUNTERMEASURES.find(c => c.id === cmId) || NEURAL_COUNTERMEASURES[0];
  }
}

export const protocolEngine = new ProtocolEngine();
