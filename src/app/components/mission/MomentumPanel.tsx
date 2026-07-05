"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MomentumFlags, MissionStability } from "@/lib/mission-mode/types";
import { suggestCorrectiveAction } from "@/lib/mission-mode/momentumEngine";

interface MomentumPanelProps {
  flags: MomentumFlags;
  stability: MissionStability | null;
}

const TREND_ICON: Record<string, string> = {
  rising: "▲",
  stable: "◆",
  falling: "▼",
};

const TREND_COLOR: Record<string, string> = {
  rising: "text-emerald-400",
  stable: "text-amber-400",
  falling: "text-red-400",
};

export default function MomentumPanel({ flags, stability }: MomentumPanelProps) {
  const correctiveAction = flags.momentumRisk
    ? suggestCorrectiveAction(flags)
    : null;

  return (
    <div className="space-y-3">
      {/* Momentum Risk Alert */}
      <AnimatePresence>
        {flags.momentumRisk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="momentum-risk border border-amber-400/30 bg-amber-400/[0.04] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
              </span>
              <p className="font-display text-xs uppercase tracking-wider text-amber-400">
                Momentum Risk
              </p>
            </div>

            <p className="font-mono text-[11px] leading-relaxed text-white/60">
              {flags.riskReason}
            </p>

            {/* Reflection prompts */}
            <div className="mt-3 space-y-2 border-t border-amber-400/10 pt-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-amber-400/60">
                System Diagnostics
              </p>
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] text-white/40">
                  ▸ What interrupted the system?
                </p>
                <p className="font-mono text-[10px] text-white/40">
                  ▸ What change prevents this tomorrow?
                </p>
              </div>
            </div>

            {/* Corrective action */}
            {correctiveAction && (
              <div className="mt-3 border-t border-amber-400/10 pt-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                  Recommended Action
                </p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-amber-400/80">
                  {correctiveAction}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stability Metrics */}
      {stability && (
        <div className="border border-white/8 bg-black/40 p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-3">
            Mission Stability
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                Stability
              </p>
              <p className="mt-0.5 font-display text-lg tabular-nums text-white">
                {stability.stabilityPercent}
                <span className="font-mono text-[9px] text-white/25">%</span>
              </p>
            </div>

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                Completion
              </p>
              <p className="mt-0.5 font-display text-lg tabular-nums text-white">
                {stability.rollingCompletionPercent}
                <span className="font-mono text-[9px] text-white/25">%</span>
              </p>
            </div>

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                Consistency
              </p>
              <p className="mt-0.5 font-display text-lg tabular-nums text-white">
                {stability.consistencyIndex}
                <span className="font-mono text-[9px] text-white/25">/100</span>
              </p>
            </div>

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                Momentum
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1.5 font-display text-sm uppercase ${
                  TREND_COLOR[stability.momentumTrend]
                }`}
              >
                <span className="text-xs">{TREND_ICON[stability.momentumTrend]}</span>
                {stability.momentumTrend}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
