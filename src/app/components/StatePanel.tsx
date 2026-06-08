"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BELIEF_STATES, BELIEF_CAUSES, SAMPLE_RECURRING_THOUGHTS } from "@/lib/belief-intelligence/config";
import type { BeliefState, BeliefCause, DecisionMatrixEntry, BeliefEntry } from "@/lib/belief-intelligence/types";
import { beliefRepo, decisionRepo, decisionUsageRepo } from "@/lib/belief-intelligence";
import { detectThreat, detectNeed } from "@/lib/countermeasures";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { localBehavioralTimelineRepository } from "@/lib/behavioral-timeline";
import { audioManager } from "@/lib/audioManager";
import type { ISODate, DailyStateLog } from "@/lib/state-detection";

interface StatePanelProps {
  todaysDate: ISODate;
  onStateCheckedIn: (log: DailyStateLog) => void;
}

const WARM_STATES = ["Lonely", "Heavy", "Fatigued", "Overwhelmed", "Restless"];
const COOL_STATES = ["Focused", "Determined", "Calm"];

const STEP_TITLES = [
  "Select Emotional States",
  "Determine Primary Cause",
  "Record Recurring Thought",
  "Threat Assessment",
  "Decision Matrix Reinforcement",
];

const DRAFT_KEY = "batcave.checkin.draft";

interface CheckInDraft {
  step: number;
  selectedStates: BeliefState[];
  primaryCause: BeliefCause | null;
  recurringThought: string;
}

function loadDraft(): CheckInDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: CheckInDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export default function StatePanel({ todaysDate, onStateCheckedIn }: StatePanelProps) {
  // ── Restore from draft on mount (Issue 6) ───────────────────
  const [step, setStep] = useState<number>(() => loadDraft()?.step ?? 1);
  const [selectedStates, setSelectedStates] = useState<BeliefState[]>(() => loadDraft()?.selectedStates ?? []);
  const [primaryCause, setPrimaryCause] = useState<BeliefCause | null>(() => loadDraft()?.primaryCause ?? null);
  const [recurringThought, setRecurringThought] = useState<string>(() => loadDraft()?.recurringThought ?? "");
  const [timelineLogs, setTimelineLogs] = useState<BeliefEntry[]>([]);

  // Decision Matrix V2 state
  const [newRecurringThought, setNewRecurringThought] = useState("");
  const [newLimitingBelief, setNewLimitingBelief] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [showMatrixManager, setShowMatrixManager] = useState(false);
  const [decisions, setDecisions] = useState<DecisionMatrixEntry[]>([]);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});

  // Load data on mount
  useEffect(() => {
    setTimelineLogs(beliefRepo.list().filter((b) => b.date === todaysDate));
    setDecisions(decisionRepo.list().filter((d) => !d.archived));
  }, [todaysDate]);

  // ── Persist draft on every change (Issue 6) ─────────────────
  const prevDraft = useRef<string>("");
  useEffect(() => {
    const draft: CheckInDraft = { step, selectedStates, primaryCause, recurringThought };
    const serialized = JSON.stringify(draft);
    if (serialized !== prevDraft.current) {
      prevDraft.current = serialized;
      saveDraft(draft);
    }
  }, [step, selectedStates, primaryCause, recurringThought]);

  // ── Step navigation ──────────────────────────────────────────
  const handleStateToggle = (state: BeliefState) => {
    audioManager.playClick();
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleCauseSelect = (cause: BeliefCause) => {
    audioManager.playClick();
    setPrimaryCause(cause);
  };

  const handleThoughtSuggestion = (thought: string) => {
    audioManager.playClick();
    setRecurringThought(thought === "Other" ? "" : thought);
  };

  // ── Step 4: Threat & Need analysis ──────────────────────────
  const analysis = useMemo(() => {
    if (selectedStates.length === 0) return null;
    const threat = detectThreat(selectedStates as any);
    const need = detectNeed(threat.id);
    const confidence = Math.min(95, 50 + selectedStates.length * 8);
    return { threat, need, confidence };
  }, [selectedStates]);

  // ── Step 5: Match on recurringThought (Issue 2) ─────────────
  const matchedDecision = useMemo(() => {
    const thought = recurringThought.trim().toLowerCase();
    if (!thought) return null;
    const items = decisionRepo.list().filter((d) => !d.archived);

    // Priority 1: exact recurringThought field match
    const thoughtMatch = items.find(
      (d) => d.recurringThought && d.recurringThought.toLowerCase().includes(thought)
    );
    if (thoughtMatch) return thoughtMatch;

    // Priority 2: thought text appears in limitingBelief (fallback for V1 entries)
    return items.find(
      (d) =>
        d.limitingBelief.toLowerCase().includes(thought) ||
        thought.includes(d.limitingBelief.toLowerCase().substring(0, 10))
    ) ?? null;
  }, [recurringThought]);

  const usageCountMap = useMemo(() => decisionUsageRepo.usageCountMap(), []);

  // ── Final submit ─────────────────────────────────────────────
  const handleFinalSubmit = () => {
    if (selectedStates.length === 0) return;

    const beliefEntry = beliefRepo.create({
      date: todaysDate,
      states: selectedStates,
      primaryCause,
      recurringThought: recurringThought.trim() || null,
    });

    const stateLog = localStateDetectionRepository.addStateLog({
      date: todaysDate,
      selectedStates: selectedStates as any,
    });

    localBehavioralTimelineRepository.addEvent({
      date: todaysDate,
      eventType: "state-check-in",
      states: selectedStates as any,
      outcome: `Cause: ${primaryCause || "None"}. Thought: "${recurringThought.trim() || "None"}"`,
    });

    if (analysis) {
      localBehavioralTimelineRepository.addEvent({
        date: todaysDate,
        eventType: "threat-detected",
        threatId: analysis.threat.id,
        need: analysis.need.name as any,
      });
    }

    if (matchedDecision) {
      decisionUsageRepo.track({
        decisionId: matchedDecision.id,
        usedAt: new Date().toISOString(),
        context: { beliefEntryId: beliefEntry.id, relatedCause: primaryCause || undefined },
      });
    }

    setTimelineLogs(beliefRepo.list().filter((b) => b.date === todaysDate));
    onStateCheckedIn(stateLog);

    // Clear draft (Issue 6)
    clearDraft();
    audioManager.playCheckinComplete();
    setStep(1);
    setSelectedStates([]);
    setPrimaryCause(null);
    setRecurringThought("");
  };

  // ── Decision Matrix V2 CRUD (Issues 1, 7) ───────────────────
  const refreshDecisions = useCallback(() => {
    setDecisions(decisionRepo.list().filter((d) => !d.archived));
  }, []);

  const handleAddDecision = () => {
    if (!newLimitingBelief.trim() || !newDecision.trim()) return;
    decisionRepo.create({
      recurringThought: newRecurringThought.trim() || null,
      limitingBelief: newLimitingBelief.trim(),
      newDecision: newDecision.trim(),
      evidence: newEvidence.trim() ? [newEvidence.trim()] : [],
    });
    refreshDecisions();
    setNewRecurringThought("");
    setNewLimitingBelief("");
    setNewDecision("");
    setNewEvidence("");
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
    refreshDecisions();
    audioManager.playClick();
  };

  const handleArchiveEntry = (id: string) => {
    decisionRepo.update({ id, archived: true });
    refreshDecisions();
    audioManager.playToggle();
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4 relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/80">
            System 2 — Belief Intelligence
          </p>
          <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
            {showMatrixManager ? "Decision Matrix" : "Neural Check-In"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            audioManager.playToggle();
            setShowMatrixManager(!showMatrixManager);
          }}
          className="px-2.5 py-1 border border-white/10 bg-white/[0.02] hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider text-frost transition-all duration-200"
        >
          {showMatrixManager ? "▸ Run Check-in" : "⚙ Matrix V2"}
        </button>
      </div>

      {/* ── Draft Recovery Banner (Issue 6) ─────────────────── */}
      {!showMatrixManager && step > 1 && (
        <div className="mb-3 flex items-center gap-2 border border-warning/20 bg-warning/[0.03] px-3 py-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-warning/70">
            ⏱ Draft Saved — Step {step} of 5
          </span>
          <button
            type="button"
            onClick={() => { clearDraft(); setStep(1); setSelectedStates([]); setPrimaryCause(null); setRecurringThought(""); audioManager.playClick(); }}
            className="ml-auto font-mono text-[8px] uppercase text-white/30 hover:text-signal transition-colors"
          >
            × Discard
          </button>
        </div>
      )}

      {showMatrixManager ? (
        /* ── DECISION MATRIX V2 MANAGER ─────────────────────── */
        <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">
          {/* Create Form */}
          <div className="border border-white/8 bg-black/45 p-3 space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Add Belief Mapping
            </h3>
            <input
              type="text"
              placeholder="Recurring Thought (e.g. I miss her)"
              value={newRecurringThought}
              onChange={(e) => setNewRecurringThought(e.target.value)}
              className="w-full bg-black/30 border border-signal/20 px-3 py-1.5 font-mono text-xs text-signal placeholder-signal/25 focus:border-signal/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Limiting Belief (e.g. I will never be loved)"
              value={newLimitingBelief}
              onChange={(e) => setNewLimitingBelief(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="New Decision (e.g. My future is still open)"
              value={newDecision}
              onChange={(e) => setNewDecision(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="First Evidence (optional)"
              value={newEvidence}
              onChange={(e) => setNewEvidence(e.target.value)}
              className="w-full bg-black/30 border border-white/10 px-3 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-signal/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddDecision}
              disabled={!newLimitingBelief.trim() || !newDecision.trim()}
              className="w-full py-1.5 bg-signal/15 border border-signal/30 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Commit Matrix Entry
            </button>
          </div>

          {/* Matrix Cards */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {decisions.length === 0 ? (
              <p className="font-mono text-xs text-white/25 text-center py-6">
                No matrix entries committed.
              </p>
            ) : (
              decisions.map((dec) => (
                <div key={dec.id} className="border border-white/5 bg-white/[0.01] p-3 space-y-2.5">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-display text-xs text-signal uppercase">
                      {usageCountMap[dec.id] ?? 0}× Used
                    </span>
                    <button
                      type="button"
                      onClick={() => handleArchiveEntry(dec.id)}
                      className="font-mono text-[8px] text-white/25 hover:text-signal transition-colors uppercase tracking-wider"
                    >
                      Archive ↓
                    </button>
                  </div>

                  {/* V2 Chain */}
                  <div className="space-y-1.5 font-mono text-xs">
                    {dec.recurringThought && (
                      <p>
                        <span className="text-signal/50 uppercase text-[9px] tracking-wider block">Thought</span>
                        &quot;{dec.recurringThought}&quot;
                      </p>
                    )}
                    <p>
                      <span className="text-white/35 uppercase text-[9px] tracking-wider block">Limiting Belief</span>
                      <span className="text-white/70">&quot;{dec.limitingBelief}&quot;</span>
                    </p>
                    <p>
                      <span className="text-frost/50 uppercase text-[9px] tracking-wider block">New Decision</span>
                      <span className="text-frost font-bold">&quot;{dec.newDecision}&quot;</span>
                    </p>
                  </div>

                  {/* Evidence CRUD (Issue 7) */}
                  <div className="border-t border-white/5 pt-2">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-1.5">
                      Evidence ({dec.evidence.length})
                    </span>
                    {dec.evidence.length === 0 ? (
                      <p className="font-mono text-[10px] italic text-white/20">No evidence committed yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {dec.evidence.map((ev, eIdx) => (
                          <div key={eIdx} className="flex items-start justify-between gap-2 group">
                            <p className="font-mono text-[10px] text-white/60 leading-relaxed flex-1">
                              • {ev}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidence(dec.id, eIdx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px] text-signal/50 hover:text-signal shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add Evidence inline */}
                    <div className="flex gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Add evidence..."
                        value={evidenceInputs[dec.id] ?? ""}
                        onChange={(e) =>
                          setEvidenceInputs((prev) => ({ ...prev, [dec.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddEvidence(dec.id);
                          }
                        }}
                        className="flex-1 bg-black/40 border border-white/5 px-2 py-1 font-mono text-[10px] text-white focus:outline-none focus:border-frost/45"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddEvidence(dec.id)}
                        className="px-2 py-1 border border-white/10 bg-white/5 hover:bg-white/10 font-mono text-[9px] text-white/50 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ── GUIDED 5-STEP CHECK-IN WIZARD ─────────────────── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between font-mono text-[10px] text-white/45 mb-1.5 uppercase">
              <span>Step {step} of 5</span>
              <span>{STEP_TITLES[step - 1]}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-signal transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
            {/* STEP 1: STATES */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {BELIEF_STATES.map((state) => {
                    const isSelected = selectedStates.includes(state);
                    const isCool = COOL_STATES.includes(state);

                    let chipClass = "border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20";
                    if (isSelected) {
                      chipClass = isCool
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                        : "border-signal/40 bg-signal/10 text-signal shadow-[0_0_8px_rgba(255,42,42,0.15)]";
                    }

                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => handleStateToggle(state)}
                        className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${chipClass}`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: CAUSE */}
            {step === 2 && (
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  {BELIEF_CAUSES.map((cause) => {
                    const isSelected = primaryCause === cause;
                    return (
                      <button
                        key={cause}
                        type="button"
                        onClick={() => handleCauseSelect(cause)}
                        className={`w-full text-left px-3 py-2 border font-mono text-xs uppercase transition-all duration-200 ${
                          isSelected
                            ? "border-signal/45 bg-signal/10 text-signal"
                            : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {cause}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: RECURRING THOUGHT */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="border border-white/5 bg-black/35 p-3">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30 mb-1">
                    Recurring Thought
                  </span>
                  <input
                    type="text"
                    value={recurringThought}
                    onChange={(e) => setRecurringThought(e.target.value)}
                    placeholder="E.g. I miss her, I am behind..."
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-signal/55"
                  />
                </div>
                <div className="space-y-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">
                    Suggestions
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_RECURRING_THOUGHTS.filter((t) => t !== "Other").map((thought) => (
                      <button
                        key={thought}
                        type="button"
                        onClick={() => handleThoughtSuggestion(thought)}
                        className="px-2 py-1.5 border border-white/5 bg-white/[0.02] hover:bg-white/5 font-mono text-[10px] text-white/60 hover:text-white transition-all duration-200"
                      >
                        &quot;{thought}&quot;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: THREAT ANALYSIS */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="border border-white/8 bg-black/40 p-4 space-y-4">
                  <div className="text-center font-mono text-xs tracking-widest text-signal animate-pulse">
                    --- RUNNING CORRELATION DIAGNOSTICS ---
                  </div>
                  {analysis ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-white/40">Detected Threat</span>
                        <span className="text-signal uppercase font-bold">{analysis.threat.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-white/40">Underlying Need</span>
                        <span className="text-frost uppercase font-bold">{analysis.need.name}</span>
                      </div>
                      {primaryCause && (
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-white/40">Root Cause</span>
                          <span className="text-warning uppercase">{primaryCause}</span>
                        </div>
                      )}
                      {recurringThought && (
                        <div className="border-b border-white/5 pb-1.5">
                          <span className="text-white/40 block mb-0.5">Trigger Thought</span>
                          <span className="text-white/70 italic">&quot;{recurringThought}&quot;</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/40">Confidence</span>
                          <span className="text-frost font-bold">{analysis.confidence}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-frost" style={{ width: `${analysis.confidence}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center font-mono text-xs text-white/20 py-4">
                      No states mapped. Analysis unavailable.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: DECISION MATRIX REINFORCEMENT (Issue 2) */}
            {step === 5 && (
              <div className="space-y-4">
                {matchedDecision ? (
                  <div className="border border-emerald-500/25 bg-emerald-500/[0.02] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase text-emerald-400 tracking-wider">
                        Matrix Match Found
                      </span>
                      <span className="px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[9px]">
                        {usageCountMap[matchedDecision.id] ?? 0}× Reinforced
                      </span>
                    </div>

                    {/* Full V2 chain display */}
                    <div className="space-y-2 font-mono text-xs">
                      {matchedDecision.recurringThought && (
                        <p>
                          <span className="font-display text-[9px] uppercase tracking-wider block text-signal/50">
                            Trigger Thought
                          </span>
                          &quot;{matchedDecision.recurringThought}&quot;
                        </p>
                      )}
                      <p>
                        <span className="font-display text-[9px] uppercase tracking-wider block text-white/30">
                          Limiting Belief
                        </span>
                        <span className="text-white/60">&quot;{matchedDecision.limitingBelief}&quot;</span>
                      </p>
                      <p className="font-mono text-xs text-frost font-bold">
                        <span className="font-display text-[9px] uppercase tracking-wider block text-frost/55">
                          New Decision
                        </span>
                        &quot;{matchedDecision.newDecision}&quot;
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-2.5">
                      <span className="block font-display text-[9px] uppercase tracking-wider text-white/30 mb-1.5">
                        Supporting Evidence
                      </span>
                      {matchedDecision.evidence.length === 0 ? (
                        <p className="font-mono text-[10px] italic text-white/30">
                          No evidence committed yet. Add some in Matrix V2.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {matchedDecision.evidence.map((ev, eIdx) => (
                            <p key={eIdx} className="font-mono text-[10px] text-white/65 leading-relaxed">
                              • {ev}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/5 bg-black/45 p-4 space-y-3">
                    <p className="font-mono text-xs text-white/40 text-center">
                      No thought match in matrix.
                      {recurringThought && (
                        <span className="block mt-1 text-white/25 italic text-[10px]">
                          &quot;{recurringThought}&quot; — seed a belief entry below.
                        </span>
                      )}
                    </p>

                    <div className="text-left space-y-2 border-t border-white/5 pt-3">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">
                        Seed Matrix Entry for This Thought
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={recurringThought}
                        className="w-full bg-black/30 border border-signal/15 px-2.5 py-1.5 font-mono text-xs text-signal/70"
                      />
                      <input
                        type="text"
                        placeholder="Limiting Belief"
                        value={newLimitingBelief}
                        onChange={(e) => setNewLimitingBelief(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/45"
                      />
                      <input
                        type="text"
                        placeholder="New Decision"
                        value={newDecision}
                        onChange={(e) => setNewDecision(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-signal/45"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLimitingBelief.trim() && newDecision.trim()) {
                            decisionRepo.create({
                              recurringThought: recurringThought.trim() || null,
                              limitingBelief: newLimitingBelief.trim(),
                              newDecision: newDecision.trim(),
                              evidence: [],
                            });
                            refreshDecisions();
                            setNewLimitingBelief("");
                            setNewDecision("");
                            audioManager.playToggle();
                          }
                        }}
                        className="w-full py-1 bg-white/10 hover:bg-white/15 border border-white/10 font-mono text-[10px] uppercase text-white tracking-wider transition-all duration-200"
                      >
                        Seed Belief Matrix
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { audioManager.playClick(); setStep(step - 1); }}
                className="flex-1 py-2 border border-white/10 bg-white/[0.02] text-white/60 font-mono text-xs uppercase tracking-wider hover:bg-white/5"
              >
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                disabled={step === 1 && selectedStates.length === 0}
                onClick={() => { audioManager.playClick(); setStep(step + 1); }}
                className="flex-1 py-2 border border-signal/40 bg-signal/10 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2 border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 font-mono text-xs uppercase tracking-wider hover:bg-emerald-400/20"
              >
                Commit Protocol Check-In
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
