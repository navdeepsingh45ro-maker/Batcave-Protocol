"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { permanentOperationsRepository, PermanentOperation, OperationLog, OperationStatus } from "@/lib/permanent-operations";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/foundation/types";

interface Props {
  todaysDate: ISODate;
}

export default function PermanentOperationsBoard({ todaysDate }: Props) {
  const [operations, setOperations] = useState<PermanentOperation[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [editMode, setEditMode] = useState(false);
  
  // Skip Modal states
  const [skipOpId, setSkipOpId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipError, setSkipError] = useState(false);
  
  // Edit mode states
  const [newOpName, setNewOpName] = useState("");
  const [newOpDesc, setNewOpDesc] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadData = useCallback(() => {
    const allOps = permanentOperationsRepository.listOperations();
    const ops = showArchived ? allOps : allOps.filter(o => !o.archived);
    ops.sort((a, b) => a.order - b.order);
    setOperations(ops);

    const dateLogs = permanentOperationsRepository.listLogsForDate(todaysDate);
    setLogs(dateLogs);
  }, [todaysDate, showArchived]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live timer tick for active operations
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const getLogForOp = (opId: string) => {
    let log = logs.find(l => l.operationId === opId);
    if (!log) {
      log = permanentOperationsRepository.getOrCreateLog(opId, todaysDate);
      loadData();
    }
    return log;
  };

  const handleSetStatus = (opId: string, status: OperationStatus) => {
    if (status === "skipped") {
      audioManager.playClick();
      setSkipOpId(opId);
      setSkipReason("");
      setSkipError(false);
      return;
    }

    audioManager.playClick();
    const log = getLogForOp(opId);
    
    permanentOperationsRepository.updateLogStatus(log.id, status, undefined);
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
    permanentOperationsRepository.updateLogStatus(log.id, "skipped", skipReason.trim());
    
    setSkipOpId(null);
    setSkipReason("");
    setSkipError(false);
    loadData();
  };

  // Edit Mode Actions
  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    permanentOperationsRepository.createOperation(newOpName.trim(), newOpDesc.trim() || undefined);
    setNewOpName("");
    setNewOpDesc("");
    loadData();
  };

  const handleToggleArchive = (id: string, archived: boolean) => {
    permanentOperationsRepository.updateOperation(id, { archived });
    loadData();
  };

  const handleMoveOrder = (idx: number, direction: -1 | 1) => {
    if (idx + direction < 0 || idx + direction >= operations.length) return;
    const newOps = [...operations];
    const temp = newOps[idx];
    newOps[idx] = newOps[idx + direction];
    newOps[idx + direction] = temp;
    
    permanentOperationsRepository.reorderOperations(newOps.map(o => o.id));
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/5 pb-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Mandatory Directives
          </p>
          <h2 className="font-display text-xl uppercase tracking-wider text-frost mt-1">
            Permanent Operations
          </h2>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`font-mono text-[9px] uppercase px-2 py-1 border transition-colors ${
            editMode ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : "border-white/10 text-white/30 hover:border-white/30 hover:text-white/60"
          }`}
        >
          {editMode ? "Exit Config" : "Config"}
        </button>
      </div>

      {/* Board */}
      <div className="flex flex-col">
        <AnimatePresence>
          {operations.map((op, idx) => {
            const log = getLogForOp(op.id);
            const status = log?.status || "pending";
            
            let currentDuration = log?.durationMs || 0;
            if (status === "active" && log?.lastResumedAt) {
              const elapsed = Math.max(0, nowMs - new Date(log.lastResumedAt).getTime());
              currentDuration += elapsed;
            }

            let statusColor = "bg-transparent text-white/40";
            let statusLabel = "PENDING";
            
            if (status === "active") {
              statusColor = "bg-amber-400/5 text-amber-400";
              statusLabel = "ACTIVE";
            } else if (status === "completed") {
              statusColor = "bg-emerald-500/5 text-emerald-400";
              statusLabel = "COMPLETED";
            } else if (status === "skipped") {
              statusColor = "bg-red-500/5 text-red-500/60";
              statusLabel = "SKIPPED";
            }

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={op.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 border-b border-white/5 transition-all duration-300 ${statusColor} ${op.archived ? "opacity-40" : ""}`}
              >
                {/* Active Indicator Line */}
                {status === "active" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 animate-pulse" />
                )}
                {status === "completed" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                )}

                {/* Info */}
                <div className="flex-1 pl-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">
                      {op.name}
                    </h3>
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                      [{statusLabel}]
                    </span>
                  </div>
                  {op.description && (
                    <p className="font-mono text-[10px] text-white/40 mt-1 uppercase tracking-wide">
                      {op.description}
                    </p>
                  )}
                  {log?.skipReason && status === "skipped" && (
                    <p className="font-mono text-[10px] text-red-400/80 mt-1 uppercase tracking-wide">
                      REASON: {log.skipReason}
                    </p>
                  )}
                  
                  {/* Timestamps */}
                  <div className="flex flex-wrap gap-4 mt-2 font-mono text-[9px] uppercase tracking-widest text-white/30">
                    <span className={log?.startedAt ? "text-white/60" : ""}>
                      START: {formatTime(log?.startedAt)}
                    </span>
                    <span className={log?.completedAt ? "text-white/60" : ""}>
                      END: {formatTime(log?.completedAt)}
                    </span>
                    <span className={currentDuration > 0 ? (status === "active" ? "text-amber-400" : "text-white/60") : ""}>
                      DUR: {formatDuration(currentDuration)}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                {!editMode ? (
                  <div className="flex gap-2 shrink-0">
                    {status === "pending" || status === "skipped" ? (
                      <button
                        onClick={() => handleSetStatus(op.id, "active")}
                        className="font-mono text-[9px] uppercase px-3 py-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        [ Start ]
                      </button>
                    ) : status === "active" ? (
                      <button
                        onClick={() => handleSetStatus(op.id, "completed")}
                        className="font-mono text-[9px] uppercase px-4 py-1.5 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors tracking-widest"
                      >
                        Complete
                      </button>
                    ) : status === "completed" ? (
                      <button
                        onClick={() => handleSetStatus(op.id, "pending")}
                        className="font-mono text-[9px] uppercase px-3 py-1.5 text-white/30 hover:text-white/80 transition-colors"
                      >
                        Reset
                      </button>
                    ) : null}

                    {(status === "pending" || status === "active") && (
                      <button
                        onClick={() => handleSetStatus(op.id, "skipped")}
                        className="font-mono text-[9px] uppercase px-2 py-1.5 text-white/20 hover:text-red-400/80 transition-colors"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                ) : (
                  // Edit Controls
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-1 mr-2">
                      <button onClick={() => handleMoveOrder(idx, -1)} className="text-white/30 hover:text-white text-[10px]">▲</button>
                      <button onClick={() => handleMoveOrder(idx, 1)} className="text-white/30 hover:text-white text-[10px]">▼</button>
                    </div>
                    <button
                      onClick={() => handleToggleArchive(op.id, !op.archived)}
                      className={`font-mono text-[9px] uppercase px-2 py-1 border transition-colors ${
                        op.archived ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      {op.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {operations.length === 0 && !editMode && (
          <div className="p-4 border border-white/10 bg-white/5 text-center font-mono text-[10px] text-white/40 uppercase">
            No permanent operations defined. Enter config mode to create.
          </div>
        )}
      </div>

      {/* Edit Mode Panel */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-white/10 bg-black/60 p-4 mt-4"
          >
            <h4 className="font-mono text-[10px] uppercase text-white/50 mb-3 tracking-widest">
              Create New Operation
            </h4>
            <form onSubmit={handleCreateOperation} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Operation Name"
                value={newOpName}
                onChange={(e) => setNewOpName(e.target.value)}
                className="bg-black/50 border border-white/10 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50 w-full sm:w-1/3"
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newOpDesc}
                onChange={(e) => setNewOpDesc(e.target.value)}
                className="bg-black/50 border border-white/10 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50 flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white/5 border border-white/10 font-mono text-xs uppercase text-white hover:bg-white/10 transition-colors"
              >
                Add
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-white/40 uppercase">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="accent-amber-400"
                />
                Show Archived Operations
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accountability Modal */}
      <AnimatePresence>
        {skipOpId && (
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
                Why was this operation skipped today?
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
                      setSkipReason("");
                      setSkipError(false);
                    }}
                    className="px-4 py-2 font-mono text-[10px] uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitSkip}
                    className="px-5 py-2 font-mono text-[10px] uppercase bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    Confirm Skip
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
