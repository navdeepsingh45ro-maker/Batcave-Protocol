"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audioManager";
import { protocolRepository, type ProtocolLog } from "@/lib/protocol-engine";

export default function ProtocolDispatch() {
  const [activeProtocol, setActiveProtocol] = useState<ProtocolLog | undefined>();

  const loadProtocol = () => {
    setActiveProtocol(protocolRepository.getActiveProtocol());
  };

  useEffect(() => {
    loadProtocol();
    const handler = () => loadProtocol();
    window.addEventListener("protocol_logs_updated", handler);
    return () => window.removeEventListener("protocol_logs_updated", handler);
  }, []);

  const handleAccept = () => {
    if (!activeProtocol) return;
    audioManager.playClick();
    protocolRepository.updateProtocolStatus(activeProtocol.id, "Accepted", { acceptedAt: new Date().toISOString() });
  };

  const handleExecute = () => {
    if (!activeProtocol) return;
    audioManager.playToggle();
    protocolRepository.updateProtocolStatus(activeProtocol.id, "Active", { startedAt: new Date().toISOString() });
    
    // If it requires focus, trigger focus timer logic here (or via global state/events if timer is separate).
    // The requirement says "Start Focus Timer" naturally if Execution/Planning.
    if (["Execution", "Planning"].includes(activeProtocol.category)) {
      window.dispatchEvent(new CustomEvent("start_focus_timer", { detail: { protocolId: activeProtocol.id } }));
    }
  };

  const handleFinish = (status: "Completed" | "Failed" | "Abandoned") => {
    if (!activeProtocol) return;
    
    if (status === "Completed") audioManager.playCheckinComplete();
    else audioManager.playClick();

    const now = new Date();
    const started = activeProtocol.startedAt ? new Date(activeProtocol.startedAt) : now;
    const diffMins = Math.round((now.getTime() - started.getTime()) / 60000);

    protocolRepository.updateProtocolStatus(activeProtocol.id, status, { 
      finishedAt: now.toISOString(),
      durationMinutes: diffMins,
    });
  };

  if (!activeProtocol || ["Completed", "Failed", "Abandoned"].includes(activeProtocol.status)) {
    return null; // Don't show if no active protocol
  }

  const { status, protocolName, selectionReason, category } = activeProtocol;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="border border-emerald-500/50 bg-emerald-500/5 p-5 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden my-4"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 animate-pulse" />

        <div className="pl-2">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-display text-xl uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <span className="text-sm">⚡</span> Protocol Dispatch
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400/50 border border-emerald-500/30 px-2 py-1">
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="border border-emerald-500/20 bg-black/40 p-3">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-emerald-400/60 mb-1">
                Current Protocol
              </span>
              <span className="font-mono text-sm text-white font-bold uppercase block">
                {protocolName}
              </span>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block mt-1">
                Category: {category}
              </span>
            </div>
            
            <div className="border border-white/10 bg-black/40 p-3">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-white/40 mb-1">
                Selection Reason
              </span>
              <span className="font-mono text-xs text-white/80 uppercase">
                {selectionReason}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {status === "Triggered" || status === "Selected" ? (
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Accept Protocol
              </button>
            ) : status === "Accepted" ? (
              <button
                onClick={handleExecute}
                className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Execute
              </button>
            ) : status === "Active" ? (
              <>
                <button
                  onClick={() => handleFinish("Completed")}
                  className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleFinish("Failed")}
                  className="px-6 py-2.5 bg-signal/10 border border-signal/50 text-signal font-mono text-xs uppercase tracking-widest hover:bg-signal/20 transition-colors"
                >
                  Failed
                </button>
                <button
                  onClick={() => handleFinish("Abandoned")}
                  className="px-6 py-2.5 bg-black/50 border border-white/20 text-white/40 font-mono text-xs uppercase tracking-widest hover:text-white/80 hover:border-white/40 transition-colors"
                >
                  Abandon
                </button>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
