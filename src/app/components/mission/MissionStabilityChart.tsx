"use client";

import { motion } from "framer-motion";
import type { MissionStability } from "@/lib/mission-mode/types";

interface MissionStabilityChartProps {
  stability: MissionStability;
}

const TREND_LABEL: Record<string, string> = {
  rising: "Rising",
  stable: "Stable",
  falling: "Falling",
};

const TREND_COLOR: Record<string, string> = {
  rising: "emerald",
  stable: "amber",
  falling: "red",
};

export default function MissionStabilityChart({ stability }: MissionStabilityChartProps) {
  const trendColor = TREND_COLOR[stability.momentumTrend] ?? "amber";

  const metrics = [
    {
      label: "Stability",
      value: stability.stabilityPercent,
      suffix: "%",
      description: "Days meeting minimum threshold",
    },
    {
      label: "Completion",
      value: stability.rollingCompletionPercent,
      suffix: "%",
      description: "Average score vs max possible",
    },
    {
      label: "Consistency",
      value: stability.consistencyIndex,
      suffix: "/100",
      description: "Lower variance = higher consistency",
    },
  ];

  return (
    <div className="border border-white/8 bg-black/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          Mission Stability
        </p>
        <span
          className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-wider border-${trendColor}-400/30 bg-${trendColor}-400/[0.06] text-${trendColor}-400`}
        >
          {stability.momentumTrend === "rising"
            ? "▲"
            : stability.momentumTrend === "falling"
              ? "▼"
              : "◆"}{" "}
          {TREND_LABEL[stability.momentumTrend]}
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  {metric.label}
                </span>
                <span className="ml-2 font-mono text-[8px] text-white/20">
                  {metric.description}
                </span>
              </div>
              <span className="font-display text-sm tabular-nums text-white">
                {metric.value}
                <span className="font-mono text-[9px] text-white/25">{metric.suffix}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    metric.value >= 75
                      ? "linear-gradient(90deg, rgba(72, 187, 120, 0.7), rgba(72, 187, 120, 0.4))"
                      : metric.value >= 50
                        ? "linear-gradient(90deg, rgba(212, 165, 67, 0.7), rgba(212, 165, 67, 0.4))"
                        : "linear-gradient(90deg, rgba(255, 42, 42, 0.7), rgba(255, 42, 42, 0.4))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(metric.value, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
