"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommendCountermeasureStack, buildMissionState, advanceMission, calculateProtocolAnalytics, shouldEscalateToEmergency } from "@/lib/countermeasures";
import { localCountermeasureRepository } from "@/lib/countermeasures";
import type { CountermeasureStackItem, MissionState, ProtocolAnalytics } from "@/lib/countermeasures";
import type { CustomCountermeasure, CreateCustomCountermeasureInput } from "@/lib/countermeasures/types";
import { COUNTERMEASURES, EXPECTED_OUTCOMES } from "@/lib/countermeasures/config";
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
  todaysDate: ISODate;
  latestStateLog: DailyStateLog | null;
  onCountermeasureActioned: () => void;
}

// ── V4.5: Mission view phases ────────────────────────────────────
type MissionPhase =
  | "dormant"
  | "briefing"
  | "active"
  | "resolved"
  | "fallback"
  | "abandoned";

const SEVERITY_COLORS: Record<string, { badge: string; text: string }> = {
  CRITICAL: { badge: "bg-signal/15 border border-signal/30 text-signal animate-pulse", text: "text-signal" },
  HIGH:     { badge: "bg-signal/15 border border-signal/30 text-signal", text: "text-signal" },
  MEDIUM:   { badge: "bg-warning/15 border border-warning/30 text-warning", text: "text-warning" },
  LOW:      { badge: "bg-emerald-400/15 border border-emerald-400/30 text-emerald-400", text: "text-emerald-400" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.LOW;
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${colors.badge}`}>
      {severity}
    </span>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const shakeVariants = {
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } },
};

// ── Custom protocols helpers ─────────────────────────────────────
function getStateChipColor(state: EmotionalState) {
  if ((POSITIVE_STATES as string[]).includes(state)) return "border-emerald-400/40 text-emerald-400";
  if ((NEUTRAL_STATES as string[]).includes(state)) return "border-warning/40 text-warning";
  return "border-signal/40 text-signal";
}

export default function CountermeasurePanel({
  todaysDate,
  latestStateLog,
  onCountermeasureActioned,
}: CountermeasurePanelProps) {
  // ── V4.5: Mission state ────────────────────────────────────────
  const [mission, setMission]       = useState<MissionState | null>(null);
  const [missionPhase, setMissionPhase] = useState<MissionPhase>("dormant");
  const [countdown, setCountdown]   = useState<number>(0);
  const [failedCmName, setFailedCmName] = useState<string | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // ── Protocol analytics ─────────────────────────────────────────
  const protocolAnalytics = useMemo<ProtocolAnalytics[]>(() => {
    return calculateProtocolAnalytics(localCountermeasureRepository.listLogs());
  }, [latestStateLog]); // Recalculate when check-in changes

  // ── Custom CM state ────────────────────────────────────────────
  const [customCMs, setCustomCMs] = useState<CustomCountermeasure[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCM, setNewCM] = useState<{
    name: string; description: string; category: string;
    triggerStates: EmotionalState[]; triggerCauses: string; durationMinutes: number;
  }>({ name: "", description: "", category: "", triggerStates: [], triggerCauses: "", durationMinutes: 10 });

  const loadCustomCMs = useCallback(() => {
    setCustomCMs(localCountermeasureRepository.listCustom());
  }, []);
  useEffect(() => { loadCustomCMs(); }, [loadCustomCMs]);

  // ── Is system active? ──────────────────────────────────────────
  const isActive = latestStateLog !== null && latestStateLog.riskScore >= 10;

  // ── Stack recommendation ───────────────────────────────────────
  const stackRecommendation = useMemo(() => {
    if (!isActive || !latestStateLog) return null;
    const logs = localCountermeasureRepository.listLogs();
    const beliefs = beliefRepo.list();
    const latestBelief = beliefs.length > 0 ? beliefs[beliefs.length - 1] : null;
    const cause = latestBelief?.primaryCause ?? null;
    const thought = latestBelief?.recurringThought ?? null;
    return recommendCountermeasureStack(
      { selectedStates: latestStateLog.selectedStates, date: todaysDate as ISODate },
      logs, cause, thought
    );
  }, [isActive, latestStateLog, todaysDate]);

  // ── Auto-build mission on new stack ────────────────────────────
  useEffect(() => {
    if (stackRecommendation && isActive) {
      const newMission = buildMissionState(stackRecommendation);
      setMission(newMission);
      setMissionPhase("briefing");
      setFailedCmName(null);
    } else {
      setMission(null);
      setMissionPhase("dormant");
    }
  }, [stackRecommendation, isActive]);

  // ── Countdown timer for active protocol ────────────────────────
  useEffect(() => {
    if (missionPhase === "active" && mission?.activeProtocol) {
      setCountdown(mission.activeProtocol.durationMinutes * 60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [missionPhase, mission?.activeProtocol?.cmId]);

  // ── Auto-dismiss resolved state ────────────────────────────────
  useEffect(() => {
    if (missionPhase === "resolved") {
      const timer = setTimeout(() => {
        setMission(null);
        setMissionPhase("dormant");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [missionPhase]);

  // ── Begin mission ──────────────────────────────────────────────
  const handleBeginMission = () => {
    if (!mission) return;
    audioManager.playClick();
    setMission({
      ...mission,
      activeProtocol: { ...mission.activeProtocol, status: "ACTIVE", startedAt: new Date().toISOString() },
    });
    setMissionPhase("active");
  };

  // ── Mission outcome handler ────────────────────────────────────
  const handleMissionOutcome = (outcome: "COMPLETED" | "FAILED" | "SKIPPED") => {
    if (!mission || !latestStateLog) return;

    const cmId = mission.activeProtocol.cmId;
    const stackItem = stackRecommendation?.stack.find((s) => s.countermeasure.id === cmId);

    // Log to localStorage
    localCountermeasureRepository.complete({
      date: todaysDate as ISODate,
      triggerStates: latestStateLog.selectedStates,
      detectedThreatId: mission.threatId,
      detectedNeed: mission.needName as any,
      countermeasureId: cmId,
      identity: stackItem?.identity ?? "Guardian",
      missionRedirect: stackItem?.missionRedirect ?? "Recovery Mission",
      accepted: outcome !== "SKIPPED",
      completed: outcome === "COMPLETED",
      notes: `Outcome: ${outcome}`,
      metadata: { outcome },
    });

    // Log to timeline
    localBehavioralTimelineRepository.addEvent({
      date: todaysDate,
      eventType: outcome === "COMPLETED" ? "countermeasure-completed" : outcome === "FAILED" ? "behavior-outcome" : "behavior-outcome",
      countermeasureId: cmId,
      threatId: mission.threatId,
      outcome: `Mission status: ${outcome}`,
      metadata: { outcome },
    });

    // Advance mission state machine
    const next = advanceMission(mission, outcome);
    setMission(next);

    // Determine phase
    if (outcome === "COMPLETED") {
      setMissionPhase("resolved");
      audioManager.playCountermeasureCompleted();
    } else if (next.resolutionState === "ABANDONED") {
      setMissionPhase("abandoned");
      audioManager.playToggle();
    } else {
      // Fallback — show transition
      setFailedCmName(mission.activeProtocol.cmName);
      setMissionPhase("fallback");
      if (outcome === "FAILED") {
        audioManager.playToggle();
      } else {
        audioManager.playClick();
      }
      // Auto-progress to briefing after 2s
      setTimeout(() => {
        setMissionPhase("briefing");
        setFailedCmName(null);
      }, 2000);
    }

    onCountermeasureActioned();
  };

  // ── Custom CM handlers (unchanged from V4.4) ──────────────────
  const handleCreateCustomCM = () => {
    if (!newCM.name.trim() || !newCM.description.trim()) return;
    const input: CreateCustomCountermeasureInput = {
      name: newCM.name.trim(), description: newCM.description.trim(),
      category: newCM.category.trim() || "Custom",
      triggerStates: newCM.triggerStates,
      triggerCauses: newCM.triggerCauses.split(",").map((c) => c.trim()).filter(Boolean),
      durationMinutes: newCM.durationMinutes,
    };
    localCountermeasureRepository.createCustom(input);
    audioManager.playClick();
    setNewCM({ name: "", description: "", category: "", triggerStates: [], triggerCauses: "", durationMinutes: 10 });
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

  // ── Get analytics for a protocol ───────────────────────────────
  const getAnalytics = (cmId: string): ProtocolAnalytics | null => {
    return protocolAnalytics.find((a) => a.protocolId === cmId) ?? null;
  };

  // ── Format countdown ──────────────────────────────────────────
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Get CM definition by ID ────────────────────────────────────
  const getCM = (id: string) => COUNTERMEASURES.find((c) => c.id === id);

  return (
    <div className={`panel p-4 transition-all duration-500 flex flex-col min-h-0 ${
      isActive ? "border-signal/15 shadow-[0_0_30px_rgba(255,42,42,0.08)]" : ""
    }`}>
      {/* Header */}
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/80">
          System 3 — Countermeasures
        </p>
        <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
          Countermeasure Dispatch
        </h2>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MISSION PHASES
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── DORMANT ──────────────────────────────────────────── */}
        {missionPhase === "dormant" && (
          <motion.div key="dormant" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="flex flex-col items-center justify-center py-10">
            <span className="relative mb-3 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <p className="font-mono text-sm uppercase text-emerald-400/60">
              System Clear — No active threats detected
            </p>
          </motion.div>
        )}

        {/* ── BRIEFING ─────────────────────────────────────────── */}
        {missionPhase === "briefing" && mission && stackRecommendation && (
          <motion.div key="briefing" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="space-y-4 overflow-y-auto pr-1 flex-1">

            {/* Threat + Need Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-white/8 bg-black/45 p-3 font-mono text-xs">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Active Threat</span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm uppercase text-white">{stackRecommendation.recommendedThreat.name}</span>
                  <SeverityBadge severity={stackRecommendation.recommendedThreat.severity} />
                </div>
                <p className="mt-1 text-[11px] text-white/50 leading-relaxed">{stackRecommendation.recommendedThreat.description}</p>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Underlying Need</span>
                <p className="font-display text-sm uppercase text-white">{stackRecommendation.recommendedNeed.name}</p>
                <p className="mt-1 text-[11px] text-white/50 leading-relaxed">{stackRecommendation.recommendedNeed.description}</p>
              </div>
            </div>

            {/* Mission Failure History */}
            {mission.failureCount > 0 && (
              <div className="border border-signal/20 bg-signal/[0.03] px-3 py-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                <span className="font-mono text-[10px] text-signal/80">
                  {mission.failureCount} protocol{mission.failureCount > 1 ? "s" : ""} failed — Fallback engaged
                </span>
                {mission.resolutionState === "ESCALATED" && (
                  <span className="ml-auto px-2 py-0.5 border border-signal/50 bg-signal/15 text-signal font-mono text-[8px] uppercase animate-pulse">
                    Emergency
                  </span>
                )}
              </div>
            )}

            {/* Primary Protocol Card */}
            {(() => {
              const cm = getCM(mission.activeProtocol.cmId);
              if (!cm) return null;
              const analytics = getAnalytics(cm.id);
              const stackItem = stackRecommendation.stack.find((s) => s.countermeasure.id === cm.id);
              const expectedOutcome = EXPECTED_OUTCOMES[cm.category] || "State Calibration";

              return (
                <div className="border-2 border-signal/30 bg-signal/[0.03] p-4 space-y-3 relative">
                  {/* Role badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border ${
                      mission.activeProtocol.role === "EMERGENCY"
                        ? "border-signal/50 bg-signal/15 text-signal animate-pulse"
                        : mission.activeProtocol.role === "SECONDARY"
                          ? "border-warning/50 bg-warning/15 text-warning"
                          : "border-emerald-400/50 bg-emerald-400/15 text-emerald-400"
                    }`}>
                      {mission.activeProtocol.role} Protocol
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-white/45">
                      <span>⌛ {cm.durationMinutes} Min</span>
                      {stackItem && <span>📊 {stackItem.confidenceScore}%</span>}
                    </div>
                  </div>

                  {/* Protocol name + description */}
                  <div>
                    <h3 className="font-display text-lg uppercase text-frost">{cm.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-white/60">{cm.description}</p>
                  </div>

                  {/* Analytics badge + Expected outcome */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 pt-2">
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Expected Outcome</span>
                      <span className="font-mono text-xs text-frost uppercase font-bold">{expectedOutcome}</span>
                    </div>
                    {analytics && analytics.totalUses > 0 && (
                      <div>
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Your History</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${
                            analytics.successRate > 70 ? "text-emerald-400" : analytics.successRate > 40 ? "text-warning" : "text-signal"
                          }`}>
                            {analytics.successRate}% Success
                          </span>
                          <span className="font-mono text-[9px] text-white/30">
                            ({analytics.totalUses} uses)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation logic */}
                  {stackItem && (
                    <div className="border-t border-white/5 pt-2">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Intelligence</span>
                      <p className="font-mono text-[10px] text-white/50 italic leading-relaxed">{stackItem.reason}</p>
                    </div>
                  )}

                  {/* BEGIN MISSION button */}
                  <button type="button" onClick={handleBeginMission}
                    className="w-full py-3 border-2 border-signal/50 bg-signal/15 text-signal font-display text-sm uppercase tracking-wider hover:bg-signal/25 hover:shadow-[0_0_20px_rgba(255,42,42,0.15)] transition-all duration-300 mt-1">
                    ▸ Begin Mission
                  </button>
                </div>
              );
            })()}

            {/* Fallback Queue Preview */}
            {mission.fallbackQueue.length > 0 && (
              <div className="border border-white/5 bg-black/30 p-2.5 space-y-1.5">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-white/25">
                  Fallback Queue ({mission.fallbackQueue.length})
                </span>
                {mission.fallbackQueue.map((fb, i) => {
                  const cm = getCM(fb.cmId);
                  const show = i === 0 || shouldEscalateToEmergency(mission.failureCount, latestStateLog?.riskScore ?? 0);
                  if (!show) return null;
                  return (
                    <div key={fb.cmId} className="flex items-center justify-between py-1 border-b border-white/3">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 font-mono text-[8px] uppercase border ${
                          fb.role === "EMERGENCY" ? "border-signal/30 text-signal/60" : "border-white/10 text-white/30"
                        }`}>{fb.role}</span>
                        <span className="font-mono text-[10px] text-white/40">{cm?.name ?? fb.cmId}</span>
                      </div>
                      <span className="font-mono text-[9px] text-white/20">{fb.durationMinutes}m</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE MISSION ───────────────────────────────────── */}
        {missionPhase === "active" && mission && (
          <motion.div key="active" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="flex-1 flex flex-col min-h-0">
            {(() => {
              const cm = getCM(mission.activeProtocol.cmId);
              const analytics = getAnalytics(mission.activeProtocol.cmId);
              if (!cm) return null;

              return (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  {/* Active Mission Card */}
                  <div className="border-2 border-signal/50 bg-signal/[0.04] p-5 space-y-4 relative overflow-hidden
                    shadow-[0_0_30px_rgba(255,42,42,0.1)] animate-[pulse-border_3s_ease-in-out_infinite]">
                    {/* Pulse overlay */}
                    <div className="absolute inset-0 bg-signal/[0.02] animate-pulse pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-signal">Active Mission</span>
                      </div>
                      <div className="font-mono text-2xl tabular-nums text-signal font-bold">
                        {formatCountdown(countdown)}
                      </div>
                    </div>

                    {/* Protocol Info */}
                    <div className="relative">
                      <h3 className="font-display text-2xl uppercase text-frost">{cm.name}</h3>
                      <p className="mt-1 font-mono text-sm text-white/60">{cm.description}</p>
                    </div>

                    {/* Stats row */}
                    <div className="relative grid grid-cols-3 gap-2 border-t border-signal/15 pt-3">
                      <div>
                        <span className="block font-mono text-[8px] uppercase tracking-wider text-white/25 mb-0.5">Duration</span>
                        <span className="font-mono text-xs text-white/70">{cm.durationMinutes} min</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[8px] uppercase tracking-wider text-white/25 mb-0.5">Identity</span>
                        <span className="font-mono text-xs text-signal/80">{cm.activatesIdentity}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[8px] uppercase tracking-wider text-white/25 mb-0.5">Success Rate</span>
                        <span className={`font-mono text-xs font-bold ${
                          analytics && analytics.successRate > 70 ? "text-emerald-400" : "text-white/50"
                        }`}>
                          {analytics ? `${analytics.successRate}%` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Threat context */}
                    <div className="relative border-t border-signal/10 pt-2">
                      <span className="font-mono text-[9px] text-white/25 uppercase tracking-wider">
                        Resolving: <span className="text-signal/70">{mission.threatName}</span>
                        {" → "}<span className="text-frost/70">{mission.needName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button type="button" onClick={() => handleMissionOutcome("COMPLETED")}
                      className="py-4 border-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 font-display text-sm uppercase tracking-wider hover:bg-emerald-400/20 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-300">
                      ✓ Complete
                    </button>
                    <button type="button" onClick={() => handleMissionOutcome("FAILED")}
                      className="py-4 border-2 border-signal/50 bg-signal/10 text-signal font-display text-sm uppercase tracking-wider hover:bg-signal/20 transition-all duration-300">
                      ✗ Abort
                    </button>
                  </div>

                  {/* Skip option (subtle) */}
                  <button type="button" onClick={() => handleMissionOutcome("SKIPPED")}
                    className="py-1.5 text-center font-mono text-[9px] uppercase tracking-wider text-white/25 hover:text-white/50 transition-colors">
                    Skip Protocol →
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ── RESOLVED ─────────────────────────────────────────── */}
        {missionPhase === "resolved" && mission && (
          <motion.div key="resolved" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="py-8 flex flex-col items-center space-y-4">
            <div className="w-full border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-6 space-y-4
              shadow-[0_0_40px_rgba(52,211,153,0.1)]">
              {/* Success header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="font-display text-2xl uppercase text-emerald-400 tracking-wider">
                    Mission Complete
                  </span>
                </div>
                <p className="font-mono text-[10px] text-emerald-400/60 uppercase tracking-wider">
                  Auto-archiving in 5 seconds
                </p>
              </div>

              {/* Resolution details */}
              <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/15 pt-4">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Threat</span>
                  <span className="font-mono text-xs text-emerald-400 line-through opacity-70">{mission.threatName}</span>
                  <span className="block font-mono text-[9px] text-emerald-400/50 uppercase mt-0.5">Resolved</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Protocol</span>
                  <span className="font-mono text-xs text-frost">{mission.activeProtocol.cmName}</span>
                  <span className="block font-mono text-[9px] text-emerald-400/50 uppercase mt-0.5">✓ Completed</span>
                </div>
              </div>

              {/* Outcome message */}
              <div className="border-t border-emerald-500/10 pt-3 text-center">
                <p className="font-mono text-[10px] text-emerald-400/60 leading-relaxed">
                  Threat pressure reduced. Protocol effectiveness logged.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FALLBACK TRANSITION ──────────────────────────────── */}
        {missionPhase === "fallback" && mission && (
          <motion.div key="fallback" variants={shakeVariants} animate="shake"
            className="py-8 flex flex-col items-center space-y-4">
            <div className="w-full border-2 border-signal/40 bg-signal/[0.04] p-5 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
                <span className="font-display text-lg uppercase text-signal">Protocol Failed</span>
              </div>
              {failedCmName && (
                <p className="font-mono text-xs text-white/50">
                  <span className="text-signal line-through">{failedCmName}</span> — did not resolve threat
                </p>
              )}
              <div className="border-t border-signal/15 pt-3">
                <span className="font-mono text-[10px] text-signal/60 uppercase tracking-wider animate-pulse">
                  Activating fallback protocol...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ABANDONED ────────────────────────────────────────── */}
        {missionPhase === "abandoned" && mission && (
          <motion.div key="abandoned" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="py-8 flex flex-col items-center space-y-4">
            <div className="w-full border border-white/10 bg-black/50 p-5 space-y-3 text-center">
              <span className="font-display text-lg uppercase text-white/40">Mission Abandoned</span>
              <p className="font-mono text-[10px] text-white/30 leading-relaxed">
                All protocols exhausted. Logging for review.
                <br />
                {mission.failureCount} failure{mission.failureCount !== 1 ? "s" : ""} recorded.
              </p>
              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                <div>
                  <span className="block font-mono text-[8px] uppercase text-white/20">Threat</span>
                  <span className="font-mono text-xs text-signal/60">{mission.threatName}</span>
                </div>
                <div>
                  <span className="block font-mono text-[8px] uppercase text-white/20">Status</span>
                  <span className="font-mono text-xs text-white/30">Unresolved</span>
                </div>
              </div>
              <button type="button" onClick={() => { setMission(null); setMissionPhase("dormant"); audioManager.playClick(); }}
                className="mt-2 px-4 py-1.5 border border-white/10 bg-white/5 font-mono text-[10px] text-white/40 uppercase tracking-wider hover:bg-white/10 transition-all">
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          MY PROTOCOLS SECTION (preserved from V4.4)
      ═══════════════════════════════════════════════════════════ */}
      <div className="mt-4 border border-white/8 bg-black/35 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            My Protocols ({customCMs.length})
          </span>
          <button type="button"
            onClick={() => { setShowCreateForm((prev) => !prev); audioManager.playClick(); }}
            className="font-mono text-[9px] uppercase tracking-wider text-signal/60 hover:text-signal transition-colors">
            {showCreateForm ? "— Close" : "+ Create"}
          </button>
        </div>

        {/* Custom CM List */}
        {customCMs.length > 0 && (
          <div className="space-y-2">
            {customCMs.map((cm) => (
              <div key={cm.id} className="border border-white/8 bg-white/[0.01] p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-sm uppercase text-frost truncate">{cm.name}</h4>
                    <p className="font-mono text-[11px] text-white/50 leading-relaxed mt-0.5">{cm.description}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteCustomCM(cm.id)}
                    className="font-mono text-[8px] text-signal/50 hover:text-signal uppercase tracking-wider transition-colors shrink-0 pt-0.5">
                    Delete
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 border border-white/15 text-[9px] font-mono uppercase text-white/50">{cm.category}</span>
                  <span className="font-mono text-[9px] text-white/30">⌛ {cm.durationMinutes} min</span>
                </div>
                {cm.triggerStates.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cm.triggerStates.map((state) => (
                      <span key={state} className={`px-2 py-1 border text-[9px] font-mono uppercase ${getStateChipColor(state as EmotionalState)}`}>
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="border border-white/10 bg-black/50 p-3 space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 block">
                  Create Custom Protocol
                </span>
                <input type="text" placeholder="Protocol Name *" value={newCM.name}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors" />
                <input type="text" placeholder="Description *" value={newCM.description}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Category (e.g. Training)" value={newCM.category}
                    onChange={(e) => setNewCM((prev) => ({ ...prev, category: e.target.value }))}
                    className="bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors" />
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={newCM.durationMinutes}
                      onChange={(e) => setNewCM((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 10 }))}
                      className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/55 transition-colors" />
                    <span className="font-mono text-[9px] text-white/30 uppercase shrink-0">Min</span>
                  </div>
                </div>
                <input type="text" placeholder="Trigger Causes (comma-separated)" value={newCM.triggerCauses}
                  onChange={(e) => setNewCM((prev) => ({ ...prev, triggerCauses: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-signal/55 transition-colors" />

                {/* Trigger States */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30 block mb-1.5">Trigger States</span>
                  <div className="space-y-1.5">
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-400/50 block mb-1">Positive</span>
                      <div className="flex flex-wrap gap-1">
                        {POSITIVE_STATES.map((state) => (
                          <button key={state} type="button" onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState) ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-400" : "border-white/10 text-white/30 hover:border-white/25"
                            }`}>{state}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-warning/50 block mb-1">Neutral</span>
                      <div className="flex flex-wrap gap-1">
                        {NEUTRAL_STATES.map((state) => (
                          <button key={state} type="button" onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState) ? "border-warning/60 bg-warning/15 text-warning" : "border-white/10 text-white/30 hover:border-white/25"
                            }`}>{state}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-signal/50 block mb-1">Negative</span>
                      <div className="flex flex-wrap gap-1">
                        {NEGATIVE_STATES.map((state) => (
                          <button key={state} type="button" onClick={() => toggleTriggerState(state as EmotionalState)}
                            className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all duration-200 ${
                              newCM.triggerStates.includes(state as EmotionalState) ? "border-signal/60 bg-signal/15 text-signal" : "border-white/10 text-white/30 hover:border-white/25"
                            }`}>{state}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={handleCreateCustomCM}
                  disabled={!newCM.name.trim() || !newCM.description.trim()}
                  className="w-full py-1.5 bg-signal/15 border border-signal/30 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
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
