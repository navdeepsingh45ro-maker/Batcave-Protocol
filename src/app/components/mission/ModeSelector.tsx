"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionConfig, BatcaveMode } from "@/lib/mission-mode/types";
import type { ISODate } from "@/lib/foundation/types";
import {
  isMissionActive,
  getActiveMission,
  getActiveMode,
  activateMission,
  deactivateMission,
} from "@/lib/mission-mode/modeManager";
import { AVAILABLE_MISSIONS } from "@/lib/mission-mode/config";
import { audioManager } from "@/lib/audioManager";

interface ModeSelectorProps {
  todaysDate: ISODate;
  onModeChange: () => void;
}

const MODE_LABELS: Record<BatcaveMode, string> = {
  normal: "Normal",
  launch: "Launch",
  tournament: "Tournament",
  exam: "Exam",
  recovery: "Recovery",
};

export default function ModeSelector({ todaysDate, onModeChange }: ModeSelectorProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [lessons, setLessons] = useState("");

  const mode = getActiveMode();
  const mission = getActiveMission();
  const missionActive = isMissionActive();

  const handleActivate = useCallback(
    (config: MissionConfig) => {
      audioManager.playClick();
      activateMission(config);
      setShowPanel(false);
      onModeChange();
    },
    [onModeChange]
  );

  const handleDeactivate = useCallback(() => {
    audioManager.playClick();
    deactivateMission(lessons, "completed");
    setShowDeactivateConfirm(false);
    setShowPanel(false);
    setLessons("");
    onModeChange();
  }, [lessons, onModeChange]);

  return (
    <div className="relative">
      {/* Mode Badge Button */}
      <button
        type="button"
        onClick={() => {
          audioManager.playClick();
          setShowPanel(!showPanel);
        }}
        className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-[10px] uppercase tracking-wider transition-all ${
          missionActive
            ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/15"
            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            missionActive ? "bg-amber-400 animate-pulse" : "bg-white/30"
          }`}
        />
        {MODE_LABELS[mode]} Mode
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-40 mt-2 w-72 border border-white/10 bg-graphite shadow-console"
          >
            {/* Corner accents */}
            <div className="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-amber-400/30" />

            <div className="p-4 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                Batcave Mode
              </p>

              {missionActive && mission ? (
                <>
                  {/* Active Mission Info */}
                  <div className="border border-amber-400/20 bg-amber-400/[0.04] p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                      </span>
                      <p className="font-display text-xs uppercase tracking-wider text-amber-400">
                        {mission.name}
                      </p>
                    </div>
                    <p className="font-mono text-[10px] text-white/40">
                      {mission.objective}
                    </p>
                    <p className="font-mono text-[9px] text-white/25">
                      {mission.startDate} → {mission.endDate}
                    </p>
                  </div>

                  {/* Deactivate */}
                  {!showDeactivateConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="w-full border border-white/10 bg-white/[0.02] px-3 py-2 font-display text-[10px] uppercase tracking-wider text-white/40 transition-all hover:border-white/20 hover:text-white/60"
                    >
                      End Mission
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={lessons}
                        onChange={(e) => setLessons(e.target.value)}
                        placeholder="Lessons learned (optional)..."
                        className="w-full border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] text-white/60 placeholder-white/20 outline-none focus:border-amber-400/30"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDeactivate}
                          className="flex-1 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-amber-400 hover:bg-amber-400/15"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeactivateConfirm(false)}
                          className="border border-white/10 bg-white/[0.02] px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-white/30 hover:text-white/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Available Missions */}
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/20">
                    Available Missions
                  </p>
                  {AVAILABLE_MISSIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleActivate(m)}
                      className="w-full border border-white/8 bg-white/[0.02] p-3 text-left transition-all hover:border-amber-400/20 hover:bg-amber-400/[0.03]"
                    >
                      <p className="font-display text-xs uppercase tracking-wider text-white">
                        {m.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] text-white/30">
                        {m.objective} · {m.startDate} → {m.endDate}
                      </p>
                    </button>
                  ))}

                  <p className="font-mono text-[8px] text-white/15 text-center">
                    Current Mode: {MODE_LABELS[mode]}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away backdrop */}
      {showPanel && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowPanel(false);
            setShowDeactivateConfirm(false);
          }}
        />
      )}
    </div>
  );
}
