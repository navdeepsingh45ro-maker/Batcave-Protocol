"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audioManager";
import type { ISODate } from "@/lib/foundation/types";

interface Props {
  todaysDate: ISODate;
}

const MISSION_STORAGE_KEY = "batcave.daily_mission";

export default function DailyMission({ todaysDate }: Props) {
  const [mission, setMission] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(MISSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todaysDate) {
          setMission(parsed.text);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [todaysDate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playClick();
    if (typeof window !== "undefined") {
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify({ date: todaysDate, text: mission.trim() }));
    }
    setIsEditing(false);
  };

  if (!isEditing && !mission) {
    return (
      <div 
        onClick={() => {
          audioManager.playClick();
          setIsEditing(true);
        }}
        className="border border-white/5 bg-black/20 p-6 cursor-pointer hover:bg-white/[0.02] transition-colors text-center border-dashed"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors">
          + Set Optional Daily Mission
        </span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/5 bg-black/40 p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/60" />
      
      <div className="flex justify-between items-start pl-2">
        <div className="flex-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2">
            Primary Objective / {todaysDate}
          </p>
          {isEditing ? (
            <form onSubmit={handleSave} className="flex gap-3 mt-2">
              <input
                type="text"
                autoFocus
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Enter today's mission..."
                className="flex-1 bg-black/60 border border-amber-500/30 text-amber-100 font-display text-lg px-4 py-2 outline-none focus:border-amber-400 transition-colors"
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-xs uppercase hover:bg-amber-500/20 transition-colors tracking-widest"
              >
                Lock
              </button>
            </form>
          ) : (
            <h2 
              onClick={() => {
                audioManager.playClick();
                setIsEditing(true);
              }}
              className="font-display text-2xl uppercase tracking-wider text-amber-400 cursor-pointer hover:text-amber-300 transition-colors drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]"
            >
              {mission}
            </h2>
          )}
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              audioManager.playClick();
              setIsEditing(true);
            }}
            className="text-white/20 hover:text-white/50 font-mono text-[10px] uppercase tracking-widest ml-4 mt-1 transition-colors opacity-0 group-hover:opacity-100"
          >
            Edit
          </button>
        )}
      </div>
    </motion.div>
  );
}
