"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { identityOperationsRepository, PermanentOperation, OperationLog, OperationStatus, ProtocolIdentity, TodayMission, TaskHistoryRecord, Restriction, RestrictionLog, RestrictionSeverity } from "@/lib/identity-operations";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/foundation/types";

interface Props {
  todaysDate: ISODate;
}

export default function IdentityOperationsBoard({ todaysDate }: Props) {
  const [operations, setOperations] = useState<PermanentOperation[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [restrictionLogs, setRestrictionLogs] = useState<RestrictionLog[]>([]);
  const [missions, setMissions] = useState<TodayMission[]>([]);
  const [history, setHistory] = useState<TaskHistoryRecord[]>([]);
  
  // Skip Modal states
  const [skipOpId, setSkipOpId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipError, setSkipError] = useState(false);
  
  // Violation Modal state (reuses skipReason)
  const [violationResId, setViolationResId] = useState<string | null>(null);
  
  // Edit mode states (unified quick add)
  const [activeAddIdentity, setActiveAddIdentity] = useState<ProtocolIdentity | null>(null);
  const [addType, setAddType] = useState<"operation" | "restriction">("operation");
  const [newTaskName, setNewTaskName] = useState("");
  const [newOpDesc, setNewOpDesc] = useState("");
  
  // Operation specifics
  const [newOpIsOptional, setNewOpIsOptional] = useState(false);
  const [newOpFocusEligible, setNewOpFocusEligible] = useState(true);
  
  // Restriction specifics
  const [newResSeverity, setNewResSeverity] = useState<RestrictionSeverity>("Medium");
  const [newResTrackDaily, setNewResTrackDaily] = useState(true);
  const [newResAskReason, setNewResAskReason] = useState(false);

  const loadData = useCallback(() => {
    const allOps = identityOperationsRepository.listOperations().filter(o => !o.archived);
    allOps.sort((a, b) => a.order - b.order);
    setOperations(allOps);

    const allRes = identityOperationsRepository.listRestrictions().filter(r => !r.archived);
    setRestrictions(allRes);

    const dateLogs = identityOperationsRepository.listLogsForDate(todaysDate);
    setLogs(dateLogs);

    const resLogs = identityOperationsRepository.listRestrictionLogsForDate(todaysDate);
    setRestrictionLogs(resLogs);

    const todaysMissions = identityOperationsRepository.listTodayMissions(todaysDate);
    setMissions(todaysMissions);

    const recentHistory = identityOperationsRepository.listHistory(50);
    setHistory(recentHistory);
  }, [todaysDate]);

  useEffect(() => {
    loadData();
    window.addEventListener("batcave-ops-updated", loadData);
    return () => window.removeEventListener("batcave-ops-updated", loadData);
  }, [loadData]);

  // Live timer tick for active operations
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions for Permanent Operations
  const getLogForOp = (opId: string) => {
    let log = logs.find(l => l.operationId === opId);
    if (!log) {
      log = identityOperationsRepository.getOrCreateLog(opId, todaysDate);
      loadData();
    }
    return log;
  };

  const handleSetOpStatus = (opId: string, status: OperationStatus) => {
    if (status === "skipped") {
      audioManager.playClick();
      setSkipOpId(opId);
      setSkipReason("");
      setSkipError(false);
      return;
    }

    audioManager.playClick();
    const log = getLogForOp(opId);
    
    identityOperationsRepository.updateLogStatus(log.id, status, undefined, "Manual");
    loadData();
    
    if (status === "completed") {
      audioManager.playCheckinComplete();
    } else if (status === "active") {
      audioManager.playToggle();
    }
  };

  const submitSkip = () => {
    if (!skipReason.trim()) {
      setSkipError(true);
      return;
    }
    if (!skipOpId) return;

    audioManager.playClick();
    const log = getLogForOp(skipOpId);
    identityOperationsRepository.updateLogStatus(log.id, "skipped", skipReason.trim(), "Manual");
    
    setSkipOpId(null);
    setSkipReason("");
    setSkipError(false);
    loadData();
  };

  const handleReportViolation = (resId: string) => {
    const res = restrictions.find(r => r.id === resId);
    if (!res) return;
    
    if (res.askReasonWhenBroken) {
      audioManager.playClick();
      setViolationResId(resId);
      setSkipReason(""); // Reusing skipReason state for violation reason
      setSkipError(false);
    } else {
      audioManager.playClick();
      identityOperationsRepository.logRestrictionViolation(resId, todaysDate);
      loadData();
    }
  };

  const submitViolation = () => {
    if (!skipReason.trim()) {
      setSkipError(true);
      return;
    }
    if (!violationResId) return;

    audioManager.playClick();
    identityOperationsRepository.logRestrictionViolation(violationResId, todaysDate, skipReason.trim());
    
    setViolationResId(null);
    setSkipReason("");
    setSkipError(false);
    loadData();
  };

  // Actions for Today's Missions
  const handleCompleteMission = (missionId: string) => {
    audioManager.playCheckinComplete();
    identityOperationsRepository.updateTodayMission(missionId, { status: "completed" }, todaysDate, "Manual");
    loadData();
  };

  const handleDeleteMission = (missionId: string) => {
    audioManager.playClick();
    identityOperationsRepository.deleteTodayMission(missionId);
    loadData();
  };

  // Add Actions
  const handleCreateTask = (e: React.FormEvent, identity: ProtocolIdentity) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    
    if (addType === "operation") {
      identityOperationsRepository.createOperation(
        newTaskName.trim(), 
        newOpDesc.trim() || undefined, 
        identity, 
        undefined, // dailyGoal
        newOpIsOptional, 
        newOpFocusEligible
      );
    } else {
      identityOperationsRepository.createRestriction(
        newTaskName.trim(), 
        newOpDesc.trim() || undefined, 
        identity, 
        newResSeverity, 
        newResTrackDaily, 
        newResAskReason
      );
    }
    
    setNewTaskName("");
    setNewOpDesc("");
    setNewOpIsOptional(false);
    setNewOpFocusEligible(true);
    setNewResSeverity("Medium");
    setNewResTrackDaily(true);
    setNewResAskReason(false);
    setActiveAddIdentity(null);
    loadData();
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return "--:--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const identities: ProtocolIdentity[] = ["Builder", "Striker", "King", "Guardian"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-white/5 pb-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          Core Framework
        </p>
        <h2 className="font-display text-xl uppercase tracking-wider text-frost mt-1">
          Identity Operations
        </h2>
      </div>

      {/* Grid Layout for Divisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {identities.map((identity) => {
          const idOps = operations.filter(o => o.identity === identity);
          const idRes = restrictions.filter(r => r.identity === identity);
          const idMissions = missions.filter(m => m.identity === identity);
          const { score, status } = identityOperationsRepository.getIdentityScore(identity, todaysDate);
          
          const recentActivity = history
            .filter(h => h.identity === identity)
            .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime())
            .slice(0, 3);

          let scoreColor = "text-emerald-400";
          if (score < 50) scoreColor = "text-red-400";
          else if (score < 80) scoreColor = "text-amber-400";

          return (
            <div key={identity} className="flex flex-col border border-white/5 bg-black/40 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 bg-black/60 border-b border-white/5">
                <div>
                  <h3 className="font-display text-lg uppercase tracking-wider text-white/90">
                    {identity}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${scoreColor}`}>
                      {score}% {status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audioManager.playClick();
                    setActiveAddIdentity(activeAddIdentity === identity ? null : identity);
                  }}
                  className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors bg-white/5 font-mono"
                >
                  {activeAddIdentity === identity ? "×" : "+"}
                </button>
              </div>

              {/* Quick Add Panel */}
              <AnimatePresence>
                {activeAddIdentity === identity && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/5 bg-white/[0.02]"
                  >
                    <form onSubmit={(e) => handleCreateTask(e, identity)} className="p-4 flex flex-col gap-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                          <input type="radio" checked={addType === "operation"} onChange={() => setAddType("operation")} className="accent-amber-400" />
                          Operation
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                          <input type="radio" checked={addType === "restriction"} onChange={() => setAddType("restriction")} className="accent-amber-400" />
                          Restriction
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder={`${addType === "operation" ? "Operation" : "Restriction"} Name`}
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        autoFocus
                        className="w-full bg-black/50 border border-white/10 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50"
                      />
                      
                      <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={newOpDesc}
                        onChange={(e) => setNewOpDesc(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50"
                      />

                      {addType === "operation" && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                            <input type="checkbox" checked={!newOpIsOptional} onChange={(e) => setNewOpIsOptional(!e.target.checked)} className="accent-amber-400" />
                            Daily Required
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                            <input type="checkbox" checked={newOpFocusEligible} onChange={(e) => setNewOpFocusEligible(e.target.checked)} className="accent-amber-400" />
                            Focus Timer Eligible
                          </label>
                        </div>
                      )}

                      {addType === "restriction" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 block mb-1">Severity</label>
                            <select
                              value={newResSeverity}
                              onChange={(e) => setNewResSeverity(e.target.value as RestrictionSeverity)}
                              className="w-full bg-black/50 border border-white/10 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                              <input type="checkbox" checked={newResTrackDaily} onChange={(e) => setNewResTrackDaily(e.target.checked)} className="accent-amber-400" />
                              Track Daily
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/60 uppercase">
                              <input type="checkbox" checked={newResAskReason} onChange={(e) => setNewResAskReason(e.target.checked)} className="accent-amber-400" />
                              Ask Reason When Broken
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-2">
                        <button type="submit" className="px-4 py-2 bg-white/5 border border-white/10 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
                          Deploy {addType === "operation" ? "Operation" : "Restriction"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sections Container */}
              <div className="p-4 space-y-6 flex-1">
                
                {/* Today's Missions */}
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3 border-b border-white/5 pb-1">
                    Today's Missions
                  </h4>
                  {idMissions.length === 0 ? (
                    <p className="font-mono text-[10px] text-white/20 italic">No temporary missions active.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {idMissions.map(m => (
                        <div key={m.id} className={`flex items-center justify-between p-2 border border-white/5 ${m.status === "completed" ? "bg-emerald-500/5 opacity-50" : "bg-black/30"}`}>
                          <span className={`font-mono text-xs uppercase ${m.status === "completed" ? "text-emerald-400/80 line-through" : "text-white/80"}`}>
                            {m.name}
                          </span>
                          {m.status === "pending" && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleCompleteMission(m.id)} className="font-mono text-[9px] px-2 py-1 uppercase border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                ✓ Complete
                              </button>
                              <button onClick={() => handleDeleteMission(m.id)} className="font-mono text-[9px] px-2 py-1 uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operations */}
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3 border-b border-white/5 pb-1">
                    Operations
                  </h4>
                  {idOps.length === 0 ? (
                    <p className="font-mono text-[10px] text-white/20 italic">No operations defined.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {idOps.map((op) => {
                        const log = getLogForOp(op.id);
                        const status = log?.status || "pending";
                        
                        let currentDuration = log?.durationMs || 0;
                        if (status === "active" && log?.lastResumedAt) {
                          const elapsed = Math.max(0, nowMs - new Date(log.lastResumedAt).getTime());
                          currentDuration += elapsed;
                        }

                        let statusColor = "bg-black/30 text-white/40 border-white/5";
                        if (status === "active") statusColor = "bg-amber-400/5 text-amber-400 border-amber-400/20";
                        else if (status === "completed") statusColor = "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 opacity-60";
                        else if (status === "skipped") statusColor = "bg-red-500/5 text-red-500/60 border-red-500/20 opacity-60";

                        return (
                          <div key={op.id} className={`flex flex-col p-3 border transition-colors relative ${statusColor}`}>
                            {status === "active" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 animate-pulse" />}
                            {status === "completed" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}

                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h5 className={`font-mono text-xs uppercase ${status === "completed" || status === "skipped" ? "line-through" : "text-white/90"}`}>
                                  {op.name}
                                </h5>
                                {op.isOptional ? (
                                  <p className="font-mono text-[9px] text-white/50 mt-1 uppercase tracking-widest">
                                    OPTIONAL
                                  </p>
                                ) : (
                                  <p className="font-mono text-[9px] text-amber-400 mt-1 uppercase tracking-widest">
                                    DAILY
                                  </p>
                                )}
                                {op.dailyGoal && (
                                  <p className="font-mono text-[9px] text-frost/80 mt-1 uppercase tracking-widest">
                                    GOAL: {op.dailyGoal}
                                  </p>
                                )}
                                {status === "active" && currentDuration > 0 && (
                                  <p className="font-mono text-[9px] text-amber-400 mt-1 uppercase">
                                    ELAPSED: {formatDuration(currentDuration)}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 shrink-0">
                                {status === "pending" || status === "skipped" ? (
                                  <button onClick={() => handleSetOpStatus(op.id, "active")} className="font-mono text-[9px] uppercase px-2 py-1 text-amber-400 hover:bg-amber-400/10 border border-amber-400/30 transition-colors">Start</button>
                                ) : status === "active" ? (
                                  <button onClick={() => handleSetOpStatus(op.id, "completed")} className="font-mono text-[9px] uppercase px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">Complete</button>
                                ) : status === "completed" ? (
                                  <button onClick={() => handleSetOpStatus(op.id, "pending")} className="font-mono text-[9px] uppercase px-2 py-1 text-white/30 hover:text-white/60 border border-white/10 transition-colors">Reset</button>
                                ) : null}

                                {(status === "pending" || status === "active") && (
                                  <button onClick={() => handleSetOpStatus(op.id, "skipped")} className="font-mono text-[9px] uppercase px-2 py-1 text-white/30 hover:text-red-400 hover:border-red-400/30 border border-white/10 transition-colors">Skip</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Restrictions */}
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-3 border-b border-white/5 pb-1">
                    Restrictions
                  </h4>
                  {idRes.length === 0 ? (
                    <p className="font-mono text-[10px] text-white/20 italic">No restrictions defined.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {idRes.map((res) => {
                        const log = restrictionLogs.find(l => l.restrictionId === res.id);
                        const isViolated = log?.status === "violated";
                        
                        return (
                          <div key={res.id} className={`flex flex-col p-3 border ${isViolated ? 'bg-red-500/10 border-red-500/30' : 'bg-black/30 border-white/5'} transition-colors relative`}>
                            {isViolated && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}

                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h5 className={`font-mono text-xs uppercase ${isViolated ? 'text-red-400' : 'text-white/90'}`}>
                                  {res.name}
                                </h5>
                                <div className="flex gap-2 mt-1">
                                  <p className={`font-mono text-[9px] uppercase tracking-widest ${isViolated ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
                                    STATUS: {isViolated ? 'VIOLATED' : 'PROTECTED'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                {!isViolated && (
                                  <button onClick={() => handleReportViolation(res.id)} className="font-mono text-[9px] uppercase px-2 py-1 text-white/30 hover:text-red-400 hover:border-red-400/30 border border-white/10 transition-colors">
                                    Report Violation
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">
                    Recent Activity
                  </h4>
                  {recentActivity.length === 0 ? (
                    <p className="font-mono text-[10px] text-white/20 italic">No recent completions.</p>
                  ) : (
                    <div className="space-y-1">
                      {recentActivity.map(record => (
                        <div key={record.id} className="flex justify-between items-center font-mono text-[10px] uppercase">
                          <span className="text-white/50 truncate max-w-[60%]">{record.taskName}</span>
                          <span className="text-emerald-400/60 shrink-0">{formatTime(record.completedAt || record.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Accountability Modal */}
      <AnimatePresence>
        {(skipOpId || violationResId) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-black border border-red-500/30 p-6 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
              
              <h3 className="font-display text-xl uppercase tracking-wider text-red-500 mb-1 pl-2">
                Accountability Protocol
              </h3>
              <p className="font-mono text-[10px] uppercase text-red-400/60 mb-6 tracking-widest pl-2">
                {skipOpId ? "Why was this operation skipped today?" : "Why was this restriction violated?"}
              </p>

              <div className="pl-2">
                <textarea
                  value={skipReason}
                  onChange={(e) => {
                    setSkipReason(e.target.value);
                    setSkipError(false);
                  }}
                  className={`w-full bg-black/50 border ${
                    skipError ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10"
                  } p-3 text-white font-mono text-xs outline-none focus:border-red-500/50 min-h-[100px] mb-2 transition-all resize-none`}
                  placeholder="State the reason clearly..."
                  autoFocus
                />
                
                {skipError && (
                  <p className="font-mono text-[9px] text-red-500 uppercase tracking-widest mb-4">
                    ! Empty reasons are not permitted.
                  </p>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setSkipOpId(null);
                      setViolationResId(null);
                      setSkipReason("");
                      setSkipError(false);
                    }}
                    className="px-4 py-2 font-mono text-[10px] uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={skipOpId ? submitSkip : submitViolation}
                    className="px-5 py-2 font-mono text-[10px] uppercase bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    Confirm {skipOpId ? "Skip" : "Violation"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
