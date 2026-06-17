import type { TransmissionState, SavedQuote, DailyTransmission } from "./types";
import type { ISODate } from "../foundation";

const STORAGE_KEY = "batcave.daily-transmission.v1";

function now(): string {
  return new Date().toISOString();
}

function readState(): TransmissionState {
  if (typeof window === "undefined") {
    return { seenQuoteIds: [], currentTransmission: null, arsenal: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { seenQuoteIds: [], currentTransmission: null, arsenal: [] };
    return JSON.parse(raw) as TransmissionState;
  } catch {
    return { seenQuoteIds: [], currentTransmission: null, arsenal: [] };
  }
}

function writeState(state: TransmissionState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const localTransmissionRepository = {
  /** Get current persisted state */
  getState(): TransmissionState {
    return readState();
  },

  /** Get today's transmission if already selected */
  getTodaysTransmission(date: ISODate): DailyTransmission | null {
    const state = readState();
    if (state.currentTransmission?.date === date) {
      return state.currentTransmission;
    }
    return null;
  },

  /** Store today's selected transmission and mark quote as seen */
  setTodaysTransmission(transmission: DailyTransmission): void {
    const state = readState();
    state.currentTransmission = transmission;
    // Add to seen list if not already there
    if (!state.seenQuoteIds.includes(transmission.quoteId)) {
      state.seenQuoteIds.push(transmission.quoteId);
    }
    writeState(state);
  },

  /** Reset seen quotes (when full library exhausted) */
  resetSeenQuotes(): void {
    const state = readState();
    state.seenQuoteIds = [];
    writeState(state);
  },

  /** Save a quote to the Arsenal */
  saveToArsenal(quoteId: string): void {
    const state = readState();
    if (state.arsenal.some((s) => s.quoteId === quoteId)) return; // Already saved
    state.arsenal.push({ quoteId, savedAt: now() });
    writeState(state);
  },

  /** Remove a quote from the Arsenal */
  removeFromArsenal(quoteId: string): void {
    const state = readState();
    state.arsenal = state.arsenal.filter((s) => s.quoteId !== quoteId);
    writeState(state);
  },

  /** Get all saved Arsenal quotes */
  getArsenal(): SavedQuote[] {
    return readState().arsenal;
  },

  /** Check if a quote is saved */
  isInArsenal(quoteId: string): boolean {
    return readState().arsenal.some((s) => s.quoteId === quoteId);
  },
};
