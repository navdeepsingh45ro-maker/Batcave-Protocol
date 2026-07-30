"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { permanentOperationsRepository, PermanentOperation } from "@/lib/permanent-operations";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/foundation/types";

interface Props {
  todaysDate: ISODate;
}

export default function FocusTimer({ todaysDate }: Props) {
  const [operations, setOperations] = useState<PermanentOperation[]>([]);
  const [selectedOpId, setSelectedOpId] = useState<string>("");
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const ops = permanentOperationsRepository.listOperations().filter(o => !o.archived);
    setOperations(ops);
    if (ops.length > 0 && !selectedOpId) {
      setSelectedOpId(ops[0].id);
    }
  }, [selectedOpId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
      audioManager.playCheckinComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (!selectedOpId) return;
    
    const log = permanentOperationsRepository.getOrCreateLog(selectedOpId, todaysDate);
    
    if (isActive) {
      // Pause
      permanentOperationsRepository.updateLogStatus(log.id, "pending");
    } else {
      // Start/Resume
      permanentOperationsRepository.updateLogStatus(log.id, "active");
    }
    
    setIsActive(!isActive);
    audioManager.playClick();
  };

  const handleFinish = (completed: boolean) => {
    if (!selectedOpId) return;
    const log = permanentOperationsRepository.getOrCreateLog(selectedOpId, todaysDate);
    
    if (completed) {
      permanentOperationsRepository.updateLogStatus(log.id, "completed");
      audioManager.playCheckinComplete();
    } else {
      permanentOperationsRepository.updateLogStatus(log.id, "pending");
      audioManager.playClick();
    }

    // Reset
    setIsFinished(false);
    setTimeLeft(initialTime);
    setIsActive(false);
  };

  const adjustTime = (minutes: number) => {
    if (isActive) return;
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

  const activeOp = operations.find(o => o.id === selectedOpId);

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

      {!isFinished ? (
        <div className="flex flex-col sm:flex-row gap-8 items-center">
          
          {/* Controls */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-2">
                Select Operation
              </label>
              <select
                value={selectedOpId}
                onChange={(e) => setSelectedOpId(e.target.value)}
                disabled={isActive}
                className="w-full bg-black/60 border border-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white outline-none focus:border-white/30 disabled:opacity-50"
              >
                {operations.map(op => (
                  <option key={op.id} value={op.id}>
                    [{op.identity}] {op.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => adjustTime(-5)} disabled={isActive}
                className="px-3 py-1 border border-white/10 bg-white/5 text-white/40 hover:text-white disabled:opacity-30 font-mono text-[10px]"
              >
                -5m
              </button>
              <button 
                onClick={() => adjustTime(5)} disabled={isActive}
                className="px-3 py-1 border border-white/10 bg-white/5 text-white/40 hover:text-white disabled:opacity-30 font-mono text-[10px]"
              >
                +5m
              </button>
            </div>
          </div>

          {/* Clock Display */}
          <div className="shrink-0 flex flex-col items-center">
            <div className={`font-display text-6xl tracking-widest transition-colors ${isActive ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]" : "text-white/80"}`}>
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={toggleTimer}
                className={`font-mono text-[10px] uppercase tracking-widest px-6 py-2 border transition-all ${
                  isActive 
                    ? "border-amber-400/30 text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                }`}
              >
                {isActive ? "Pause" : timeLeft < initialTime ? "Continue" : "Start"}
              </button>
              
              {(!isActive && timeLeft < initialTime) && (
                <button
                  onClick={() => handleFinish(false)}
                  className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-white/10 text-white/30 hover:text-white/60"
                >
                  End Early
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-4 text-center space-y-6"
        >
          <div className="space-y-1">
            <h3 className="font-display text-2xl uppercase text-white">Time Elapsed</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Was "{activeOp?.name}" completed?
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleFinish(true)}
              className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              Yes, Mark Completed
            </button>
            <button
              onClick={() => handleFinish(false)}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 font-mono text-[11px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              No, Log Time & Reset
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
