"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionCardState, MissionDayLog, MissionCardStatus } from "@/lib/mission-mode/types";
import type { MissionCardConfig } from "@/lib/mission-mode/types";
import type { FoundationType } from "@/lib/foundation/types";
import { audioManager } from "@/lib/audioManager";

interface MissionCardProps {
  config: MissionCardConfig;
  state: MissionCardState;
  todaysDate: string;
  dayLog: MissionDayLog | null;
  onUpdateDayLog: (updates: Partial<MissionDayLog>) => void;
  onLogFoundation: (fType: FoundationType, subtype?: string) => void;
}

const STATUS_STYLES = {
  pending: {
    border: "border-white/10",
    bg: "bg-white/[0.02]",
    label: "Pending",
    dot: "bg-white/30",
    labelColor: "text-white/40",
  },
  "in-progress": {
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.04]",
    label: "In Progress",
    dot: "bg-amber-400",
    labelColor: "text-amber-400",
  },
  completed: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.04]",
    label: "Completed",
    dot: "bg-emerald-400",
    labelColor: "text-emerald-400",
  },
} as const;

export default function MissionCard({
  config,
  state,
  todaysDate,
  dayLog,
  onUpdateDayLog,
  onLogFoundation,
}: MissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newDrill, setNewDrill] = useState("");
  const [newTask, setNewTask] = useState("");

  const status = state.status;
  const style = STATUS_STYLES[status];

  const completedTime = state.completedAt
    ? new Date(state.completedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      })
    : null;

  // State Overrides
  const handleSetStatus = (newStatus: MissionCardStatus) => {
    audioManager.playClick();
    const currentManuals = dayLog?.manualStatuses ?? {};
    onUpdateDayLog({
      manualStatuses: {
        ...currentManuals,
        [config.id]: newStatus,
      },
    });
  };

  // Complete logs
  const handleQuickComplete = () => {
    audioManager.playClick();
    if (config.id === "builder") {
      onLogFoundation("Builder Work", "BudgetBuddy");
    } else if (config.id === "athlete") {
      onLogFoundation("Striker Work", "Full Session");
    } else if (config.id === "anchor") {
      onLogFoundation("Mental Reset", "Meditation");
    }
    handleSetStatus("completed");
  };

  // Switch Home/Park
  const handleSetLocation = (loc: "Home" | "Park") => {
    audioManager.playClick();
    onUpdateDayLog({ athleteLocation: loc });
  };

  // Drills
  const handleAddDrill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrill.trim()) return;
    audioManager.playClick();
    const currentDrills = dayLog?.athleteDrills ?? [];
    onUpdateDayLog({
      athleteDrills: [
        ...currentDrills,
        { id: Date.now().toString(), name: newDrill.trim(), completed: false },
      ],
    });
    setNewDrill("");
  };

  const handleToggleDrill = (drillId: string) => {
    audioManager.playClick();
    const currentDrills = dayLog?.athleteDrills ?? [];
    const updated = currentDrills.map((d) =>
      d.id === drillId ? { ...d, completed: !d.completed } : d
    );
    onUpdateDayLog({ athleteDrills: updated });
  };

  const handleDeleteDrill = (drillId: string) => {
    audioManager.playClick();
    const currentDrills = dayLog?.athleteDrills ?? [];
    onUpdateDayLog({ athleteDrills: currentDrills.filter((d) => d.id !== drillId) });
  };

  // Anchor Tasks
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    audioManager.playClick();
    const currentTasks = dayLog?.anchorTasks ?? [];
    onUpdateDayLog({
      anchorTasks: [
        ...currentTasks,
        { id: Date.now().toString(), name: newTask.trim(), completed: false },
      ],
    });
    setNewTask("");
  };

  const handleToggleTask = (taskId: string) => {
    audioManager.playClick();
    const currentTasks = dayLog?.anchorTasks ?? [];
    const updated = currentTasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateDayLog({ anchorTasks: updated });
  };

  const handleDeleteTask = (taskId: string) => {
    audioManager.playClick();
    const currentTasks = dayLog?.anchorTasks ?? [];
    onUpdateDayLog({ anchorTasks: currentTasks.filter((t) => t.id !== taskId) });
  };

  return (
    <motion.div
      className={`mission-card relative border ${style.border} ${style.bg} transition-all duration-300`}
      layout
    >
      {/* Side Status Indicators */}
      {status === "completed" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-emerald-400/60 shadow-[0_0_10px_rgba(72,187,120,0.3)]" />
      )}
      {status === "in-progress" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-amber-400/60 shadow-[0_0_10px_rgba(212,165,67,0.3)]" />
      )}

      <div className="p-4">
        {/* Clickable Header Area to Toggle Collapse */}
        <div
          onClick={() => {
            audioManager.playClick();
            setExpanded(!expanded);
          }}
          className="flex cursor-pointer items-start justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg leading-none">{config.icon}</span>
            <div>
              <h3 className="font-display text-xs uppercase tracking-wider text-white">
                {config.label}
              </h3>
              <p className="font-mono text-[9px] text-white/30 truncate max-w-[150px] sm:max-w-none">
                {dayLog?.builderGoal && config.id === "builder"
                  ? `Goal: ${dayLog.builderGoal}`
                  : config.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
            <span className={`font-mono text-[10px] uppercase tracking-wider ${style.labelColor}`}>
              {style.label}
            </span>
            <span className="text-white/20 text-[9px] font-mono select-none ml-1">
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Info & Metrics Row */}
        <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
              Score
            </p>
            <p className="font-display text-sm tabular-nums text-white">
              {state.score}
              <span className="ml-0.5 font-mono text-[9px] text-white/30">/ {state.maxScore}</span>
            </p>
          </div>

          {completedTime && (
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
                Done
              </p>
              <p className="font-mono text-xs tabular-nums text-emerald-400/80">
                {completedTime}
              </p>
            </div>
          )}

          {config.id === "athlete" && dayLog?.athleteLocation && (
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
                Location
              </p>
              <p className="font-mono text-xs text-amber-400/80">
                {dayLog.athleteLocation}
              </p>
            </div>
          )}
        </div>

        {/* Expandable Editor Dashboard */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
                {/* 1. BUILDER EDITABLE PANEL */}
                {config.id === "builder" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[9px] text-white/40 uppercase">
                        Today&apos;s Builder Goal
                      </label>
                      <input
                        type="text"
                        value={dayLog?.builderGoal ?? ""}
                        onChange={(e) => onUpdateDayLog({ builderGoal: e.target.value })}
                        placeholder="Define today's focus..."
                        className="w-full border border-white/8 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-white outline-none focus:border-amber-400/30"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetStatus("in-progress")}
                        className={`flex-1 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          status === "in-progress"
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Start ]
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickComplete}
                        className={`flex-1 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          status === "completed"
                            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Complete ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus("pending")}
                        className="border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/40 hover:border-white/20"
                      >
                        [ Reset ]
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. ATHLETE EDITABLE PANEL */}
                {config.id === "athlete" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetLocation("Home")}
                        className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          dayLog?.athleteLocation === "Home"
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Home ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetLocation("Park")}
                        className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          dayLog?.athleteLocation === "Park"
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Park ]
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickComplete}
                        className="border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400 hover:border-emerald-400/20"
                      >
                        [ Complete ]
                      </button>
                    </div>

                    {/* Drill List Manager */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <p className="font-mono text-[9px] text-white/40 uppercase">
                        Drills List ({dayLog?.athleteDrills?.length ?? 0})
                      </p>

                      <form onSubmit={handleAddDrill} className="flex gap-1.5">
                        <input
                          type="text"
                          value={newDrill}
                          onChange={(e) => setNewDrill(e.target.value)}
                          placeholder="Add new drill objective..."
                          className="flex-1 border border-white/8 bg-black/40 px-2.5 py-1 font-mono text-[9px] text-white outline-none focus:border-amber-400/30"
                        />
                        <button
                          type="submit"
                          className="border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[9px] text-white/60 hover:text-white"
                        >
                          Add
                        </button>
                      </form>

                      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                        {dayLog?.athleteDrills?.map((drill) => (
                          <div
                            key={drill.id}
                            className="flex items-center justify-between border border-white/5 bg-black/20 px-2 py-1"
                          >
                            <label className="flex items-center gap-2 font-mono text-[10px] text-white/70 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={drill.completed}
                                onChange={() => handleToggleDrill(drill.id)}
                                className="accent-amber-400"
                              />
                              <span className={drill.completed ? "line-through text-white/30" : ""}>
                                {drill.name}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteDrill(drill.id)}
                              className="text-red-400/50 hover:text-red-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ANCHOR EDITABLE PANEL */}
                {config.id === "anchor" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetStatus("in-progress")}
                        className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          status === "in-progress"
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Start ]
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickComplete}
                        className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                          status === "completed"
                            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                            : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                        }`}
                      >
                        [ Complete ]
                      </button>
                    </div>

                    {/* Task List Manager */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <p className="font-mono text-[9px] text-white/40 uppercase">
                        Anchor Tasks ({dayLog?.anchorTasks?.length ?? 0})
                      </p>

                      <form onSubmit={handleAddTask} className="flex gap-1.5">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Add new task..."
                          className="flex-1 border border-white/8 bg-black/40 px-2.5 py-1 font-mono text-[9px] text-white outline-none focus:border-amber-400/30"
                        />
                        <button
                          type="submit"
                          className="border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[9px] text-white/60 hover:text-white"
                        >
                          Add
                        </button>
                      </form>

                      <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                        {dayLog?.anchorTasks?.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between border border-white/5 bg-black/20 px-2 py-1"
                          >
                            <label className="flex items-center gap-2 font-mono text-[10px] text-white/70 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                className="accent-amber-400"
                              />
                              <span className={task.completed ? "line-through text-white/30" : ""}>
                                {task.name}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-400/50 hover:text-red-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtask Status View */}
                {state.subtasks.filter((t) => t.id !== "builder_goal").length > 0 && (
                  <div className="border-t border-white/5 pt-3">
                    <p className="font-mono text-[8px] uppercase tracking-wider text-white/20 mb-1.5">
                      Foundation Logs
                    </p>
                    <div className="space-y-1">
                      {state.subtasks
                        .filter((t) => t.id !== "builder_goal")
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 font-mono text-[9px] text-white/50"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>{task.label}</span>
                            {task.completedAt && (
                              <span className="ml-auto text-[8px] text-white/25">
                                {new Date(task.completedAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Asia/Kolkata",
                                })}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
