"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { beliefRepo } from "@/lib/belief-intelligence";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { localBehavioralTimelineRepository } from "@/lib/behavioral-timeline";
import { audioManager } from "@/lib/audioManager";
import type { ISODate, DailyStateLog } from "@/lib/state-detection";
import type { BeliefState, StateCategory } from "@/lib/belief-intelligence/types";
import { STATE_SUGGESTIONS } from "@/lib/neural-intelligence/config";
import { neuralIntelligenceEngine } from "@/lib/neural-intelligence/engine";
import type { NeuralIntervention } from "@/lib/neural-intelligence/types";
import { protocolEngine } from "@/lib/protocol-engine";

interface StatePanelProps {
  todaysDate: ISODate;
  onStateCheckedIn: (log: DailyStateLog) => void;
}

const POSITIVE_STATES: BeliefState[] = ["Focused", "Motivated", "Confident", "Calm", "Disciplined", "Flow State"] as any[];
const NEUTRAL_STATES: BeliefState[] = ["Reflective", "Recovering", "Thinking", "Curious", "Observing"] as any[];
const NEGATIVE_STATES: BeliefState[] = ["Heavy", "Anxious", "Lonely", "Frustrated", "Overwhelmed", "Fatigued", "Disconnected"] as any[];

export default function StatePanel({ todaysDate, onStateCheckedIn }: StatePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
  const [selectedState, setSelectedState] = useState<BeliefState | null>(null);
  const [dominantThought, setDominantThought] = useState("");
  const [primaryCause, setPrimaryCause] = useState("");
  const [classification, setClassification] = useState<StateCategory | null>(null);
  
  const [customThought, setCustomThought] = useState(false);
  const [customCause, setCustomCause] = useState(false);

  // Intervention
  const [intervention, setIntervention] = useState<NeuralIntervention | null>(null);
  const [momentumMsg, setMomentumMsg] = useState("");

  const logs = localStateDetectionRepository.getStateLogsForDate(todaysDate);
  const latest = logs.length > 0 ? logs[logs.length - 1] : null;

  useEffect(() => {
    if (logs.length > 0) {
      setIsCollapsed(true);
      setStep(5);
    } else {
      setIsCollapsed(false);
      setStep(1);
    }
  }, [logs.length]);

  const handleStateSelect = (state: BeliefState) => {
    audioManager.playClick();
    setSelectedState(state);
    
    // Check if we should reuse yesterday's thought for this state to save time
    const history = beliefRepo.list();
    const lastMatching = history.reverse().find(h => h.states.includes(state) && h.dominantThought);
    
    setStep(2);
  };

  const handleThoughtSelect = (thought: string) => {
    audioManager.playClick();
    setDominantThought(thought);
    setStep(3);
  };

  const handleCauseSelect = (cause: string) => {
    audioManager.playClick();
    setPrimaryCause(cause);
    setStep(4);
  };

  const handleClassification = (cat: StateCategory) => {
    if (!selectedState) return;
    audioManager.playClick();
    setClassification(cat);
    
    const thought = dominantThought.trim() || "None";
    const cause = primaryCause.trim() || "None";

    // Save
    beliefRepo.create({
      date: todaysDate,
      states: [selectedState],
      stateCategory: cat,
      primaryCause: cause as any,
      dominantThought: thought,
      thoughtType: cat === "positive" ? "strengthening" : cat === "negative" ? "limiting" : "neutral",
    });

    const stateLog = localStateDetectionRepository.addStateLog({
      date: todaysDate,
      selectedStates: [selectedState],
      metadata: {
        stateCategory: cat,
        dominantThought: thought,
        primaryCause: cause,
      },
    });

    localBehavioralTimelineRepository.addEvent({
      date: todaysDate,
      eventType: "state-check-in",
      states: [selectedState],
      outcome: `Cause: ${cause}. Thought: "${thought}"`,
    });

    // Compute Response
    if (cat === "positive") {
      setMomentumMsg(neuralIntelligenceEngine.getMomentumResponse(selectedState));
      // Dispatch momentum protocol optionally?
      // Wait, let's let the engine handle it uniformly if we want.
      // But the user specifically wanted momentum response to just show in the UI previously. Let's dispatch for negative.
    } else if (cat === "negative") {
      protocolEngine.triggerProtocol("NeuralIntelligence", selectedState, cause, thought);
      setIntervention({ type: "Dispatched", primaryThreat: "", need: "", action: "" } as any); // Mock so step 5 shows something
    }

    onStateCheckedIn(stateLog);
    audioManager.playCheckinComplete();
    setStep(5);
  };

  const resetWizard = () => {
    setSelectedState(null);
    setDominantThought("");
    setPrimaryCause("");
    setClassification(null);
    setCustomThought(false);
    setCustomCause(false);
    setIntervention(null);
    setMomentumMsg("");
    setStep(1);
    if (latest) {
      localStateDetectionRepository.deleteStateLog(latest.id);
      onStateCheckedIn(latest); // Trigger refresh
    }
  };

  const suggestions = selectedState ? STATE_SUGGESTIONS[selectedState] : null;

  return (
    <div className="w-full mb-4">
      <div 
        onClick={() => {
          if (latest) {
            audioManager.playClick();
            setIsCollapsed(!isCollapsed);
          }
        }}
        className={`mb-4 flex items-center justify-between ${latest ? "cursor-pointer select-none" : ""}`}
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            System 2
          </p>
          <h2 className="font-display text-lg uppercase text-white/80 flex items-center gap-2">
            <span>Neural Check-In</span>
            {latest && <span className="text-white/20 text-xs">{isCollapsed ? "▼" : "▲"}</span>}
          </h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key="wizard"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* STEP 1: STATE */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">
                  What state am I in?
                </p>
                <div className="grid gap-6">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-500/50 mb-2">Positive</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {POSITIVE_STATES.map((s) => (
                        <button key={s} onClick={() => handleStateSelect(s)} className="p-3 text-center border border-white/10 bg-white/[0.03] text-emerald-400/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors font-display text-xs uppercase">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-frost/50 mb-2">Neutral</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {NEUTRAL_STATES.map((s) => (
                        <button key={s} onClick={() => handleStateSelect(s)} className="p-3 text-center border border-white/10 bg-white/[0.03] text-frost/80 hover:bg-frost/10 hover:border-frost/30 transition-colors font-display text-xs uppercase">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-signal/50 mb-2">Negative</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {NEGATIVE_STATES.map((s) => (
                        <button key={s} onClick={() => handleStateSelect(s)} className="p-3 text-center border border-white/10 bg-white/[0.03] text-signal/80 hover:bg-signal/10 hover:border-signal/30 transition-colors font-display text-xs uppercase">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: THOUGHT */}
            {step === 2 && suggestions && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">
                  Dominant Thought
                </p>
                {!customThought ? (
                  <div className="flex flex-col gap-2">
                    {suggestions.thoughts.map(t => (
                      <button key={t} onClick={() => handleThoughtSelect(t)} className="p-4 text-left border border-white/10 bg-black/40 text-white/80 hover:bg-white/5 transition-colors font-mono text-xs">
                        "{t}"
                      </button>
                    ))}
                    <button onClick={() => setCustomThought(true)} className="p-4 text-left border border-white/5 bg-transparent text-white/40 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest mt-2">
                      + Custom Thought
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={dominantThought}
                      onChange={e => setDominantThought(e.target.value)}
                      placeholder="Enter dominant thought..."
                      className="flex-1 bg-black/50 border border-white/20 p-3 font-mono text-xs text-white outline-none focus:border-emerald-500/50"
                    />
                    <button onClick={() => { if(dominantThought) handleThoughtSelect(dominantThought) }} className="px-6 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase">
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: CAUSE */}
            {step === 3 && suggestions && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">
                  Why am I in this state? (Cause)
                </p>
                {!customCause ? (
                  <div className="grid grid-cols-2 gap-2">
                    {suggestions.causes.map(c => (
                      <button key={c} onClick={() => handleCauseSelect(c)} className="p-4 text-center border border-white/10 bg-black/40 text-white/80 hover:bg-white/5 transition-colors font-display text-sm uppercase">
                        {c}
                      </button>
                    ))}
                    <button onClick={() => setCustomCause(true)} className="p-4 col-span-2 text-center border border-white/5 bg-transparent text-white/40 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest mt-2">
                      + Custom Cause
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={primaryCause}
                      onChange={e => setPrimaryCause(e.target.value)}
                      placeholder="Enter primary cause..."
                      className="flex-1 bg-black/50 border border-white/20 p-3 font-mono text-xs text-white outline-none focus:border-emerald-500/50"
                    />
                    <button onClick={() => { if(primaryCause) handleCauseSelect(primaryCause) }} className="px-6 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase">
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: CLASSIFICATION */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">
                  Classification
                </p>
                <div className="grid gap-3">
                  <button onClick={() => handleClassification("positive")} className="p-6 text-center border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-colors font-display text-xl uppercase tracking-widest">
                    🟢 Strengthening
                  </button>
                  <button onClick={() => handleClassification("neutral")} className="p-6 text-center border border-frost/20 bg-frost/5 hover:bg-frost/10 text-frost transition-colors font-display text-xl uppercase tracking-widest">
                    ⚪ Neutral
                  </button>
                  <button onClick={() => handleClassification("negative")} className="p-6 text-center border border-signal/20 bg-signal/5 hover:bg-signal/10 text-signal transition-colors font-display text-xl uppercase tracking-widest">
                    🔴 Limiting
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: INTELLIGENT RESPONSE */}
            {step === 5 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-white/10 bg-black/60 p-6">
                
                {classification === "positive" && (
                  <div className="space-y-4 text-center">
                    <h3 className="font-display text-2xl uppercase text-emerald-400 tracking-wider">Momentum Mode</h3>
                    <p className="font-mono text-sm text-emerald-400/80">{momentumMsg}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 pt-4">No countermeasure required.</p>
                  </div>
                )}

                {classification === "neutral" && (
                  <div className="space-y-4 text-center">
                    <h3 className="font-display text-2xl uppercase text-frost tracking-wider">Observation Recorded</h3>
                    <p className="font-mono text-sm text-frost/80">State logged successfully.</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 pt-4">No action required.</p>
                  </div>
                )}

                {classification === "negative" && intervention && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="font-display text-2xl uppercase text-signal tracking-wider">Intervention Required</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mt-1">
                        State requires correction.
                      </p>
                    </div>

                    <div className="border border-signal/30 bg-signal/10 p-6 text-center mt-4 shadow-[0_0_15px_rgba(255,42,42,0.1)]">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-2">Protocol Dispatched</p>
                      <p className="font-display text-xl text-white/80 uppercase">Check Command Center</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-8">
                  <button onClick={() => setIsCollapsed(true)} className="px-10 py-3 border border-white/20 hover:bg-white/5 text-white/80 font-mono text-[11px] uppercase tracking-widest transition-colors">
                    Execute
                  </button>
                  <button onClick={resetWizard} className="ml-4 px-6 py-3 border border-transparent text-white/30 hover:text-white/60 font-mono text-[11px] uppercase tracking-widest transition-colors">
                    Reset
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
