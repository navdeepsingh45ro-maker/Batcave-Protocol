"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  localFoundationRepository,
  calculateDailyFoundationScoreFromActivities,
} from "@/lib/foundation";
import type { DailyStateLog } from "@/lib/state-detection";
import type { CountermeasureRecommendation } from "@/lib/countermeasures";
import { localCountermeasureRepository, detectThreat, detectNeed } from "@/lib/countermeasures";
import { COUNTERMEASURES } from "@/lib/countermeasures/config";
import { audioManager } from "@/lib/audioManager";

interface CommandCenterProps {
  todaysDate: string;
  latestStateLog: DailyStateLog | null;
  todaysStateLogCount: number;
  recommendation: CountermeasureRecommendation | null;
  refreshKey: number;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * i,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function CommandCenter({
  todaysDate,
  latestStateLog,
  todaysStateLogCount,
  recommendation,
  refreshKey,
}: CommandCenterProps) {
  const [clock, setClock] = useState("");

  // Clock tick
  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 2. Dominant Threat and Need
  const dominantThreat = useMemo(() => {
    if (!latestStateLog || latestStateLog.selectedStates.length === 0) return null;
    const thoughtType = latestStateLog.metadata?.thoughtType ?? null;
    if (thoughtType !== "limiting") return null;
    return detectThreat(latestStateLog.selectedStates);
  }, [latestStateLog]);

  const dominantNeed = useMemo(() => {
    if (!dominantThreat) return null;
    return detectNeed(dominantThreat.id);
  }, [dominantThreat]);

  // 3. Current Countermeasure
  const activeCountermeasure = useMemo(() => {
    const cmLogs = localCountermeasureRepository.listLogs();
    const todaysCmLogs = cmLogs.filter((log) => log.date === todaysDate);
    const acceptedLogs = todaysCmLogs.filter((log) => log.accepted);
    if (acceptedLogs.length === 0) return null;
    return acceptedLogs[acceptedLogs.length - 1];
  }, [refreshKey, todaysDate]);

  const countermeasureName = useMemo(() => {
    if (activeCountermeasure) {
      const match = COUNTERMEASURES.find((c) => c.id === activeCountermeasure.countermeasureId);
      return match ? match.name : activeCountermeasure.countermeasureId.replace(/_/g, " ");
    }
    if (recommendation) {
      return recommendation.recommendedCountermeasure.name;
    }
    return "Standby";
  }, [activeCountermeasure, recommendation]);

  // 4. Current Streak Calculation (Foundation score >= 60)
  const currentStreak = useMemo(() => {
    const getISTDateString = (date: Date) => {
      const offset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(date.getTime() + offset);
      return ist.toISOString().slice(0, 10);
    };
    
    const foundationActivities = localFoundationRepository.listFoundationActivities();
    
    const getScoreForDate = (dateStr: string) => {
      const fScore = calculateDailyFoundationScoreFromActivities(foundationActivities, dateStr as any);
      return fScore.scorePercent;
    };
    
    let streak = 0;
    let checkDate = new Date();
    let currentDateStr = getISTDateString(checkDate);
    
    if (getScoreForDate(currentDateStr) < 60) {
      checkDate.setDate(checkDate.getDate() - 1);
      currentDateStr = getISTDateString(checkDate);
    }
    
    let limit = 365;
    while (limit > 0) {
      const score = getScoreForDate(currentDateStr);
      if (score >= 60) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        currentDateStr = getISTDateString(checkDate);
      } else {
        break;
      }
      limit--;
    }
    return streak;
  }, [refreshKey, todaysDate]);

  // 5. Interactive Focus Timer (Pomodoro)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (timerRunning) {
      intervalId = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            audioManager.playCheckinComplete();
            // trigger custom sound or notification
            if (typeof window !== "undefined") {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              } catch (e) {
                // AudioContext blocked or not supported
              }
            }
            return timerMode === "focus" ? 5 * 60 : 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerRunning, timerMode]);

  const toggleTimer = () => {
    audioManager.playClick();
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    audioManager.playClick();
    setTimerRunning(false);
    setTimerSeconds(timerMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchTimerMode = (mode: "focus" | "break") => {
    audioManager.playClick();
    setTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [timerSeconds]);

  // Unified Status Check
  const statusLabel = useMemo(() => {
    if (dominantThreat) return "THREAT DETECTED";
    return "ALL SYSTEMS STABLE";
  }, [dominantThreat]);

  const statusColor = useMemo(() => {
    if (dominantThreat) return "text-signal glow-text-red border-signal/30 bg-signal/5";
    return "text-emerald-400 glow-text-emerald border-emerald-400/30 bg-emerald-500/[0.01]";
  }, [dominantThreat]);

  let sectionIdx = 0;

  return (
    <div className="panel flex min-h-0 flex-col p-4">
      {/* Title & Clock Header */}
      <motion.div
        className="mb-4 flex items-start justify-between border-b border-white/5 pb-2"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIdx++}
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
            Wayne Ent. / Operations
          </p>
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Command Center
          </h2>
        </div>
        <span className="font-mono text-sm tabular-nums text-signal/85 tracking-wider">
          {clock}
        </span>
      </motion.div>

      {/* Grid of strict fields */}
      <div className="flex-1 flex flex-col gap-3 justify-between">
        
        {/* 1. MISSION STATUS */}
        <motion.div
          className={`border p-3 text-center transition-all ${statusColor}`}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={sectionIdx++}
        >
          <span className="block font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            System Status
          </span>
          <p className="mt-1 font-display text-sm sm:text-base uppercase tracking-widest font-bold">
            {statusLabel}
          </p>
        </motion.div>

        {/* 2. Threats & Countermeasures */}
        <motion.div
          className="grid grid-cols-2 gap-2 border border-white/6 bg-black/35 p-3 font-mono text-xs"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={sectionIdx++}
        >
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">
              Current Threat
            </span>
            <p className={`font-display text-[10px] uppercase truncate ${dominantThreat ? "text-signal" : "text-white/40"}`}>
              {dominantThreat ? dominantThreat.name : "None Scan"}
            </p>
          </div>
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">
              Countermeasure
            </span>
            <p className={`font-display text-[10px] uppercase truncate ${activeCountermeasure ? "text-emerald-400" : recommendation ? "text-amber-400" : "text-white/40"}`}>
              {countermeasureName}
            </p>
          </div>
        </motion.div>

        {/* 4. Streak Counter */}
        <motion.div
          className="border border-white/6 bg-black/35 p-3 font-mono text-xs flex justify-between items-center"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={sectionIdx++}
        >
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">
              Current Streak
            </span>
            <p className="font-display text-lg uppercase text-white leading-tight mt-0.5">
              {currentStreak} <span className="text-[10px] text-white/40">Days</span>
            </p>
          </div>
          <span className="text-xl">🔥</span>
        </motion.div>

        {/* 5. Focus Timer */}
        <motion.div
          className="border border-white/6 bg-black/35 p-3 space-y-2.5"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={sectionIdx++}
        >
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[8px] uppercase tracking-wider text-white/30">
              Current Focus Timer
            </span>
            <div className="flex gap-1.5 text-[8px] font-mono uppercase">
              <button
                type="button"
                onClick={() => switchTimerMode("focus")}
                className={`px-1.5 py-0.5 border ${
                  timerMode === "focus"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                    : "border-white/5 text-white/30 hover:text-white"
                }`}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => switchTimerMode("break")}
                className={`px-1.5 py-0.5 border ${
                  timerMode === "break"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                    : "border-white/5 text-white/30 hover:text-white"
                }`}
              >
                Break
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`font-display text-2xl tabular-nums leading-none ${
              timerRunning
                ? timerMode === "focus"
                  ? "text-amber-400 animate-pulse"
                  : "text-emerald-400 animate-pulse"
                : "text-white"
            }`}>
              {formattedTimer}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className={`px-3 py-1 border font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  timerRunning
                    ? "border-signal/50 bg-signal/10 text-signal hover:bg-signal/20"
                    : "border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                }`}
              >
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="px-2.5 py-1 border border-white/10 bg-white/[0.03] text-white/50 hover:text-white font-mono text-[9px] uppercase tracking-wider"
              >
                Reset
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
