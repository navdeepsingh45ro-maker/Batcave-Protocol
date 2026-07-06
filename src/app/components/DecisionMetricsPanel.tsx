"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { decisionRepo, decisionUsageRepo } from "@/lib/belief-intelligence";
import type { DecisionMatrixEntry } from "@/lib/belief-intelligence/types";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/state-detection";

interface DecisionMetricsPanelProps {
  todaysDate: ISODate;
  refreshKey?: number;
}

export default function DecisionMetricsPanel({ todaysDate, refreshKey }: DecisionMetricsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [decisions, setDecisions]                 = useState<DecisionMatrixEntry[]>([]);
  const [evidenceInputs, setEvidenceInputs]       = useState<Record<string, string>>({});

  // Form states
  const [newRecurringThought, setNewRecurringThought] = useState("");
  const [newLimitingBelief, setNewLimitingBelief]     = useState("");
  const [newDecision, setNewDecision]                 = useState("");
  const [newEmpoweringBelief, setNewEmpoweringBelief] = useState("");
  const [newEvidence, setNewEvidence]                 = useState("");

  const refreshDecisions = useCallback(() => {
    setDecisions(decisionRepo.list().filter((d) => !d.archived));
  }, []);

  useEffect(() => {
    refreshDecisions();
  }, [refreshDecisions, refreshKey]);

  const usageCountMap = useMemo(() => decisionUsageRepo.usageCountMap(), [decisions]);

  const handleAddDecision = () => {
    if (!newLimitingBelief.trim() || !newDecision.trim()) return;
    decisionRepo.create({
      recurringThought:    newRecurringThought.trim() || null,
      limitingBelief:      newLimitingBelief.trim(),
      newDecision:         newDecision.trim(),
      newEmpoweringBelief: newEmpoweringBelief.trim() || null,
      evidence:            newEvidence.trim() ? [newEvidence.trim()] : [],
    });
    refreshDecisions();
    setNewRecurringThought("");
    setNewLimitingBelief("");
    setNewDecision("");
    setNewEmpoweringBelief("");
    setNewEvidence("");
    audioManager.playToggle();
  };

  const handleAddEvidence = (id: string) => {
    const text = evidenceInputs[id]?.trim();
    if (!text) return;
    decisionRepo.addEvidence({ decisionId: id, evidence: text });
    setEvidenceInputs((prev) => ({ ...prev, [id]: "" }));
    refreshDecisions();
    audioManager.playClick();
  };

  const handleRemoveEvidence = (id: string, idx: number) => {
    decisionRepo.removeEvidence({ decisionId: id, evidenceIndex: idx });
    refreshDecisions();
    audioManager.playClick();
  };

  const handleArchiveEntry = (id: string) => {
    decisionRepo.update({ id, archived: true });
    refreshDecisions();
    audioManager.playToggle();
  };

  const handleTrackUsage = (id: string) => {
    decisionUsageRepo.track({
      decisionId: id,
      usedAt:     new Date().toISOString(),
    });
    refreshDecisions();
    audioManager.playClick();
  };

  return (
    <div className="panel flex min-h-0 flex-col p-4 relative bg-black/40 border-white/8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div 
        onClick={() => {
          audioManager.playClick();
          setIsCollapsed(!isCollapsed);
        }}
        className="mb-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-frost/70">
            System 2 — Belief Mapping
          </p>
          <h2 className="font-display text-lg uppercase text-frost flex items-center gap-2">
            <span>Decision Metrics</span>
            <span className="text-white/20 text-xs">{isCollapsed ? "▼" : "▲"}</span>
          </h2>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden"
            key="decision-metrics-expanded"
          >
            {/* Create belief mapping form */}
            <div className="border border-white/5 bg-black/35 p-3 space-y-2 font-mono text-xs">
              <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-1">Add Belief Mapping</span>
              
              <input 
                type="text" 
                placeholder="Recurring / Dominant Thought"
                value={newRecurringThought} 
                onChange={(e) => setNewRecurringThought(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-frost/45 focus:outline-none" 
              />
              <input 
                type="text" 
                placeholder="Limiting Belief *"
                value={newLimitingBelief} 
                onChange={(e) => setNewLimitingBelief(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-frost/45 focus:outline-none" 
              />
              <input 
                type="text" 
                placeholder="Counter Decision (Actionable) *"
                value={newDecision} 
                onChange={(e) => setNewDecision(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-frost/45 focus:outline-none" 
              />
              <input 
                type="text" 
                placeholder="Empowering Belief"
                value={newEmpoweringBelief} 
                onChange={(e) => setNewEmpoweringBelief(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-frost/45 focus:outline-none" 
              />
              <input 
                type="text" 
                placeholder="Initial Supporting Evidence"
                value={newEvidence} 
                onChange={(e) => setNewEvidence(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white placeholder-white/20 focus:border-frost/45 focus:outline-none" 
              />
              
              <button 
                type="button" 
                onClick={handleAddDecision}
                disabled={!newLimitingBelief.trim() || !newDecision.trim()}
                className="w-full py-1.5 bg-signal/15 border border-signal/30 text-signal font-mono text-xs uppercase tracking-wider hover:bg-signal/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Commit Matrix Entry
              </button>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[400px]">
              {decisions.length === 0 ? (
                <p className="font-mono text-xs text-white/25 text-center py-6">No matrix entries committed.</p>
              ) : (
                decisions.map((dec) => (
                  <div key={dec.id} className="border border-white/5 bg-white/[0.01] p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleTrackUsage(dec.id)}
                        className="font-display text-[9px] uppercase tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 hover:bg-emerald-500/10 transition-colors"
                      >
                        {usageCountMap[dec.id] ?? 0}× Active Recall
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleArchiveEntry(dec.id)}
                        className="font-mono text-[8px] text-white/25 hover:text-signal transition-colors uppercase tracking-wider"
                      >
                        Archive ↓
                      </button>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      {dec.recurringThought && (
                        <div>
                          <span className="text-white/25 text-[9px] uppercase tracking-widest block">Recurring Thought</span>
                          <span className="text-signal/90 font-medium">"{dec.recurringThought}"</span>
                        </div>
                      )}
                      <div>
                        <span className="text-white/25 text-[9px] uppercase tracking-widest block">Limiting Belief</span>
                        <span className="text-signal/70">"{dec.limitingBelief}"</span>
                      </div>
                      <div>
                        <span className="text-white/25 text-[9px] uppercase tracking-widest block">Counter Decision</span>
                        <span className="text-frost font-bold">"{dec.newDecision}"</span>
                      </div>
                      {dec.newEmpoweringBelief && (
                        <div>
                          <span className="text-white/25 text-[9px] uppercase tracking-widest block">Empowering Belief</span>
                          <span className="text-emerald-400">"{dec.newEmpoweringBelief}"</span>
                        </div>
                      )}

                      {/* Evidence */}
                      <div className="pt-2">
                        <span className="text-white/25 text-[9px] uppercase tracking-widest block mb-1">Evidences</span>
                        {(!dec.evidence || dec.evidence.length === 0) ? (
                          <span className="text-[10px] text-white/20 italic block pl-1">No evidences recorded yet.</span>
                        ) : (
                          <div className="space-y-1 pl-1.5 border-l border-white/5">
                            {dec.evidence.map((ev, idx) => (
                              <div key={idx} className="flex justify-between items-center gap-2 group">
                                <span className="text-[10px] text-white/60">• {ev}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEvidence(dec.id, idx)}
                                  className="text-[9px] text-white/25 opacity-0 group-hover:opacity-100 hover:text-signal transition-all"
                                >
                                  × Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add evidence input */}
                        <div className="flex gap-1.5 mt-2">
                          <input 
                            type="text" 
                            placeholder="Record supportive evidence..."
                            value={evidenceInputs[dec.id] ?? ""}
                            onChange={(e) => setEvidenceInputs((p) => ({ ...p, [dec.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddEvidence(dec.id); }}
                            className="flex-1 bg-black/40 border border-white/5 px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-frost/45" 
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddEvidence(dec.id)}
                            className="px-2 py-0.5 border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] text-white/50 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
