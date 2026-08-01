"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { identityOperationsRepository, PermanentOperation, ProtocolIdentity, TodayMission } from "@/lib/identity-operations";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/foundation/types";
import { focusSessionRepository, ObjectiveStatus, InterruptionReason } from "@/lib/focus-sessions";

interface Props {
  todaysDate: ISODate;
}

type TimerState = "idle" | "task_selection" | "temp_task_input" | "active" | "break" | "review" | "logged";

export default function FocusTimer({ todaysDate }: Props) {
  const [operations, setOperations] = useState<PermanentOperation[]>([]);
  const [missions, setMissions] = useState<TodayMission[]>([]);
  const [state, setState] = useState<TimerState>("idle");
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  
  // Session details
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskType, setLinkedTaskType] = useState<"PermanentOperation" | "TodayMission" | null>(null);
  const [taskName, setTaskName] = useState<string>("Unassigned");
  const [activeIdentity, setActiveIdentity] = useState<ProtocolIdentity>("Builder");
  const [sessionStartTime, setSessionStartTime] = useState<string>("");
  const [breakSkipped, setBreakSkipped] = useState(false);
  const [tempTaskInput, setTempTaskInput] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);

  // Review state
  const [focusRating, setFocusRating] = useState(5);
  const [energyRating, setEnergyRating] = useState(5);
  const [distractionRating, setDistractionRating] = useState(5);
  const [objectiveStatus, setObjectiveStatus] = useState<ObjectiveStatus>("Mission Complete");
  const [interruptionReason, setInterruptionReason] = useState<InterruptionReason>("Phone");
  const [notes, setNotes] = useState("");

  // Logged summary details
  const [lastLoggedSummary, setLastLoggedSummary] = useState({ duration: 0, score: 0, status: "", identity: "" });

  const loadData = () => {
    const ops = identityOperationsRepository.listOperations().filter(o => !o.archived && o.focusTimerEligible !== false);
    setOperations(ops);
    const m = identityOperationsRepository.listTodayMissions(todaysDate).filter(m => m.status === "pending");
    setMissions(m);

    const sessions = focusSessionRepository.listSessions().filter(s => s.date === todaysDate);
    setSessionNumber(sessions.length + 1);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("batcave-ops-updated", loadData);
    return () => window.removeEventListener("batcave-ops-updated", loadData);
  }, [state, todaysDate]);

  // Request Notification Permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (state === "active" && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(time => time - 1), 1000);
    } else if (state === "active" && timeLeft === 0) {
      handleSessionComplete();
    } else if (state === "break" && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(time => time - 1), 1000);
    } else if (state === "break" && timeLeft === 0) {
      handleBreakComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, timeLeft]);

  const showNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const startIdle = () => {
    setState("idle");
    setTimeLeft(initialTime);
    setLinkedTaskId(null);
    setLinkedTaskType(null);
    setTaskName("Unassigned");
    setActiveIdentity("Builder");
  };

  const handleStartClick = () => {
    audioManager.playClick();
    setState("task_selection");
  };

  const startActiveSession = (id: string | null, type: "PermanentOperation" | "TodayMission" | null, name: string, identity: ProtocolIdentity) => {
    setLinkedTaskId(id);
    setLinkedTaskType(type);
    setTaskName(name || "Unassigned");
    setActiveIdentity(identity);
    setSessionStartTime(new Date().toISOString());
    setState("active");
    audioManager.playToggle();
  };

  const handleSessionComplete = () => {
    audioManager.playCheckinComplete();
    showNotification("Focus Session Complete", "Time for a 5-minute break.");
    setState("break");
    setTimeLeft(5 * 60); // 5 minute break
    setInitialTime(5 * 60);
    audioManager.playToggle(); // Break begin cue
  };

  const handleBreakComplete = () => {
    audioManager.playClick();
    setState("review");
  };

  const skipBreak = () => {
    audioManager.playClick();
    setBreakSkipped(true);
    setState("review");
  };

  const adjustTime = (minutes: number) => {
    if (state !== "idle") return;
    const newTime = Math.max(60, initialTime + minutes * 60);
    setInitialTime(newTime);
    setTimeLeft(newTime);
    audioManager.playClick();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const saveSession = () => {
    audioManager.playClick();
    
    const durationSec = state === "active" ? (initialTime - timeLeft) : initialTime;
    
    const session = focusSessionRepository.createSession({
      date: todaysDate,
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      duration: durationSec,
      identity: activeIdentity,
      linkedTaskId,
      taskName,
      objectiveStatus,
      focusRating,
      energyRating,
      distractionRating,
      interruptionReason: objectiveStatus === "Blocked" ? interruptionReason : undefined,
      notes,
      breakCompleted: !breakSkipped,
      timerLength: initialTime,
    });

    if (linkedTaskId && objectiveStatus === "Mission Complete") {
      if (linkedTaskType === "PermanentOperation") {
        const log = identityOperationsRepository.getOrCreateLog(linkedTaskId, todaysDate);
        identityOperationsRepository.updateLogStatus(log.id, "completed", undefined, "Focus Timer");
      } else if (linkedTaskType === "TodayMission") {
        identityOperationsRepository.updateTodayMission(linkedTaskId, { status: "completed" }, todaysDate, "Focus Timer");
      }
    }

    setLastLoggedSummary({
      duration: durationSec,
      score: session.deepWorkScore,
      status: objectiveStatus,
      identity: activeIdentity,
    });
    
    setState("logged");

    // Reset Review form
    setFocusRating(5);
    setEnergyRating(5);
    setDistractionRating(5);
    setObjectiveStatus("Mission Complete");
    setInterruptionReason("Phone");
    setNotes("");
    setBreakSkipped(false);
  };

  const discardSession = () => {
    audioManager.playClick();
    startIdle();
  };

  return (
    <div className="border border-white/5 bg-black/40 p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-end border-b border-white/5 pb-2 mb-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Execution Engine
          </p>
          <h2 className="font-display text-xl uppercase tracking-wider text-frost mt-1">
            Focus Timer
          </h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => adjustTime(-5)} className="px-3 py-1 border border-white/10 bg-white/5 text-white/40 hover:text-white font-mono text-[10px]">-5m</button>
              <button onClick={() => adjustTime(5)} className="px-3 py-1 border border-white/10 bg-white/5 text-white/40 hover:text-white font-mono text-[10px]">+5m</button>
            </div>
            <div className="font-display text-6xl tracking-widest text-white/80 mb-6">
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleStartClick}
              className="font-mono text-xs uppercase tracking-widest px-8 py-3 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              Start Focus Session
            </button>
          </motion.div>
        )}

        {state === "task_selection" && (
          <motion.div key="task_selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4 space-y-4">
            <p className="font-mono text-xs text-white/60 text-center mb-6 uppercase tracking-widest">
              Would you like to connect this Focus Session to a task?
            </p>
            
            <div className="space-y-4">
              {(operations.length > 0 || missions.length > 0) && (
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">Select Existing Task</label>
                  <select
                    className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white outline-none focus:border-emerald-500/50"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [type, id] = e.target.value.split(":");
                      if (type === "op") {
                        const op = operations.find(o => o.id === id);
                        if (op) startActiveSession(op.id, "PermanentOperation", op.name, op.identity);
                      } else {
                        const m = missions.find(m => m.id === id);
                        if (m) startActiveSession(m.id, "TodayMission", m.name, m.identity);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Task --</option>
                    {missions.length > 0 && <optgroup label="Today's Missions" className="bg-black text-white/50" />}
                    {missions.map(m => (
                      <option key={`m_${m.id}`} value={`mission:${m.id}`}>[{m.identity}] {m.name}</option>
                    ))}
                    {operations.length > 0 && <optgroup label="Permanent Operations" className="bg-black text-white/50 mt-2" />}
                    {operations.map(op => (
                      <option key={`op_${op.id}`} value={`op:${op.id}`}>[{op.identity}] {op.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => { audioManager.playClick(); setState("temp_task_input"); }}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white/60 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  Create Temporary Task
                </button>
                <button
                  onClick={() => startActiveSession(null, null, "Unassigned", "Builder")}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white/60 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  Continue Without Task
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {state === "temp_task_input" && (
          <motion.div key="temp_task_input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4 space-y-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">Temporary Task Name</label>
              <input
                autoFocus
                type="text"
                value={tempTaskInput}
                onChange={e => setTempTaskInput(e.target.value)}
                className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-amber-500/50"
                placeholder="E.g. Clean Inbox"
              />
            </div>
            <div>
               <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">Primary Identity</label>
               <select
                 value={activeIdentity}
                 onChange={(e) => setActiveIdentity(e.target.value as ProtocolIdentity)}
                 className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white outline-none focus:border-amber-500/50"
               >
                 <option value="Builder">Builder</option>
                 <option value="Striker">Striker</option>
                 <option value="King">King</option>
                 <option value="Guardian">Guardian</option>
               </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => { audioManager.playClick(); setState("task_selection"); }}
                className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (tempTaskInput.trim()) {
                    startActiveSession(null, null, tempTaskInput.trim(), activeIdentity);
                  }
                }}
                disabled={!tempTaskInput.trim()}
                className="flex-1 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-30"
              >
                Begin Focus
              </button>
            </div>
          </motion.div>
        )}

        {state === "active" && (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-amber-400/80 mb-2">
              Session {sessionNumber} · {activeIdentity}
            </p>
            <h3 className="font-display text-xl text-white mb-6 uppercase tracking-wider">{taskName}</h3>
            
            <div className="font-display text-7xl tracking-widest text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)] mb-8">
              {formatTime(timeLeft)}
            </div>
            
            <button
              onClick={() => { audioManager.playClick(); setState("review"); }}
              className="font-mono text-[9px] uppercase tracking-widest px-4 py-1.5 border border-white/10 text-white/30 hover:text-white/60 transition-colors"
            >
              End Early
            </button>
          </motion.div>
        )}

        {state === "break" && (
          <motion.div key="break" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6">
            <h3 className="font-display text-2xl text-emerald-400 mb-2 uppercase tracking-wider">Focus Session Complete</h3>
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-6">Mandatory Break</p>
            
            <div className="font-display text-6xl tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] mb-8">
              {formatTime(timeLeft)}
            </div>
            
            <button
              onClick={skipBreak}
              className="font-mono text-[10px] uppercase tracking-widest px-6 py-2 border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              Skip Break
            </button>
          </motion.div>
        )}

        {state === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-2 space-y-6">
            <h3 className="font-display text-lg uppercase text-white/90 border-b border-white/10 pb-2">Session Review</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Ratings */}
              <div className="space-y-4 col-span-1">
                <div>
                  <div className="flex justify-between font-mono text-[9px] uppercase text-white/40 mb-1">
                    <span>Focus</span><span className="text-amber-400">{focusRating}</span>
                  </div>
                  <input type="range" min="1" max="10" value={focusRating} onChange={e => setFocusRating(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] uppercase text-white/40 mb-1">
                    <span>Energy</span><span className="text-emerald-400">{energyRating}</span>
                  </div>
                  <input type="range" min="1" max="10" value={energyRating} onChange={e => setEnergyRating(Number(e.target.value))} className="w-full accent-emerald-500" />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] uppercase text-white/40 mb-1">
                    <span>Distraction</span><span className="text-red-400">{distractionRating}</span>
                  </div>
                  <input type="range" min="1" max="10" value={distractionRating} onChange={e => setDistractionRating(Number(e.target.value))} className="w-full accent-red-500" />
                </div>
              </div>

              {/* Status & Notes */}
              <div className="col-span-1 sm:col-span-2 space-y-4">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">Objective Status</label>
                  <select
                    value={objectiveStatus}
                    onChange={(e) => setObjectiveStatus(e.target.value as ObjectiveStatus)}
                    className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="Mission Complete">✅ Mission Complete</option>
                    <option value="Significant Progress">🟡 Significant Progress</option>
                    <option value="Blocked">❌ Blocked</option>
                  </select>
                </div>

                {objectiveStatus === "Blocked" && (
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-widest text-red-400/80 block mb-2">Interruption Reason</label>
                    <select
                      value={interruptionReason}
                      onChange={(e) => setInterruptionReason(e.target.value as InterruptionReason)}
                      className="w-full bg-red-500/10 border border-red-500/30 px-3 py-2 font-mono text-[11px] uppercase text-red-400 outline-none focus:border-red-500"
                    >
                      <option value="Phone">Phone</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Fatigue">Fatigue</option>
                      <option value="Hunger">Hunger</option>
                      <option value="Work">Work</option>
                      <option value="Family">Family</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="E.g. Phone distracted me, deep work, etc."
                    className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button
                onClick={discardSession}
                className="px-6 py-2 border border-red-500/30 text-red-400/60 font-mono text-[10px] uppercase hover:bg-red-500/10 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={saveSession}
                className="flex-1 px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              >
                Save Session
              </button>
            </div>
          </motion.div>
        )}

        {state === "logged" && (
          <motion.div key="logged" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
            <h3 className="font-display text-2xl text-emerald-400 mb-1 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">Mission Logged</h3>
            <p className="font-mono text-[10px] text-emerald-400/50 uppercase tracking-widest mb-6">Data saved to Vault</p>
            
            <div className="flex gap-6 mb-8 text-center font-mono uppercase">
              <div>
                <div className="text-[9px] text-white/30 tracking-widest mb-1">Identity</div>
                <div className="text-sm text-white/80">{lastLoggedSummary.identity}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 tracking-widest mb-1">Duration</div>
                <div className="text-sm text-amber-400">{Math.round(lastLoggedSummary.duration / 60)}m</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 tracking-widest mb-1">Status</div>
                <div className={`text-sm ${lastLoggedSummary.status === "Blocked" ? "text-red-400" : lastLoggedSummary.status === "Mission Complete" ? "text-emerald-400" : "text-amber-400"}`}>
                  {lastLoggedSummary.status === "Mission Complete" ? "CMPT" : lastLoggedSummary.status === "Blocked" ? "BLCK" : "PROG"}
                </div>
              </div>
            </div>

            <button
              onClick={startIdle}
              className="font-mono text-[10px] uppercase tracking-widest px-6 py-2 border border-white/20 text-white/60 hover:text-white transition-colors"
            >
              Continue
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
