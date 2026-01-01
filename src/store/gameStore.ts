/**
 * Game Store - Zustand State Management
 * 
 * Central state store for the Match-3 game engine
 */

import { create } from 'zustand';
import { Element, GamePhase, TOTAL_CELLS } from '../types';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface GameStore {
  // State
  grid: Element[];
  phase: GamePhase;
  selectedIndex: number;
  score: number;
  combo: number;
  highScore: number;
  
  // Actions
  setGrid: (grid: Element[]) => void;
  setPhase: (phase: GamePhase) => void;
  setSelectedIndex: (index: number) => void;
  addScore: (points: number) => void;
  resetScore: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  resetGame: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  grid: [] as Element[],
  phase: 'IDLE' as GamePhase,
  selectedIndex: -1,
  score: 0,
  combo: 0,
  highScore: 0,
};

// ============================================================================
// STORE CREATION
// ============================================================================

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ...initialState,

  // Grid management
  setGrid: (grid: Element[]) => set({ grid }),

  // Phase management
  setPhase: (phase: GamePhase) => set({ phase }),

  // Selection management
  setSelectedIndex: (index: number) => set({ selectedIndex: index }),

  // Score management
  addScore: (points: number) => {
    const { score, highScore } = get();
    const newScore = score + points;
    set({
      score: newScore,
      highScore: Math.max(highScore, newScore),
    });
  },

  resetScore: () => set({ score: 0 }),

  // Combo management
  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),
  
  resetCombo: () => set({ combo: 0 }),

  // Full reset
  resetGame: () => set({
    ...initialState,
    highScore: get().highScore, // Preserve high score
  }),
}));

// ============================================================================
// SELECTORS (for optimized re-renders)
// ============================================================================

export const selectGrid = (state: GameStore) => state.grid;
export const selectPhase = (state: GameStore) => state.phase;
export const selectScore = (state: GameStore) => state.score;
export const selectCombo = (state: GameStore) => state.combo;
export const selectSelectedIndex = (state: GameStore) => state.selectedIndex;
export const selectHighScore = (state: GameStore) => state.highScore;
