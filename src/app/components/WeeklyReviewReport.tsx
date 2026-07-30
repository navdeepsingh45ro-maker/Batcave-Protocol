"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { permanentOperationsRepository } from "@/lib/permanent-operations";
import type { ISODate } from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

interface Props {
  todaysDate: ISODate;
}

function subtractDays(dateStr: ISODate, days: number): ISODate {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as ISODate;
}

function getDayName(dateStr: ISODate): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export default function WeeklyReviewReport({ todaysDate }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  // Is today Sunday?
  const isSunday = getDayName(todaysDate) === "Sunday";

  const report = useMemo(() => {
    if (!isVisible && !isSunday) return null; // Don't calculate if hidden and not Sunday

    // Get last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => subtractDays(todaysDate, i));
    const allOps = permanentOperationsRepository.listOperations();
    
    let totalExpected = 0;
    let totalCompleted = 0;
    const completedByOp: Record<string, number> = {};
    const skippedByOp: Record<string, number> = {};
    const skipReasons: Record<string, number> = {};
    const completedByDay: Record<string, number> = {};

    dates.forEach((date) => {
      const logs = permanentOperationsRepository.listLogsForDate(date);
      // Expected operations for this day = total operations that aren't archived (or were active that day)
      // For simplicity, we just use the current unarchived count * 7 as the baseline, 
      // or just sum the logs that exist if they cover all.
      
      const activeOps = allOps.filter(o => !o.archived);
      totalExpected += activeOps.length;

      let dailyCompleted = 0;

      logs.forEach(log => {
        const op = allOps.find(o => o.id === log.operationId);
        if (!op) return;

        if (log.status === "completed") {
          totalCompleted++;
          dailyCompleted++;
          completedByOp[op.name] = (completedByOp[op.name] || 0) + 1;
        } else if (log.status === "skipped") {
          skippedByOp[op.name] = (skippedByOp[op.name] || 0) + 1;
          if (log.skipReason) {
            const reason = log.skipReason.toLowerCase().trim();
            skipReasons[reason] = (skipReasons[reason] || 0) + 1;
          }
        }
      });

      completedByDay[date] = dailyCompleted;
    });

    const overallConsistency = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
    const avgDailyScore = Math.round((totalCompleted / 7) * 10) / 10;

    // Progress metrics
    const getProgress = (name: string) => {
      const count = completedByOp[name] || 0;
      return Math.round((count / 7) * 100);
    };

    // Most skipped
    const mostSkippedOp = Object.entries(skippedByOp).sort((a, b) => b[1] - a[1])[0];
    const mostSkipped = mostSkippedOp ? mostSkippedOp[0] : "None";

    // Most improved habit (highest completion)
    const mostImprovedOp = Object.entries(completedByOp).sort((a, b) => b[1] - a[1])[0];
    const mostImproved = mostImprovedOp ? mostImprovedOp[0] : "None";

    // Most productive day
    const mostProductiveEntry = Object.entries(completedByDay).sort((a, b) => b[1] - a[1])[0];
    const mostProductiveDay = mostProductiveEntry && mostProductiveEntry[1] > 0 
      ? getDayName(mostProductiveEntry[0] as ISODate) 
      : "None";

    // Most common excuse
    const mostCommonExcuseEntry = Object.entries(skipReasons).sort((a, b) => b[1] - a[1])[0];
    const mostCommonExcuse = mostCommonExcuseEntry ? mostCommonExcuseEntry[0] : "None";

    // Dynamic Recommendation
    let recommendation = "";
    if (overallConsistency < 50) {
      recommendation = "Critical failure in operational consistency. Disregard emotion. Re-establish minimum baseline immediately.";
    } else if (mostSkippedOp && mostSkippedOp[1] >= 3) {
      recommendation = `Targeted failure detected in: ${mostSkippedOp[0]}. Review protocol and remove friction for next week.`;
    } else if (mostCommonExcuse !== "None" && mostCommonExcuseEntry![1] >= 2) {
      recommendation = `Recurring failure pattern detected: "${mostCommonExcuse}". Intelligence suggests this excuse is a vulnerability. Neutralize it.`;
    } else if (overallConsistency >= 85) {
      recommendation = "Performance is optimal. Maintain current velocity and do not change parameters.";
    } else {
      recommendation = "Baseline performance acceptable. Push for marginal improvements in the lowest scoring operation.";
    }

    return {
      overallConsistency,
      avgDailyScore,
      mostSkipped,
      mostImproved,
      mostProductiveDay,
      mostCommonExcuse,
      recommendation,
      progress: {
        Builder: getProgress("Builder Work"),
        Football: getProgress("Football Training"),
        Meditation: getProgress("Meditation"),
        Workout: getProgress("Workout"),
        Sleep: getProgress("Sleep Protection"),
      }
    };
  }, [todaysDate, isVisible, isSunday]);

  // If it's Sunday, we should default to visible.
  useEffect(() => {
    if (isSunday) {
      setIsVisible(true);
    }
  }, [isSunday]);

  return (
    <div className="w-full mb-6">
      {!isVisible && (
        <button
          onClick={() => {
            audioManager.playClick();
            setIsVisible(true);
          }}
          className="w-full py-3 border border-frost/20 bg-frost/5 hover:bg-frost/10 text-frost font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Generate Weekly Review
        </button>
      )}

      <AnimatePresence>
        {isVisible && report && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border border-white/10 bg-black/40 p-5 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
          >
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-frost/60 mb-1">Coach Protocol</p>
                <h2 className="font-display text-xl uppercase text-white tracking-wider">Weekly Review</h2>
              </div>
              {!isSunday && (
                <button 
                  onClick={() => { audioManager.playClick(); setIsVisible(false); }}
                  className="font-mono text-[10px] text-white/30 hover:text-white uppercase tracking-widest"
                >
                  Close
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="border border-white/5 bg-black/30 p-4">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">Consistency</span>
                <span className="font-display text-3xl text-frost">{report.overallConsistency}%</span>
              </div>
              <div className="border border-white/5 bg-black/30 p-4">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">Avg Score</span>
                <span className="font-display text-3xl text-white">{report.avgDailyScore}</span>
                <span className="font-mono text-[10px] text-white/30 ml-1">/day</span>
              </div>
              <div className="col-span-2 border border-white/5 bg-black/30 p-4">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">Coach Directive</span>
                <p className="font-mono text-xs text-emerald-400 uppercase leading-snug">
                  "{report.recommendation}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Core Progress */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-3 border-b border-white/5 pb-2">Core Progress</h3>
                {Object.entries(report.progress).map(([name, pct]) => (
                  <div key={name} className="flex items-center justify-between font-mono text-[11px] uppercase">
                    <span className="text-white/70">{name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1 bg-white/5 rounded overflow-hidden">
                        <div 
                          className={`h-full ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-frost' : 'bg-signal'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className="w-8 text-right text-white">{pct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-3 border-b border-white/5 pb-2">Intelligence Insights</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-white/30">Most Skipped</span>
                    <span className="font-mono text-[10px] text-signal uppercase mt-1 block truncate" title={report.mostSkipped}>{report.mostSkipped}</span>
                  </div>
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-white/30">Most Improved</span>
                    <span className="font-mono text-[10px] text-emerald-400 uppercase mt-1 block truncate" title={report.mostImproved}>{report.mostImproved}</span>
                  </div>
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-white/30">Peak Day</span>
                    <span className="font-mono text-[10px] text-frost uppercase mt-1 block">{report.mostProductiveDay}</span>
                  </div>
                  <div className="bg-black/20 p-2 border border-white/5">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-white/30">Primary Vulnerability</span>
                    <span className="font-mono text-[10px] text-warning uppercase mt-1 block truncate" title={report.mostCommonExcuse}>
                      {report.mostCommonExcuse}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
