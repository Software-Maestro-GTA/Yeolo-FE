/**
 * @file taste.ts
 * @description Zustand global store for managing taste preference analysis states.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import { create } from 'zustand';

interface TasteState {
  /**
   * The UUID of the successfully completed taste profile analysis.
   */
  tasteProfileId: string | null;
  /**
   * Action to update the taste profile ID.
   */
  setTasteProfileId: (id: string | null) => void;
  /**
   * Action to clear the taste profile ID.
   */
  clearTasteProfileId: () => void;
}

export const useTasteStore = create<TasteState>((set) => ({
  tasteProfileId: null,
  setTasteProfileId: (id) => set({ tasteProfileId: id }),
  clearTasteProfileId: () => set({ tasteProfileId: null }),
}));
