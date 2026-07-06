"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  POSITIVE_STATES,
  NEUTRAL_STATES,
  NEGATIVE_STATES,
  getStateCategory,
  getCausesForCategory,
  getThoughtSuggestions,
} from "@/lib/belief-intelligence/config";
import type { BeliefState, BeliefCause, ThoughtType, DecisionMatrixEntry, StateCategory } from "@/lib/belief-intelligence/types";
import { beliefRepo, decisionRepo, decisionUsageRepo } from "@/lib/belief-intelligence";
import { detectThreat, detectNeed, getMomentumRecommendations } from "@/lib/countermeasures";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { localBehavioralTimelineRepository } from "@/lib/behavioral-timeline";
import { audioManager } from "@/lib/audioManager";
import type { ISODate, DailyStateLog } from "@/lib/state-detection";

interface StatePanelProps {
  todaysDate: ISODate;
  onStateCheckedIn: (log: DailyStateLog) => void;
}

// ── Step definitions ──────────────────────────────────────────
const STEP_TITLES = [
  "Dominant State",
  "Primary Cause",
  "Dominant Thought",
  "Thought Classification",
  "Response",
];

// ── V4.4: State category colors ────────────────────────────────
const STATE_CATEGORY_STYLE: Record<StateCategory, { selected: string; header: string; dot: string }> = {
  positive: {
    selected: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]",
    header: "text-emerald-400/70",
    dot: "bg-emerald-400",
  },
  neutral: {
    selected: "border-frost/40 bg-frost/10 text-frost shadow-[0_0_8px_rgba(160,204,255,0.15)]",
    header: "text-frost/70",
    dot: "bg-frost",
  },
  negative: {
    selected: "border-signal/40 bg-signal/10 text-signal shadow-[0_0_8px_rgba(255,42,42,0.15)]",
    header: "text-signal/70",
    dot: "bg-signal",
  },
};

const DRAFT_KEY = "batcave.checkin.draft";

interface CheckInDraft {
  step: number;
  selectedStates: BeliefState[];
  primaryCause: BeliefCause | null;
  dominantThought: string;
  thoughtType: ThoughtType | null;
}

function loadDraft(): CheckInDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckInDraft>;
    return {
      step:           parsed.step           ?? 1,
      selectedStates: parsed.selectedStates ?? [],
      primaryCause:   parsed.primaryCause   ?? null,
      dominantThought: (parsed as any).dominantThought ?? (parsed as any).recurringThought ?? "",
      thoughtType:    parsed.thoughtType    ?? null,
    };
  } catch {
    return null;
  }
}
function saveDraft(d: CheckInDraft) {
  if (typeof window !== "undefined") window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}
function clearDraft() {
  if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
}

export default function StatePanel({ todaysDate, onStateCheckedIn }: StatePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (!userToggled) {
      const logs = localStateDetectionRepository.getStateLogsForDate(todaysDate);
      const hasLogs = logs.length > 0;
      const latest = logs.length > 0 ? logs[logs.length - 1] : null;
      const isThreat = latest && latest.riskScore >= 10;
      if (hasLogs || isThreat) {
        setIsCollapsed(false);
      }
    }
  }, [todaysDate, userToggled]);

  // ── Restore draft on mount ────────────────────────────────
  const [step, setStep]                     = useState<number>(() => loadDraft()?.step ?? 1);
  // V4.4: Single dominant state — still array for migration compat
  const [selectedStates, setSelectedStates] = useState<BeliefState[]>(() => loadDraft()?.selectedStates ?? []);
  const [primaryCause, setPrimaryCause]     = useState<BeliefCause | null>(() => loadDraft()?.primaryCause ?? null);
  const [dominantThought, setDominantThought] = useState<string>(() => loadDraft()?.dominantThought ?? "");
  const [thoughtType, setThoughtType]       = useState<ThoughtType | null>(() => loadDraft()?.thoughtType ?? null);

  // Matrix view state
  const [showMatrixManager, setShowMatrixManager] = useState(false);
  const [decisions, setDecisions]                 = useState<DecisionMatrixEntry[]>([]);
  const [evidenceInputs, setEvidenceInputs]       = useState<Record<string, string>>({});

  // Inline decision creation (for Step 5b when no match)
  const [newRecurringThought, setNewRecurringThought] = useState("");
  const [newLimitingBelief, setNewLimitingBelief]     = useState("");
  const [newDecision, setNewDecision]                 = useState("");
  const [newEmpoweringBelief, setNewEmpoweringBelief] = useState("");
  const [newEvidence, setNewEvidence]                 = useState("");

  const refreshDecisions = useCallback(() => {
    setDecisions(decisionRepo.list().filter((d) => !d.archived));
  }, []);

  useEffect(() => { refreshDecisions(); }, [refreshDecisions]);

  // ── Persist draft on every change ────────────────────────
  const prevDraft = useRef("");
  useEffect(() => {
    const draft: CheckInDraft = { step, selectedStates, primaryCause, dominantThought, thoughtType };
    const s = JSON.stringify(draft);
    if (s !== prevDraft.current) { prevDraft.current = s; saveDraft(draft); }
  }, [step, selectedStates, primaryCause, dominantThought, thoughtType]);

  // ── V4.4: Derive state category from single selection ─────
  const dominantState: BeliefState | null = selectedStates[0] ?? null;
  const stateCategory: StateCategory = dominantState ? getStateCategory(dominantState) : "neutral";

  // ── V4.4: Dynamic causes based on state category ──────────
  const dynamicCauses = useMemo(() => getCausesForCategory(stateCategory), [stateCategory]);

  // ── V4.4: Smart thought suggestions (State + Cause) ───────
  const thoughtSuggestions = useMemo(() => {
    return getThoughtSuggestions(dominantState ?? "", primaryCause);
  }, [dominantState, primaryCause]);

  // ── Step 5 analysis (threat / need) — only for limiting ───
  const analysis = useMemo(() => {
    if (selectedStates.length === 0 || thoughtType !== "limiting") return null;
    const threat = detectThreat(selectedStates as any);
    const need   = detectNeed(threat.id);
    return { threat, need, confidence: Math.min(95, 50 + selectedStates.length * 8) };
  }, [selectedStates, thoughtType]);

  // ── V4.4: Momentum actions for positive states ────────────
  const momentumActions = useMemo(() => getMomentumRecommendations(), []);

  // ── Decision Matrix match (on dominantThought) ────────────
  const matchedDecision = useMemo(() => {
    const thought = dominantThought.trim().toLowerCase();
    if (!thought) return null;
    const items = decisionRepo.list().filter((d) => !d.archived);
    const byThought = items.find((d) =>
      d.recurringThought && d.recurringThought.toLowerCase().includes(thought)
    );
    if (byThought) return byThought;
    return items.find((d) =>
      d.limitingBelief.toLowerCase().includes(thought) ||
      thought.includes(d.limitingBelief.toLowerCase().substring(0, 10))
    ) ?? null;
  }, [dominantThought]);

  const usageCountMap = useMemo(() => decisionUsageRepo.usageCountMap(), []);

  // ── Final submit ──────────────────────────────────────────
  const handleFinalSubmit = () => {
    if (selectedStates.length === 0) return;

    beliefRepo.create({
      date:           todaysDate,
      states:         selectedStates,
      stateCategory,
      primaryCause,
      dominantThought: dominantThought.trim() || null,
      thoughtType,
    });

    const stateLog = localStateDetectionRepository.addStateLog({
      date:          todaysDate,
      selectedStates: selectedStates as any,
      metadata: {
        stateCategory,
        thoughtType: thoughtType ?? null,
        dominantThought: dominantThought.trim() || null,
        primaryCause: primaryCause ?? null,
      },
    });

    localBehavioralTimelineRepository.addEvent({
      date:      todaysDate,
      eventType: "state-check-in",
      states:    selectedStates as any,
      outcome:   `Cause: ${primaryCause ?? "None"}. Thought: "${dominantThought.trim() || "None"}" [${thoughtType ?? "unclassified"}]`,
    });

    if (analysis) {
      localBehavioralTimelineRepository.addEvent({
        date:      todaysDate,
        eventType: "threat-detected",
        threatId:  analysis.threat.id,
        need:      analysis.need.name as any,
      });
    }

    if (matchedDecision && thoughtType === "limiting") {
      decisionUsageRepo.track({
        decisionId: matchedDecision.id,
        usedAt:     new Date().toISOString(),
        context:    { relatedCause: primaryCause || undefined },
      });
    }

    onStateCheckedIn(stateLog);
    clearDraft();
    audioManager.playCheckinComplete();

    // Reset
    setStep(1); setSelectedStates([]); setPrimaryCause(null);
    setDominantThought(""); setThoughtType(null);
  };

  // ── V4.4: Single state selection handler ──────────────────
  const handleStateSelect = (state: BeliefState) => {
    audioManager.playClick();
    setSelectedStates([state]); // V4.4: single dominant state
    setPrimaryCause(null);      // Reset cause when state changes
  };

  // ── Decision Matrix CRUD ──────────────────────────────────
  const handleAddDecision = () => {
    if (!newLimitingBelief.trim() || !newDecision.trim()) return;
    decisionRepo.create({
      recurringThought:    newRecurringThought.trim() || dominantThought.trim() || null,
      limitingBelief:      newLimitingBelief.trim(),
      newDecision:         newDecision.trim(),
      newEmpoweringBelief: newEmpoweringBelief.trim() || null,
      evidence:            newEvidence.trim() ? [newEvidence.trim()] : [],
    });
    refreshDecisions();
    setNewRecurringThought(""); setNewLimitingBelief("");
    setNewDecision(""); setNewEmpoweringBelief(""); setNewEvidence("");
    audioManager.playToggle();
  };

  const handleAddEvidence = (id: string) => {
    const text = evidenceInputs[id]?.trim();
    if (!text) return;
    decisionRepo.addEvidence({ decisionId: id, evidence: text });
    setEvidenceInputs((prev) => ({ ...prev, [id]: "" }));
    refreshDecisions();
    audioManager.playClick();
  };

  const handleRemoveEvidence = (id: string, idx: number) => {
    decisionRepo.removeEvidence({ decisionId: id, evidenceIndex: idx });
    refreshDecisions(); audioManager.playClick();
  };

  const handleArchiveEntry = (id: string) => {
    decisionRepo.update({ id, archived: true });
    refreshDecisions(); audioManager.playToggle();
  };

  // ── Thought suggestion click ──────────────────────────────
  const handleThoughtSuggestion = (t: string) => {
    audioManager.playClick();
    setDominantThought(t);
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4 relative">
      {/* ── Header ─────────────────────────────────────────── */}
      <div 
        onClick={() => {
          audioManager.playClick();
          setIsCollapsed(!isCollapsed);
          setUserToggled(true);
        }}
        className="mb-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">
            System 2 — Belief Intelligence
          </p>
          <h2 className="font-display text-lg uppercase text-frost flex items-center gap-2">
            <span>{showMatrixManager ? "Decision Matrix" : "Neural Check-In"}</span>
            <span className="text-white/20 text-xs">{isCollapsed ? "▼" : "▲"}</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioManager.playToggle();
            setShowMatrixManager(!showMatrixManager);
            setIsCollapsed(false);
          }}
          className="px-2.5 py-1 border border-white/10 bg-white/[0.02] hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider text-frost transition-all duration-200"
        >
          {showMatrixManager ? "▸ Check-In" : "⚙ Matrix"}
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            key="expanded-content"
          >
            {/* ── Draft recovery banner ───────────────────────────── */}
            {!showMatrixManager && step > 1 && (
              <div className="mb-3 flex items-center gap-2 border border-warning/20 bg-warning/[0.03] px-3 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-warning/70">
                  ⏱ Draft — Step {step} of 5
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft(); setStep(1); setSelectedStates([]);
                    setPrimaryCause(null); setDominantThought(""); setThoughtType(null);
                    audioManager.playClick();
                  }}
                  className="ml-auto font-mono text-[8px] uppercase text-white/30 hover:text-signal transition-colors"
                >
                  × Discard
                </button>
              </div>
            )}

      {/* ═══════════════════════════════════════════════════════
          MATRIX MANAGER VIEW
      ═══════════════════════════════════════════════════════ */}
      {showMatrixManager ? (
        <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">
          {/* Create form */}
          <div className="border border-white/8 bg-black/45 p-3 space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/40">Add Belief Mapping</h3>
            <input type="text" placeholder="Recurring / Dominant Thought"
              value={newRecurringThought} onChange={(e) => setNewRecurringThought(e.target.value)}
              className="w-full bg-black/30 border border-signal/20 px-3 py-1.5 font-mono text-xs text-signal placeholder-signal/25 focus:border-signal/50 focus:outline-none" />
            <input type="text" placeholder="Limiting Belief"
              value={newLimitingBelief} onChange={(e) => setNewLimitingBelief(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none" />
            <input type="text" placeholder="Counter Decision"
              value={newDecision} onChange={(e) => setNewDecision(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none" />
            <input type="text" placeholder="New Empowering Belief (V4.1)"
              value={newEmpoweringBelief} onChange={(e) => setNewEmpoweringBelief(e.target.value)}
              className="w-full bg-black/30 border border-frost/20 px-3 py-1.5 font-mono text-xs text-frost placeholder-frost/25 focus:border-frost/50 focus:outline-none" />
            <input type="text" placeholder="First Evidence (optional)"
              value={newEvidence} onChange={(e) => setNewEvidence(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none" />
            <button type="button" onClick={handleAddDecision}
              disabled={!newLimitingBelief.trim() || !newDecision.trim()}
              className="w-full py-1.5 bg-signal/15 border border-signal/30 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
              Commit Matrix Entry
            </button>
          </div>

          {/* Matrix cards */}
          {decisions.length === 0 ? (
            <p className="font-mono text-xs text-white/25 text-center py-6">No matrix entries committed.</p>
          ) : (
            decisions.map((dec) => (
              <div key={dec.id} className="border border-white/5 bg-white/[0.01] p-3 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-display text-xs text-signal uppercase">{usageCountMap[dec.id] ?? 0}× Used</span>
                  <button type="button" onClick={() => handleArchiveEntry(dec.id)}
                    className="font-mono text-[8px] text-white/25 hover:text-signal transition-colors uppercase tracking-wider">
                    Archive ↓
                  </button>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {dec.recurringThought && (
                    <p><span className="text-signal/50 uppercase text-[9px] tracking-wider block">Thought</span>&quot;{dec.recurringThought}&quot;</p>
                  )}
                  <p><span className="text-white/35 uppercase text-[9px] tracking-wider block">Limiting Belief</span><span className="text-white/70">&quot;{dec.limitingBelief}&quot;</span></p>
                  {dec.newEmpoweringBelief && (
                    <p><span className="text-emerald-400/55 uppercase text-[9px] tracking-wider block">Empowering Belief</span><span className="text-emerald-400/80">&quot;{dec.newEmpoweringBelief}&quot;</span></p>
                  )}
                  <p><span className="text-frost/50 uppercase text-[9px] tracking-wider block">Counter Decision</span><span className="text-frost font-bold">&quot;{dec.newDecision}&quot;</span></p>
                </div>
                {/* Evidence CRUD */}
                <div className="border-t border-white/5 pt-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-1.5">Evidence ({dec.evidence.length})</span>
                  {dec.evidence.length === 0
                    ? <p className="font-mono text-[10px] italic text-white/20">No evidence yet.</p>
                    : <div className="space-y-1">{dec.evidence.map((ev, eIdx) => (
                        <div key={eIdx} className="flex items-start justify-between gap-2 group">
                          <p className="font-mono text-[10px] text-white/60 flex-1">• {ev}</p>
                          <button type="button" onClick={() => handleRemoveEvidence(dec.id, eIdx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px] text-signal/50 hover:text-signal shrink-0">×</button>
                        </div>
                      ))}</div>
                  }
                  <div className="flex gap-1.5 mt-2">
                    <input type="text" placeholder="Add evidence..."
                      value={evidenceInputs[dec.id] ?? ""}
                      onChange={(e) => setEvidenceInputs((p) => ({ ...p, [dec.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddEvidence(dec.id); }}
                      className="flex-1 bg-black/40 border border-white/5 px-2 py-1 font-mono text-[10px] text-white focus:outline-none focus:border-frost/45" />
                    <button type="button" onClick={() => handleAddEvidence(dec.id)}
                      className="px-2 py-1 border border-white/10 bg-white/5 hover:bg-white/10 font-mono text-[9px] text-white/50 transition-all">+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
           5-STEP CHECK-IN WIZARD (V4.4)
        ══════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between font-mono text-[10px] text-white/45 mb-1.5 uppercase">
              <span>Step {step} / 5</span>
              <span>{STEP_TITLES[step - 1]}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-signal transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-4">
            {/* ── STEP 1: SINGLE DOMINANT STATE (V4.4) ───────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="border border-white/5 bg-black/20 px-3 py-2 space-y-1">
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">Dominant State</p>
                  <p className="font-mono text-[10px] text-white/50 leading-relaxed">
                    What is your dominant state right now?
                    <span className="text-white/30 ml-1">Select exactly one.</span>
                  </p>
                </div>

                {/* Positive States */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/70">Positive</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POSITIVE_STATES.map((state) => {
                      const isSelected = selectedStates[0] === state;
                      return (
                        <button key={state} type="button"
                          onClick={() => handleStateSelect(state)}
                          className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                            isSelected
                              ? STATE_CATEGORY_STYLE.positive.selected
                              : "border-white/10 bg-white/[0.03] text-white/45 hover:border-emerald-400/20 hover:text-emerald-400/60"
                          }`}>
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Neutral States */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-frost" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-frost/70">Neutral</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NEUTRAL_STATES.map((state) => {
                      const isSelected = selectedStates[0] === state;
                      return (
                        <button key={state} type="button"
                          onClick={() => handleStateSelect(state)}
                          className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                            isSelected
                              ? STATE_CATEGORY_STYLE.neutral.selected
                              : "border-white/10 bg-white/[0.03] text-white/45 hover:border-frost/20 hover:text-frost/60"
                          }`}>
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Negative States */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-signal/70">Negative</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NEGATIVE_STATES.map((state) => {
                      const isSelected = selectedStates[0] === state;
                      return (
                        <button key={state} type="button"
                          onClick={() => handleStateSelect(state)}
                          className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                            isSelected
                              ? STATE_CATEGORY_STYLE.negative.selected
                              : "border-white/10 bg-white/[0.03] text-white/45 hover:border-signal/20 hover:text-signal/60"
                          }`}>
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: DYNAMIC CAUSES (V4.4) ─────────────── */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="border border-white/5 bg-black/20 px-3 py-2">
                  <p className="font-mono text-[10px] text-white/50">
                    Why are you feeling{" "}
                    <span className={stateCategory === "positive" ? "text-emerald-400" : stateCategory === "negative" ? "text-signal" : "text-frost"}>
                      {dominantState}
                    </span>?
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {dynamicCauses.map((cause) => {
                    const isSelected = primaryCause === cause;
                    const causeColor = stateCategory === "positive"
                      ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-400"
                      : stateCategory === "negative"
                        ? "border-signal/45 bg-signal/10 text-signal"
                        : "border-frost/40 bg-frost/10 text-frost";
                    return (
                      <button key={cause} type="button"
                        onClick={() => { audioManager.playClick(); setPrimaryCause(cause); }}
                        className={`w-full text-left px-3 py-2 border font-mono text-xs uppercase transition-all duration-200 ${isSelected
                          ? causeColor
                          : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"}`}>
                        {cause}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 3: SMART THOUGHT (V4.4: State + Cause) ─ */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="border border-white/5 bg-black/20 px-3 py-2.5 space-y-1">
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">Dominant Thought</p>
                  <p className="font-mono text-[10px] text-white/50 leading-relaxed">
                    What sentence has been repeating in your mind today?<br />
                    <span className="text-white/30">This can be positive, neutral, or negative.</span>
                  </p>
                </div>

                {/* Contextual suggestions: State + Cause */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">
                      Suggestions
                      {dominantState && primaryCause && (
                        <span className="text-frost/40 ml-1">
                          (for {dominantState} + {primaryCause})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {thoughtSuggestions.map((thought) => (
                      <button key={thought} type="button"
                        onClick={() => handleThoughtSuggestion(thought)}
                        className={`px-2 py-1.5 border border-white/5 bg-white/[0.02] hover:bg-white/5 font-mono text-[10px] transition-all duration-200 ${
                          dominantThought === thought ? "text-frost border-frost/30 bg-frost/5" : "text-white/55 hover:text-white"
                        }`}>
                        &quot;{thought}&quot;
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Thought Input */}
                <div className="border border-white/5 bg-black/35 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-frost/50">✎ Custom Thought</span>
                    <span className="font-mono text-[8px] text-white/20">Type your own</span>
                  </div>
                  <textarea
                    rows={2}
                    value={dominantThought}
                    onChange={(e) => setDominantThought(e.target.value)}
                    placeholder='e.g. "I am worried about Budget Buddy", "I feel powerful today"'
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-signal/55 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4: THOUGHT CLASSIFICATION ─────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                {dominantThought.trim() && (
                  <div className="border border-white/8 bg-black/40 p-3">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-1">Your thought</span>
                    <p className="font-mono text-sm text-frost italic">&quot;{dominantThought}&quot;</p>
                  </div>
                )}

                <div className="border border-white/5 bg-black/20 px-3 py-2.5">
                  <p className="font-mono text-[10px] text-white/45 leading-relaxed">
                    Does this thought <span className="text-emerald-400">strengthen</span> you or does it <span className="text-signal">limit</span> you?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button type="button"
                    onClick={() => { audioManager.playClick(); setThoughtType("strengthening"); }}
                    className={`py-4 border font-display text-sm uppercase tracking-wider transition-all duration-200 ${
                      thoughtType === "strengthening"
                        ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.15)]"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:border-emerald-400/25 hover:text-emerald-400/70"
                    }`}>
                    ↑ Strengthening
                    <span className="block font-mono text-[9px] opacity-60 mt-0.5 normal-case">
                      Energises, motivates, builds confidence
                    </span>
                  </button>

                  <button type="button"
                    onClick={() => { audioManager.playClick(); setThoughtType("neutral"); }}
                    className={`py-3 border font-display text-sm uppercase tracking-wider transition-all duration-200 ${
                      thoughtType === "neutral"
                        ? "border-frost/40 bg-frost/10 text-frost"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:border-frost/25 hover:text-frost/70"
                    }`}>
                    → Neutral
                    <span className="block font-mono text-[9px] opacity-60 mt-0.5 normal-case">
                      Observational, neither positive nor negative
                    </span>
                  </button>

                  <button type="button"
                    onClick={() => { audioManager.playClick(); setThoughtType("limiting"); }}
                    className={`py-3 border font-display text-sm uppercase tracking-wider transition-all duration-200 ${
                      thoughtType === "limiting"
                        ? "border-signal/50 bg-signal/15 text-signal shadow-[0_0_16px_rgba(255,42,42,0.1)]"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:border-signal/25 hover:text-signal/70"
                    }`}>
                    ↓ Limiting
                    <span className="block font-mono text-[9px] opacity-60 mt-0.5 normal-case">
                      Weakens, drains, creates self-doubt
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5a: MOMENTUM MODE (V4.4) ─────────────── */}
            {step === 5 && stateCategory === "positive" && thoughtType === "strengthening" && (
              <div className="space-y-4">
                <div className="border border-emerald-500/30 bg-emerald-500/[0.04] p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-display text-lg uppercase text-emerald-400 tracking-wider">
                      Momentum Detected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-white/5 bg-black/20 p-2.5">
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-white/30 mb-1">Current State</span>
                      <span className="font-mono text-sm text-emerald-400">{dominantState}</span>
                    </div>
                    <div className="border border-white/5 bg-black/20 p-2.5">
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-white/30 mb-1">Direction</span>
                      <span className="font-mono text-sm text-emerald-400">↗ Positive</span>
                    </div>
                  </div>

                  {dominantThought && (
                    <div className="border border-emerald-500/15 bg-emerald-500/[0.02] px-3 py-2">
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-emerald-400/40 mb-1">Thought</span>
                      <p className="font-mono text-xs text-emerald-400/80 italic">&quot;{dominantThought}&quot;</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">Suggested Actions</span>
                    {momentumActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-3 border border-emerald-500/15 bg-emerald-500/[0.02] px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                        <div>
                          <span className="font-mono text-xs text-emerald-400">{action.name}</span>
                          <span className="block font-mono text-[9px] text-white/30">{action.description}</span>
                        </div>
                        <span className="ml-auto font-mono text-[9px] text-white/20">{action.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>

                  <p className="font-mono text-[10px] text-emerald-400/50 text-center border-t border-emerald-500/10 pt-3">
                    Current trajectory is positive. Protect momentum.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 5b: NEUTRAL / STRENGTHENING (non-positive) ── */}
            {step === 5 && thoughtType !== "limiting" && !(stateCategory === "positive" && thoughtType === "strengthening") && (
              <div className="space-y-4">
                <div className={`border p-4 space-y-3 ${
                  thoughtType === "strengthening"
                    ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                    : "border-frost/15 bg-frost/[0.02]"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${
                      thoughtType === "strengthening" ? "text-emerald-400" : "text-frost/60"
                    }`}>
                      {thoughtType === "strengthening" ? "✓ Strengthening Pattern" : "→ Neutral Observation"}
                    </span>
                  </div>
                  {dominantThought && (
                    <p className="font-mono text-sm text-white/80 italic">&quot;{dominantThought}&quot;</p>
                  )}
                  <p className="font-mono text-[10px] text-white/35 leading-relaxed">
                    {thoughtType === "strengthening"
                      ? "This thought pattern is logged as a strengthening pattern. No intervention required."
                      : "This thought is stored as a neutral observation. No intervention required."}
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 5c: LIMITING → BELIEF SYSTEM ────────────── */}
            {step === 5 && thoughtType === "limiting" && (
              <div className="space-y-4">
                {matchedDecision ? (
                  <div className="border border-signal/20 bg-signal/[0.02] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase text-signal tracking-wider">Belief Matrix Match</span>
                      <span className="px-2 py-0.5 border border-signal/30 bg-signal/10 text-signal font-mono text-[9px]">
                        {usageCountMap[matchedDecision.id] ?? 0}× Reinforced
                      </span>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      {matchedDecision.recurringThought && (
                        <p><span className="text-signal/45 uppercase text-[9px] tracking-wider block">Trigger Thought</span>&quot;{matchedDecision.recurringThought}&quot;</p>
                      )}
                      <p><span className="text-white/30 uppercase text-[9px] tracking-wider block">Limiting Belief</span><span className="text-white/65">&quot;{matchedDecision.limitingBelief}&quot;</span></p>
                      {matchedDecision.newEmpoweringBelief && (
                        <p><span className="text-emerald-400/55 uppercase text-[9px] tracking-wider block">Empowering Belief</span><span className="text-emerald-400 font-bold">&quot;{matchedDecision.newEmpoweringBelief}&quot;</span></p>
                      )}
                      <p><span className="text-frost/50 uppercase text-[9px] tracking-wider block">Counter Decision</span><span className="text-frost font-bold">&quot;{matchedDecision.newDecision}&quot;</span></p>
                    </div>

                    {matchedDecision.evidence.length > 0 && (
                      <div className="border-t border-white/5 pt-2.5">
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-1.5">Supporting Evidence</span>
                        {matchedDecision.evidence.map((ev, i) => (
                          <p key={i} className="font-mono text-[10px] text-white/60 leading-relaxed">• {ev}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-white/5 bg-black/40 p-4 space-y-3">
                    <p className="font-mono text-xs text-white/40 text-center">
                      No belief match found. Seed a new entry below.
                    </p>

                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <input type="text" readOnly value={dominantThought}
                        className="w-full bg-black/30 border border-signal/15 px-2.5 py-1.5 font-mono text-xs text-signal/70" />
                      <input type="text" placeholder="Underlying Limiting Belief"
                        value={newLimitingBelief} onChange={(e) => setNewLimitingBelief(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/45" />
                      <input type="text" placeholder="Counter Decision"
                        value={newDecision} onChange={(e) => setNewDecision(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/45" />
                      <input type="text" placeholder="New Empowering Belief (e.g. Connection is built through action)"
                        value={newEmpoweringBelief} onChange={(e) => setNewEmpoweringBelief(e.target.value)}
                        className="w-full bg-black/40 border border-frost/10 px-2.5 py-1.5 font-mono text-xs text-frost placeholder-frost/25 focus:outline-none focus:border-frost/45" />
                      <button type="button"
                        onClick={() => {
                          if (!newLimitingBelief.trim() || !newDecision.trim()) return;
                          decisionRepo.create({
                            recurringThought:    dominantThought.trim() || null,
                            limitingBelief:      newLimitingBelief.trim(),
                            newDecision:         newDecision.trim(),
                            newEmpoweringBelief: newEmpoweringBelief.trim() || null,
                            evidence:            [],
                          });
                          refreshDecisions();
                          setNewLimitingBelief(""); setNewDecision(""); setNewEmpoweringBelief("");
                          audioManager.playToggle();
                        }}
                        className="w-full py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 font-mono text-[10px] uppercase text-white tracking-wider transition-all">
                        Seed Belief Transformation
                      </button>
                    </div>
                  </div>
                )}

                {/* Threat analysis always shown in limiting mode */}
                {analysis && (
                  <div className="border border-white/5 bg-black/35 p-3 space-y-2 font-mono text-xs">
                    <span className="block text-[9px] uppercase tracking-wider text-white/30">Threat Assessment</span>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Threat</span><span className="text-signal font-bold">{analysis.threat.name}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Need</span><span className="text-frost">{analysis.need.name}</span></div>
                    {primaryCause && <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/40">Root Cause</span><span className="text-warning">{primaryCause}</span></div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
            {step > 1 && (
              <button type="button" onClick={() => { audioManager.playClick(); setStep(step - 1); }}
                className="flex-1 py-2 border border-white/10 bg-white/[0.02] text-white/60 font-mono text-xs uppercase tracking-wider hover:bg-white/5">
                Back
              </button>
            )}
            {step < 5 ? (
              <button type="button"
                disabled={step === 1 && selectedStates.length === 0 || (step === 4 && thoughtType === null)}
                onClick={() => { audioManager.playClick(); setStep(step + 1); }}
                className="flex-1 py-2 border border-signal/40 bg-signal/10 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/20 disabled:opacity-30 disabled:cursor-not-allowed">
                {step === 3 && !dominantThought.trim() ? "Skip →" : "Next →"}
              </button>
            ) : (
              <button type="button" onClick={handleFinalSubmit}
                className="flex-1 py-2 border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 font-mono text-xs uppercase tracking-wider hover:bg-emerald-400/20">
                Commit Check-In ✓
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
    ) : (
      <div className="font-mono text-[10px] text-white/35 uppercase tracking-wider mt-1 pl-1 select-none">
        Standing By · Logs today: {localStateDetectionRepository.getStateLogsForDate(todaysDate).length}
      </div>
    )}
  </AnimatePresence>
</div>
  );
}
