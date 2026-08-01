"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FOUNDATION_DEFINITIONS,
  IDENTITIES,
  FOUNDATION_IDENTITY_MAP,
  addDays,
} from "@/lib/foundation";
import type { Identity, ISODate } from "@/lib/foundation";
import { localFoundationRepository } from "@/lib/foundation";
import { beliefRepo, decisionRepo, decisionUsageRepo } from "@/lib/belief-intelligence";
import {
  generatePatternReport,
  calculateBeliefCorrelations,
  generateBeliefTransformations,
} from "@/lib/belief-intelligence/calculations";
import { localCountermeasureRepository, calculateCountermeasureEffectiveness } from "@/lib/countermeasures";
import { getStateCategory } from "@/lib/belief-intelligence/config";
import { THREATS, COUNTERMEASURES } from "@/lib/countermeasures/config";
import WeeklyReviewReport from "./WeeklyReviewReport";
import ExecutionIntelligenceEngine from "./ExecutionIntelligenceEngine";

interface IntelligencePanelProps {
  todaysDate: ISODate;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatTime12h(isoOrTime: string | undefined): string {
  if (!isoOrTime) return "--:--";
  try {
    // Handle "HH:MM" format
    if (/^\d{2}:\d{2}$/.test(isoOrTime)) {
      const [h, m] = isoOrTime.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    }
    // Handle ISO date-time
    const d = new Date(isoOrTime);
    if (isNaN(d.getTime())) return isoOrTime;
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return isoOrTime || "--:--";
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function MiniBar({ percent, color = "bg-signal/70" }: { percent: number; color?: string }) {
  return (
    <div className="h-1 w-full rounded bg-white/5 overflow-hidden mt-1">
      <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

// ── Classification style helpers ──────────────────────────────
const CLASS_STYLES: Record<string, { text: string; border: string; bg: string; label: string }> = {
  strengthening: { text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/5", label: "Strengthening" },
  limiting:      { text: "text-signal",       border: "border-signal/30",       bg: "bg-signal/5",       label: "Limiting" },
  neutral:       { text: "text-frost/60",     border: "border-frost/15",       bg: "bg-frost/[0.02]",   label: "Neutral" },
};
function classStyle(t: string | null | undefined) {
  return CLASS_STYLES[t ?? ""] ?? { text: "text-white/30", border: "border-white/5", bg: "bg-transparent", label: "—" };
}

export default function IntelligencePanel({ todaysDate }: IntelligencePanelProps) {
  // ── Rolling 7 days ────────────────────────────────────────────
  const dates = useMemo(() => {
    const arr: ISODate[] = [];
    for (let i = -6; i <= 0; i++) arr.push(addDays(todaysDate, i));
    return arr;
  }, [todaysDate]);

  // ── Data loads ────────────────────────────────────────────────
  const activities = useMemo(() => localFoundationRepository.listFoundationActivities(), []);
  const beliefs = useMemo(() => beliefRepo.list(), []);
  const countermeasureLogs = useMemo(() => localCountermeasureRepository.listLogs(), []);



  // ── TODAY'S MENTAL PROFILE (Problem #2) ────────────────────────
  const todayBeliefs = useMemo(() => beliefs.filter((b) => b.date === todaysDate), [beliefs, todaysDate]);
  const mentalProfile = useMemo(() => {
    const total = todayBeliefs.length;
    if (total === 0) return null;

    const strnCount = todayBeliefs.filter((b) => b.thoughtType === "strengthening").length;
    const neutCount = todayBeliefs.filter((b) => b.thoughtType === "neutral").length;
    const limCount  = todayBeliefs.filter((b) => b.thoughtType === "limiting").length;

    // Dominant state
    const stateCounts: Record<string, number> = {};
    todayBeliefs.forEach((b) => b.states.forEach((s) => { stateCounts[s] = (stateCounts[s] || 0) + 1; }));
    const dominantState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Most frequent cause
    const causeCounts: Record<string, number> = {};
    todayBeliefs.forEach((b) => { if (b.primaryCause) causeCounts[b.primaryCause] = (causeCounts[b.primaryCause] || 0) + 1; });
    const dominantCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Most frequent thought
    const thoughtCounts: Record<string, number> = {};
    todayBeliefs.forEach((b) => {
      const t = b.dominantThought ?? b.recurringThought;
      if (t) thoughtCounts[t] = (thoughtCounts[t] || 0) + 1;
    });
    const dominantThought = Object.entries(thoughtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Peak risk time: limiting check-in with latest states (highest number of negative states)
    const limitingEntries = todayBeliefs.filter((b) => b.thoughtType === "limiting");
    const peakRiskEntry = limitingEntries.sort((a, b) => b.states.length - a.states.length)[0];
    const peakRiskTime = peakRiskEntry
      ? formatTime12h(peakRiskEntry.time ?? peakRiskEntry.createdAt)
      : "—";

    // Recovery time: first strengthening check-in after any limiting check-in
    let recoveryTime = "—";
    if (limitingEntries.length > 0) {
      const lastLimiting = limitingEntries.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")).pop();
      if (lastLimiting) {
        const recovery = todayBeliefs.find(
          (b) => b.thoughtType === "strengthening" && (b.createdAt ?? "") > (lastLimiting.createdAt ?? "")
        );
        if (recovery) recoveryTime = formatTime12h(recovery.time ?? recovery.createdAt);
      }
    }

    // Net direction
    let direction: { label: string; icon: string; color: string };
    if (strnCount > limCount) {
      direction = { label: "Positive", icon: "↗", color: "text-emerald-400" };
    } else if (strnCount < limCount) {
      direction = { label: "Negative", icon: "↘", color: "text-signal" };
    } else {
      direction = { label: "Stable", icon: "→", color: "text-frost" };
    }

    return {
      total, strnCount, neutCount, limCount,
      dominantState, dominantCause, dominantThought,
      peakRiskTime, recoveryTime, direction,
    };
  }, [todayBeliefs, todaysDate]);

  // ── DAILY STATE DISTRIBUTION (V4.4 — Change 10) ───────────────
  const stateDurations = useMemo(() => {
    const todayEntries = beliefs.filter(e => e.date === todaysDate).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (todayEntries.length < 2) return null;
    const durations: Record<string, number> = {};
    const now = Date.now();
    todayEntries.forEach((entry, i) => {
      const state = entry.states[0] ?? 'Unknown';
      const start = new Date(entry.createdAt).getTime();
      const end = i < todayEntries.length - 1 ? new Date(todayEntries[i + 1].createdAt).getTime() : now;
      const mins = Math.round((end - start) / 60000);
      durations[state] = (durations[state] ?? 0) + mins;
    });
    const totalMins = Object.values(durations).reduce((a, b) => a + b, 0);
    return Object.entries(durations)
      .map(([state, mins]) => ({ state, mins, pct: totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0 }))
      .sort((a, b) => b.mins - a.mins);
  }, [beliefs, todaysDate]);

  // ── DAILY PSYCHOLOGICAL TIMELINE (Problem #1) ─────────────────
  const timeline = useMemo(() => {
    return todayBeliefs
      .map((b) => ({
        time: formatTime12h(b.time ?? b.createdAt),
        rawTime: b.time ?? b.createdAt ?? "",
        states: b.states,
        thought: b.dominantThought ?? b.recurringThought ?? null,
        thoughtType: b.thoughtType ?? null,
        cause: b.primaryCause ?? null,
      }))
      .sort((a, b) => a.rawTime.localeCompare(b.rawTime));
  }, [todayBeliefs]);

  // ── PATTERN DISCOVERY (Problem #5) ─────────────────────────────
  const discoveredPatterns = useMemo(() => {
    const patterns: { text: string; confidence: number }[] = [];
    if (beliefs.length < 3) return patterns;

    // Pattern: cause appears after specific hour
    const causeByHour: Record<string, number[]> = {};
    for (const b of beliefs) {
      if (!b.primaryCause || !b.createdAt) continue;
      try {
        const hour = new Date(b.createdAt).getHours();
        if (!causeByHour[b.primaryCause]) causeByHour[b.primaryCause] = [];
        causeByHour[b.primaryCause].push(hour);
      } catch { /* ignore */ }
    }
    for (const [cause, hours] of Object.entries(causeByHour)) {
      if (hours.length < 3) continue;
      const eveningHours = hours.filter((h) => h >= 19);
      const pct = Math.round((eveningHours.length / hours.length) * 100);
      if (pct >= 60 && eveningHours.length >= 2) {
        patterns.push({ text: `${cause} appears after 7 PM ${pct}% of the time.`, confidence: pct });
      }
      const morningHours = hours.filter((h) => h < 12);
      const mPct = Math.round((morningHours.length / hours.length) * 100);
      if (mPct >= 60 && morningHours.length >= 2) {
        patterns.push({ text: `${cause} appears before noon ${mPct}% of the time.`, confidence: mPct });
      }
    }

    // Pattern: state appears after foundation completion
    const foundationDates = new Set(activities.map((a) => a.date));
    const allDates = Array.from(new Set(beliefs.map((b) => b.date)));
    if (allDates.length >= 3) {
      const stateOnFoundation: Record<string, { withF: number; withoutF: number }> = {};
      for (const date of allDates) {
        const hasFoundation = foundationDates.has(date);
        const dayStates = beliefs.filter((b) => b.date === date).flatMap((b) => b.states);
        for (const s of dayStates) {
          if (!stateOnFoundation[s]) stateOnFoundation[s] = { withF: 0, withoutF: 0 };
          if (hasFoundation) stateOnFoundation[s].withF++;
          else stateOnFoundation[s].withoutF++;
        }
      }
      for (const [state, counts] of Object.entries(stateOnFoundation)) {
        const total = counts.withF + counts.withoutF;
        if (total < 3) continue;
        const pct = Math.round((counts.withF / total) * 100);
        if (pct >= 65 && ["Focused", "Determined", "Calm"].includes(state)) {
          patterns.push({ text: `${state} state appears when foundations are completed (${pct}%).`, confidence: pct });
        }
      }

      // Pattern: limiting thoughts spike when foundation is skipped
      const COOL = ["Focused", "Determined", "Calm"];
      const limitingByDate: Record<string, number> = {};
      for (const b of beliefs) {
        if (b.thoughtType === "limiting") limitingByDate[b.date] = (limitingByDate[b.date] || 0) + 1;
      }
      let skipLim = 0, skipTotal = 0, doneTotal = 0, doneLim = 0;
      for (const date of allDates) {
        const fDone = foundationDates.has(date);
        const lim = limitingByDate[date] ?? 0;
        if (fDone) { doneTotal++; doneLim += lim; }
        else { skipTotal++; skipLim += lim; }
      }
      if (skipTotal >= 2 && doneTotal >= 2) {
        const avgSkipLim = skipLim / skipTotal;
        const avgDoneLim = doneLim / doneTotal;
        if (avgSkipLim > avgDoneLim * 1.5 && avgSkipLim >= 1) {
          patterns.push({
            text: `Limiting thoughts spike ${Math.round((avgSkipLim / Math.max(0.1, avgDoneLim)) * 100 - 100)}% more when foundations are skipped.`,
            confidence: Math.min(95, Math.round((avgSkipLim / Math.max(0.1, avgDoneLim)) * 50)),
          });
        }
      }

      // Pattern: fatigue appears when Sleep Protection is missed
      const sleepDates = new Set(activities.filter((a) => a.foundation === "Sleep Protection").map((a) => a.date));
      const fatigueEntries = beliefs.filter((b) => b.states.includes("Fatigued" as any));
      if (fatigueEntries.length >= 3) {
        const noSleepFatigue = fatigueEntries.filter((b) => !sleepDates.has(b.date)).length;
        const pct = Math.round((noSleepFatigue / fatigueEntries.length) * 100);
        if (pct >= 50 && noSleepFatigue >= 2) {
          patterns.push({ text: `Fatigue appears when Sleep Protection is missed (${pct}% of the time).`, confidence: pct });
        }
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  }, [beliefs, activities]);

  // ── Belief Transformations ─────────────────────────────────────
  const beliefTransformations = useMemo(() => {
    const decisions = decisionRepo.list();
    const usages    = decisionUsageRepo.list();
    return generateBeliefTransformations(decisions, usages);
  }, []);

  // ── Pattern Report ─────────────────────────────────────────────
  const patternReport = useMemo(() => generatePatternReport(beliefs), [beliefs]);

  // ── Dominant threats ───────────────────────────────────────────
  const dominantThreats = useMemo(() => {
    const total = countermeasureLogs.length;
    if (total === 0) return [];
    const counts: Record<string, number> = {};
    for (const log of countermeasureLogs) {
      counts[log.detectedThreatId] = (counts[log.detectedThreatId] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        name: THREATS.find((t) => t.id === id)?.name ?? id.replace(/_/g, " "),
        severity: THREATS.find((t) => t.id === id)?.severity ?? "MEDIUM",
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [countermeasureLogs]);

  // ── CM effectiveness ───────────────────────────────────────────
  const cmEffectiveness = useMemo(() => {
    return calculateCountermeasureEffectiveness(countermeasureLogs)
      .filter((e) => e.recommendedCount > 0)
      .map((e) => ({
        ...e,
        name: COUNTERMEASURES.find((c) => c.id === e.countermeasureId)?.name ?? e.countermeasureId,
      }))
      .slice(0, 5);
  }, [countermeasureLogs]);

  // ── Foundation correlations ────────────────────────────────────
  const correlations = useMemo(() =>
    calculateBeliefCorrelations(beliefs, activities),
    [beliefs, activities]);
  const topCorrelations = useMemo(() => {
    return correlations
      .filter((c) => c.occurrences >= 2)
      .sort((a, b) => b.skipPercent - a.skipPercent)
      .slice(0, 8);
  }, [correlations]);

  const SEVERITY_COLOR: Record<string, string> = {
    CRITICAL: "text-signal", HIGH: "text-signal", MEDIUM: "text-warning", LOW: "text-emerald-400",
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-1 flex-1 min-h-0 overflow-y-auto"
    >
      <div className="col-span-1 lg:col-span-12">
        <WeeklyReviewReport todaysDate={todaysDate} />
      </div>

      {beliefs.length < 5 && countermeasureLogs.length < 2 ? (
        <div className="col-span-1 lg:col-span-12 panel p-8 bg-black/45 border-white/8 text-center mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
            Intelligence Gathering...
          </p>
          <p className="font-mono text-[9px] text-white/20 mt-2">
            Insufficient data to generate proactive insights. Maintain daily execution.
          </p>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════
              ROW 0: TODAY'S MENTAL PROFILE (Problem #2) — FULL WIDTH
          ════════════════════════════════════════════════════════════ */}
          <motion.div
            variants={itemVariants}
            className="panel p-4 lg:col-span-12 bg-black/45 border-white/8"
          >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Live Snapshot</p>
          <h3 className="font-display text-sm uppercase text-frost">Today&apos;s Mental Profile</h3>
        </div>

        {!mentalProfile ? (
          <p className="font-mono text-xs text-white/20 text-center py-4">
            No check-ins today. Complete a Neural Check-In to populate.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Check-in counts */}
            <div className="border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Check-ins</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl text-frost">{mentalProfile.total}</span>
                <div className="flex items-center gap-1 font-mono text-[8px]">
                  <span className="text-emerald-400">{mentalProfile.strnCount}↑</span>
                  <span className="text-frost/50">{mentalProfile.neutCount}→</span>
                  <span className="text-signal">{mentalProfile.limCount}↓</span>
                </div>
              </div>
            </div>

            {/* Dominant State */}
            <div className="border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Dominant State</p>
              <span className={`font-display text-sm uppercase ${
                ["Focused", "Determined", "Calm"].includes(mentalProfile.dominantState) ? "text-emerald-400" : "text-signal"
              }`}>{mentalProfile.dominantState}</span>
            </div>

            {/* Most Frequent Cause */}
            <div className="border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Top Cause</p>
              <span className="font-display text-sm uppercase text-warning/80">{mentalProfile.dominantCause}</span>
            </div>

            {/* Peak Risk / Recovery */}
            <div className="border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Peak Risk</p>
              <span className="font-mono text-xs text-signal">{mentalProfile.peakRiskTime}</span>
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30 mt-1">Recovery</p>
              <span className="font-mono text-xs text-emerald-400">{mentalProfile.recoveryTime}</span>
            </div>

            {/* Net Direction */}
            <div className="border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Net Direction</p>
              <div className="flex items-center gap-2">
                <span className={`font-display text-2xl ${mentalProfile.direction.color}`}>
                  {mentalProfile.direction.icon}
                </span>
                <span className={`font-display text-sm uppercase ${mentalProfile.direction.color}`}>
                  {mentalProfile.direction.label}
                </span>
              </div>
            </div>

            {/* Most Frequent Thought — spans full bottom */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-5 border border-white/5 bg-black/25 p-2.5 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Dominant Thought</p>
              <p className="font-mono text-xs text-frost/80 italic leading-snug">
                &quot;{mentalProfile.dominantThought}&quot;
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          ROW 0.5: DAILY STATE DISTRIBUTION (V4.4 — Change 10)
      ════════════════════════════════════════════════════════════ */}
      {stateDurations && stateDurations.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="panel p-4 lg:col-span-12 bg-black/45 border-white/8"
        >
          <div className="mb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Duration Analysis</p>
            <h3 className="font-display text-sm uppercase text-frost">Daily State Distribution</h3>
            <p className="font-mono text-[9px] text-white/30 mt-0.5">Time spent in each state based on check-in intervals</p>
          </div>
          <div className="space-y-2">
            {stateDurations.map((sd, idx) => {
              const cat = getStateCategory(sd.state);
              const barColor = cat === "positive" ? "bg-emerald-400" : cat === "negative" ? "bg-signal" : "bg-frost";
              const h = Math.floor(sd.mins / 60);
              const m = sd.mins % 60;
              return (
                <div key={sd.state} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {idx === 0 && (
                        <span className="px-1 py-0.5 border border-warning/25 bg-warning/5 font-mono text-[7px] uppercase text-warning/80">Dominant</span>
                      )}
                      <span className="font-display text-xs uppercase text-white/80 truncate">{sd.state}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                      <span className="text-frost/70 tabular-nums">{h}h {m}m</span>
                      <span className="text-white/40 tabular-nums w-8 text-right">{sd.pct}%</span>
                    </div>
                  </div>
                  <MiniBar percent={sd.pct} color={barColor} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ROW 1: EXECUTION INTELLIGENCE ENGINE (New)
      ════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-12 my-2">
        <ExecutionIntelligenceEngine todaysDate={todaysDate} />
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 3: DAILY PSYCHOLOGICAL TIMELINE (Problem #1) — FULL WIDTH
      ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-12 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Live Feed</p>
          <h3 className="font-display text-sm uppercase text-frost">Daily Psychological Timeline</h3>
          <p className="font-mono text-[9px] text-white/30 mt-0.5">Every check-in today, in chronological order</p>
        </div>

        {timeline.length === 0 ? (
          <p className="font-mono text-xs text-white/20 text-center py-8">
            No check-ins today. Complete a Neural Check-In to see your timeline.
          </p>
        ) : (
          <div className="space-y-0">
            {timeline.map((entry, idx) => {
              const cs = classStyle(entry.thoughtType);
              return (
                <div key={idx} className="relative">
                  {/* Timeline connector */}
                  {idx > 0 && (
                    <div className="absolute left-[52px] -top-3 w-px h-3 bg-white/8" />
                  )}
                  <div className={`flex gap-4 p-3 border-l-2 ${cs.border} ${cs.bg} transition-all`}>
                    {/* Time */}
                    <div className="w-[60px] shrink-0 text-right">
                      <span className="font-mono text-xs text-white/60 tabular-nums">{entry.time}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {/* States row */}
                      <div className="flex flex-wrap gap-1.5">
                        {entry.states.map((state) => {
                          const isCool = ["Focused", "Determined", "Calm"].includes(state);
                          return (
                            <span key={state} className={`px-2 py-0.5 border text-[9px] uppercase font-display ${
                              isCool
                                ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
                                : "border-signal/25 bg-signal/5 text-signal"
                            }`}>{state}</span>
                          );
                        })}
                      </div>

                      {/* Primary Cause (V4.4 — between states and thought) */}
                      {entry.cause && (
                        <span className="font-mono text-[10px] text-warning/70">{entry.cause}</span>
                      )}

                      {/* Thought */}
                      {entry.thought && (
                        <div>
                          <span className="font-mono text-[8px] uppercase tracking-wider text-white/25 block">Thought</span>
                          <p className="font-mono text-xs text-white/75 italic leading-snug">
                            &quot;{entry.thought}&quot;
                          </p>
                        </div>
                      )}

                      {/* Classification badge */}
                      <div>
                        <span className="font-mono text-[8px] uppercase tracking-wider text-white/25 block">Classification</span>
                        <span className={`inline-block px-2 py-0.5 border font-mono text-[9px] uppercase tracking-wider mt-0.5 ${cs.text} ${cs.border} ${cs.bg}`}>
                          {cs.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  {idx < timeline.length - 1 && (
                    <div className="ml-[52px] border-t border-dashed border-white/[0.04] my-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          ROW 4: RECURRING THOUGHTS + DOMINANT THREATS
      ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Thought Pattern</p>
          <h3 className="font-display text-sm uppercase text-frost">Recurring Thoughts</h3>
        </div>
        {patternReport.topThoughts.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">No recurring thoughts logged.</p>
        ) : (
          <div className="space-y-2.5">
            {patternReport.topThoughts.slice(0, 6).map((t, idx) => {
              const cs = classStyle(t.thoughtType);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-xs text-white/75 leading-snug flex-1">
                      &quot;{String(t.thought)}&quot;
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-1 py-0.5 border font-mono text-[7px] uppercase ${cs.text} ${cs.border} ${cs.bg}`}>{cs.label}</span>
                      <span className="font-display text-sm text-frost tabular-nums">{t.count}×</span>
                    </div>
                  </div>
                  <MiniBar
                    percent={Math.round((t.count / Math.max(1, patternReport.topThoughts[0].count)) * 100)}
                    color="bg-frost/40"
                  />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Threat Intel</p>
          <h3 className="font-display text-sm uppercase text-frost">Dominant Threats</h3>
        </div>
        {dominantThreats.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">No threat data.</p>
        ) : (
          <div className="space-y-3">
            {dominantThreats.map((threat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`font-mono text-[9px] uppercase shrink-0 ${SEVERITY_COLOR[threat.severity] ?? "text-white/50"}`}>▸</span>
                    <span className="font-display text-xs uppercase text-white truncate">{threat.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-display text-sm text-frost tabular-nums">{threat.percent}%</span>
                    <span className="block font-mono text-[8px] text-white/25">{threat.count} events</span>
                  </div>
                </div>
                <MiniBar
                  percent={threat.percent}
                  color={
                    (threat.severity as string) === "HIGH" || (threat.severity as string) === "CRITICAL"
                      ? "bg-signal/60"
                      : (threat.severity as string) === "MEDIUM"
                        ? "bg-warning/60"
                        : "bg-emerald-400/50"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          ROW 5: STRENGTHENING PATTERNS + BELIEF TRANSFORMATIONS
      ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-emerald-400/80">Positive Intelligence</p>
          <h3 className="font-display text-sm uppercase text-frost">Strengthening Patterns</h3>
          <p className="font-mono text-[9px] text-white/25 mt-0.5">Thoughts that build you up, by frequency</p>
        </div>
        {patternReport.strengtheningThoughts.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">
            No strengthening thoughts logged yet.<br />
            <span className="text-white/15 text-[10px]">Mark a thought as &quot;Strengthening&quot; during check-in.</span>
          </p>
        ) : (
          <div className="space-y-2.5">
            {patternReport.strengtheningThoughts.slice(0, 6).map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-xs text-emerald-400/85 leading-snug flex-1">&quot;{t.thought}&quot;</p>
                  <span className="font-display text-sm text-emerald-400 shrink-0 tabular-nums">{t.count}×</span>
                </div>
                <MiniBar percent={Math.round((t.count / Math.max(1, patternReport.strengtheningThoughts[0].count)) * 100)} color="bg-emerald-400/55" />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Belief Engine</p>
          <h3 className="font-display text-sm uppercase text-frost">Belief Transformations</h3>
          <p className="font-mono text-[9px] text-white/25 mt-0.5">Thought → Limiting Belief → Empowering Belief</p>
        </div>
        {beliefTransformations.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">
            No belief transformations yet.<br />
            <span className="text-white/15 text-[10px]">Create a matrix entry with a New Empowering Belief.</span>
          </p>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
            {beliefTransformations.slice(0, 5).map((bt, idx) => (
              <div key={idx} className="border border-white/5 bg-white/[0.01] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">#{idx + 1}</span>
                  <span className="font-display text-xs text-frost">{bt.usageCount}× used</span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <p className="text-white/60 italic">&quot;{bt.recurringThought}&quot;</p>
                  <div className="flex items-center gap-1.5 pl-2">
                    <span className="text-white/20">↓</span>
                    <span className="text-signal/70">{bt.limitingBelief}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-2">
                    <span className="text-white/20">↓</span>
                    <span className="text-emerald-400 font-bold">{bt.newEmpoweringBelief}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          ROW 6: DISCOVERED PATTERNS (Problem #5) — FULL WIDTH
      ════════════════════════════════════════════════════════════ */}
      {discoveredPatterns.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="panel p-4 lg:col-span-12 bg-black/45 border-white/8"
        >
          <div className="mb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-warning/80">Pattern Engine</p>
            <h3 className="font-display text-sm uppercase text-frost">Discovered Patterns</h3>
            <p className="font-mono text-[9px] text-white/25 mt-0.5">Statistically meaningful patterns from your data</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {discoveredPatterns.map((pat, idx) => (
              <div key={idx} className="border border-warning/15 bg-warning/[0.02] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-warning/60 uppercase tracking-wider">Pattern #{idx + 1}</span>
                  <span className="px-1.5 py-0.5 border border-warning/20 bg-warning/5 font-mono text-[8px] text-warning/70">{pat.confidence}%</span>
                </div>
                <p className="font-mono text-xs text-white/70 leading-snug">{pat.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ROW 7: COUNTERMEASURE EFFECTIVENESS + FOUNDATION CORRELATIONS
      ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Protocol Index</p>
          <h3 className="font-display text-sm uppercase text-frost">Most Effective Countermeasures</h3>
        </div>
        {cmEffectiveness.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">No protocol outcomes logged yet.</p>
        ) : (
          <div className="space-y-3">
            {cmEffectiveness.map((cm, idx) => (
              <div key={idx} className="border border-white/5 bg-white/[0.01] p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs uppercase text-white">{cm.name}</span>
                  <span className="font-mono text-[9px] text-white/30 shrink-0">{cm.recommendedCount}× used</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                  <div>
                    <span className="block text-white/25 uppercase tracking-wider">Completion</span>
                    <span className={`font-display text-sm ${cm.completionRate >= 60 ? "text-emerald-400" : cm.completionRate >= 30 ? "text-warning" : "text-signal"}`}>
                      {cm.completionRate}%
                    </span>
                    <MiniBar percent={cm.completionRate} color={cm.completionRate >= 60 ? "bg-emerald-400/60" : cm.completionRate >= 30 ? "bg-warning/60" : "bg-signal/60"} />
                  </div>
                  <div>
                    <span className="block text-white/25 uppercase tracking-wider">Accepted</span>
                    <span className="font-display text-sm text-frost">{cm.acceptanceRate}%</span>
                    <MiniBar percent={cm.acceptanceRate} color="bg-frost/40" />
                  </div>
                  <div>
                    <span className="block text-white/25 uppercase tracking-wider">Skipped</span>
                    <span className={`font-display text-sm ${cm.skipRate > 50 ? "text-signal" : "text-white/50"}`}>{cm.skipRate}%</span>
                    <MiniBar percent={cm.skipRate} color="bg-signal/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-6 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Belief Intel</p>
          <h3 className="font-display text-sm uppercase text-frost">Foundation Correlations</h3>
          <p className="font-mono text-[9px] text-white/25 mt-0.5">Cause → Foundation impact (min 2 data points)</p>
        </div>
        {topCorrelations.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">
            Not enough data yet. Complete check-ins with cause data across multiple days.
          </p>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[240px] pr-1">
            {topCorrelations.map((corr, idx) => {
              const isSkipHigh = corr.skipPercent >= 60;
              const isSkipLow  = corr.skipPercent <= 30;
              return (
                <div key={idx} className="border border-white/5 bg-white/[0.01] p-2.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="block font-mono text-[10px] text-warning/80 truncate">{corr.cause}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-white/25 text-[10px]">→</span>
                        <span className="font-display text-[11px] uppercase text-white/70">{corr.foundation}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-display text-sm ${isSkipHigh ? "text-signal" : isSkipLow ? "text-emerald-400" : "text-warning"}`}>
                        {isSkipHigh ? `skipped ${corr.skipPercent}%` : `done ${100 - corr.skipPercent}%`}
                      </span>
                      <span className="block font-mono text-[8px] text-white/20">{corr.occurrences} days</span>
                    </div>
                  </div>
                  <MiniBar
                    percent={isSkipHigh ? corr.skipPercent : 100 - corr.skipPercent}
                    color={isSkipHigh ? "bg-signal/55" : "bg-emerald-400/55"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
      </>
      )}
    </motion.div>
  );
}
