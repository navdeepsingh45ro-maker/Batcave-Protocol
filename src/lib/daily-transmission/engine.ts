import type { TransmissionQuote, QuoteCategory, StateQuoteAffinity, DailyTransmission, TransmissionState } from "./types";
import type { ISODate } from "../foundation";
import { QUOTE_LIBRARY } from "./quotes";

// ── State → Quote Category Affinity ──────────────────────────────

const STATE_QUOTE_AFFINITY: StateQuoteAffinity = {
  // Positive states
  "Focused":     ["discipline", "leadership", "growth"],
  "Motivated":   ["discipline", "persistence", "growth"],
  "Confident":   ["leadership", "responsibility", "growth"],
  "Energized":   ["discipline", "persistence", "leadership"],
  "Calm":        ["growth", "leadership", "responsibility"],

  // Neutral states
  "Reflective":  ["growth", "responsibility", "leadership"],
  "Curious":     ["growth", "persistence", "leadership"],
  "Recovering":  ["persistence", "growth", "discipline"],
  "Uncertain":   ["persistence", "responsibility", "leadership"],

  // Negative states
  "Heavy":       ["persistence", "growth", "responsibility"],
  "Lonely":      ["responsibility", "growth", "persistence"],
  "Anxious":     ["discipline", "persistence", "growth"],
  "Overwhelmed": ["persistence", "discipline", "growth"],
  "Frustrated":  ["persistence", "discipline", "leadership"],
  "Fatigued":    ["growth", "persistence", "discipline"],
};

// ── Engine Functions ─────────────────────────────────────────────

/**
 * Select the daily transmission quote.
 * Uses date as seed for deterministic daily selection.
 * Avoids repeating until full library is exhausted.
 * Optionally personalizes by dominant state.
 */
export function selectDailyTransmission(
  date: ISODate,
  state: TransmissionState,
  dominantState?: string | null,
): { quote: TransmissionQuote; category: QuoteCategory } {
  // 1. Determine preferred categories based on state
  const preferredCategories: QuoteCategory[] = dominantState
    ? STATE_QUOTE_AFFINITY[dominantState] ?? ["discipline", "persistence", "growth"]
    : ["discipline", "persistence", "growth", "responsibility", "leadership"];

  // 2. Filter to unseen quotes first
  const seenSet = new Set(state.seenQuoteIds);
  let candidates = QUOTE_LIBRARY.filter((q) => !seenSet.has(q.id));

  // If all seen, reset rotation
  if (candidates.length === 0) {
    candidates = [...QUOTE_LIBRARY];
  }

  // 3. Prefer quotes matching the dominant state's category affinity
  const preferred = candidates.filter((q) => preferredCategories.includes(q.category));
  const pool = preferred.length > 0 ? preferred : candidates;

  // 4. Random selection (quote is locked per day via localStorage)
  const index = Math.floor(Math.random() * pool.length);
  const selectedQuote = pool[index];

  return {
    quote: selectedQuote,
    category: selectedQuote.category,
  };
}

/**
 * Get quotes by category for browsing.
 */
export function getQuotesByCategory(category: QuoteCategory): TransmissionQuote[] {
  return QUOTE_LIBRARY.filter((q) => q.category === category);
}

/**
 * Get a saved quote by ID.
 */
export function getQuoteById(id: string): TransmissionQuote | undefined {
  return QUOTE_LIBRARY.find((q) => q.id === id);
}
