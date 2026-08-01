"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { identityOperationsRepository, ProtocolIdentity } from "@/lib/identity-operations";
import type { ISODate } from "@/lib/foundation/types";
import { audioManager } from "@/lib/audioManager";

interface Props {
  todaysDate: ISODate;
}

type UnfinishedTask = { id: string; name: string; identity: ProtocolIdentity; type: "PermanentOperation" | "TodayMission" };

type EngineState = "idle" | "reviewing" | "done";

function subtractDays(dateStr: ISODate, days: number): ISODate {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as ISODate;
}

const REASONS = [
  "Ran out of time",
  "Low Energy",
  "Changed Priorities",
  "Forgot",
  "Health",
  "Other"
];

export default function AccountabilityEngine({ todaysDate }: Props) {
  const [state, setState] = useState<EngineState>("idle");
  const [unfinishedTasks, setUnfinishedTasks] = useState<UnfinishedTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [otherText, setOtherText] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [yesterday, setYesterday] = useState<ISODate>(todaysDate);

  useEffect(() => {
    const yest = subtractDays(todaysDate, 1);
    setYesterday(yest);
    
    if (identityOperationsRepository.hasCompletedAccountabilityReview(todaysDate)) {
      return;
    }

    const tasks = identityOperationsRepository.getUnfinishedTasks(yest);
    if (tasks.length > 0) {
      setUnfinishedTasks(tasks);
    } else {
      identityOperationsRepository.markAccountabilityReviewCompleted(todaysDate);
    }
  }, [todaysDate]);

  const handleStartReview = () => {
    audioManager.playClick();
    setState("reviewing");
  };

  const handleReasonSelected = (reason: string) => {
    if (reason === "Other") {
      audioManager.playClick();
      setShowOther(true);
      return;
    }
    submitReason(reason);
  };

  const submitReason = (reason: string) => {
    if (!reason.trim()) return;
    audioManager.playClick();
    
    const task = unfinishedTasks[currentIndex];
    identityOperationsRepository.logUnfinishedTaskReason(task.id, task.type, yesterday, reason.trim());

    if (currentIndex < unfinishedTasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowOther(false);
      setOtherText("");
    } else {
      completeReview();
    }
  };

  const completeReview = useCallback(() => {
    identityOperationsRepository.markAccountabilityReviewCompleted(todaysDate);
    setState("done");
    
    // Auto-dismiss after 2.5 seconds
    setTimeout(() => {
      setUnfinishedTasks([]);
    }, 2500);
  }, [todaysDate]);

  if (unfinishedTasks.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        <div className="border border-red-500/30 bg-black/60 p-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          {state === "idle" && (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-red-500 mb-1">
                  Yesterday's Review
                </p>
                <p className="font-mono text-sm text-white/80">
                  {unfinishedTasks.length} {unfinishedTasks.length === 1 ? "operation requires" : "operations require"} explanation.
                </p>
              </div>
              <button
                onClick={handleStartReview}
                className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Review
              </button>
            </div>
          )}

          {state === "reviewing" && (
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-1">
                  [{unfinishedTasks[currentIndex].identity}]
                </p>
                <h3 className="font-display text-lg uppercase text-white/90">
                  {unfinishedTasks[currentIndex].name}
                </h3>
              </div>
              
              <p className="font-mono text-[10px] uppercase text-red-400/80 tracking-widest">
                Why wasn't this completed?
              </p>

              {!showOther ? (
                <div className="flex flex-wrap gap-2">
                  {REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => handleReasonSelected(reason)}
                      className="px-3 py-1.5 font-mono text-[10px] uppercase text-white/60 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    autoFocus
                    rows={2}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 p-2 font-mono text-xs text-white outline-none focus:border-red-500/50 resize-none"
                    placeholder="Brief explanation..."
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => submitReason(otherText)}
                      disabled={!otherText.trim()}
                      className="px-4 py-1.5 font-mono text-[10px] uppercase bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowOther(false);
                        setOtherText("");
                      }}
                      className="px-4 py-1.5 font-mono text-[10px] uppercase border border-white/10 text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {state === "done" && (
            <div className="py-2">
              <h3 className="font-display text-lg uppercase text-emerald-400 tracking-wider mb-1">
                Yesterday's Review Complete
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Resume today's operations.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
