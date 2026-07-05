"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionArchiveEntry } from "@/lib/mission-mode/types";
import { getMissionHistory } from "@/lib/mission-mode/missionHistory";

interface MissionHistoryPanelProps {
  refreshKey?: number;
}

export default function MissionHistoryPanel({ refreshKey }: MissionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const history = getMissionHistory();

  if (history.length === 0) {
    return (
      <div className="border border-white/8 bg-black/40 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2">
          Mission History
        </p>
        <p className="font-mono text-xs text-white/20">
          No completed missions yet. Your operational history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/8 bg-black/40 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-3">
        Mission History
      </p>

      <div className="space-y-2">
        {history.map((entry) => (
          <div key={entry.id} className="border border-white/6 bg-black/20">
            {/* Summary Row */}
            <button
              type="button"
              onClick={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              className="flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-white/[0.02]"
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${
                  entry.outcome === "completed"
                    ? "bg-emerald-400"
                    : entry.outcome === "abandoned"
                      ? "bg-red-400"
                      : "bg-amber-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs uppercase tracking-wider text-white truncate">
                  {entry.config.name}
                </p>
                <p className="font-mono text-[9px] text-white/30 truncate">
                  {entry.config.objective}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-sm tabular-nums text-white">
                  {entry.averageDailyScore}
                </p>
                <p className="font-mono text-[8px] uppercase text-white/25">
                  avg score
                </p>
              </div>
              <span
                className={`font-mono text-[10px] text-white/30 transition-transform ${
                  expandedId === entry.id ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {/* Expanded Detail */}
            <AnimatePresence>
              {expandedId === entry.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/5 p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                          Duration
                        </p>
                        <p className="font-mono text-[10px] text-white/50">
                          {entry.config.startDate} → {entry.config.endDate}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                          Final Score
                        </p>
                        <p className="font-mono text-[10px] tabular-nums text-white/50">
                          {entry.finalScore}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                          Stability
                        </p>
                        <p className="font-mono text-[10px] tabular-nums text-white/50">
                          {entry.stability.stabilityPercent}%
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                          Outcome
                        </p>
                        <p
                          className={`font-display text-[10px] uppercase ${
                            entry.outcome === "completed"
                              ? "text-emerald-400/70"
                              : entry.outcome === "abandoned"
                                ? "text-red-400/70"
                                : "text-amber-400/70"
                          }`}
                        >
                          {entry.outcome}
                        </p>
                      </div>
                    </div>

                    {entry.lessonsLearned && (
                      <div className="border-t border-white/5 pt-2">
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/25 mb-1">
                          Lessons Learned
                        </p>
                        <p className="font-mono text-[10px] leading-relaxed text-white/40">
                          {entry.lessonsLearned}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
