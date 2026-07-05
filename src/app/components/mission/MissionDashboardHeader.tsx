"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MissionConfig } from "@/lib/mission-mode/types";
import type { ISODate } from "@/lib/foundation/types";
import {
  getMissionDayNumber,
  getMissionTotalDays,
  getMissionDaysRemaining,
  getMissionProgress,
  getMissionStatus,
} from "@/lib/mission-mode/modeManager";

interface MissionDashboardHeaderProps {
  config: MissionConfig;
  todaysDate: ISODate;
  score: number;
  rating: string;
}

export default function MissionDashboardHeader({
  config,
  todaysDate,
  score,
  rating,
}: MissionDashboardHeaderProps) {
  const dayNumber = useMemo(() => getMissionDayNumber(config, todaysDate), [config, todaysDate]);
  const totalDays = useMemo(() => getMissionTotalDays(config), [config]);
  const daysRemaining = useMemo(() => getMissionDaysRemaining(config, todaysDate), [config, todaysDate]);
  const progress = useMemo(() => getMissionProgress(config, todaysDate), [config, todaysDate]);
  const status = useMemo(() => getMissionStatus(config, todaysDate), [config, todaysDate]);

  return (
    <motion.div
      className="mission-banner panel px-4 py-4 sm:px-6 sm:py-5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top Row: Mission Mode Badge + Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Pulsing mission indicator */}
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
          </div>
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.3em] text-amber-400">
              Mission Mode Active
            </p>
            <h2 className="font-display text-xl uppercase leading-tight text-white sm:text-2xl">
              {config.customName ?? config.name}
            </h2>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 border px-3 py-1.5 font-display text-[10px] uppercase tracking-wider ${
              status === "ACTIVE"
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                : status === "COMPLETED"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                  : "border-white/20 bg-white/5 text-white/50"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                status === "ACTIVE"
                  ? "bg-amber-400"
                  : status === "COMPLETED"
                    ? "bg-emerald-400"
                    : "bg-white/40"
              }`}
            />
            {status}
          </span>
        </div>
      </div>

      {/* Mission Objective */}
      <div className="mt-3 border-t border-white/6 pt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          Mission Objective
        </p>
        <p className="mt-1 font-display text-sm uppercase tracking-wide text-frost">
          {config.customObjective ?? config.objective}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">
            Mission Progress
          </span>
          <span className="font-mono text-[10px] tabular-nums text-amber-400/80">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, rgba(212, 165, 67, 0.8), rgba(212, 165, 67, 0.5))",
              boxShadow: "0 0 12px rgba(212, 165, 67, 0.3)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="border border-white/6 bg-black/30 p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
            Current Day
          </p>
          <p className="mt-0.5 font-display text-lg tabular-nums text-white">
            {dayNumber}
            <span className="ml-0.5 font-mono text-[9px] text-white/30">/ {totalDays}</span>
          </p>
        </div>

        <div className="border border-white/6 bg-black/30 p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
            Days Remaining
          </p>
          <p className="mt-0.5 font-display text-lg tabular-nums text-amber-400">
            {daysRemaining}
          </p>
        </div>

        <div className="border border-white/6 bg-black/30 p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
            Today&apos;s Score
          </p>
          <p className="mt-0.5 font-display text-lg tabular-nums text-white">
            {score}
            <span className="ml-0.5 font-mono text-[9px] text-white/30">/ {config.scoringWeights.maxScore}</span>
          </p>
        </div>

        <div className="border border-white/6 bg-black/30 p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
            Rating
          </p>
          <p
            className={`mt-0.5 font-display text-sm uppercase ${
              rating === "Excellent"
                ? "text-emerald-400"
                : rating === "Good"
                  ? "text-blue-400"
                  : rating === "Recover Tomorrow"
                    ? "text-amber-400"
                    : "text-red-400"
            }`}
          >
            {rating}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
