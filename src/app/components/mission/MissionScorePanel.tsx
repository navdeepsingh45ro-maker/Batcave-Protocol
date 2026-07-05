"use client";

import { motion } from "framer-motion";
import type { MissionConfig } from "@/lib/mission-mode/types";

interface ScoreBreakdownItem {
  id: string;
  label: string;
  earned: number;
  max: number;
  completed: boolean;
}

interface MissionScorePanelProps {
  config: MissionConfig;
  score: number;
  rating: string;
  breakdown: ScoreBreakdownItem[];
}

export default function MissionScorePanel({
  config,
  score,
  rating,
  breakdown,
}: MissionScorePanelProps) {
  const maxScore = config.scoringWeights.maxScore;
  const scorePercent = Math.round((score / maxScore) * 100);

  const ratingColor =
    rating === "Excellent"
      ? "text-emerald-400"
      : rating === "Good"
        ? "text-blue-400"
        : rating === "Recover Tomorrow"
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="border border-white/8 bg-black/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Mission Score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl tabular-nums text-white glow-text-amber">
              {score}
            </span>
            <span className="font-mono text-xs text-white/25">
              / {maxScore}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Rating
          </p>
          <p className={`mt-1 font-display text-sm uppercase ${ratingColor}`}>
            {rating}
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              scorePercent >= 90
                ? "linear-gradient(90deg, rgba(72, 187, 120, 0.8), rgba(72, 187, 120, 0.5))"
                : scorePercent >= 75
                  ? "linear-gradient(90deg, rgba(96, 165, 250, 0.8), rgba(96, 165, 250, 0.5))"
                  : scorePercent >= 60
                    ? "linear-gradient(90deg, rgba(212, 165, 67, 0.8), rgba(212, 165, 67, 0.5))"
                    : "linear-gradient(90deg, rgba(255, 42, 42, 0.8), rgba(255, 42, 42, 0.5))",
            boxShadow:
              scorePercent >= 90
                ? "0 0 12px rgba(72, 187, 120, 0.3)"
                : scorePercent >= 75
                  ? "0 0 12px rgba(96, 165, 250, 0.3)"
                  : scorePercent >= 60
                    ? "0 0 12px rgba(212, 165, 67, 0.3)"
                    : "0 0 12px rgba(255, 42, 42, 0.3)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${scorePercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2 border-t border-white/5 pt-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">
          Breakdown
        </p>
        {breakdown.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                item.completed ? "bg-emerald-400" : "bg-white/15"
              }`}
            />
            <span
              className={`flex-1 font-mono text-[10px] uppercase tracking-wider ${
                item.completed ? "text-white/60" : "text-white/25"
              }`}
            >
              {item.label}
            </span>
            <span
              className={`font-mono text-[10px] tabular-nums ${
                item.completed ? "text-emerald-400/80" : "text-white/20"
              }`}
            >
              {item.earned}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
