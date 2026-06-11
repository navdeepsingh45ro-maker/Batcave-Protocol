"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommendCountermeasureStack } from "@/lib/countermeasures";
import { localCountermeasureRepository } from "@/lib/countermeasures";
import type { CountermeasureStackItem } from "@/lib/countermeasures";
import type { CustomCountermeasure, CreateCustomCountermeasureInput } from "@/lib/countermeasures/types";
import { beliefRepo } from "@/lib/belief-intelligence";
import { localFoundationRepository } from "@/lib/foundation";
import { calculateBeliefCorrelations } from "@/lib/belief-intelligence/calculations";
import { localBehavioralTimelineRepository } from "@/lib/behavioral-timeline";
import { audioManager } from "@/lib/audioManager";
import { POSITIVE_STATES, NEUTRAL_STATES, NEGATIVE_STATES } from "@/lib/belief-intelligence/config";
import type { ISODate } from "@/lib/foundation";
import type { DailyStateLog } from "@/lib/state-detection";
import type { EmotionalState } from "@/lib/state-detection";

interface CountermeasurePanelProps {
  todaysDate: ISODate; // ISODate format
  latestStateLog: DailyStateLog | null;
  onCountermeasureActioned: () => void;
}

const SEVERITY_COLORS: Record<string, { badge: string; text: string }> = {
  CRITICAL: {
    badge: "bg-signal/15 border border-signal/30 text-signal animate-pulse",
    text: "text-signal",
  },
  HIGH: {
    badge: "bg-signal/15 border border-signal/30 text-signal",
    text: "text-signal",
  },
  MEDIUM: {
    badge: "bg-warning/15 border border-warning/30 text-warning",
    text: "text-warning",
  },
  LOW: {
    badge: "bg-emerald-400/15 border border-emerald-400/30 text-emerald-400",
    text: "text-emerald-400",
  },
};

const ROLE_BADGES: Record<string, string> = {
  PRIMARY: "bg-emerald-400/10 border border-emerald-400/35 text-emerald-400",
  SECONDARY: "bg-warning/10 border border-warning/35 text-warning",
  EMERGENCY: "bg-signal/10 border border-signal/35 text-signal animate-pulse",
};

// Map categories to expected outcomes
const EXPECTED_OUTCOMES: Record<string, string> = {
  "Mental Reset": "Clarity Reclamation",
  "Striker Work": "Physical Readiness",
  "Builder Work": "Momentum Recovery",
  "Knowledge Intake": "Cognitive Calibration",
  "Sleep Protection": "Circadian Defense",
  "Digital Control": "Attention Isolation",
  "Mission Simplification": "Action Clarification",
  "Connection": "Relational Alignment",
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.LOW;
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${colors.badge}`}
    >
      {severity}
    </span>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3 },
  },
};

export default function CountermeasurePanel({
  todaysDate,
  latestStateLog,
  onCountermeasureActioned,
}: CountermeasurePanelProps) {
  const [actionedCountermeasures, setActionedCountermeasures] = useState<
    Record<string, "ACCEPTED" | "COMPLETED" | "FAILED" | "SKIPPED">
  >({});

  // ── V4.4: Custom Countermeasure State ──────────────────────────
  const [customCMs, setCustomCMs] = useState<CustomCountermeasure[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCM, setNewCM] = useState<{
    name: string;
    description: string;
    category: string;
    triggerStates: EmotionalState[];
    triggerCauses: string;
    durationMinutes: number;
  }>({
    name: "",
    description: "",
    category: "",
    triggerStates: [],
    triggerCauses: "",
    durationMinutes: 10,
  });

  const loadCustomCMs = useCallback(() => {
    setCustomCMs(localCountermeasureRepository.listCustom());
  }, []);

  useEffect(() => {
    loadCustomCMs();
  }, [loadCustomCMs]);

  const handleCreateCustomCM = () => {
    if (!newCM.name.trim() || !newCM.description.trim()) return;
    const input: CreateCustomCountermeasureInput = {
      name: newCM.name.trim(),
      description: newCM.description.trim(),
      category: newCM.category.trim() || "Custom",
      triggerStates: newCM.triggerStates,
      triggerCauses: newCM.triggerCauses
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      durationMinutes: newCM.durationMinutes,
    };
    localCountermeasureRepository.createCustom(input);
    audioManager.playClick();
    setNewCM({
      name: "",
      description: "",
      category: "",
      triggerStates: [],
      triggerCauses: "",
      durationMinutes: 10,
    });
    setShowCreateForm(false);
    loadCustomCMs();
  };

  const handleDeleteCustomCM = (id: string) => {
    localCountermeasureRepository.deleteCustom(id);
    audioManager.playClick();
    loadCustomCMs();
  };

  const toggleTriggerState = (state: EmotionalState) => {
    setNewCM((prev) => ({
      ...prev,
      triggerStates: prev.triggerStates.includes(state)
        ? prev.triggerStates.filter((s) => s !== state)
        : [...prev.triggerStates, state],
    }));
  };

  const getStateChipColor = (state: EmotionalState) => {
    if ((POSITIVE_STATES as string[]).includes(state)) return "border-emerald-400/40 text-emerald-400";
    if ((NEUTRAL_STATES as string[]).includes(state)) return "border-warning/40 text-warning";
    return "border-signal/40 text-signal";
  };

  const isActive = latestStateLog !== null && latestStateLog.riskScore >= 10;

  // Reset actions when check-in changes
  useEffect(() => {
    setActionedCountermeasures({});
  }, [latestStateLog]);

  const stackRecommendation = useMemo(() => {
    if (!isActive || !latestStateLog) return null;
    const logs = localCountermeasureRepository.listLogs();
    const beliefs = beliefRepo.list();

    // Get cause and thought from the most recent belief check-in (Issue 4)
    const latestBelief = beliefs.length > 0 ? beliefs[beliefs.length - 1] : null;
    const cause = latestBelief?.primaryCause ?? null;
    const thought = latestBelief?.recurringThought ?? null;

    return recommendCountermeasureStack(
      { selectedStates: latestStateLog.selectedStates, date: todaysDate as ISODate },
      logs,
      cause,
      thought
    );
  }, [isActive, latestStateLog, todaysDate]);

  // Compute correlation-driven reason why this recommendation exists
  const recommendationReasons = useMemo(() => {
    if (!stackRecommendation) return {};
    const beliefs = beliefRepo.list();
    const activities = localFoundationRepository.listFoundationActivities();
    const correlations = calculateBeliefCorrelations(beliefs, activities);

    // Get primary cause from latest belief check-in
    const latestBelief = beliefs[beliefs.length - 1];
    const cause = latestBelief?.primaryCause;

    const reasons: Record<string, string> = {};

    stackRecommendation.stack.forEach((item) => {
      const category = item.countermeasure.category;
      
      // Look for a matching correlation for this cause and this foundation category
      const match = correlations.find(
        (c) => c.cause === cause && c.foundation === category
      );

      if (match && match.skipPercent > 0 && match.occurrences >= 2) {
        reasons[item.countermeasure.id] = `${cause} has historically reduced ${category} completion (${match.skipPercent}% skip rate).`;
      } else if (cause) {
        reasons[item.countermeasure.id] = `Active cause "${cause}" demands high-priority ${category} stabilization.`;
      } else {
        reasons[item.countermeasure.id] = `${item.countermeasure.name} is recommended to resolve ${stackRecommendation.recommendedThreat.name}.`;
      }
    });

    return reasons;
  }, [stackRecommendation]);

  const handleAction = (item: CountermeasureStackItem, outcome: "ACCEPTED" | "COMPLETED" | "FAILED" | "SKIPPED") => {
    if (!latestStateLog) return;
    audioManager.playClick();

    const accepted = outcome !== "SKIPPED";
    const completed = outcome === "COMPLETED";

    // 1. Log Countermeasure Outcome
    localCountermeasureRepository.complete({
      date: todaysDate as ISODate,
      triggerStates: latestStateLog.selectedStates,
      detectedThreatId: item.detectedThreat.id,
      detectedNeed: item.recommendedNeed.name,
      countermeasureId: item.countermeasure.id,
      identity: item.identity,
      missionRedirect: item.missionRedirect,
      accepted,
      completed,
      notes: `Outcome: ${outcome}`,
      metadata: { outcome },
    });

    // 2. Track Event in Behavioral Timeline
    let timelineType: any = "behavior-outcome";
    if (outcome === "ACCEPTED") timelineType = "countermeasure-accepted";
    if (outcome === "COMPLETED") timelineType = "countermeasure-completed";

    localBehavioralTimelineRepository.addEvent({
      date: todaysDate,
      eventType: timelineType,
      countermeasureId: item.countermeasure.id,
      threatId: item.detectedThreat.id,
      outcome: `Mission status updated to: ${outcome}`,
      metadata: { outcome },
    });

    setActionedCountermeasures((prev) => ({
      ...prev,
      [item.countermeasure.id]: outcome,
    }));

    // Play sounds
    if (outcome === "ACCEPTED") {
      audioManager.playCountermeasureAccepted();
    } else if (outcome === "COMPLETED") {
      audioManager.playCountermeasureCompleted();
    } else {
      audioManager.playToggle();
    }

    onCountermeasureActioned();
  };

  return (
    <div
      className={`panel p-4 transition-all duration-500 flex flex-col min-h-0 ${
        isActive
          ? "border-signal/15 shadow-[0_0_30px_rgba(255,42,42,0.08)]"
          : ""
      }`}
    >
      {/* Header */}
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/80">
          System 3 — Countermeasures
        </p>
        <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
          Countermeasure Dispatch
        </h2>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.div
            key="dormant"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center py-10"
          >
            <span className="relative mb-3 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <p className="font-mono text-sm uppercase text-emerald-400/60">
              System Clear — No active threats detected
            </p>
          </motion.div>
        )}

        {isActive && stackRecommendation && (
          <motion.div
            key="dispatch-stack"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 overflow-y-auto pr-1 flex-1"
          >
            {/* Threat & Need Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-white/8 bg-black/45 p-3 font-mono text-xs">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Active Threat</span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm uppercase text-white">
                    {stackRecommendation.recommendedThreat.name}
                  </span>
                  <SeverityBadge
                    severity={stackRecommendation.recommendedThreat.severity}
                  />
                </div>
                <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                  {stackRecommendation.recommendedThreat.description}
                </p>
              </div>

              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Underlying Need</span>
                <p className="font-display text-sm uppercase text-white">
                  {stackRecommendation.recommendedNeed.name}
                </p>
                <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                  {stackRecommendation.recommendedNeed.description}
                </p>
              </div>
            </div>

            {/* Countermeasure Stack List */}
            <div className="space-y-3">
              {stackRecommendation.stack.map((item) => {
                const cmId = item.countermeasure.id;
                const status = actionedCountermeasures[cmId];
                const isActioned = !!status;
                const reason = recommendationReasons[cmId] || item.reason;
                const expectedOutcome = EXPECTED_OUTCOMES[item.countermeasure.category] || "State Calibration";

                let cardBorderClass = "border-white/8 bg-white/[0.01]";
                if (status === "COMPLETED") cardBorderClass = "border-emerald-500/30 bg-emerald-500/[0.04] shadow-[0_0_15px_rgba(52,211,153,0.05)]";
                if (status === "ACCEPTED") cardBorderClass = "border-warning/30 bg-warning/[0.04]";
                if (status === "FAILED") cardBorderClass = "border-signal/30 bg-signal/[0.04]";
                if (status === "SKIPPED") cardBorderClass = "border-white/5 bg-black/20 opacity-50";

                return (
                  <div
                    key={cmId}
                    className={`border p-3 transition-all duration-300 space-y-2.5 ${cardBorderClass}`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${ROLE_BADGES[item.role]}`}>
                        {item.role} Protocol
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-white/45">
                        <span>⌛ {item.countermeasure.durationMinutes} Min</span>
                        <span>📊 Match: {item.confidenceScore}%</span>
                      </div>
                    </div>

                    {/* Countermeasure Info */}
                    <div>
                      <h3 className="font-display text-base uppercase text-frost">
                        {item.countermeasure.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-white/60">
                        {item.countermeasure.description}
                      </p>
                    </div>

                    {/* Expected Outcome & Reason */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 pt-2 font-mono text-[10px]">
                      <div>
                        <span className="block uppercase text-white/30 tracking-wider">Expected Outcome</span>
                        <span className="text-frost uppercase font-bold">{expectedOutcome}</span>
                      </div>
                      <div>
                        <span className="block uppercase text-white/30 tracking-wider">Recommendation Logic</span>
                        <p className="text-white/50 italic leading-relaxed">{reason}</p>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {isActioned ? (
                        <div
                          className={`w-full py-1.5 text-center font-display text-xs uppercase tracking-wider border ${
                            status === "COMPLETED"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : status === "ACCEPTED"
                                ? "border-warning/40 bg-warning/10 text-warning"
                                : status === "FAILED"
                                  ? "border-signal/40 bg-signal/10 text-signal"
                                  : "border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          {status === "COMPLETED" && "✓ Mission Completed"}
                          {status === "ACCEPTED" && "✓ Mission Accepted"}
                          {status === "FAILED" && "✗ Mission Failed"}
                          {status === "SKIPPED" && "▸ Mission Skipped"}
                        </div>
                      ) : (
                        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAction(item, "ACCEPTED")}
                            className="py-1.5 border border-warning/40 bg-warning/10 text-[10px] font-display uppercase tracking-wider text-warning hover:bg-warning/20 transition-all duration-200"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item, "COMPLETED")}
                            className="py-1.5 border border-emerald-400/40 bg-emerald-400/10 text-[10px] font-display uppercase tracking-wider text-emerald-400 hover:bg-emerald-400/20 transition-all duration-200"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item, "FAILED")}
                            className="py-1.5 border border-signal/40 bg-signal/10 text-[10px] font-display uppercase tracking-wider text-signal hover:bg-signal/20 transition-all duration-200"
                          >
                            Failed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item, "SKIPPED")}
                            className="py-1.5 border border-white/20 bg-white/5 text-[10px] font-display uppercase tracking-wider text-white/50 hover:bg-white/10 transition-all duration-200"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── V4.4: My Protocols Section ──────────────────────────── */}
      <div className="mt-4 border border-white/8 bg-black/35 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            My Protocols ({customCMs.length})
          </span>
          <button
            type="button"
            onClick={() => { setShowCreateForm((prev) => !prev); audioManager.playClick(); }}
            className="font-mono text-[9px] uppercase tracking-wider text-signal/60 hover:text-signal transition-colors"
          >
            {showCreateForm ? "— Close" : "+ Create"}
          </button>
        </div>

        {/* Custom CM List */}
        {customCMs.length > 0 && (
          <div className="space-y-2">
            {customCMs.map((cm) => (
              <div
                key={cm.id}
                className="border border-white/8 bg-white/[0.01] p-2.5 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-sm uppercase text-frost truncate">
                      {cm.name}
                    </h4>
                    <p className="font-mono text-[11px] text-white/50 leading-relaxed mt-0.5">
                      {cm.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomCM(cm.id)}
                    className="font-mono text-[8px] text-signal/50 hover:text-signal uppercase tracking-wider transition-colors shrink-0 pt-0.5"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 border border-white/15 text-[9px] font-mono uppercase text-white/50">
                    {cm.category}
                  </span>
                  <span className="font-mono text-[9px] text-white/30">
                    ⌛ {cm.durationMinutes} min
                  </span>
                </div>
                {cm.triggerStates.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cm.triggerStates.map((state) => (
                      <span
                        key={state}
                        className={`px-2 py-1 border text-[9px] font-mono uppercase ${getStateChipColor(state as EmotionalState)}`}
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {customCMs.length === 0 && !showCreateForm && (
          <p className="font-mono text-[10px] text-white/25 text-center py-3">
            No custom protocols created yet.
          </p>
        )}

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-white/10 bg-black/50 p-3 space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 block">
                  Create Custom Protocol
                </span>

                {/* Name */}
                <input
                  type="text"
                  placeholder="Protocol Name *"
                  value={newCM.name}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors"
                />

                {/* Description */}
                <input
                  type="text"
                  placeholder="Description *"
                  value={newCM.description}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors"
                />

                {/* Category + Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Category (e.g. Training)"
                    value={newCM.category}
                    onChange={(e) => setNewCM((prev) => ({ ...prev, category: e.target.value }))}
                    className="bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={newCM.durationMinutes}
                      onChange={(e) => setNewCM((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 10 }))}
                      className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/55 transition-colors"
                    />
                    <span className="font-mono text-[9px] text-white/30 uppercase shrink-0">Min</span>
                  </div>
                </div>

                {/* Trigger Causes */}
                <input
                  type="text"
                  placeholder="Trigger Causes (comma-separated)"
                  value={newCM.triggerCauses}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, triggerCauses: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors"
                />

                {/* Trigger States Multi-Select */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30 block mb-1.5">
                    Trigger States
                  </span>
                  <div className="space-y-1.5">
                    {/* Positive */}
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-400/50 block mb-1">
                        Positive
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {POSITIVE_STATES.map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState)
                                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-400"
                                : "border-white/10 text-white/30 hover:border-white/25"
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Neutral */}
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-warning/50 block mb-1">
                        Neutral
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {NEUTRAL_STATES.map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState)
                                ? "border-warning/60 bg-warning/15 text-warning"
                                : "border-white/10 text-white/30 hover:border-white/25"
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Negative */}
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-signal/50 block mb-1">
                        Negative
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {NEGATIVE_STATES.map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState)
                                ? "border-signal/60 bg-signal/15 text-signal"
                                : "border-white/10 text-white/30 hover:border-white/25"
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleCreateCustomCM}
                  disabled={!newCM.name.trim() || !newCM.description.trim()}
                  className="w-full py-1.5 bg-signal/15 border border-signal/30 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Deploy Protocol
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
