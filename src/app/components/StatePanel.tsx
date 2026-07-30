"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { beliefRepo } from "@/lib/belief-intelligence";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { localBehavioralTimelineRepository } from "@/lib/behavioral-timeline";
import { audioManager } from "@/lib/audioManager";
import type { ISODate, DailyStateLog } from "@/lib/state-detection";
import type { BeliefState, StateCategory } from "@/lib/belief-intelligence/types";

interface StatePanelProps {
  todaysDate: ISODate;
  onStateCheckedIn: (log: DailyStateLog) => void;
}

const POSITIVE_STATES: BeliefState[] = ["Focused", "Motivated", "Confident", "Calm"] as any[];
const NEUTRAL_STATES: BeliefState[] = ["Reflective", "Recovering", "Curious"] as any[];
const NEGATIVE_STATES: BeliefState[] = ["Heavy", "Lonely", "Anxious", "Overwhelmed", "Frustrated", "Fatigued"] as any[];

const STATE_CATEGORY_STYLE = {
  positive: {
    selected: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]",
    dot: "bg-emerald-400",
  },
  neutral: {
    selected: "border-frost/40 bg-frost/10 text-frost shadow-[0_0_8px_rgba(160,204,255,0.15)]",
    dot: "bg-frost",
  },
  negative: {
    selected: "border-signal/40 bg-signal/10 text-signal shadow-[0_0_8px_rgba(255,42,42,0.15)]",
    dot: "bg-signal",
  },
};

export default function StatePanel({ todaysDate, onStateCheckedIn }: StatePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Step 1: State
  const [selectedState, setSelectedState] = useState<BeliefState | null>(null);
  
  // Step 2 & 3: Thought and Cause
  const [dominantThought, setDominantThought] = useState("");
  const [primaryCause, setPrimaryCause] = useState("");

  const logs = localStateDetectionRepository.getStateLogsForDate(todaysDate);
  const latest = logs.length > 0 ? logs[logs.length - 1] : null;

  useEffect(() => {
    if (logs.length > 0) {
      setIsCollapsed(false);
    }
  }, [logs]);

  const getStateCategory = (state: BeliefState): StateCategory => {
    if (POSITIVE_STATES.includes(state)) return "positive";
    if (NEGATIVE_STATES.includes(state)) return "negative";
    return "neutral";
  };

  const handleStateSelect = (state: BeliefState) => {
    audioManager.playClick();
    setSelectedState(state);
  };

  const handleSubmit = () => {
    if (!selectedState) return;

    const category = getStateCategory(selectedState);
    const thought = dominantThought.trim() || null;
    const cause = primaryCause.trim() || null;

    // Save to belief repo
    beliefRepo.create({
      date: todaysDate,
      states: [selectedState],
      stateCategory: category,
      primaryCause: cause as any,
      dominantThought: thought,
      thoughtType: null, // Removed classification
    });

    // Save to state detection repo
    const stateLog = localStateDetectionRepository.addStateLog({
      date: todaysDate,
      selectedStates: [selectedState],
      metadata: {
        stateCategory: category,
        dominantThought: thought,
        primaryCause: cause,
      },
    });

    // Save to timeline repo
    localBehavioralTimelineRepository.addEvent({
      date: todaysDate,
      eventType: "state-check-in",
      states: [selectedState],
      outcome: `Cause: ${cause ?? "None"}. Thought: "${thought ?? "None"}"`,
    });

    onStateCheckedIn(stateLog);
    audioManager.playCheckinComplete();
    
    // Reset form
    setSelectedState(null);
    setDominantThought("");
    setPrimaryCause("");
  };

  const handleRecheck = () => {
    if (!latest) return;
    audioManager.playToggle();
    localStateDetectionRepository.deleteStateLog(latest.id);
    onStateCheckedIn(latest); // Trigger list refresh
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4 relative bg-black/40 border-white/8">
      {/* Header */}
      <div 
        onClick={() => {
          audioManager.playClick();
          setIsCollapsed(!isCollapsed);
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
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {latest ? (
              /* Checked-In Result View */
              <div className="space-y-3 font-mono text-xs animate-fade-in">
                <div className="border border-emerald-500/30 bg-emerald-500/5 p-3 flex justify-between items-center">
                  <span className="text-emerald-400 uppercase tracking-widest text-[10px]">Neural State Locked</span>
                  <span className="text-emerald-400">✓</span>
                </div>

                <div className="grid grid-cols-2 gap-3 border border-white/5 bg-black/25 p-3">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant State</span>
                    <span className="text-white font-bold">{latest.selectedStates[0] || "None"}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-white/30">Primary Cause</span>
                    <span className="text-white/70">{(latest.metadata?.primaryCause as string) || "None"}</span>
                  </div>
                </div>

                <div className="border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant Thought</span>
                  <p className="text-white/70 italic">"{(latest.metadata?.dominantThought as string) || "None"}"</p>
                </div>

                <button
                  type="button"
                  onClick={handleRecheck}
                  className="w-full py-2 mt-2 border border-white/10 bg-white/[0.02] hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider text-white/60 hover:text-white transition-all"
                >
                  ↻ Recheck-In
                </button>
              </div>
            ) : (
              /* Diagnostic Wizard */
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                
                {/* STEP 1 */}
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-2">
                    <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                      Step 1: Dominant State (Required)
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {/* Positive */}
                    <div className="flex flex-wrap gap-2">
                      {POSITIVE_STATES.map((state) => (
                        <button key={state} type="button" onClick={() => handleStateSelect(state)}
                          className={`px-3 py-1.5 font-mono text-[10px] uppercase border rounded-sm transition-all duration-200 ${
                            selectedState === state ? STATE_CATEGORY_STYLE.positive.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-emerald-400/20 hover:text-emerald-400"
                          }`}>{state}</button>
                      ))}
                    </div>
                    {/* Neutral */}
                    <div className="flex flex-wrap gap-2">
                      {NEUTRAL_STATES.map((state) => (
                        <button key={state} type="button" onClick={() => handleStateSelect(state)}
                          className={`px-3 py-1.5 font-mono text-[10px] uppercase border rounded-sm transition-all duration-200 ${
                            selectedState === state ? STATE_CATEGORY_STYLE.neutral.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-frost/20 hover:text-frost"
                          }`}>{state}</button>
                      ))}
                    </div>
                    {/* Negative */}
                    <div className="flex flex-wrap gap-2">
                      {NEGATIVE_STATES.map((state) => (
                        <button key={state} type="button" onClick={() => handleStateSelect(state)}
                          className={`px-3 py-1.5 font-mono text-[10px] uppercase border rounded-sm transition-all duration-200 ${
                            selectedState === state ? STATE_CATEGORY_STYLE.negative.selected : "border-white/10 bg-white/[0.03] text-white/45 hover:border-signal/20 hover:text-signal/60"
                          }`}>{state}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedState && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6"
                    >
                      {/* STEP 2 */}
                      <div className="space-y-2">
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest block border-b border-white/10 pb-2">
                          Step 2: Dominant Thought (Optional)
                        </span>
                        <input
                          type="text"
                          value={dominantThought}
                          onChange={(e) => setDominantThought(e.target.value)}
                          placeholder="What sentence is repeating in your mind?"
                          className="w-full bg-black/45 border border-white/10 p-3 font-mono text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>

                      {/* STEP 3 */}
                      <div className="space-y-2">
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest block border-b border-white/10 pb-2">
                          Step 3: Primary Cause (Optional)
                        </span>
                        <input
                          type="text"
                          value={primaryCause}
                          onChange={(e) => setPrimaryCause(e.target.value)}
                          placeholder="What is causing this state?"
                          className="w-full bg-black/45 border border-white/10 p-3 font-mono text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        Lock Check-In
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}
          </motion.div>
        ) : (
          <div className="font-mono text-[10px] text-white/35 uppercase tracking-wider mt-1 pl-1 select-none">
            Standing By · Checked In: {latest ? "YES" : "NO"}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
