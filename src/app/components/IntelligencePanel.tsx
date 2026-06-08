"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FOUNDATION_DEFINITIONS,
  IDENTITIES,
  FOUNDATION_IDENTITY_MAP,
  addDays,
  calculateDailyFoundationScoreFromActivities,
  getCompletedFoundationTypesFromActivities,
} from "@/lib/foundation";
import type { Identity, ISODate } from "@/lib/foundation";
import { localFoundationRepository } from "@/lib/foundation";
import { beliefRepo } from "@/lib/belief-intelligence";
import { generatePatternReport, calculateBeliefCorrelations } from "@/lib/belief-intelligence/calculations";
import { localCountermeasureRepository, calculateCountermeasureEffectiveness } from "@/lib/countermeasures";
import { THREATS, COUNTERMEASURES } from "@/lib/countermeasures/config";

interface IntelligencePanelProps {
  todaysDate: ISODate;
  refreshKey: number;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.toLocaleDateString("en-US", { weekday: "short" });
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

// ── Small reusable bar ──────────────────────────────────────────
function MiniBar({ percent, color = "bg-signal/70" }: { percent: number; color?: string }) {
  return (
    <div className="h-1 w-full rounded bg-white/5 overflow-hidden mt-1">
      <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export default function IntelligencePanel({ todaysDate, refreshKey }: IntelligencePanelProps) {
  // ── Rolling 7 days ────────────────────────────────────────────
  const dates = useMemo(() => {
    const arr: ISODate[] = [];
    for (let i = -6; i <= 0; i++) arr.push(addDays(todaysDate, i));
    return arr;
  }, [todaysDate]);

  // ── Data loads ────────────────────────────────────────────────
  const activities = useMemo(() => localFoundationRepository.listFoundationActivities(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]);

  const beliefs = useMemo(() => beliefRepo.list(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]);

  const countermeasureLogs = useMemo(() => localCountermeasureRepository.listLogs(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]);

  // ── Foundation charts (Rows 1–2) ─────────────────────────────
  const scores = useMemo(() =>
    dates.map((d) => {
      const score = calculateDailyFoundationScoreFromActivities(activities, d);
      return { date: d, scorePercent: score.scorePercent, completedCount: score.completedCount };
    }),
    [dates, activities]);

  const averageReadiness = useMemo(() => {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((t, e) => t + e.scorePercent, 0) / scores.length);
  }, [scores]);

  const heatmapMatrix = useMemo(() =>
    FOUNDATION_DEFINITIONS.map((def) => ({
      type: def.type,
      identity: def.identity,
      days: dates.map((d) => ({
        date: d,
        completed: getCompletedFoundationTypesFromActivities(activities, d).includes(def.type),
      })),
    })),
    [dates, activities]);

  const identityScores = useMemo(() => {
    const counts: Record<Identity, number> = { King: 0, Builder: 0, Striker: 0, Guardian: 0 };
    dates.forEach((d) => {
      const completed = getCompletedFoundationTypesFromActivities(activities, d);
      new Set(completed.map((f) => FOUNDATION_IDENTITY_MAP[f])).forEach((id) => { if (id) counts[id]++; });
    });
    return IDENTITIES.map((id) => ({
      identity: id,
      activeDays: counts[id],
      scorePercent: Math.round((counts[id] / 7) * 100),
    }));
  }, [dates, activities]);

  // ── SVG line chart ────────────────────────────────────────────
  const svgWidth = 600, svgHeight = 150, paddingX = 45, paddingY = 20;
  const points = useMemo(() => {
    const cw = svgWidth - paddingX * 2, ch = svgHeight - paddingY * 2;
    return scores.map((s, i) => ({
      x: paddingX + i * (cw / 6),
      y: paddingY + ch - (s.scorePercent / 100) * ch,
      scorePercent: s.scorePercent,
    }));
  }, [scores]);
  const linePath = useMemo(() =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "),
    [points]);
  const fillPath = useMemo(() =>
    points.length === 0
      ? ""
      : `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`,
    [points, linePath]);

  // ── NEW: Psychological Landscape chains ───────────────────────
  const psychChains = useMemo(() => {
    const map: Record<string, { state: string; cause: string; thought: string; count: number }> = {};
    for (const b of beliefs) {
      for (const state of b.states) {
        const cause = b.primaryCause ?? "Unknown";
        const thought = b.recurringThought ?? "";
        const key = `${state}||${cause}||${thought}`;
        if (!map[key]) map[key] = { state, cause, thought, count: 0 };
        map[key].count++;
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [beliefs]);

  // ── NEW: Recurring thoughts (full text, no truncation) ────────
  const patternReport = useMemo(() => generatePatternReport(beliefs), [beliefs]);

  // ── NEW: Dominant threats from CM logs ───────────────────────
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

  // ── NEW: Countermeasure effectiveness ────────────────────────
  const cmEffectiveness = useMemo(() => {
    return calculateCountermeasureEffectiveness(countermeasureLogs)
      .filter((e) => e.recommendedCount > 0)
      .map((e) => ({
        ...e,
        name: COUNTERMEASURES.find((c) => c.id === e.countermeasureId)?.name ?? e.countermeasureId,
      }))
      .slice(0, 5);
  }, [countermeasureLogs]);

  // ── NEW: Foundation correlations (full strings) ───────────────
  const correlations = useMemo(() =>
    calculateBeliefCorrelations(beliefs, activities),
    [beliefs, activities]);

  // Group correlations by cause, pick the strongest signal per cause
  const topCorrelations = useMemo(() => {
    const byCorr = correlations
      .filter((c) => c.occurrences >= 2) // require at least 2 data points
      .sort((a, b) => b.skipPercent - a.skipPercent)
      .slice(0, 8);
    return byCorr;
  }, [correlations]);

  const SEVERITY_COLOR: Record<string, string> = {
    CRITICAL: "text-signal",
    HIGH: "text-signal",
    MEDIUM: "text-warning",
    LOW: "text-emerald-400",
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-1 flex-1 min-h-0 overflow-y-auto"
    >
      {/* ── ROW 1: READINESS CIRCLE & HEATMAP ──────────────────── */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-4 flex flex-col justify-between items-center text-center bg-black/45 border-white/8 min-h-[220px]"
      >
        <div className="w-full text-left">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Analytics Alpha</p>
          <h3 className="font-display text-sm uppercase text-frost">Readiness Index</h3>
        </div>

        <div className="relative my-3 flex items-center justify-center">
          <svg className="h-24 w-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" className="stroke-white/5 fill-transparent" strokeWidth="4" />
            <motion.circle
              cx="48" cy="48" r="40"
              className="stroke-signal/85 fill-transparent"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 - (2 * Math.PI * 40 * averageReadiness) / 100 }}
              transition={{ duration: 1 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-xl text-white">{averageReadiness}%</span>
            <span className="font-mono text-[8px] uppercase tracking-wider text-white/30">Readiness</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-2 text-left font-mono text-[9px] uppercase text-white/45">
          <div className="border border-white/5 bg-white/[0.01] p-2">
            <span>Check-ins</span>
            <p className="mt-0.5 text-xs text-frost font-display">{beliefs.length}</p>
          </div>
          <div className="border border-white/5 bg-white/[0.01] p-2">
            <span>Readiness</span>
            <p className={`mt-0.5 text-xs font-display ${averageReadiness >= 70 ? "text-emerald-400" : averageReadiness >= 40 ? "text-warning" : "text-signal"}`}>
              {averageReadiness >= 70 ? "OPTIMAL" : averageReadiness >= 40 ? "WARN" : "CRITICAL"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-8 bg-black/45 border-white/8 flex flex-col justify-between min-h-[220px]"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">System Telemetry</p>
          <h3 className="font-display text-sm uppercase text-frost mb-3">Weekly Habits Heatmap</h3>
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-x-auto">
          <div className="min-w-[420px] space-y-2">
            <div className="grid grid-cols-12 gap-1.5 text-center font-mono text-[9px] uppercase text-white/35">
              <span className="col-span-4 text-left">Foundation</span>
              {dates.map((d) => (
                <span key={d} className="col-span-1">
                  {formatDayOfWeek(d)}
                  <span className="block text-[8px] opacity-75">{formatDateLabel(d).split(" ")[1]}</span>
                </span>
              ))}
            </div>
            {heatmapMatrix.map((row) => (
              <div key={row.type} className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-4 flex items-center justify-between pr-2">
                  <span className="font-display text-[10px] uppercase text-white/60 truncate">{row.type}</span>
                  <span className="border border-signal/20 bg-signal/5 px-1 py-0.5 font-mono text-[8px] uppercase text-signal/50 hidden sm:inline">
                    {row.identity.substring(0, 4)}
                  </span>
                </div>
                {row.days.map((day) => (
                  <div key={day.date} className="col-span-1 flex justify-center">
                    <div className={`h-5 w-5 border rounded-sm transition-all duration-300 ${
                      day.completed
                        ? "bg-emerald-500/25 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
                        : "bg-white/[0.02] border-white/5"
                    }`} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── ROW 2: LINE GRAPH & IDENTITY SCORES ────────────────── */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-8 bg-black/45 border-white/8 flex flex-col justify-between"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Trend Log</p>
          <h3 className="font-display text-sm uppercase text-frost mb-2">7-Day Completion Trend</h3>
        </div>

        <div className="w-full flex-1 flex items-center justify-center min-h-[140px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-h-[140px] overflow-visible">
            <defs>
              <linearGradient id="chartGlowInt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 42, 42, 0.18)" />
                <stop offset="100%" stopColor="rgba(255, 42, 42, 0.0)" />
              </linearGradient>
            </defs>
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.04)" strokeDasharray="4,4" />
            <line x1={paddingX} y1={(paddingY + svgHeight - paddingY) / 2} x2={svgWidth - paddingX} y2={(paddingY + svgHeight - paddingY) / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="4,4" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(255,255,255,0.08)" />
            <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" className="fill-white/30 font-mono text-[8px]">100%</text>
            <text x={paddingX - 10} y={(paddingY + svgHeight - paddingY) / 2 + 3} textAnchor="end" className="fill-white/30 font-mono text-[8px]">50%</text>
            <text x={paddingX - 10} y={svgHeight - paddingY + 3} textAnchor="end" className="fill-white/30 font-mono text-[8px]">0%</text>
            {points.length > 0 && <path d={fillPath} fill="url(#chartGlowInt)" />}
            {points.length > 0 && <path d={linePath} fill="none" stroke="rgba(255, 42, 42, 0.85)" strokeWidth="1.5" />}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" className="fill-white stroke-signal" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 7} textAnchor="middle" className="fill-frost font-mono text-[8px] font-bold">{p.scorePercent}%</text>
                <text x={p.x} y={svgHeight - paddingY + 12} textAnchor="middle" className="fill-white/40 font-mono text-[8px] uppercase">{formatDayOfWeek(scores[i].date)}</text>
              </g>
            ))}
          </svg>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-4 bg-black/45 border-white/8 flex flex-col justify-between"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Persona Index</p>
          <h3 className="font-display text-sm uppercase text-frost mb-4">Identity Participation</h3>
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-2.5">
          {identityScores.map((score) => (
            <div key={score.identity} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="font-display uppercase text-white/60">{score.identity}</span>
                <span className="text-white/40">{score.activeDays}/7 D ({score.scorePercent}%)</span>
              </div>
              <MiniBar percent={score.scorePercent} color="bg-signal/70" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── ROW 3: PSYCHOLOGICAL LANDSCAPE ─────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="panel p-4 lg:col-span-12 bg-black/45 border-white/8 min-h-[200px]"
      >
        <div className="mb-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Mind Index</p>
          <h3 className="font-display text-sm uppercase text-frost">Psychological Landscape</h3>
          <p className="font-mono text-[9px] text-white/30 mt-0.5">State → Cause → Recurring Thought, ranked by occurrence</p>
        </div>

        {psychChains.length === 0 ? (
          <p className="font-mono text-xs text-white/20 text-center py-8">
            No check-in patterns yet. Complete check-ins to build the landscape.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {psychChains.map((chain, idx) => (
              <div key={idx} className="border border-white/5 bg-white/[0.01] p-3 space-y-2">
                {/* Chain header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">
                    #{idx + 1} Pattern
                  </span>
                  <span className="font-display text-sm text-frost">{chain.count}×</span>
                </div>

                {/* State → Cause → Thought chain */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 border text-[10px] uppercase font-display ${
                      ["Focused","Determined","Calm"].includes(chain.state)
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                        : "border-signal/30 bg-signal/5 text-signal"
                    }`}>{chain.state}</span>
                  </div>

                  {chain.cause !== "Unknown" && (
                    <>
                      <span className="text-white/20 pl-2 text-[10px]">↓</span>
                      <div className="pl-2">
                        <span className="text-white/50">{chain.cause}</span>
                      </div>
                    </>
                  )}

                  {chain.thought && (
                    <>
                      <span className="text-white/20 pl-2 text-[10px]">↓</span>
                      <div className="pl-2 border-l border-white/8">
                        <span className="text-frost/80 italic">&quot;{chain.thought}&quot;</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Occurrence bar */}
                <div>
                  <MiniBar
                    percent={Math.round((chain.count / Math.max(1, psychChains[0].count)) * 100)}
                    color={["Focused","Determined","Calm"].includes(chain.state) ? "bg-emerald-500/50" : "bg-signal/50"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── ROW 4: RECURRING THOUGHTS + DOMINANT THREATS ────────── */}
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
            {patternReport.topThoughts.slice(0, 6).map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-xs text-white/75 leading-snug flex-1">
                    &quot;{String(t.thought)}&quot;
                  </p>
                  <span className="font-display text-sm text-frost shrink-0 tabular-nums">
                    {t.count}×
                  </span>
                </div>
                <MiniBar
                  percent={Math.round((t.count / Math.max(1, patternReport.topThoughts[0].count)) * 100)}
                  color="bg-frost/40"
                />
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
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Threat Intel</p>
          <h3 className="font-display text-sm uppercase text-frost">Dominant Threats</h3>
        </div>

        {dominantThreats.length === 0 ? (
          <p className="font-mono text-xs text-white/20 py-6 text-center">
            No threat data. Complete a check-in with risk ≥ YELLOW.
          </p>
        ) : (
          <div className="space-y-3">
            {dominantThreats.map((threat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`font-mono text-[9px] uppercase shrink-0 ${SEVERITY_COLOR[threat.severity] ?? "text-white/50"}`}>
                      ▸
                    </span>
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

      {/* ── ROW 5: COUNTERMEASURE EFFECTIVENESS + FOUNDATION CORRELATIONS */}
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
                    <MiniBar
                      percent={cm.completionRate}
                      color={cm.completionRate >= 60 ? "bg-emerald-400/60" : cm.completionRate >= 30 ? "bg-warning/60" : "bg-signal/60"}
                    />
                  </div>
                  <div>
                    <span className="block text-white/25 uppercase tracking-wider">Accepted</span>
                    <span className="font-display text-sm text-frost">{cm.acceptanceRate}%</span>
                    <MiniBar percent={cm.acceptanceRate} color="bg-frost/40" />
                  </div>
                  <div>
                    <span className="block text-white/25 uppercase tracking-wider">Skipped</span>
                    <span className={`font-display text-sm ${cm.skipRate > 50 ? "text-signal" : "text-white/50"}`}>
                      {cm.skipRate}%
                    </span>
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
              const isSkipLow = corr.skipPercent <= 30;
              return (
                <div key={idx} className="border border-white/5 bg-white/[0.01] p-2.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="block font-mono text-[10px] text-warning/80 truncate">
                        {corr.cause}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-white/25 text-[10px]">→</span>
                        <span className="font-display text-[11px] uppercase text-white/70">
                          {corr.foundation}
                        </span>
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
    </motion.div>
  );
}
