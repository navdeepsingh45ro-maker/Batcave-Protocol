"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audioManager";
import { localStateDetectionRepository, type ISODate } from "@/lib/state-detection";
import { identityOperationsRepository } from "@/lib/identity-operations";
import { recommendCountermeasure, localCountermeasureRepository, type CountermeasureRecommendation } from "@/lib/countermeasures";

interface Props {
  todaysDate: ISODate;
}

export default function CountermeasureDispatch({ todaysDate }: Props) {
  const [missionState, setMissionState] = useState<"pending" | "accepted" | "completed" | "failed">("pending");
  const [recommendation, setRecommendation] = useState<CountermeasureRecommendation | null>(null);

  // 1. Evaluate rules for activation
  const stateLogs = localStateDetectionRepository.getStateLogsForDate(todaysDate);
  const latestState = stateLogs.length > 0 ? stateLogs[stateLogs.length - 1] : null;
  const isNegative = latestState?.metadata?.stateCategory === "negative";

  const opsLogs = identityOperationsRepository.listLogsForDate(todaysDate);
  const skippedCount = opsLogs.filter(l => l.status === "skipped").length;

  const shouldActivate = isNegative || skippedCount >= 2;

  // 2. Generate Mission if activated
  useEffect(() => {
    if (shouldActivate && !recommendation && latestState) {
      // Use existing recommendation engine
      const rec = recommendCountermeasure({
        selectedStates: latestState.selectedStates,
        date: todaysDate,
      });
      setRecommendation(rec);
    }
  }, [shouldActivate, recommendation, latestState, todaysDate]);

  // 3. Actions
  const handleAccept = () => {
    audioManager.playClick();
    setMissionState("accepted");
  };

  const handleFinish = (success: boolean) => {
    if (!recommendation) return;
    
    // Log to repository
    localCountermeasureRepository.complete({
      date: todaysDate,
      triggerStates: latestState?.selectedStates || [],
      detectedThreatId: recommendation.detectedThreat.id,
      detectedNeed: recommendation.recommendedNeed.name,
      countermeasureId: recommendation.recommendedCountermeasure.id,
      identity: recommendation.recommendedIdentity,
      missionRedirect: recommendation.missionRedirect,
      accepted: true,
      completed: success,
    });

    if (success) {
      audioManager.playCheckinComplete();
      setMissionState("completed");
    } else {
      audioManager.playClick();
      setMissionState("failed");
    }
  };

  if (!shouldActivate || !recommendation) return null;

  return (
    <AnimatePresence>
      {(missionState === "pending" || missionState === "accepted") && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="border border-signal/50 bg-signal/5 p-5 shadow-[0_0_30px_rgba(255,42,42,0.15)] relative overflow-hidden my-4"
        >
          {/* Pulsing warning line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-signal animate-pulse" />

          <div className="pl-2">
            <h2 className="font-display text-xl uppercase tracking-widest text-signal mb-4 flex items-center gap-2">
              <span className="text-sm">⚠️</span> Countermeasure Dispatch
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="border border-signal/20 bg-black/40 p-3">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-signal/60 mb-1">
                  Identified Threat
                </span>
                <span className="font-mono text-sm text-white font-bold uppercase">
                  {recommendation.detectedThreat.name}
                </span>
              </div>
              
              <div className="border border-frost/20 bg-black/40 p-3">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-frost/60 mb-1">
                  Required Need
                </span>
                <span className="font-mono text-sm text-white font-bold uppercase">
                  {recommendation.recommendedNeed.name}
                </span>
              </div>

              <div className="border border-emerald-400/20 bg-black/40 p-3 sm:col-span-3 lg:col-span-1">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-emerald-400/60 mb-1">
                  Primary Mission
                </span>
                <span className="font-mono text-sm text-emerald-400 font-bold uppercase">
                  {recommendation.recommendedCountermeasure.name}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {missionState === "pending" && (
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 bg-signal/10 border border-signal/50 text-signal font-mono text-xs uppercase tracking-widest hover:bg-signal/20 transition-colors shadow-[0_0_15px_rgba(255,42,42,0.2)]"
                >
                  Accept Mission
                </button>
              )}

              {missionState === "accepted" && (
                <>
                  <button
                    onClick={() => handleFinish(true)}
                    className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    Complete Mission
                  </button>
                  <button
                    onClick={() => handleFinish(false)}
                    className="px-6 py-2.5 bg-black/50 border border-white/20 text-white/40 font-mono text-xs uppercase tracking-widest hover:text-white/80 hover:border-white/40 transition-colors"
                  >
                    Failed
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {missionState === "completed" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border border-emerald-500/30 bg-emerald-500/5 p-4 my-4 flex items-center justify-between"
        >
          <span className="font-mono text-xs uppercase text-emerald-400 tracking-widest">
            Mission Successful. State Recovering.
          </span>
          <span className="text-emerald-400">✓</span>
        </motion.div>
      )}

      {missionState === "failed" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border border-white/10 bg-white/5 p-4 my-4 flex items-center justify-between"
        >
          <span className="font-mono text-xs uppercase text-white/40 tracking-widest">
            Mission Failed. Threat Persists.
          </span>
          <span className="text-white/20">×</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
