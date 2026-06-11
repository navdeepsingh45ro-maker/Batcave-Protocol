"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { IDENTITIES, FOUNDATION_IDENTITY_MAP } from "@/lib/foundation";
import type { FoundationType, Identity, ISODate } from "@/lib/foundation";
import {
  localFoundationRepository,
  calculateDailyFoundationScoreFromActivities,
  getCompletedFoundationTypesFromActivities,
} from "@/lib/foundation";
import type { DailyStateLog } from "@/lib/state-detection";
import type { CountermeasureRecommendation, CountermeasureLog } from "@/lib/countermeasures";
import { localCountermeasureRepository, detectThreat, detectNeed } from "@/lib/countermeasures";
import { COUNTERMEASURES } from "@/lib/countermeasures/config";
import { audioManager } from "@/lib/audioManager";

interface CommandCenterProps {
  todaysDate: ISODate;
  latestStateLog: DailyStateLog | null;
  todaysStateLogCount: number;
  recommendation: CountermeasureRecommendation | null;
  refreshKey: number;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const RISK_COLORS: Record<string, string> = {
  GREEN: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  YELLOW: "text-warning border-warning/40 bg-warning/10",
  ORANGE: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  RED: "text-signal border-signal/40 bg-signal/10",
};

const RISK_DOT: Record<string, string> = {
  GREEN: "bg-emerald-400",
  YELLOW: "bg-warning",
  ORANGE: "bg-orange-400",
  RED: "bg-signal",
};

export default function CommandCenter({
  todaysDate,
  latestStateLog,
  todaysStateLogCount,
  recommendation,
  refreshKey,
}: CommandCenterProps) {
  const [clock, setClock] = useState("");

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

  // Read activities
  const activities = useMemo(
    () => localFoundationRepository.listFoundationActivities(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  const constraintLogs = useMemo(
    () => localFoundationRepository.listConstraintLogs(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  const completedFoundations = useMemo(
    () => getCompletedFoundationTypesFromActivities(activities, todaysDate),
    [activities, todaysDate]
  );

  const dailyScore = useMemo(
    () => calculateDailyFoundationScoreFromActivities(activities, todaysDate),
    [activities, todaysDate]
  );

  // Load countermeasure logs to find latest accepted countermeasure today
  const activeCountermeasure = useMemo(() => {
    const cmLogs = localCountermeasureRepository.listLogs();
    const todaysCmLogs = cmLogs.filter((log) => log.date === todaysDate);
    
    // Find latest accepted but not completed, or completed log
    const acceptedLogs = todaysCmLogs.filter((log) => log.accepted);
    if (acceptedLogs.length === 0) return null;
    return acceptedLogs[acceptedLogs.length - 1];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, todaysDate]);

  // Dominant Threat and Need — computed directly from latest state log (Issue 9 fix)
  // This updates immediately after any check-in, regardless of risk level or recommendation prop
  const dominantThreat = useMemo(() => {
    if (!latestStateLog || latestStateLog.selectedStates.length === 0) return null;
    // V4.2: only run threat detection for limiting thoughts
    const thoughtType = latestStateLog.metadata?.thoughtType ?? null;
    if (thoughtType !== "limiting") return null;
    return detectThreat(latestStateLog.selectedStates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestStateLog, refreshKey]);

  const dominantNeed = useMemo(() => {
    if (!dominantThreat) return null;
    return detectNeed(dominantThreat.id);
  }, [dominantThreat]);

  // Active identities (multiple allowed)
  const activeIdentities = useMemo(() => {
    const active = new Set<Identity>();

    completedFoundations.forEach((f: FoundationType) => {
      const identity = FOUNDATION_IDENTITY_MAP[f];
      if (identity) active.add(identity);
    });

    if (recommendation?.recommendedIdentity) {
      active.add(recommendation.recommendedIdentity);
    }

    return active;
  }, [completedFoundations, recommendation]);

  const constraintStatus = useMemo(() => {
    const todaysEntry = constraintLogs.find(
      (log) => log.date === todaysDate && log.constraint === "No Porn"
    );

    if (!todaysEntry) return "PENDING" as const;
    if (todaysEntry.subtype === "Yes" && todaysEntry.completed)
      return "CLEAN" as const;
    if (todaysEntry.subtype === "No") return "FAILED" as const;
    return "PENDING" as const;
  }, [constraintLogs, todaysDate]);

  let sectionIndex = 0;

  return (
    <div className="panel flex min-h-0 flex-col p-4">
      {/* Header */}
      <motion.div
        className="mb-4 flex items-start justify-between"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIndex++}
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/80">
            Right Array
          </p>
          <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
            Command Center
          </h2>
        </div>
        <span className="font-mono text-lg tabular-nums text-signal glow-text-red">
          {clock}
        </span>
      </motion.div>

      {/* Identity Activation Grid */}
      <motion.div
        className="mb-3 grid grid-cols-2 gap-2"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIndex++}
      >
        {IDENTITIES.map((identity) => {
          const isActive = activeIdentities.has(identity);
          const isCountermeasureTarget =
            recommendation?.recommendedIdentity === identity;

          return (
            <div
              key={identity}
              className={`relative px-3 py-3.5 text-center font-display text-xs sm:text-sm uppercase transition-all duration-300 ${
                isActive
                  ? "border border-signal/50 bg-signal/10 text-white shadow-[0_0_20px_rgba(255,42,42,0.12)]"
                  : "border border-white/10 bg-white/[0.03] text-white/40"
              }`}
            >
              {identity}
              {isCountermeasureTarget && (
                <span className="mt-1 block font-mono text-[9px] tracking-wider text-signal animate-pulse">
                  ▸ ACTIVATED
                </span>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ── MISSION CONTROL PANEL ── */}
      <motion.div
        className="mb-3 border border-white/8 bg-black/40 p-3 space-y-2.5 font-mono text-xs"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIndex++}
      >
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-white/30">Primary Mission</span>
          {activeCountermeasure ? (
            <p className="font-display text-base uppercase text-signal glow-text-red leading-tight">
              {COUNTERMEASURES.find((c) => c.id === activeCountermeasure.countermeasureId)?.name ?? activeCountermeasure.countermeasureId.replace(/_/g, " ")}
            </p>
          ) : recommendation ? (
            <p className="font-display text-base uppercase text-signal glow-text-red leading-tight">
              {recommendation.missionRedirect}
            </p>
          ) : (
            <p className="font-display text-base uppercase text-white/35 leading-tight">Standing By</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">Active Action</span>
            <p className="font-display text-[11px] uppercase text-white truncate">
              {activeCountermeasure
                ? `[${activeCountermeasure.metadata?.outcome || "ACTIVE"}]`
                : "None Deploy"}
            </p>
          </div>
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">Active Protocol</span>
            <p className="font-display text-[11px] uppercase text-frost truncate">
              {activeCountermeasure
                ? activeCountermeasure.countermeasureId.replace(/_/g, " ")
                : recommendation
                  ? recommendation.recommendedCountermeasure.name
                  : "Standby"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant Threat</span>
            <p className="font-display text-[11px] uppercase text-white truncate">
              {dominantThreat ? dominantThreat.name : "None Scan"}
            </p>
          </div>
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/30">Dominant Need</span>
            <p className="font-display text-[11px] uppercase text-frost truncate">
              {dominantNeed ? dominantNeed.name : "None Detect"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Constraints & Risk Level */}
      <motion.div
        className="mb-3 grid grid-cols-2 gap-2"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIndex++}
      >
        {/* No-Porn Constraint */}
        <div className="border border-white/8 bg-black/40 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            No Porn
          </p>
          <p
            className={`mt-1 flex items-center gap-1.5 font-display text-lg uppercase ${
              constraintStatus === "CLEAN"
                ? "text-emerald-400"
                : constraintStatus === "FAILED"
                  ? "text-red-400"
                  : "text-amber-400/60"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                constraintStatus === "CLEAN"
                  ? "bg-emerald-400"
                  : constraintStatus === "FAILED"
                    ? "bg-red-400"
                    : "bg-amber-400/60"
              }`}
            />
            {constraintStatus}
          </p>
        </div>

        {/* Risk Level */}
        <div className="border border-white/8 bg-black/40 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            Risk Level
          </p>
          {latestStateLog ? (
            <p className="mt-1 flex items-center gap-1.5 font-display text-lg uppercase">
              <span
                className={`inline-block h-2 w-2 rounded-full ${RISK_DOT[latestStateLog.riskLevel] ?? "bg-white/30"}`}
              />
              <span
                className={
                  RISK_COLORS[latestStateLog.riskLevel]
                    ?.split(" ")
                    .find((c) => c.startsWith("text-")) ?? "text-white/40"
                }
              >
                {latestStateLog.riskLevel}
              </span>
            </p>
          ) : (
            <p className="mt-1 font-display text-lg uppercase text-white/30">
              No Data
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats Row: Check-ins · Foundation Score */}
      <motion.div
        className="grid grid-cols-2 gap-2"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={sectionIndex++}
      >
        {/* Check-in Count */}
        <div className="border border-white/8 bg-black/40 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            Check-ins
          </p>
          <p className="mt-1 font-display text-lg uppercase text-white">
            {todaysStateLogCount}
            <span className="ml-1 font-mono text-[9px] tracking-wider text-white/40">
              today
            </span>
          </p>
        </div>

        {/* Foundation Score */}
        <div className="border border-white/8 bg-black/40 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            Foundation
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-display text-lg uppercase text-white">
              {dailyScore.completedCount}/{dailyScore.totalFoundations}
            </p>
            {/* Progress meter */}
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-signal/70"
                initial={{ width: 0 }}
                animate={{
                  width: `${(dailyScore.completedCount / dailyScore.totalFoundations) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
