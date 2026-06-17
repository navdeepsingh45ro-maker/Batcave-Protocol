import type { ISODate, ISODateTime } from "../foundation";

// ── Quote Data Types ─────────────────────────────────────────────

export type QuoteCategory = "discipline" | "responsibility" | "persistence" | "leadership" | "growth";

export interface QuoteSource {
  name: string;
  origin: string;
}

export interface TransmissionQuote {
  id: string;
  text: string;
  source: QuoteSource;
  category: QuoteCategory;
  meaning: string;
  tags: string[];
}

// ── State → Category Mapping ─────────────────────────────────────

export type StateQuoteAffinity = Record<string, QuoteCategory[]>;

// ── Persistence Types ────────────────────────────────────────────

export interface DailyTransmission {
  date: ISODate;
  quoteId: string;
  category: QuoteCategory;
  viewedAt: ISODateTime;
}

export interface SavedQuote {
  quoteId: string;
  savedAt: ISODateTime;
}

export interface TransmissionState {
  /** IDs of quotes already shown (for rotation without repeat) */
  seenQuoteIds: string[];
  /** The current day's selected transmission */
  currentTransmission: DailyTransmission | null;
  /** User-saved favorites (Quote Arsenal) */
  arsenal: SavedQuote[];
}
