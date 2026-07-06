"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionConfig, MissionDayLog, MissionCardStatus } from "@/lib/mission-mode/types";
import type { FoundationType, ActivityDefinition, ActivityLogEntry, ISODate } from "@/lib/foundation/types";
import { localFoundationRepository, FOUNDATION_DEFINITIONS } from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

interface DailyOperationsCardProps {
  cardId: "builder" | "athlete" | "reset" | "guardian";
  title: string;
  icon: string;
  todaysDate: ISODate;
  activeMission: MissionConfig | null;
  dayLog: MissionDayLog | null;
  activities: ActivityDefinition[];
  activityLogs: ActivityLogEntry[];
  constraintStatus: "CLEAN" | "FAILED" | "PENDING";
  onUpdateDayLog: (updates: Partial<MissionDayLog>) => void;
  onRefresh: () => void;
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
    border: "border-amber-400/40 bg-amber-400/[0.04]",
    bg: "bg-amber-400/[0.04]",
    label: "In Progress",
    dot: "bg-amber-400",
    labelColor: "text-amber-400",
  },
  completed: {
    border: "border-emerald-500/30 bg-emerald-500/[0.03]",
    bg: "bg-emerald-500/[0.03]",
    label: "Completed",
    dot: "bg-emerald-400",
    labelColor: "text-emerald-400",
  },
} as const;

export default function DailyOperationsCard({
  cardId,
  title,
  icon,
  todaysDate,
  activeMission,
  dayLog,
  activities,
  activityLogs,
  constraintStatus,
  onUpdateDayLog,
  onRefresh,
}: DailyOperationsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newDrill, setNewDrill] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [logDurations, setLogDurations] = useState<Record<string, number>>({});

  // 1. Determine local completion/status if no mission active
  const mappedFoundationTypes = useMemo(() => {
    if (cardId === "builder") return ["Builder Work", "Knowledge Intake"] as FoundationType[];
    if (cardId === "athlete") return ["Striker Work"] as FoundationType[];
    if (cardId === "reset") return ["Mental Reset"] as FoundationType[];
    return ["Sleep Protection"] as FoundationType[];
  }, [cardId]);

  // Today's logs for this card
  const todayLogs = useMemo(() => {
    return activityLogs.filter(
      (log) => log.date === todaysDate && mappedFoundationTypes.includes(log.foundation)
    );
  }, [activityLogs, todaysDate, mappedFoundationTypes]);

  // Active definition/types
  const activeDefs = useMemo(() => {
    return activities.filter((act) => mappedFoundationTypes.includes(act.foundation) && !act.archived);
  }, [activities, mappedFoundationTypes]);

  const archivedDefs = useMemo(() => {
    return activities.filter((act) => mappedFoundationTypes.includes(act.foundation) && act.archived);
  }, [activities, mappedFoundationTypes]);

  // Card status
  const cardState = useMemo(() => {
    // If mission active, try to fetch cardState from dayLog
    if (activeMission && dayLog) {
      const match = dayLog.cardStates.find((cs) => cs.cardId === cardId);
      if (match) return match;
    }
    // Normal / Mission Fallback
    const hasLog = todayLogs.length > 0;
    const isNoPornClean = constraintStatus === "CLEAN";

    let status: MissionCardStatus = "pending";
    if (dayLog?.manualStatuses?.[cardId]) {
      status = dayLog.manualStatuses[cardId];
    } else if (cardId === "guardian") {
      status = (hasLog && isNoPornClean) ? "completed" : hasLog ? "in-progress" : "pending";
    } else {
      status = hasLog ? "completed" : "pending";
    }

    return {
      status,
      score: hasLog ? 1 : 0,
      maxScore: 1,
    };
  }, [activeMission, dayLog, cardId, todayLogs, constraintStatus]);

  const status = cardState.status;
  const style = STATUS_STYLES[status];

  // Actions
  const handleSetStatus = (newStatus: MissionCardStatus) => {
    audioManager.playClick();
    const currentManuals = dayLog?.manualStatuses ?? {};
    onUpdateDayLog({
      manualStatuses: {
        ...currentManuals,
        [cardId]: newStatus,
      },
    });
  };

  const handleQuickComplete = () => {
    audioManager.playClick();
    const fType = mappedFoundationTypes[0];
    const def = activeDefs[0] || activities.find((a) => a.foundation === fType);
    
    if (def) {
      localFoundationRepository.addActivityLog({
        date: todaysDate,
        activityId: def.id,
        durationMinutes: 30,
      });
      audioManager.playFoundationComplete();
    }
    handleSetStatus("completed");
    onRefresh();
  };

  // ── Specific logic for Builder ──
  const builderGoalText = dayLog?.builderGoal ?? "";

  // ── Specific logic for Athlete ──
  const athleteLocation = dayLog?.athleteLocation ?? "Home";
  const athleteGoalText = (dayLog as any)?.athleteGoal ?? "";

  const handleSetLocation = (loc: "Home" | "Park") => {
    audioManager.playClick();
    onUpdateDayLog({ athleteLocation: loc });
  };

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

  // ── Specific logic for Reset (Meditation, Journal, Sleep Checkboxes) ──
  const isMeditationLogged = todayLogs.some((l) => {
    const act = activities.find((a) => a.id === l.activityId);
    return act?.name === "Meditation";
  });
  const isJournalLogged = todayLogs.some((l) => {
    const act = activities.find((a) => a.id === l.activityId);
    return act?.name === "Reflection" || act?.name === "Journal";
  });
  const isSleepLogged = activityLogs.some((l) => l.date === todaysDate && l.foundation === "Sleep Protection");

  const handleToggleResetCheckbox = (type: "Meditation" | "Journal" | "Sleep") => {
    audioManager.playClick();
    if (type === "Meditation") {
      if (isMeditationLogged) {
        // remove Meditation log
        const log = todayLogs.find((l) => {
          const act = activities.find((a) => a.id === l.activityId);
          return act?.name === "Meditation";
        });
        if (log) localFoundationRepository.deleteActivityLog(log.id);
      } else {
        // add Meditation log
        const def = activities.find((a) => a.foundation === "Mental Reset" && a.name === "Meditation");
        if (def) {
          localFoundationRepository.addActivityLog({ date: todaysDate, activityId: def.id, durationMinutes: 20 });
        }
      }
    } else if (type === "Journal") {
      if (isJournalLogged) {
        const log = todayLogs.find((l) => {
          const act = activities.find((a) => a.id === l.activityId);
          return act?.name === "Reflection" || act?.name === "Journal";
        });
        if (log) localFoundationRepository.deleteActivityLog(log.id);
      } else {
        const def = activities.find((a) => a.foundation === "Mental Reset" && (a.name === "Reflection" || a.name === "Journal"));
        if (def) {
          localFoundationRepository.addActivityLog({ date: todaysDate, activityId: def.id, durationMinutes: 15 });
        }
      }
    } else if (type === "Sleep") {
      if (isSleepLogged) {
        const log = activityLogs.find((l) => l.date === todaysDate && l.foundation === "Sleep Protection");
        if (log) localFoundationRepository.deleteActivityLog(log.id);
      } else {
        const def = activities.find((a) => a.foundation === "Sleep Protection");
        if (def) {
          localFoundationRepository.addActivityLog({ date: todaysDate, activityId: def.id, durationMinutes: 480 });
        }
      }
    }
    onRefresh();
  };

  // ── Specific logic for Guardian No Porn Constraint ──
  const handleConstraintLog = (subtype: "Yes" | "No") => {
    audioManager.playClick();
    localFoundationRepository.upsertConstraintLog({
      date: todaysDate,
      constraint: "No Porn",
      subtype,
    });
    onRefresh();
  };

  // ── Custom Activity CRUD ──
  const handleLogActivity = (activityId: string, fType: FoundationType) => {
    audioManager.playClick();
    const duration = logDurations[activityId] || 30;
    localFoundationRepository.addActivityLog({
      date: todaysDate,
      activityId,
      durationMinutes: duration,
    });
    audioManager.playFoundationComplete();
    onRefresh();
  };

  const handleDeleteLog = (logId: string) => {
    audioManager.playClick();
    localFoundationRepository.deleteActivityLog(logId);
    onRefresh();
  };

  const handleAddActivity = (fType: FoundationType) => {
    audioManager.playClick();
    const name = newActivityName.trim();
    if (!name) return;
    localFoundationRepository.createActivity({
      foundation: fType,
      name,
    });
    setNewActivityName("");
    onRefresh();
  };

  const handleStartRename = (id: string, currentName: string) => {
    audioManager.playClick();
    setEditingActivityId(id);
    setEditingNameValue(currentName);
  };

  const handleSaveRename = () => {
    if (!editingActivityId || !editingNameValue.trim()) return;
    audioManager.playClick();
    localFoundationRepository.updateActivity({
      id: editingActivityId,
      name: editingNameValue.trim(),
    });
    setEditingActivityId(null);
    setEditingNameValue("");
    onRefresh();
  };

  const handleToggleArchive = (id: string, isArchived: boolean) => {
    audioManager.playClick();
    localFoundationRepository.updateActivity({
      id,
      archived: isArchived,
    });
    onRefresh();
  };

  const handleDeleteActivity = (id: string) => {
    audioManager.playClick();
    localFoundationRepository.deleteActivity(id);
    onRefresh();
  };

  // Check if Builder/Athlete is active for glows/highlighting
  const isBuilderActive = cardId === "builder" && status === "in-progress";
  const isAthleteActive = cardId === "athlete" && status === "in-progress";

  const glowStyles = isBuilderActive
    ? "shadow-[0_0_20px_rgba(251,191,36,0.3)] border-amber-400/80 bg-amber-400/[0.06]"
    : isAthleteActive
      ? "shadow-[0_0_20px_rgba(251,191,36,0.2)] border-amber-400 bg-amber-400/[0.06] scale-[1.01]"
      : `${style.border} ${style.bg}`;

  return (
    <motion.div
      className={`relative border p-4 transition-all duration-300 ${glowStyles}`}
      layout
    >
      {/* Side Status Indicators */}
      {status === "completed" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-emerald-400/60 shadow-[0_0_10px_rgba(72,187,120,0.3)]" />
      )}
      {status === "in-progress" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-amber-400/60 shadow-[0_0_10px_rgba(212,165,67,0.3)]" />
      )}

      {/* Header section (Clickable to Expand) */}
      <div
        onClick={() => {
          audioManager.playClick();
          setExpanded(!expanded);
        }}
        className="flex cursor-pointer items-start justify-between select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xl leading-none">{icon}</span>
          <div>
            <h3 className="font-display text-sm uppercase tracking-wider text-white">
              {title}
            </h3>
            <p className="font-mono text-[9px] text-white/30 truncate max-w-[200px] sm:max-w-none">
              {cardId === "builder" && builderGoalText
                ? `Goal: ${builderGoalText}`
                : cardId === "athlete" && athleteGoalText
                  ? `Goal: ${athleteGoalText}`
                  : `Operations for ${title}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
          <span className={`font-mono text-[10px] uppercase tracking-wider ${style.labelColor}`}>
            {style.label}
          </span>
          {activeMission && (
            <span className="font-mono text-[9px] text-white/30 ml-1.5">
              ({cardState.score}/{cardState.maxScore})
            </span>
          )}
          <span className="text-white/20 text-[9px] font-mono ml-1">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Summary of logs shown collapsed */}
      {!expanded && todayLogs.length > 0 && (
        <div className="mt-2.5 pl-7 flex flex-wrap gap-2">
          {todayLogs.map((log) => {
            const name = activities.find((a) => a.id === log.activityId)?.name || (log as any).subtype || "Activity";
            return (
              <span
                key={log.id}
                className="px-1.5 py-0.5 border border-white/5 bg-black/20 font-mono text-[8px] uppercase tracking-wider text-white/55"
              >
                ✓ {name} ({log.durationMinutes || 0}m)
              </span>
            );
          })}
        </div>
      )}

      {/* Guardian status summary collapsed */}
      {!expanded && cardId === "guardian" && (
        <div className="mt-2.5 pl-7 flex gap-2 font-mono text-[8px] uppercase">
          <span className={`px-1.5 py-0.5 border ${
            constraintStatus === "CLEAN"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
              : constraintStatus === "FAILED"
                ? "border-red-500/30 bg-red-500/5 text-red-400"
                : "border-white/5 bg-black/20 text-white/30"
          }`}>
            No Porn: {constraintStatus}
          </span>
          {isSleepLogged && (
            <span className="px-1.5 py-0.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
              ✓ Sleep Protected
            </span>
          )}
        </div>
      )}

      {/* Expandable operations panel */}
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

              {/* ────────────────── BUILDER EXPANDED ────────────────── */}
              {cardId === "builder" && (
                <div className="space-y-3.5">
                  {/* Goal Input */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-white/40 uppercase">
                      Today&apos;s Builder Goal
                    </label>
                    <input
                      type="text"
                      value={builderGoalText}
                      onChange={(e) => onUpdateDayLog({ builderGoal: e.target.value })}
                      placeholder="Define today's focus..."
                      className="w-full border border-white/8 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-white outline-none focus:border-amber-400/30"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetStatus("in-progress")}
                      className={`flex-1 border py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        status === "in-progress"
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      [ Start ]
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickComplete}
                      className={`flex-1 border py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        status === "completed"
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      [ Complete ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus("pending")}
                      className="border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40 hover:border-white/20"
                    >
                      [ Reset ]
                    </button>
                  </div>
                </div>
              )}

              {/* ────────────────── ATHLETE EXPANDED ────────────────── */}
              {cardId === "athlete" && (
                <div className="space-y-3.5">
                  {/* Goal Input */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-white/40 uppercase">
                      Today&apos;s Athlete Goal
                    </label>
                    <input
                      type="text"
                      value={athleteGoalText}
                      onChange={(e) => onUpdateDayLog({ athleteGoal: e.target.value } as any)}
                      placeholder="e.g. Morning Football, Sprint intervals..."
                      className="w-full border border-white/8 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-white outline-none focus:border-amber-400/30"
                    />
                  </div>

                  {/* Location & Complete Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetLocation("Home")}
                      className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        athleteLocation === "Home"
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      [ Home ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetLocation("Park")}
                      className={`flex-1 border py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        athleteLocation === "Park"
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                      }`}
                    >
                      [ Park ]
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickComplete}
                      className={`border px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        status === "completed"
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                          : "border-white/10 bg-white/[0.02] text-white/40 hover:text-white"
                      }`}
                    >
                      [ Complete ]
                    </button>
                  </div>

                  {/* Drills List Manager */}
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

              {/* ────────────────── RESET EXPANDED ────────────────── */}
              {cardId === "reset" && (
                <div className="space-y-3.5">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">
                    Daily Reset Core Checklists
                  </span>
                  
                  {/* Meditation, Journal, Sleep Checks */}
                  <div className="grid grid-cols-1 gap-2 bg-black/20 border border-white/5 p-3">
                    <label className="flex items-center gap-2.5 font-mono text-xs text-white/70 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={isMeditationLogged}
                        onChange={() => handleToggleResetCheckbox("Meditation")}
                        className="accent-amber-400 h-4 w-4 rounded"
                      />
                      <span className={isMeditationLogged ? "text-emerald-400 font-bold" : ""}>
                        Meditation (20 mins)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 font-mono text-xs text-white/70 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={isJournalLogged}
                        onChange={() => handleToggleResetCheckbox("Journal")}
                        className="accent-amber-400 h-4 w-4 rounded"
                      />
                      <span className={isJournalLogged ? "text-emerald-400 font-bold" : ""}>
                        Journal Reflection (15 mins)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 font-mono text-xs text-white/70 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={isSleepLogged}
                        onChange={() => handleToggleResetCheckbox("Sleep")}
                        className="accent-amber-400 h-4 w-4 rounded"
                      />
                      <span className={isSleepLogged ? "text-emerald-400 font-bold" : ""}>
                        Sleep Protection (8 hrs / target sleep)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ────────────────── GUARDIAN EXPANDED ────────────────── */}
              {cardId === "guardian" && (
                <div className="space-y-3.5">
                  {/* No Porn Constraint Toggles */}
                  <div className="space-y-2">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">
                      Constraint: No Porn
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConstraintLog("Yes")}
                        className={`flex-1 cursor-pointer border py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                          constraintStatus === "CLEAN"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                        }`}
                      >
                        Clean Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConstraintLog("No")}
                        className={`flex-1 cursor-pointer border py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                          constraintStatus === "FAILED"
                            ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-red-500/30 hover:bg-red-500/10"
                        }`}
                      >
                        Violation No
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── CUSTOM ACTIVITIES CRUD (ALL CARDS) ────────────────── */}
              <div className="border-t border-white/5 pt-3.5 space-y-3">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">
                  Custom Activities & Logs
                </span>

                {/* Logged items list */}
                {todayLogs.length > 0 ? (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {todayLogs.map((log) => {
                      const defName = activities.find((a) => a.id === log.activityId)?.name || (log as any).subtype || "Activity";
                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between gap-2 border border-white/5 bg-black/20 p-2 font-mono text-xs"
                        >
                          <span className="truncate text-frost">• {defName} ({log.durationMinutes || 0} min)</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-signal/70 hover:text-signal hover:underline text-[9px] uppercase tracking-wider pl-2"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-white/20 italic">No custom activities logged today.</p>
                )}

                {/* Active definitions to log */}
                {activeDefs.length > 0 && (
                  <div className="space-y-1.5">
                    {activeDefs.map((def) => {
                      const isEditing = editingActivityId === def.id;
                      const curDur = logDurations[def.id] || 30;

                      return (
                        <div
                          key={def.id}
                          className="flex items-center justify-between gap-2 bg-white/[0.01] border border-white/5 p-2 font-mono text-xs"
                        >
                          {isEditing ? (
                            <div className="flex-1 flex gap-1.5">
                              <input
                                type="text"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="flex-1 bg-black border border-white/10 px-2 py-0.5 text-white text-[10px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveRename}
                                className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 uppercase text-[9px]"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-white/70 font-medium truncate">{def.name}</span>
                              
                              <div className="flex items-center gap-2">
                                {/* Duration */}
                                <div className="flex items-center gap-0.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="480"
                                    value={curDur}
                                    onChange={(e) =>
                                      setLogDurations((prev) => ({
                                        ...prev,
                                        [def.id]: Math.max(1, parseInt(e.target.value) || 30),
                                      }))
                                    }
                                    className="w-8 bg-black/50 border border-white/10 text-center py-0.5 text-[9px] text-white focus:outline-none"
                                  />
                                  <span className="text-[8px] text-white/30">m</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleLogActivity(def.id, def.foundation)}
                                  className="px-2 py-0.5 bg-signal/10 border border-signal/30 text-signal hover:bg-signal/20 uppercase text-[9px] font-bold"
                                >
                                  Log
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartRename(def.id, def.name)}
                                  className="text-frost/40 hover:text-frost text-[9px]"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleArchive(def.id, true)}
                                  className="text-white/30 hover:text-white/60 text-[9px]"
                                >
                                  Archive
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add activity form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Add custom activity (e.g. for ${title})`}
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="flex-1 bg-black/45 border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-signal/45"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddActivity(mappedFoundationTypes[0])}
                    className="px-3 bg-white/10 hover:bg-white/15 border border-white/15 font-mono text-[9px] uppercase text-white tracking-wider"
                  >
                    Add
                  </button>
                </div>

                {/* Archive Management Toggle */}
                {archivedDefs.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        audioManager.playToggle();
                        setShowArchived(!showArchived);
                      }}
                      className="font-mono text-[9px] uppercase tracking-wider text-white/30 hover:text-white/50"
                    >
                      {showArchived ? "Hide Archived" : `Show Archived (${archivedDefs.length})`}
                    </button>

                    <AnimatePresence>
                      {showArchived && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1.5 overflow-hidden pl-2 border-l border-white/5"
                        >
                          {archivedDefs.map((def) => (
                            <div
                              key={def.id}
                              className="flex items-center justify-between gap-2 p-1.5 font-mono text-xs text-white/40"
                            >
                              <span>{def.name}</span>
                              <div className="flex gap-2 text-[9px]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleArchive(def.id, false)}
                                  className="text-emerald-400/60 hover:text-emerald-400"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActivity(def.id)}
                                  className="text-signal/60 hover:text-signal"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Minimum Viable Win hint */}
                {FOUNDATION_DEFINITIONS.find((f) => f.type === mappedFoundationTypes[0])?.minimumViableWin && (
                  <p className="font-mono text-[8px] italic text-white/30 pt-1">
                    Win threshold: {FOUNDATION_DEFINITIONS.find((f) => f.type === mappedFoundationTypes[0])?.minimumViableWin}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
