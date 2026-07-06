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
import type { BeliefState, BeliefCause, ThoughtType, StateCategory } from "@/lib/belief-intelligence/types";
import { beliefRepo } from "@/lib/belief-intelligence";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userToggled, setUserToggled] = useState(false);

  // ── Restore draft on mount ────────────────────────────────
  const [step, setStep]                     = useState<number>(() => loadDraft()?.step ?? 1);
  const [selectedStates, setSelectedStates] = useState<BeliefState[]>(() => loadDraft()?.selectedStates ?? []);
  const [primaryCause, setPrimaryCause]     = useState<BeliefCause | null>(() => loadDraft()?.primaryCause ?? null);
  const [dominantThought, setDominantThought] = useState<string>(() => loadDraft()?.dominantThought ?? "");
  const [thoughtType, setThoughtType]       = useState<ThoughtType | null>(() => loadDraft()?.thoughtType ?? null);

  const logs = useMemo(() => {
    return localStateDetectionRepository.getStateLogsForDate(todaysDate);
  }, [todaysDate, step]); // refresh when step/submit happens

  const latest = logs.length > 0 ? logs[logs.length - 1] : null;

  useEffect(() => {
    if (!userToggled) {
      const hasLogs = logs.length > 0;
      const isThreat = latest && latest.riskScore >= 10;
      if (hasLogs || isThreat) {
        setIsCollapsed(false);
      }
    }
  }, [todaysDate, userToggled, logs, latest]);

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

  // ── Thought suggestion click ──────────────────────────────
  const handleThoughtSuggestion = (t: string) => {
    audioManager.playClick();
    setDominantThought(t);
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4 relative bg-black/40 border-white/8">
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
            <span>Neural Check-In</span>
            <span className="text-white/20 text-xs">{isCollapsed ? "▼" : "▲"}</span>
          </h2>
        </div>
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
            {latest ? (
              /* ────────────────── CHECKED-IN RESULT VIEW ────────────────── */
              <div className="space-y-4 font-mono text-xs animate-fade-in">
                {/* Operator State Details */}
                <div className="grid grid-cols-2 gap-3 border border-white/5 bg-black/25 p-3">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant State</span>
                    <span className="text-white font-bold">{latest.selectedStates.join(", ") || "None"}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-white/30">Primary Cause</span>
                    <span className="text-white/70">{(latest.metadata?.primaryCause as string) || "None"}</span>
                  </div>
                </div>

                {/* Classification Banner Indicator (🟢 / ⚪ / 🔴) */}
                {(latest.metadata?.thoughtType as string) === "strengthening" && (
                  <div className="border border-emerald-500/20 bg-emerald-500/[0.04] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-sm">🟢</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Strengthening Pattern</span>
                    </div>
                    <p className="text-white italic">"{(latest.metadata?.dominantThought as string)}"</p>
                    <p className="text-[9px] text-emerald-400/80 uppercase tracking-wider">Momentum increasing.</p>
                  </div>
                )}

                {(latest.metadata?.thoughtType as string) === "neutral" && (
                  <div className="border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">⚪</span>
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Neutral Observation</span>
                    </div>
                    <p className="text-white/70 italic">"{(latest.metadata?.dominantThought as string)}"</p>
                    <p className="text-[9px] text-white/45 uppercase tracking-wider">Observation only.</p>
                  </div>
                )}

                {(latest.metadata?.thoughtType as string) === "limiting" && (
                  <div className="border border-signal/20 bg-signal/[0.04] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-signal text-sm">🔴</span>
                      <span className="text-[10px] uppercase font-bold text-signal tracking-wider">Limiting Pattern</span>
                    </div>
                    <p className="text-white italic">"{(latest.metadata?.dominantThought as string)}"</p>
                    <p className="text-[9px] text-signal/70 uppercase tracking-wider">Threat analysis activated.</p>
                  </div>
                )}

                {/* Final Intelligence Result Assessment */}
                {(latest.metadata?.thoughtType as string) === "limiting" && (
                  (() => {
                    const threat = detectThreat(latest.selectedStates as any);
                    const need = detectNeed(threat.id);
                    return (
                      <div className="border border-white/5 bg-black/35 p-3 space-y-2">
                        <span className="block text-[9px] uppercase tracking-wider text-white/30">Threat Assessment</span>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/40">Threat Code</span>
                          <span className="text-signal font-bold">{threat.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-white/40">Core Need</span>
                          <span className="text-frost">{need.name}</span>
                        </div>
                      </div>
                    );
                  })()
                )}

                {(latest.metadata?.thoughtType as string) === "strengthening" && (
                  <div className="border border-white/5 bg-black/35 p-3 space-y-1.5">
                    <span className="block text-[9px] uppercase tracking-wider text-white/30">Momentum Recommendations</span>
                    <div className="text-[10px] text-white/60 space-y-1">
                      {momentumActions.slice(0, 2).map((rec, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>{rec.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    audioManager.playToggle();
                    localStateDetectionRepository.deleteStateLog(latest.id);
                    onStateCheckedIn(latest); // Trigger list refresh
                  }}
                  className="w-full py-1.5 border border-white/10 bg-white/[0.02] hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider text-frost transition-all"
                >
                  ↻ Recheck-In
                </button>
              </div>
            ) : (
              /* ────────────────── 5-STEP DIAGNOSTIC WIZARD ────────────────── */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Draft recovery banner */}
                {step > 1 && (
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

                {/* Wizard steps content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-4">
                  
                  {/* ── STEP 1: DOMINANT STATE ── */}
                  {step === 1 && (
                    <div className="space-y-3.5">
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
                              <button key={state} type="button" onClick={() => handleStateSelect(state)}
                                className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                                  isSelected ? STATE_CATEGORY_STYLE.positive.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-emerald-400/20 hover:text-emerald-400"
                                }`}>{state}</button>
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
                              <button key={state} type="button" onClick={() => handleStateSelect(state)}
                                className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                                  isSelected ? STATE_CATEGORY_STYLE.neutral.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-frost/20 hover:text-frost"
                                }`}>{state}</button>
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
                              <button key={state} type="button" onClick={() => handleStateSelect(state)}
                                className={`px-3 py-2 font-mono text-xs uppercase border rounded-sm transition-all duration-200 ${
                                  isSelected ? STATE_CATEGORY_STYLE.negative.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-signal/20 hover:text-signal/60"
                                }`}>{state}</button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: DYNAMIC CAUSES ── */}
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
                                : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"}`}>{cause}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: DOMINANT THOUGHT ── */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="border border-white/5 bg-black/20 px-3 py-2.5 space-y-1">
                        <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">Dominant Thought</p>
                        <p className="font-mono text-[10px] text-white/50 leading-relaxed">
                          What sentence has been repeating in your mind today?<br />
                          <span className="text-white/30">This can be positive, neutral, or negative.</span>
                        </p>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          value={dominantThought}
                          onChange={(e) => setDominantThought(e.target.value)}
                          placeholder="e.g. I need to get back to writing build tools..."
                          className="w-full h-20 bg-black/45 border border-white/10 p-3 font-mono text-xs text-white placeholder-white/20 focus:outline-none focus:border-frost/45 transition-colors resize-none"
                        />

                        {thoughtSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">Quick Suggestions</span>
                            <div className="flex flex-col gap-1">
                              {thoughtSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => handleThoughtSuggestion(suggestion)}
                                  className="w-full text-left p-2 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] font-mono text-[10px] text-white/60 hover:text-white transition-colors"
                                >
                                  "{suggestion}"
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 4: THOUGHT CLASSIFICATION ── */}
                  {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border border-white/5 bg-black/20 px-3 py-2.5 space-y-1">
                        <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">Thought Classification</p>
                        <p className="font-mono text-[10px] text-white/50 leading-relaxed">
                          Classify the momentum direction of: <span className="italic text-white">"{dominantThought || "(unspecified)"}"</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => { audioManager.playClick(); setThoughtType("strengthening"); }}
                          className={`w-full text-left p-3 border font-mono transition-all duration-200 ${
                            thoughtType === "strengthening"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <span>✓ Strengthening</span>
                          </div>
                          <span className="text-[10px] opacity-75">Empowering core beliefs, building momentum, or reflecting state progression.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { audioManager.playClick(); setThoughtType("neutral"); }}
                          className={`w-full text-left p-3 border font-mono transition-all duration-200 ${
                            thoughtType === "neutral"
                              ? "border-frost/40 bg-frost/10 text-frost"
                              : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <span>● Neutral</span>
                          </div>
                          <span className="text-[10px] opacity-75">Objective logs, generic reflections, or observations with no clear charge.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { audioManager.playClick(); setThoughtType("limiting"); }}
                          className={`w-full text-left p-3 border font-mono transition-all duration-200 ${
                            thoughtType === "limiting"
                              ? "border-signal/40 bg-signal/10 text-signal"
                              : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold mb-1">
                            <span>▲ Limiting</span>
                          </div>
                          <span className="text-[10px] opacity-75">Core constraints, self-critical, defense patterns, or failure risks.</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 5: RESPONSE DIAGNOSTIC RESULTS ── */}
                  {step === 5 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="border border-white/5 bg-black/20 px-3 py-2.5">
                        <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">Response & Intelligence Recommendations</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border border-white/5 bg-black/25 p-3 font-mono text-xs">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant State</span>
                          <span className="text-white font-bold">{dominantState}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-white/30">Primary Cause</span>
                          <span className="text-white/70">{primaryCause || "None"}</span>
                        </div>
                      </div>

                      <div className="border border-white/5 bg-white/[0.01] p-3 font-mono text-xs space-y-2">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-white/30">Thought [{thoughtType}]</span>
                          <span className="text-white italic">"{dominantThought || "None"}"</span>
                        </div>

                        {thoughtType === "strengthening" && (
                          <div className="pt-2 border-t border-white/5 text-emerald-400 flex items-center gap-2">
                            <span>🟢 Strengthening Pattern</span>
                            <span className="text-[10px] text-white/40">· Momentum increasing</span>
                          </div>
                        )}

                        {thoughtType === "neutral" && (
                          <div className="pt-2 border-t border-white/5 text-white/60 flex items-center gap-2">
                            <span>⚪ Neutral Observation</span>
                            <span className="text-[10px] text-white/40">· Observation only</span>
                          </div>
                        )}

                        {thoughtType === "limiting" && (
                          <div className="pt-2 border-t border-white/5 text-signal flex items-center gap-2 animate-pulse">
                            <span>🔴 Limiting Pattern</span>
                            <span className="text-[10px] text-white/40">· Threat analysis activated</span>
                          </div>
                        )}
                      </div>

                      {analysis && (
                        <div className="border border-white/5 bg-black/35 p-3 space-y-2 font-mono text-xs">
                          <span className="block text-[9px] uppercase tracking-wider text-white/30">Threat Assessment</span>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-white/40">Threat</span>
                            <span className="text-signal font-bold">{analysis.threat.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-white/40">Core Need</span>
                            <span className="text-frost">{analysis.need.name}</span>
                          </div>
                          {primaryCause && (
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-white/40">Root Cause</span>
                              <span className="text-warning">{primaryCause}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Navigation controls */}
                <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                  {step > 1 && (
                    <button type="button" onClick={() => { audioManager.playClick(); setStep(step - 1); }}
                      className="flex-1 py-2 border border-white/10 bg-white/[0.02] text-white/60 font-mono text-xs uppercase tracking-wider hover:bg-white/5">
                      Back
                    </button>
                  )}
                  {step < 5 ? (
                    <button type="button"
                      disabled={(step === 1 && selectedStates.length === 0) || (step === 4 && thoughtType === null)}
                      onClick={() => { audioManager.playClick(); setStep(step + 1); }}
                      className="flex-1 py-2 border border-signal/40 bg-signal/10 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {step === 3 && !dominantThought.trim() ? "Skip →" : "Next →"}
                    </button>
                  ) : (
                    <button type="button" onClick={handleFinalSubmit}
                      className="flex-1 py-2 border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 font-mono text-xs uppercase tracking-wider hover:bg-emerald-400/20"
                    >
                      Commit Check-In ✓
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Collapsed diagnostic state */
          <div className="font-mono text-[10px] text-white/35 uppercase tracking-wider mt-1 pl-1 select-none">
            Standing By · Checked In: {latest ? `YES [${((latest.metadata?.thoughtType as string) || "").toUpperCase()}]` : "NO"}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
