"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FOUNDATION_DEFINITIONS,
  NO_PORN_CONSTRAINT,
} from "@/lib/foundation";
import type {
  FoundationType,
  ISODate,
  ActivityDefinition,
  ActivityLogEntry,
} from "@/lib/foundation";
import {
  localFoundationRepository,
  getCompletedFoundationTypesFromActivities,
  calculateDailyFoundationScoreFromActivities,
} from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

interface FoundationPanelProps {
  todaysDate: ISODate;
  onFoundationLogged: () => void;
}

export default function FoundationPanel({
  todaysDate,
  onFoundationLogged,
}: FoundationPanelProps) {
  const [activities, setActivities] = useState<ActivityDefinition[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalFoundations, setTotalFoundations] = useState<number>(FOUNDATION_DEFINITIONS.length);
  const [expandedType, setExpandedType] = useState<FoundationType | null>(null);
  
  // Custom Activity editing states
  const [newActivityNames, setNewActivityNames] = useState<Record<string, string>>({});
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [showArchived, setShowArchived] = useState<Record<string, boolean>>({});
  const [logDurations, setLogDurations] = useState<Record<string, number>>({});
  const [constraintStatus, setConstraintStatus] = useState<"Yes" | "No" | null>(null);

  const refreshState = useCallback(() => {
    const allDefs = localFoundationRepository.listActivities();
    const allLogs = localFoundationRepository.listActivityLogs();
    const syncedActs = localFoundationRepository.listFoundationActivities();
    const score = calculateDailyFoundationScoreFromActivities(syncedActs, todaysDate);

    setActivities(allDefs);
    setActivityLogs(allLogs);
    setCompletedCount(score.completedCount);
    setTotalFoundations(score.totalFoundations);

    const constraintLogs = localFoundationRepository.listConstraintLogs();
    const todayConstraint = constraintLogs.find(
      (log) => log.date === todaysDate && log.constraint === "No Porn"
    );
    setConstraintStatus(
      todayConstraint ? (todayConstraint.subtype as "Yes" | "No") : null
    );
  }, [todaysDate]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const completedTypes = useMemo(() => {
    const syncedActs = localFoundationRepository.listFoundationActivities();
    return getCompletedFoundationTypesFromActivities(syncedActs, todaysDate);
  }, [activityLogs, todaysDate]);

  // Logging activities
  const handleLogActivity = (activityId: string, fType: FoundationType) => {
    audioManager.playClick();
    const duration = logDurations[activityId] || 30;

    const wasCompleted = completedTypes.includes(fType);

    localFoundationRepository.addActivityLog({
      date: todaysDate,
      activityId,
      durationMinutes: duration,
    });

    if (!wasCompleted) {
      audioManager.playFoundationComplete();
    }

    onFoundationLogged();
    refreshState();
  };

  const handleDeleteLog = (logId: string) => {
    audioManager.playClick();
    localFoundationRepository.deleteActivityLog(logId);
    onFoundationLogged();
    refreshState();
  };

  // Activity Definitions CRUD
  const handleAddActivity = (fType: FoundationType) => {
    audioManager.playClick();
    const name = newActivityNames[fType]?.trim();
    if (!name) return;

    localFoundationRepository.createActivity({
      foundation: fType,
      name,
    });

    setNewActivityNames(prev => ({ ...prev, [fType]: "" }));
    refreshState();
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
    refreshState();
  };

  const handleToggleArchive = (id: string, isArchived: boolean) => {
    audioManager.playClick();
    localFoundationRepository.updateActivity({
      id,
      archived: isArchived,
    });
    refreshState();
  };

  const handleDeleteActivity = (id: string) => {
    audioManager.playClick();
    localFoundationRepository.deleteActivity(id);
    refreshState();
  };

  const handleConstraintLog = (subtype: "Yes" | "No") => {
    audioManager.playClick();
    localFoundationRepository.upsertConstraintLog({
      date: todaysDate,
      constraint: "No Porn",
      subtype,
    });
    onFoundationLogged();
    refreshState();
  };

  const toggleExpand = (type: FoundationType) => {
    audioManager.playClick();
    setExpandedType(prev => (prev === type ? null : type));
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal/80">
            System 1 — Custom Foundations
          </p>
          <h2 className="font-display text-xl uppercase text-frost sm:text-2xl">
            Foundation Layer
          </h2>
        </div>
        <div className="font-mono text-xs uppercase tracking-wider text-white/50">
          <span className="text-emerald-400">{completedCount}</span>
          <span className="text-white/30">/{totalFoundations}</span>{" "}
          <span className="text-white/40">Completions</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {FOUNDATION_DEFINITIONS.map((definition) => {
          const isCompleted = completedTypes.includes(definition.type);
          const isExpanded = expandedType === definition.type;
          
          // Get today's activity logs for this foundation
          const todayLogs = activityLogs.filter(
            (log) => log.date === todaysDate && log.foundation === definition.type
          );

          // Get activity definitions for this foundation
          const fDefs = activities.filter((act) => act.foundation === definition.type);
          const activeDefs = fDefs.filter((act) => !act.archived);
          const archivedDefs = fDefs.filter((act) => act.archived);

          return (
            <div key={definition.type} className="border border-white/8 bg-black/35">
              {/* Row Header */}
              <button
                type="button"
                onClick={() => toggleExpand(definition.type)}
                className={`w-full cursor-pointer p-3 text-left transition-all duration-200 flex flex-col gap-1.5 ${
                  isCompleted ? "bg-emerald-500/[0.03]" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    {/* Check indicator */}
                    {isCompleted ? (
                      <span className="flex h-5 w-5 items-center justify-center text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                        ✓
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center text-white/20">
                        ○
                      </span>
                    )}

                    <span className={`font-display text-sm uppercase ${isCompleted ? "text-frost" : "text-white/50"}`}>
                      {definition.type}
                    </span>

                    <span className="border border-signal/20 bg-signal/5 px-1.5 py-0.5 font-mono text-[9px] uppercase text-signal/70">
                      {definition.identity}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-white/30">
                    {isExpanded ? "▲ Collapse" : "▼ Expand"}
                  </span>
                </div>

                {/* Bullet list of logged activities today */}
                {todayLogs.length > 0 && (
                  <div className="pl-7 w-full font-mono text-xs text-white/60 space-y-1 text-left">
                    <p className="text-[9px] uppercase tracking-wider text-white/30">Logged Today</p>
                    {todayLogs.map((log) => {
                      const defName = activities.find(a => a.id === log.activityId)?.name || "Activity";
                      return (
                        <div key={log.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-0.5">
                          <span className="truncate">• {defName} ({log.durationMinutes || 0} min)</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLog(log.id);
                            }}
                            className="text-signal/70 hover:text-signal hover:underline text-[9px] uppercase tracking-wider pl-2"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>

              {/* Expanded Area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/5 bg-black/20 p-3 space-y-3"
                  >
                    {/* Active Activities List */}
                    <div className="space-y-2">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-white/30">Active Activities</span>
                      {activeDefs.length === 0 ? (
                        <p className="font-mono text-[10px] text-white/20 italic">No custom activities defined.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeDefs.map((def) => {
                            const isEditing = editingActivityId === def.id;
                            const curDur = logDurations[def.id] || 30;

                            return (
                              <div key={def.id} className="flex items-center justify-between gap-2 bg-white/[0.01] border border-white/5 p-2 font-mono text-xs">
                                {isEditing ? (
                                  <div className="flex-1 flex gap-1.5">
                                    <input
                                      type="text"
                                      value={editingNameValue}
                                      onChange={(e) => setEditingNameValue(e.target.value)}
                                      className="flex-1 bg-black border border-white/10 px-2 py-0.5 text-white focus:outline-none"
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
                                    <span className="text-frost font-medium truncate">{def.name}</span>
                                    
                                    {/* Action Logs Box */}
                                    <div className="flex items-center gap-2">
                                      {/* Duration input */}
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max="480"
                                          value={curDur}
                                          onChange={(e) =>
                                            setLogDurations(prev => ({
                                              ...prev,
                                              [def.id]: Math.max(1, parseInt(e.target.value) || 30),
                                            }))
                                          }
                                          className="w-10 bg-black/50 border border-white/10 text-center py-0.5 text-[10px] text-white focus:outline-none focus:border-signal/50"
                                        />
                                        <span className="text-[9px] text-white/30">m</span>
                                      </div>

                                      {/* Log button */}
                                      <button
                                        type="button"
                                        onClick={() => handleLogActivity(def.id, definition.type)}
                                        className="px-2 py-0.5 bg-signal/10 border border-signal/30 text-signal hover:bg-signal/20 uppercase text-[9px] font-bold"
                                      >
                                        Log
                                      </button>

                                      {/* Controls */}
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
                    </div>

                    {/* Add Activity Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add custom activity (e.g. Portfolio)"
                        value={newActivityNames[definition.type] || ""}
                        onChange={(e) =>
                          setNewActivityNames(prev => ({
                            ...prev,
                            [definition.type]: e.target.value,
                          }))
                        }
                        className="flex-1 bg-black/45 border border-white/10 px-2.5 py-1 font-mono text-xs text-white placeholder-white/20 focus:outline-none focus:border-signal/45"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddActivity(definition.type)}
                        className="px-3 bg-white/10 hover:bg-white/15 border border-white/15 font-mono text-xs uppercase text-white tracking-wider"
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
                            setShowArchived(prev => ({ ...prev, [definition.type]: !prev[definition.type] }));
                          }}
                          className="font-mono text-[9px] uppercase tracking-wider text-white/30 hover:text-white/50"
                        >
                          {showArchived[definition.type] ? "Hide Archived Activities" : `Show Archived Activities (${archivedDefs.length})`}
                        </button>

                        <AnimatePresence>
                          {showArchived[definition.type] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-1.5 overflow-hidden pl-2 border-l border-white/5"
                            >
                              {archivedDefs.map(def => (
                                <div key={def.id} className="flex items-center justify-between gap-2 p-1.5 font-mono text-xs text-white/40">
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

                    <p className="font-mono text-[9px] italic text-white/30 pt-1">
                      {definition.minimumViableWin}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* ── No Porn Constraint ── */}
        <div className="mt-2.5 border-t border-white/8 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {constraintStatus === "Yes" ? (
                <span className="flex h-5 w-5 items-center justify-center text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                  ✓
                </span>
              ) : constraintStatus === "No" ? (
                <span className="flex h-5 w-5 items-center justify-center text-red-400 font-bold drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]">
                  ✗
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center text-white/20">
                  ○
                </span>
              )}

              <span className="font-display text-sm uppercase text-white/50">
                {NO_PORN_CONSTRAINT.type}
              </span>

              <span className="border border-signal/20 bg-signal/5 px-1.5 py-0.5 font-mono text-[9px] uppercase text-signal/70">
                {NO_PORN_CONSTRAINT.identity}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConstraintLog("Yes")}
                className={`cursor-pointer border px-3 py-1 font-mono text-xs uppercase transition-all duration-200 ${
                  constraintStatus === "Yes"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleConstraintLog("No")}
                className={`cursor-pointer border px-3 py-1 font-mono text-xs uppercase transition-all duration-200 ${
                  constraintStatus === "No"
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
