"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { selectDailyTransmission, getQuoteById } from "@/lib/daily-transmission/engine";
import { localTransmissionRepository } from "@/lib/daily-transmission/localStorageRepository";
import { QUOTE_LIBRARY } from "@/lib/daily-transmission/quotes";
import type { TransmissionQuote, QuoteCategory } from "@/lib/daily-transmission/types";
import type { ISODate } from "@/lib/foundation";
import { audioManager } from "@/lib/audioManager";

interface DailyTransmissionProps {
  todaysDate: ISODate;
  dominantState?: string | null;
}

const CATEGORY_LABELS: Record<QuoteCategory, { label: string; color: string }> = {
  discipline:     { label: "Discipline",     color: "text-signal border-signal/30 bg-signal/10" },
  responsibility: { label: "Responsibility", color: "text-sky-400 border-sky-400/30 bg-sky-400/10" },
  persistence:    { label: "Persistence",    color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  leadership:     { label: "Leadership",     color: "text-violet-400 border-violet-400/30 bg-violet-400/10" },
  growth:         { label: "Growth",         color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
};

export default function DailyTransmission({ todaysDate, dominantState }: DailyTransmissionProps) {
  const [quote, setQuote] = useState<TransmissionQuote | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showArsenal, setShowArsenal] = useState(false);
  const [arsenalQuotes, setArsenalQuotes] = useState<TransmissionQuote[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  // ── Load or generate today's transmission ──────────────────────
  useEffect(() => {
    const state = localTransmissionRepository.getState();
    const existing = localTransmissionRepository.getTodaysTransmission(todaysDate);

    if (existing) {
      // Already selected for today
      const q = getQuoteById(existing.quoteId);
      if (q) {
        setQuote(q);
        setIsSaved(localTransmissionRepository.isInArsenal(q.id));
        setIsRevealed(true);
        return;
      }
    }

    // Select new transmission for today
    const { quote: selectedQuote, category } = selectDailyTransmission(
      todaysDate,
      state,
      dominantState,
    );

    localTransmissionRepository.setTodaysTransmission({
      date: todaysDate,
      quoteId: selectedQuote.id,
      category,
      viewedAt: new Date().toISOString(),
    });

    setQuote(selectedQuote);
    setIsSaved(localTransmissionRepository.isInArsenal(selectedQuote.id));
    // Animate reveal for new transmissions
    setTimeout(() => setIsRevealed(true), 300);
  }, [todaysDate, dominantState]);

  // ── Load arsenal ───────────────────────────────────────────────
  const loadArsenal = useCallback(() => {
    const saved = localTransmissionRepository.getArsenal();
    const quotes = saved
      .map((s) => getQuoteById(s.quoteId))
      .filter((q): q is TransmissionQuote => q !== undefined);
    setArsenalQuotes(quotes);
  }, []);

  // ── Save / Unsave ──────────────────────────────────────────────
  const handleToggleSave = () => {
    if (!quote) return;
    if (isSaved) {
      localTransmissionRepository.removeFromArsenal(quote.id);
      setIsSaved(false);
    } else {
      localTransmissionRepository.saveToArsenal(quote.id);
      setIsSaved(true);
    }
    audioManager.playClick();
  };

  // ── Toggle Arsenal ─────────────────────────────────────────────
  const handleToggleArsenal = () => {
    if (!showArsenal) loadArsenal();
    setShowArsenal((prev) => !prev);
    audioManager.playClick();
  };

  const handleRemoveFromArsenal = (quoteId: string) => {
    localTransmissionRepository.removeFromArsenal(quoteId);
    if (quote && quoteId === quote.id) setIsSaved(false);
    loadArsenal();
    audioManager.playClick();
  };

  if (!quote) return null;

  const categoryInfo = CATEGORY_LABELS[quote.category];

  return (
    <div className="w-full mb-2">
      {/* ── Main Transmission ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="px-2"
      >
        <div className="flex flex-col space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
              Daily Transmission
            </p>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-[8px] uppercase tracking-wider ${categoryInfo.color.replace('border-', 'text-').replace('bg-', '')}`}>
                {categoryInfo.label}
              </span>
              <button
                type="button"
                onClick={handleToggleArsenal}
                className="font-mono text-[8px] uppercase tracking-wider text-white/25 hover:text-signal/60 transition-colors"
              >
                Arsenal {arsenalQuotes.length > 0 || showArsenal ? `(${localTransmissionRepository.getArsenal().length})` : ""}
              </button>
            </div>
          </div>

          {/* Quote */}
          <AnimatePresence mode="wait">
            {isRevealed && (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-2"
              >
                {/* The quote itself */}
                <div>
                  <p className="font-display text-sm sm:text-base text-white/50 leading-relaxed italic">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
                      — {quote.source.name} <span className="text-white/20 ml-1">· {quote.source.origin}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleToggleSave}
                      className={`font-mono text-[8px] uppercase tracking-wider transition-all duration-200 ${
                        isSaved
                          ? "text-signal"
                          : "text-white/20 hover:text-signal/50"
                      }`}
                    >
                      {isSaved ? "✓ Saved" : "Save"}
                    </button>
                  </div>
                </div>

                {/* Mission Interpretation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <p className="font-mono text-[9px] text-white/30 leading-relaxed">
                    <span className="text-white/20 mr-1">Interpretation:</span>{quote.meaning}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Quote Arsenal (expandable) ────────────────────────── */}
      <AnimatePresence>
        {showArsenal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 py-3 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                Quote Arsenal — Saved Transmissions
              </p>

              {arsenalQuotes.length === 0 && (
                <p className="font-mono text-[10px] text-white/20 text-center py-3">
                  No saved transmissions yet. Save quotes to build your arsenal.
                </p>
              )}

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {arsenalQuotes.map((aq) => {
                  const catInfo = CATEGORY_LABELS[aq.category];
                  return (
                    <div
                      key={aq.id}
                      className="border border-white/6 bg-white/[0.01] p-2.5 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-xs text-white/70 italic leading-relaxed flex-1">
                          &ldquo;{aq.text}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromArsenal(aq.id)}
                          className="font-mono text-[7px] text-signal/40 hover:text-signal uppercase tracking-wider transition-colors shrink-0 pt-0.5"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-white/30">
                          — {aq.source.name}
                        </span>
                        <span className={`px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
