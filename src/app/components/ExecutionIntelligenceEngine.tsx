"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ISODate } from "@/lib/foundation/types";
import { executionIntelligenceEngine } from "@/lib/intelligence-engine";

interface Props {
  todaysDate: ISODate;
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
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function ExecutionIntelligenceEngine({ todaysDate }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    if (!mounted) return null;
    const exec = executionIntelligenceEngine.getTodaysExecution(todaysDate);
    const pattern = executionIntelligenceEngine.getPatternDiscovery();
    const bottleneck = executionIntelligenceEngine.getBottleneck(todaysDate);
    const momentum = executionIntelligenceEngine.getMomentum(todaysDate);
    const coach = executionIntelligenceEngine.getCoachNote(pattern, bottleneck);

    return { exec, pattern, bottleneck, momentum, coach };
  }, [todaysDate, mounted]);

  if (!mounted || !data) return null;

  const { exec, pattern, bottleneck, momentum, coach } = data;

  const hasInsights = pattern || bottleneck || momentum || coach;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
    >
      {/* CARD 1: TODAY'S EXECUTION */}
      <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 flex flex-col justify-between min-h-[140px]">
        <div className="mb-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-frost/80 mb-0.5">Execution</p>
          <h3 className="font-display text-sm uppercase text-white/90">Today's Briefing</h3>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-white/40">Completion</span>
            <span className="text-emerald-400">{exec.builderScore}% {exec.strikerScore}% {exec.kingScore}% {exec.guardianScore}%</span>
          </div>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-white/40">Deep Work</span>
            <span className="text-frost">{Math.round(exec.deepWorkTimeMs / 60000)} MIN</span>
          </div>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-white/40">Focus Sessions</span>
            <span className="text-white/80">{exec.focusSessionsCount}</span>
          </div>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span className="text-white/40">Current Streak</span>
            <span className="text-warning/80">{exec.currentStreakDays} DAYS</span>
          </div>
        </div>
      </motion.div>

      {!hasInsights ? (
        <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 md:col-span-1 lg:col-span-2 xl:col-span-4 flex flex-col justify-center items-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-frost/60 mb-2">
            No Insight Today
          </p>
          <p className="font-mono text-xs text-white/40 max-w-sm leading-relaxed">
            No significant behavioural changes detected today.
            <br />
            Continue executing your current routine.
          </p>
        </motion.div>
      ) : (
        <>
          {/* CARD 2: PATTERN DISCOVERY */}
          {pattern && (
            <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 flex flex-col justify-between min-h-[140px]">
              <div className="mb-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/80 mb-0.5">Discovery</p>
                <h3 className="font-display text-sm uppercase text-white/90">Pattern Identified</h3>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-white/80 leading-snug">
                  {pattern.description}
                </p>
                <div className="flex gap-4 font-mono text-[9px] uppercase tracking-wider text-white/40">
                  <span>Evidence {pattern.evidence}</span>
                  <span className="text-emerald-400/80">Conf {pattern.confidence}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* CARD 3: BOTTLENECKS */}
          {bottleneck && (
            <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 flex flex-col justify-between min-h-[140px]">
              <div className="mb-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-signal/80 mb-0.5">Obstacle</p>
                <h3 className="font-display text-sm uppercase text-white/90">Primary Bottleneck</h3>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-white/80 leading-snug">
                  {bottleneck.description}
                </p>
                <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  Evidence {bottleneck.evidence}
                </div>
              </div>
            </motion.div>
          )}

          {/* CARD 4: MOMENTUM */}
          {momentum && (
            <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 flex flex-col justify-between min-h-[140px]">
              <div className="mb-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-frost/80 mb-0.5">Growth</p>
                <h3 className="font-display text-sm uppercase text-white/90">Momentum</h3>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-white/80 leading-snug">
                  {momentum.description}
                </p>
                <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                  Evidence {momentum.evidence}
                </div>
              </div>
            </motion.div>
          )}

          {/* CARD 5: COACH'S NOTE */}
          {coach && (
            <motion.div variants={itemVariants} className="border border-white/10 bg-black/60 p-4 flex flex-col justify-between min-h-[140px] xl:col-span-2">
              <div className="mb-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-warning/80 mb-0.5">Directive</p>
                <h3 className="font-display text-sm uppercase text-white/90">Coach's Note</h3>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Observation</p>
                <p className="font-mono text-xs text-warning/90 leading-snug">
                  {coach.observation}
                </p>
                <div className="border-t border-white/10 pt-2 mt-2" />
                <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Recommendation</p>
                <p className="font-mono text-xs text-white/90 leading-snug">
                  {coach.recommendation}
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
