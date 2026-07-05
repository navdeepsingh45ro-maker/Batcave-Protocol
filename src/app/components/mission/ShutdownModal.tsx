"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionConfig, ShutdownReflection } from "@/lib/mission-mode/types";
import type { ISODate } from "@/lib/foundation/types";

interface ShutdownModalProps {
  config: MissionConfig;
  todaysDate: ISODate;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reflection: ShutdownReflection) => void;
}

export default function ShutdownModal({
  config,
  todaysDate,
  isOpen,
  onClose,
  onSubmit,
}: ShutdownModalProps) {
  const [builderForward, setBuilderForward] = useState<boolean | null>(null);
  const [athleteForward, setAthleteForward] = useState<boolean | null>(null);
  const [anchorComplete, setAnchorComplete] = useState<boolean | null>(null);
  const [tomorrowTask, setTomorrowTask] = useState("");

  const canSubmit =
    builderForward !== null &&
    athleteForward !== null &&
    anchorComplete !== null &&
    tomorrowTask.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    const reflection: ShutdownReflection = {
      builderForward: builderForward!,
      athleteForward: athleteForward!,
      anchorComplete: anchorComplete!,
      tomorrowFirstTask: tomorrowTask.trim(),
      timestamp: new Date().toISOString(),
    };

    onSubmit(reflection);
  }, [builderForward, athleteForward, anchorComplete, tomorrowTask, canSubmit, onSubmit]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="shutdown-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg border border-white/10 bg-graphite shadow-console"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Corner accents */}
            <div className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-amber-400/40" />
            <div className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-amber-400/20" />

            <div className="p-6">
              {/* Header */}
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
                  Evening Shutdown Protocol
                </p>
                <h3 className="mt-1 font-display text-lg uppercase text-white">
                  Mission Shutdown
                </h3>
                <p className="mt-1 font-mono text-[10px] text-white/30">
                  {todaysDate} · {config.name}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {/* Builder Forward */}
                <div className="space-y-2">
                  <p className="font-mono text-xs text-white/60">
                    Did I move Builder forward?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderForward(true)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        builderForward === true
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderForward(false)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        builderForward === false
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Athlete Forward */}
                <div className="space-y-2">
                  <p className="font-mono text-xs text-white/60">
                    Did I move Athlete forward?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAthleteForward(true)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        athleteForward === true
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAthleteForward(false)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        athleteForward === false
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Anchor Complete */}
                <div className="space-y-2">
                  <p className="font-mono text-xs text-white/60">
                    Did I complete my Anchor?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAnchorComplete(true)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        anchorComplete === true
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnchorComplete(false)}
                      className={`flex-1 border px-3 py-2 font-display text-xs uppercase tracking-wider transition-all ${
                        anchorComplete === false
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Tomorrow's First Builder Task */}
                <div className="space-y-2">
                  <p className="font-mono text-xs text-white/60">
                    What is tomorrow&apos;s first Builder task?
                  </p>
                  <input
                    type="text"
                    value={tomorrowTask}
                    onChange={(e) => setTomorrowTask(e.target.value)}
                    placeholder="e.g., Fix auth flow in BudgetBuddy..."
                    className="w-full border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-xs text-white/80 placeholder-white/20 outline-none transition-all focus:border-amber-400/40"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex-1 border px-4 py-2.5 font-display text-xs uppercase tracking-wider transition-all ${
                    canSubmit
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/15"
                      : "border-white/8 bg-white/[0.02] text-white/20 cursor-not-allowed"
                  }`}
                >
                  Complete Shutdown
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-white/8 bg-white/[0.02] px-4 py-2.5 font-display text-xs uppercase tracking-wider text-white/40 transition-all hover:border-white/15 hover:text-white/60"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
