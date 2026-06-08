"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "./BootSequence";
import FoundationPanel from "./FoundationPanel";
import StatePanel from "./StatePanel";
import CountermeasurePanel from "./CountermeasurePanel";
import CommandCenter from "./CommandCenter";
import IntelligencePanel from "./IntelligencePanel";
import type { DailyStateLog } from "@/lib/state-detection";
import { localStateDetectionRepository } from "@/lib/state-detection";
import { recommendCountermeasure } from "@/lib/countermeasures";
import { localCountermeasureRepository } from "@/lib/countermeasures";
import type { CountermeasureRecommendation } from "@/lib/countermeasures";
import type { ISODate } from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

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

// Maximum days back the user can still log / edit data
const MAX_BACKDATE_DAYS = 2;

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

  // Layout mode
  const [activeMode, setActiveMode] = useState<"deployment" | "intelligence">("deployment");

  // Audio system state
  const [audioMuted, setAudioMuted] = useState(true);

  // State detection — scoped to activeDate
  const [activeDateStateLogs, setActiveDateStateLogs] = useState<DailyStateLog[]>([]);
  const [latestStateLog, setLatestStateLog] = useState<DailyStateLog | null>(null);

  // Countermeasure recommendation
  const [recommendation, setRecommendation] = useState<CountermeasureRecommendation | null>(null);

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
      const cmLogs = localCountermeasureRepository.listLogs();
      const rec = recommendCountermeasure(
        { selectedStates: latest.selectedStates, date: activeDate },
        cmLogs
      );
      setRecommendation(rec);
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

  const handleFoundationLogged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleStateCheckedIn = useCallback(
    (log: DailyStateLog) => {
      refreshStateLogs();
      if (log.riskScore >= 10) {
        audioManager.playThreatDetected();
      } else {
        audioManager.playCheckinComplete();
      }
    },
    [refreshStateLogs]
  );

  const handleCountermeasureActioned = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSetOffset = useCallback((offset: number) => {
    audioManager.playClick();
    setOffsetDays(offset);
    // refreshStateLogs will trigger from the activeDate change via useEffect
  }, []);

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

            {/* ─── HEADER ─────────────────────────────────────────── */}
            <motion.header
              className="panel flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-black/40 border-white/8"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative hidden sm:block">
                  <div className="h-8 w-8 rounded-full border border-signal/30 bg-signal/10 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 12" className="w-5" fill="rgba(255,42,42,0.8)">
                      <path d="M12 1 C10.5 1 9.5 3 8.5 4.5 C7.5 3.5 5.5 2.5 3.5 3 C4.5 4.5 5 6 5.5 7 C3.5 6.5 1.5 7 0.5 9 C2.5 8.5 4.5 9 6.5 10 C5.5 11.5 4.5 12 3.5 12.5 C5.5 11.5 7.5 11 9.5 10.5 C10 11.5 10.5 12 12 13 C13.5 12 14 11.5 14.5 10.5 C16.5 11 18.5 11.5 20.5 12.5 C19.5 12 18.5 11.5 17.5 10 C19.5 9 21.5 8.5 23.5 9 C22.5 7 20.5 6.5 18.5 7 C19 6 19.5 4.5 20.5 3 C18.5 2.5 16.5 3.5 15.5 4.5 C14.5 3 13.5 1 12 1Z" />
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

              {/* Mode Toggle Tabs & Mute Button */}
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
                </div>

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
                          ? "text-yellow-400"
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
                  {/* Date selector pills */}
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

                  {/* Backdate banner */}
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

            {/* ─── MAIN GRID ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {activeMode === "deployment" ? (
                <motion.div
                  key="deployment"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="grid flex-1 gap-3 xl:min-h-0 xl:grid-cols-[minmax(280px,0.9fr)_minmax(480px,1.5fr)_minmax(280px,1fr)]"
                >
                  {/* LEFT: Foundation Layer */}
                  <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    className="flex min-h-0 flex-col"
                  >
                    <FoundationPanel
                      todaysDate={activeDate}
                      onFoundationLogged={handleFoundationLogged}
                    />
                  </motion.div>

                  {/* CENTER: State Detection + Countermeasure */}
                  <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                    className="flex min-h-0 flex-col gap-3"
                  >
                    <StatePanel
                      todaysDate={activeDate}
                      onStateCheckedIn={handleStateCheckedIn}
                    />
                    <CountermeasurePanel
                      todaysDate={activeDate}
                      latestStateLog={latestStateLog}
                      onCountermeasureActioned={handleCountermeasureActioned}
                    />
                  </motion.div>

                  {/* RIGHT: Command Center */}
                  <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    className="flex min-h-0 flex-col"
                  >
                    <CommandCenter
                      todaysDate={activeDate}
                      latestStateLog={latestStateLog}
                      todaysStateLogCount={activeDateStateLogs.length}
                      recommendation={recommendation}
                      refreshKey={refreshKey}
                    />
                  </motion.div>
                </motion.div>
              ) : (
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
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </>
  );
}
