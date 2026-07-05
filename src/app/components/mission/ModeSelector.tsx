"use client";

import { useMemo } from "react";
import type { BatcaveMode } from "@/lib/mission-mode/types";
import {
  isMissionActive,
  getActiveMode,
} from "@/lib/mission-mode/modeManager";
import { audioManager } from "@/lib/audioManager";

interface ModeSelectorProps {
  todaysDate: string;
  onOpenDrawer: () => void;
}

const MODE_LABELS: Record<BatcaveMode, string> = {
  normal: "Normal Mode",
  launch: "Launch Mode Active",
  tournament: "Tournament Mode Active",
  exam: "Exam Mode Active",
  recovery: "Recovery Mode Active",
};

export default function ModeSelector({ todaysDate, onOpenDrawer }: ModeSelectorProps) {
  const mode = getActiveMode();
  const missionActive = isMissionActive();

  const badgeText = useMemo(() => {
    return MODE_LABELS[mode] ?? `${mode.toUpperCase()} MODE`;
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => {
        audioManager.playClick();
        onOpenDrawer();
      }}
      className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-[10px] uppercase tracking-wider transition-all select-none ${
        missionActive
          ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/15 hover:border-amber-400/60"
          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          missionActive ? "bg-amber-400 animate-pulse" : "bg-white/30"
        }`}
      />
      ● {badgeText}
    </button>
  );
}
