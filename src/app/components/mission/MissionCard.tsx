"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionCardState } from "@/lib/mission-mode/types";
import type { MissionCardConfig } from "@/lib/mission-mode/types";

interface MissionCardProps {
  config: MissionCardConfig;
  state: MissionCardState;
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

export default function MissionCard({ config, state }: MissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[state.status];

  const completedTime = state.completedAt
    ? new Date(state.completedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <motion.div
      className={`mission-card relative border ${style.border} ${style.bg} transition-all duration-300`}
      layout
    >
      {/* Status accent line */}
      {state.status === "completed" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-emerald-400/60 shadow-[0_0_10px_rgba(72,187,120,0.3)]" />
      )}
      {state.status === "in-progress" && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-amber-400/60 shadow-[0_0_10px_rgba(212,165,67,0.3)]" />
      )}

      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg leading-none">{config.icon}</span>
            <div>
              <h3 className="font-display text-sm uppercase tracking-wider text-white">
                {config.label}
              </h3>
              <p className="font-mono text-[9px] text-white/30">{config.description}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
            <span className={`font-mono text-[10px] uppercase tracking-wider ${style.labelColor}`}>
              {style.label}
            </span>
          </div>
        </div>

        {/* Score & Time Row */}
        <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
              Score
            </p>
            <p className="font-display text-base tabular-nums text-white">
              {state.score}
              <span className="ml-0.5 font-mono text-[9px] text-white/30">/ {state.maxScore}</span>
            </p>
          </div>

          {completedTime && (
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">
                Completed
              </p>
              <p className="font-mono text-sm tabular-nums text-emerald-400/80">
                {completedTime}
              </p>
            </div>
          )}

          {/* Expand toggle */}
          {state.subtasks.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="ml-auto flex items-center gap-1 border border-white/8 bg-white/[0.02] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white/40 transition-all hover:border-white/15 hover:text-white/60"
            >
              {expanded ? "Collapse" : `${state.subtasks.length} Tasks`}
              <span
                className={`inline-block transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
          )}
        </div>

        {/* Expandable Subtasks */}
        <AnimatePresence>
          {expanded && state.subtasks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                {state.subtasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 font-mono text-[10px]"
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        task.completed ? "bg-emerald-400" : "bg-white/20"
                      }`}
                    />
                    <span
                      className={
                        task.completed ? "text-white/60" : "text-white/30"
                      }
                    >
                      {task.label}
                    </span>
                    {task.completedAt && (
                      <span className="ml-auto text-[9px] text-white/20">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
