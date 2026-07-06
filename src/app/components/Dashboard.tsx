"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "./BootSequence";
import StatePanel from "./StatePanel";
import CountermeasurePanel from "./CountermeasurePanel";
import CommandCenter from "./CommandCenter";
import IntelligencePanel from "./IntelligencePanel";
import DataVaultPanel from "./DataVaultPanel";
import DailyTransmission from "./DailyTransmission";
import type { DailyStateLog } from "@/lib/state-detection";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { recommendCountermeasure } from "@/lib/countermeasures";
import { localCountermeasureRepository } from "@/lib/countermeasures";
import type { CountermeasureRecommendation } from "@/lib/countermeasures";
import type { ISODate, FoundationType } from "@/lib/foundation";
import { localFoundationRepository } from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

// ── Mission Mode Imports ────────────────────────────────────────
import MissionDashboardHeader from "./mission/MissionDashboardHeader";
import DailyOperationsCard from "./mission/DailyOperationsCard";
import MissionScorePanel from "./mission/MissionScorePanel";
import MomentumPanel from "./mission/MomentumPanel";
import ShutdownModal from "./mission/ShutdownModal";
import MissionHistoryPanel from "./mission/MissionHistoryPanel";
import ModeSelector from "./mission/ModeSelector";
import MissionControlDrawer from "./mission/MissionControlDrawer";
import {
  isMissionActive,
  getActiveMission,
  isMissionExpired,
  deactivateMission,
} from "@/lib/mission-mode/modeManager";
import {
  calculateMissionDayScore,
  getScoreBreakdown,
  getCardState,
  buildMissionDayLog,
} from "@/lib/mission-mode/scoreEngine";
import { checkMomentumFlags, calculateMissionStability } from "@/lib/mission-mode/momentumEngine";
import { getMissionRating } from "@/lib/mission-mode/config";
import {
  getDayLogsForMission,
  upsertDayLog,
  getDayLog,
  getShutdownDismissedDate,
  setShutdownDismissedDate,
} from "@/lib/mission-mode/repository";
import type { MissionConfig, ShutdownReflection, MissionDayLog } from "@/lib/mission-mode/types";

/** Returns today's date in IST as YYYY-MM-DD */
function getTodaysDate(): ISODate {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + offset);
  return ist.toISOString().slice(0, 10) as ISODate;
}

/** Subtracts N days from a YYYY-MM-DD date string */
function subtractDays(dateStr: ISODate, days: number): ISODate {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as ISODate;
}

/** Human-readable label for each offset */
function formatDateLabel(dateStr: ISODate, offset: number): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Yesterday";
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Check if it's past 8 PM IST */
function isPastShutdownTime(): boolean {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + offset);
  return ist.getUTCHours() >= 14; // 8 PM IST = 14:30 UTC
}

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15 * i,
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function Dashboard() {
  const [booted, setBooted] = useState(false);
  const [todaysDate] = useState<ISODate>(getTodaysDate);
  const [refreshKey, setRefreshKey] = useState(0);

  // 0 = today, 1 = yesterday, 2 = day-before-yesterday
  const [offsetDays, setOffsetDays] = useState(0);

  // The currently active date for logging
  const activeDate = useMemo(
    () => (offsetDays === 0 ? todaysDate : subtractDays(todaysDate, offsetDays)),
    [todaysDate, offsetDays]
  );

  // Layout mode — deployment | intelligence | vault
  const [activeMode, setActiveMode] = useState<"deployment" | "intelligence" | "vault">("deployment");

  // Audio system state
  const [audioMuted, setAudioMuted] = useState(true);

  // State detection — scoped to activeDate
  const [activeDateStateLogs, setActiveDateStateLogs] = useState<DailyStateLog[]>([]);
  const [latestStateLog, setLatestStateLog] = useState<DailyStateLog | null>(null);

  // Countermeasure recommendation
  const [recommendation, setRecommendation] = useState<CountermeasureRecommendation | null>(null);

  const handleFoundationLogged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // ── Mission Mode State ────────────────────────────────────────
  const [missionModeKey, setMissionModeKey] = useState(0);
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const missionActive = useMemo(() => isMissionActive(), [missionModeKey, refreshKey]);
  const activeMission = useMemo(() => getActiveMission(), [missionModeKey, refreshKey]);

  // Current daily log
  const currentDayLog = useMemo(() => {
    if (!activeMission) return null;
    return getDayLog(activeMission.id, activeDate);
  }, [activeMission, activeDate, refreshKey]);

  // Mission-specific computed data
  const missionScore = useMemo(() => {
    if (!activeMission) return 0;
    return calculateMissionDayScore(activeMission, activeDate);
  }, [activeMission, activeDate, refreshKey]);

  const missionRating = useMemo(() => {
    if (!activeMission) return "—";
    return getMissionRating(missionScore, activeMission.ratings).label;
  }, [activeMission, missionScore]);

  const missionBreakdown = useMemo(() => {
    if (!activeMission) return [];
    return getScoreBreakdown(activeMission, activeDate);
  }, [activeMission, activeDate, refreshKey]);

  const momentumFlags = useMemo(() => {
    if (!activeMission) return null;
    return checkMomentumFlags(activeMission, activeDate);
  }, [activeMission, activeDate, refreshKey]);

  const missionStability = useMemo(() => {
    if (!activeMission) return null;
    const dayLogs = getDayLogsForMission(activeMission.id);
    return calculateMissionStability(activeMission, dayLogs);
  }, [activeMission, refreshKey]);

  // Unified Foundation Resources loaded at parent
  const activities = useMemo(() => {
    return localFoundationRepository.listActivities();
  }, [refreshKey]);

  const activityLogs = useMemo(() => {
    return localFoundationRepository.listActivityLogs();
  }, [refreshKey]);

  const constraintStatus = useMemo(() => {
    const constraintLogs = localFoundationRepository.listConstraintLogs();
    const todayConstraint = constraintLogs.find(
      (log) => log.date === activeDate && log.constraint === "No Porn"
    );
    if (!todayConstraint) return "PENDING" as const;
    if (todayConstraint.subtype === "Yes" && todayConstraint.completed) return "CLEAN" as const;
    if (todayConstraint.subtype === "No") return "FAILED" as const;
    return "PENDING" as const;
  }, [refreshKey, activeDate]);

  // Update daily log fields
  const handleUpdateDayLog = useCallback(
    (updates: Partial<MissionDayLog>) => {
      if (!activeMission) {
        // Normal Mode Mock Persistence of manual status & goals
        const existingMockLogs = typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem("batcave.normal.dayLogs") || "[]") : [];
        const existing = existingMockLogs.find((l: any) => l.date === activeDate) || { date: activeDate, manualStatuses: {}, builderGoal: "", athleteLocation: "Home" };
        const merged = {
          ...existing,
          ...updates,
          manualStatuses: {
            ...(existing.manualStatuses ?? {}),
            ...(updates.manualStatuses ?? {}),
          },
          updatedAt: new Date().toISOString(),
        };
        const nextMockLogs = [
          ...existingMockLogs.filter((l: any) => l.date !== activeDate),
          merged,
        ];
        if (typeof window !== "undefined") {
          window.localStorage.setItem("batcave.normal.dayLogs", JSON.stringify(nextMockLogs));
        }
        setRefreshKey((k) => k + 1);
        return;
      }
      const existing = getDayLog(activeMission.id, activeDate) || buildMissionDayLog(activeMission, activeDate);
      const merged = {
        ...existing,
        ...updates,
        manualStatuses: {
          ...(existing.manualStatuses ?? {}),
          ...(updates.manualStatuses ?? {}),
        },
        updatedAt: new Date().toISOString(),
      };
      upsertDayLog(merged);
      setRefreshKey((k) => k + 1);
    },
    [activeMission, activeDate]
  );

  // Normal Mode mock resolver
  const mockNormalDayLog = useMemo(() => {
    if (activeMission) return null;
    const existingMockLogs = typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem("batcave.normal.dayLogs") || "[]") : [];
    return existingMockLogs.find((l: any) => l.date === activeDate) || {
      date: activeDate,
      manualStatuses: {},
      builderGoal: "",
      athleteLocation: "Home",
      athleteDrills: [],
      anchorTasks: [],
    };
  }, [activeMission, activeDate, refreshKey]);

  const activeDayLog = useMemo(() => {
    return activeMission ? currentDayLog : mockNormalDayLog;
  }, [activeMission, currentDayLog, mockNormalDayLog]);

  // Auto-save mission day log when data changes
  useEffect(() => {
    if (!activeMission || !booted) return;
    const existing = getDayLog(activeMission.id, activeDate);
    const dayLog = buildMissionDayLog(activeMission, activeDate, existing);
    if (momentumFlags) {
      dayLog.momentumFlags = momentumFlags;
    }
    upsertDayLog(dayLog);
  }, [activeMission, activeDate, missionScore, momentumFlags, booted]);

  // Auto-expire mission
  useEffect(() => {
    if (activeMission && isMissionExpired(activeMission, todaysDate)) {
      deactivateMission("Auto-completed: mission duration ended.", "completed");
      setMissionModeKey((k) => k + 1);
    }
  }, [activeMission, todaysDate]);

  // Auto-open shutdown modal after 8 PM IST
  useEffect(() => {
    if (!activeMission || !booted) return;
    const dismissed = getShutdownDismissedDate();
    const existing = getDayLog(activeMission.id, todaysDate);

    if (
      isPastShutdownTime() &&
      dismissed !== todaysDate &&
      !existing?.shutdownReflection &&
      offsetDays === 0
    ) {
      setShowShutdownModal(true);
    }
  }, [activeMission, booted, todaysDate, offsetDays]);

  // Initialize audio state from local storage on mount
  useEffect(() => {
    setAudioMuted(audioManager.getMuted());
  }, []);

  const handleToggleAudio = useCallback(() => {
    const nextMute = !audioMuted;
    setAudioMuted(nextMute);
    audioManager.setMuted(nextMute);
    if (!nextMute) {
      audioManager.playToggle();
    }
  }, [audioMuted]);

  // Load state logs for the activeDate
  const refreshStateLogs = useCallback(() => {
    const logs = localStateDetectionRepository.getStateLogsForDate(activeDate);
    setActiveDateStateLogs(logs);
    const latest = logs.length > 0 ? logs[logs.length - 1] : null;
    setLatestStateLog(latest);

    if (latest && latest.riskScore >= 10) {
      const thoughtType = latest.metadata?.thoughtType ?? null;
      if (thoughtType === "limiting") {
        const cmLogs = localCountermeasureRepository.listLogs();
        const rec = recommendCountermeasure(
          { selectedStates: latest.selectedStates, date: activeDate },
          cmLogs
        );
        setRecommendation(rec);
      } else {
        setRecommendation(null);
      }
    } else {
      setRecommendation(null);
    }
  }, [activeDate]);

  // Refresh on mount, refreshKey change, or activeDate change
  useEffect(() => {
    if (booted) {
      refreshStateLogs();
    }
  }, [booted, refreshKey, refreshStateLogs]);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  const handleStateCheckedIn = useCallback(
    (log: DailyStateLog) => {
      refreshStateLogs();
      if (log.riskScore >= 10) {
        const thoughtType = log.metadata?.thoughtType ?? null;
        if (thoughtType === "limiting") audioManager.playThreatDetected();
        else audioManager.playCheckinComplete();
      } else {
        audioManager.playCheckinComplete();
      }
      setRefreshKey((k) => k + 1);
    },
    [refreshStateLogs]
  );

  const handleCountermeasureActioned = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSetOffset = useCallback((offset: number) => {
    audioManager.playClick();
    setOffsetDays(offset);
  }, []);

  const handleModeChange = useCallback(() => {
    setMissionModeKey((k) => k + 1);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleShutdownSubmit = useCallback(
    (reflection: ShutdownReflection) => {
      if (!activeMission) return;
      const dayLog = buildMissionDayLog(activeMission, todaysDate);
      dayLog.shutdownReflection = reflection;
      if (momentumFlags) {
        dayLog.momentumFlags = momentumFlags;
      }
      upsertDayLog(dayLog);
      setShowShutdownModal(false);
      setShutdownDismissedDate(todaysDate);
    },
    [activeMission, todaysDate, momentumFlags]
  );

  const handleShutdownClose = useCallback(() => {
    setShowShutdownModal(false);
    setShutdownDismissedDate(todaysDate);
  }, [todaysDate]);

  // Alive states:
  const nothingNeedsAttention = useMemo(() => {
    const manualStatuses = activeDayLog?.manualStatuses ?? {};
    const anyInProgress = Object.values(manualStatuses).some((s) => s === "in-progress");
    const isThreat = latestStateLog !== null && latestStateLog.riskScore >= 10;
    const isNoPornFailed = constraintStatus === "FAILED";
    return !anyInProgress && !isThreat && !isNoPornFailed;
  }, [activeDayLog, latestStateLog, constraintStatus]);

  // Intelligence section visibility:
  const [userExpandedIntelligence, setUserExpandedIntelligence] = useState(false);

  const autoExpandIntelligence = useMemo(() => {
    const hasCheckins = activeDateStateLogs.length > 0;
    const isThreat = latestStateLog !== null && latestStateLog.riskScore >= 10;
    return hasCheckins || isThreat;
  }, [activeDateStateLogs, latestStateLog]);

  const showIntelligence = userExpandedIntelligence || autoExpandIntelligence;

  return (
    <>
      <AnimatePresence mode="wait">
        {!booted && (
          <motion.div
            key="boot"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BootSequence onComplete={handleBootComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <main className="scanlines min-h-screen bg-obsidian p-3 text-frost sm:p-4">
          <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1800px] flex-col gap-3">

            {/* ─── NORMAL HEADER ─────────────────────────────────── */}
            <motion.header
              className={`panel flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-black/40 border-white/8 ${
                missionActive ? "border-l-2 border-l-amber-400/40" : ""
              }`}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative hidden sm:block">
                  <div className="h-8 w-8 rounded-full border border-signal/30 bg-signal/10 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 187.059 187.059" 
                      className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,42,42,0.7)]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M94.406,146.118c0,0,20.569-43.123,58.889-46.039c-0.262-3.715,3.373-32.008,33.765-59.02c-5.286,1.589-50.687,18.194-50.687,18.194s-9.511,21.711-20.618,35.217c-1.193,1.649-6.637,3.659-8.086,0.262c-1.114-2.569-3.057-19.004-3.057-22.983c0.268,0.268-10.261,22.533-20.298-0.055c0.262,3.44-1.404,16.392-2.643,20.919c-1.814,6.649-6.08,4.238-8.187,1.583c-2.116-2.648-17.598-17.813-20.77-36.352C47.425,56.255,0,40.94,0,40.94s33.177,30.188,32.385,59.053C34.501,100.261,67.982,101.089,94.406,146.118z"
                        fill="rgba(255,42,42,0.9)"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal/70">
                    Wayne Enterprises / Private Systems
                  </p>
                  <h1 className="mt-1 font-display text-3xl uppercase leading-none text-white sm:text-5xl glow-text-red">
                    Batcave
                  </h1>
                </div>
              </div>

              {/* Mode Toggle Tabs & Mode Selector & Mute Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-white/10 bg-black/45 p-1 rounded-sm">
                  <button
                    type="button"
                    onClick={() => { audioManager.playClick(); setActiveMode("deployment"); }}
                    className={`px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-all duration-200 ${
                      activeMode === "deployment"
                        ? "border border-signal/40 bg-signal/10 text-signal"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    Deployment
                  </button>
                  <button
                    type="button"
                    onClick={() => { audioManager.playClick(); setActiveMode("intelligence"); }}
                    className={`px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-all duration-200 ${
                      activeMode === "intelligence"
                        ? "border border-signal/40 bg-signal/10 text-signal"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    Intelligence
                  </button>
                  <button
                    type="button"
                    onClick={() => { audioManager.playClick(); setActiveMode("vault"); }}
                    className={`px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-all duration-200 ${
                      activeMode === "vault"
                        ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    Data Vault
                  </button>
                </div>

                <ModeSelector todaysDate={todaysDate} onOpenDrawer={() => setDrawerOpen(true)} />

                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`px-3 py-2 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                    audioMuted
                      ? "border-white/10 bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white/60"
                      : "border-signal/40 bg-signal/5 text-signal hover:bg-signal/10"
                  }`}
                >
                  <span>{audioMuted ? "🔇 Muted" : "🔊 Audio On"}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-right font-mono text-[10px] uppercase text-white/40 sm:min-w-[390px]">
                <div className="border border-white/8 bg-black/40 p-2">
                  <p>Active Date</p>
                  <p className={`mt-1 text-sm ${offsetDays > 0 ? "text-warning" : "text-white"}`}>
                    {activeDate}
                  </p>
                </div>
                <div className="border border-white/8 bg-black/40 p-2">
                  <p>Risk</p>
                  <p className={`mt-1 text-sm ${
                    latestStateLog
                      ? latestStateLog.riskLevel === "GREEN"
                        ? "text-emerald-400"
                        : latestStateLog.riskLevel === "YELLOW"
                          ? "text-warning"
                          : latestStateLog.riskLevel === "ORANGE"
                            ? "text-orange-400"
                            : "text-signal"
                      : "text-white/30"
                  }`}>
                    {latestStateLog ? latestStateLog.riskLevel : "—"}
                  </p>
                </div>
                <div className="border border-white/8 bg-black/40 p-2">
                  <p>Status</p>
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-sm text-emerald-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Online
                  </p>
                </div>
              </div>
            </motion.header>

            {/* ─── DATE NAVIGATOR (Deployment mode only) ──────────── */}
            <AnimatePresence>
              {activeMode === "deployment" && (
                <motion.div
                  key="date-nav"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-1.5 border border-white/8 bg-black/35 p-1.5 rounded-sm">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/25 px-1 hidden sm:inline">
                      Log For
                    </span>
                    {([0, 1, 2] as const).map((offset) => {
                      const date = offset === 0 ? todaysDate : subtractDays(todaysDate, offset);
                      const isActive = offsetDays === offset;
                      return (
                        <button
                          key={offset}
                          type="button"
                          onClick={() => handleSetOffset(offset)}
                          className={`px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-all duration-200 border ${
                            isActive
                              ? offset === 0
                                ? "border-signal/50 bg-signal/10 text-signal shadow-[0_0_12px_rgba(255,42,42,0.15)]"
                                : "border-warning/50 bg-warning/10 text-warning shadow-[0_0_12px_rgba(234,179,8,0.12)]"
                              : "border-white/8 bg-transparent text-white/30 hover:border-white/20 hover:text-white/55"
                          }`}
                        >
                          <span className="block font-display">{formatDateLabel(date, offset)}</span>
                          <span className="block text-[8px] opacity-50 mt-0.5">{date}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {offsetDays > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2.5 border border-warning/20 bg-warning/[0.04] px-3 py-2 rounded-sm"
                      >
                        <span className="text-warning/80 text-xs font-mono">⏪ BACKDATE</span>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-warning/60">
                            Logging for {formatDateLabel(activeDate, offsetDays)} · {activeDate}
                          </p>
                          <p className="font-mono text-[8px] text-white/20 mt-0.5">
                            Edits lock after 2 days. Switch to Today to resume live.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── MAIN VIEWS ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {activeMode === "deployment" ? (
                <motion.div
                  key="deployment"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* ───────────────── TOP ZONE ───────────────── */}
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-3">
                      {missionActive && activeMission && (
                        <MissionDashboardHeader
                          config={activeMission}
                          todaysDate={activeDate}
                          score={missionScore}
                          rating={missionRating}
                        />
                      )}
                      
                      {offsetDays === 0 && (
                        <DailyTransmission
                          todaysDate={todaysDate}
                          dominantState={latestStateLog?.selectedStates?.[0] ?? null}
                        />
                      )}
                    </div>
                    
                    <div className="lg:col-span-1">
                      <CommandCenter
                        todaysDate={activeDate}
                        latestStateLog={latestStateLog}
                        todaysStateLogCount={activeDateStateLogs.length}
                        recommendation={recommendation}
                        refreshKey={refreshKey}
                      />
                    </div>
                  </div>

                  {/* ───────────────── CENTER ZONE ───────────────── */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
                          System 1 — Operations
                        </p>
                        <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
                          Daily Operations
                        </h2>
                      </div>
                      
                      {nothingNeedsAttention && (
                        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-sm animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                          All Systems Stable
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <DailyOperationsCard
                        cardId="builder"
                        title="Builder"
                        icon="🏗"
                        todaysDate={activeDate}
                        activeMission={activeMission}
                        dayLog={activeDayLog}
                        activities={activities}
                        activityLogs={activityLogs}
                        constraintStatus={constraintStatus}
                        onUpdateDayLog={handleUpdateDayLog}
                        onRefresh={handleFoundationLogged}
                      />

                      <DailyOperationsCard
                        cardId="athlete"
                        title="Athlete"
                        icon="⚽"
                        todaysDate={activeDate}
                        activeMission={activeMission}
                        dayLog={activeDayLog}
                        activities={activities}
                        activityLogs={activityLogs}
                        constraintStatus={constraintStatus}
                        onUpdateDayLog={handleUpdateDayLog}
                        onRefresh={handleFoundationLogged}
                      />

                      <DailyOperationsCard
                        cardId="reset"
                        title="Reset"
                        icon="🧠"
                        todaysDate={activeDate}
                        activeMission={activeMission}
                        dayLog={activeDayLog}
                        activities={activities}
                        activityLogs={activityLogs}
                        constraintStatus={constraintStatus}
                        onUpdateDayLog={handleUpdateDayLog}
                        onRefresh={handleFoundationLogged}
                      />

                      <DailyOperationsCard
                        cardId="guardian"
                        title="Guardian"
                        icon="🛡"
                        todaysDate={activeDate}
                        activeMission={activeMission}
                        dayLog={activeDayLog}
                        activities={activities}
                        activityLogs={activityLogs}
                        constraintStatus={constraintStatus}
                        onUpdateDayLog={handleUpdateDayLog}
                        onRefresh={handleFoundationLogged}
                      />
                    </div>
                  </div>

                  {/* ───────────────── BOTTOM ZONE ───────────────── */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div 
                      onClick={() => {
                        audioManager.playClick();
                        setUserExpandedIntelligence(!userExpandedIntelligence);
                      }}
                      className="flex justify-between items-center cursor-pointer select-none border border-white/8 bg-black/45 px-4 py-3 hover:bg-black/60 transition-all mb-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🕵️‍♂️</span>
                        <div>
                          <h3 className="font-display text-sm uppercase tracking-wider text-white">
                            Intelligence Corps & Analytics
                          </h3>
                          <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                            Neural state assessments · Countermeasure logs · History logs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                        <span className={showIntelligence ? "text-amber-400" : "text-white/40"}>
                          {showIntelligence ? "ACTIVE" : "STANDBY"}
                        </span>
                        <span className="text-white/20">{showIntelligence ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {showIntelligence && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="grid gap-3 grid-cols-1 lg:grid-cols-2"
                        >
                          {/* State check-in (Neural Check-in) */}
                          <div className="flex min-h-0 flex-col">
                            <StatePanel
                              todaysDate={activeDate}
                              onStateCheckedIn={handleStateCheckedIn}
                            />
                          </div>
                          
                          {/* Countermeasure dispatch */}
                          <div className="flex min-h-0 flex-col">
                            <CountermeasurePanel
                              todaysDate={activeDate}
                              latestStateLog={latestStateLog}
                              onCountermeasureActioned={handleCountermeasureActioned}
                            />
                          </div>
                          
                          {/* Analytics (Momentum Panel / MissionScorePanel / Stability) */}
                          <div className="space-y-3 flex min-h-0 flex-col justify-start">
                            {momentumFlags && (
                              <MomentumPanel
                                flags={momentumFlags}
                                stability={missionStability}
                              />
                            )}
                            {missionActive && activeMission && (
                              <MissionScorePanel
                                config={activeMission}
                                score={missionScore}
                                rating={missionRating}
                                breakdown={missionBreakdown}
                              />
                            )}
                          </div>
                          
                          {/* History */}
                          <div className="flex min-h-0 flex-col">
                            <MissionHistoryPanel refreshKey={refreshKey} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              ) : activeMode === "intelligence" ? (
                <motion.div
                  key="intelligence"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-1 min-h-0"
                >
                  <IntelligencePanel
                    todaysDate={todaysDate}
                    refreshKey={refreshKey}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="vault"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-1 min-h-0"
                >
                  <DataVaultPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── SHUTDOWN MODAL ─────────────────────────────────── */}
          {missionActive && activeMission && (
            <ShutdownModal
              config={activeMission}
              todaysDate={todaysDate}
              isOpen={showShutdownModal}
              onClose={handleShutdownClose}
              onSubmit={handleShutdownSubmit}
            />
          )}

          {/* ─── MISSION CONTROL DRAWER ─────────────────────────── */}
          <MissionControlDrawer
            todaysDate={todaysDate}
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onRefresh={handleModeChange}
            score={missionScore}
            rating={missionRating}
          />

          {/* ─── FLOATING MISSION CONTROL BUTTON ────────────────── */}
          {missionActive && (
            <button
              type="button"
              onClick={() => {
                audioManager.playClick();
                setDrawerOpen(true);
              }}
              className="fixed bottom-6 right-6 z-40 flex items-center gap-2 border border-amber-400/40 bg-graphite/95 px-4 py-2.5 font-display text-[10px] uppercase tracking-wider text-amber-400 shadow-console hover:bg-amber-400/10 hover:border-amber-400/80 transition-all select-none animate-pulse"
            >
              ⚙ Mission Control
            </button>
          )}
        </main>
      )}
    </>
  );
}
