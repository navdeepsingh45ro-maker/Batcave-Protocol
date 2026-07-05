"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionConfig } from "@/lib/mission-mode/types";
import type { ISODate } from "@/lib/foundation/types";
import {
  isMissionActive,
  getActiveMission,
  getActiveMode,
  updateActiveMissionConfig,
  deactivateMission,
  getMissionDaysRemaining,
} from "@/lib/mission-mode/modeManager";
import { AVAILABLE_MISSIONS } from "@/lib/mission-mode/config";
import MissionHistoryPanel from "./MissionHistoryPanel";
import { audioManager } from "@/lib/audioManager";

interface MissionControlDrawerProps {
  todaysDate: ISODate;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  score: number;
  rating: string;
}

export default function MissionControlDrawer({
  todaysDate,
  isOpen,
  onClose,
  onRefresh,
  score,
  rating,
}: MissionControlDrawerProps) {
  const mission = getActiveMission();
  const missionActive = isMissionActive();

  // Local editing states for Mission details
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [lessons, setLessons] = useState("");

  // Sync edits when active mission changes
  useEffect(() => {
    if (mission) {
      setName(mission.customName ?? mission.name);
      setObjective(mission.customObjective ?? mission.objective);
      setEndDate(mission.customEndDate ?? mission.endDate);
      setNotes(mission.missionNotes ?? "");
    }
  }, [mission, isOpen]);

  // Auto-saves when inputs change
  const handleUpdate = useCallback(
    (field: string, value: string) => {
      if (!mission) return;
      if (field === "name") {
        setName(value);
        updateActiveMissionConfig({ customName: value });
      } else if (field === "objective") {
        setObjective(value);
        updateActiveMissionConfig({ customObjective: value });
      } else if (field === "endDate") {
        setEndDate(value);
        updateActiveMissionConfig({ customEndDate: value as ISODate });
      } else if (field === "notes") {
        setNotes(value);
        updateActiveMissionConfig({ missionNotes: value });
      }
      onRefresh();
    },
    [mission, onRefresh]
  );

  const handleDeactivate = useCallback(() => {
    audioManager.playClick();
    deactivateMission(lessons, "completed");
    setShowDeactivateConfirm(false);
    setLessons("");
    onClose();
    onRefresh();
  }, [lessons, onClose, onRefresh]);

  const handleActivateTemplate = useCallback(
    (template: MissionConfig) => {
      audioManager.playClick();
      // Reset active state with the template
      const state = {
        mode: template.mode,
        activeMission: template,
        activatedAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("batcave.mission.active", JSON.stringify(state));
      }
      onRefresh();
    },
    [onRefresh]
  );

  const daysRemaining = mission ? getMissionDaysRemaining(mission, todaysDate) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Right Drawer */}
          <motion.div
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-graphite p-6 text-frost shadow-console sm:max-w-md"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Accent border top-left */}
            <div className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-amber-500/40" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400">
                  System Configuration
                </p>
                <h3 className="font-display text-lg uppercase text-white">⚙ Mission Control</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase text-white/50 hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
              {/* Mission active state */}
              {missionActive && mission ? (
                <>
                  {/* Status, Score & Countdown */}
                  <div className="border border-amber-400/20 bg-amber-400/[0.02] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">
                        Active Mission
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                        ● Launch Mode Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
                          Current Score
                        </p>
                        <p className="font-display text-xl text-white">
                          {score}
                          <span className="font-mono text-xs text-white/30">/100</span>
                        </p>
                        <p className="font-mono text-[9px] text-white/40 uppercase">{rating}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
                          Countdown
                        </p>
                        <p className="font-display text-xl text-amber-400">{daysRemaining}</p>
                        <p className="font-mono text-[9px] text-white/40 uppercase">
                          Days Remaining
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mission Details — EDITABLE FIELDS (Auto-save) */}
                  <div className="space-y-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 border-b border-white/5 pb-1">
                      Edit Mission Details
                    </p>

                    {/* Mission Name */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-white/40 uppercase">
                        Mission Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleUpdate("name", e.target.value)}
                        className="w-full border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </div>

                    {/* Objective */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-white/40 uppercase">
                        Mission Objective
                      </label>
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleUpdate("objective", e.target.value)}
                        className="w-full border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-white/40 uppercase">
                        Countdown Target Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="text"
                        value={endDate}
                        onChange={(e) => handleUpdate("endDate", e.target.value)}
                        placeholder="e.g. 2026-07-09"
                        className="w-full border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-white/40 uppercase">
                        Mission Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => handleUpdate("notes", e.target.value)}
                        rows={3}
                        placeholder="Define constraints, guidelines, strategy..."
                        className="w-full resize-none border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </div>
                  </div>

                  {/* Deactivate settings */}
                  <div className="border-t border-white/5 pt-4">
                    {!showDeactivateConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeactivateConfirm(true)}
                        className="w-full border border-red-500/20 bg-red-500/[0.02] py-2.5 font-display text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                      >
                        Deactivate Mission Mode
                      </button>
                    ) : (
                      <div className="space-y-2 border border-red-500/20 bg-red-500/[0.02] p-3">
                        <p className="font-mono text-[10px] text-red-400 uppercase">
                          Are you sure you want to end this mission?
                        </p>
                        <input
                          type="text"
                          value={lessons}
                          onChange={(e) => setLessons(e.target.value)}
                          placeholder="Lessons learned (optional)..."
                          className="w-full border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] text-white/60 outline-none focus:border-red-500/30"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeactivate}
                            className="flex-1 border border-red-500/40 bg-red-500/10 py-1.5 font-display text-[10px] uppercase text-red-400 hover:bg-red-500/15"
                          >
                            End Mission
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeactivateConfirm(false)}
                            className="border border-white/10 bg-white/[0.02] px-3 py-1.5 font-display text-[10px] uppercase text-white/30 hover:text-white/50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="border border-white/8 bg-black/20 p-4 text-center">
                    <p className="font-mono text-[11px] text-white/40">
                      Normal operating state active. No active mission.
                    </p>
                  </div>

                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 border-b border-white/5 pb-1">
                    Select Mode Template
                  </p>
                  <div className="space-y-2">
                    {AVAILABLE_MISSIONS.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleActivateTemplate(template)}
                        className="w-full border border-white/8 bg-white/[0.02] p-3 text-left hover:border-amber-400/40 hover:bg-amber-400/[0.04]"
                      >
                        <p className="font-display text-xs uppercase tracking-wider text-white">
                          {template.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-white/30 truncate">
                          {template.objective}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* History Archive */}
              <div className="border-t border-white/8 pt-4">
                <MissionHistoryPanel refreshKey={Math.random()} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
