/**
 * Game Store - Zustand State Management
 * 
 * Central state store for the Match-3 game engine
 * Features team contribution system with progress tracking
 */

import { create } from 'zustand';
import { Element, GamePhase, LevelState, ContributionParticle, TOTAL_CELLS, CONTRIBUTION_CONFIG } from '../types';

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
  teamProgress: number;           // 0-100% contribution progress
  isLevelComplete: boolean;       // Win state
  contributionParticles: ContributionParticle[]; // Active particles
  moves: number;                  // Remaining moves
  maxMoves: number;               // Starting moves for the level
  levelState: LevelState;         // PLAYING, WON, or LOST
  
  // Actions
  setGrid: (grid: Element[]) => void;
  setPhase: (phase: GamePhase) => void;
  setSelectedIndex: (index: number) => void;
  addScore: (points: number) => void;
  resetScore: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  resetGame: () => void;
  
  // Team Contribution Actions
  addContribution: (points: number) => void;
  addContributionParticle: (particle: ContributionParticle) => void;
  removeContributionParticle: (id: string) => void;
  clearContributionParticles: () => void;
  
  // Move Actions
  decrementMoves: () => void;
  addMoves: (count: number) => void;
  setLevelState: (state: LevelState) => void;
  checkWinLossCondition: () => void;
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const DEFAULT_MAX_MOVES = 20;

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
  teamProgress: 0,
  isLevelComplete: false,
  contributionParticles: [] as ContributionParticle[],
  moves: DEFAULT_MAX_MOVES,
  maxMoves: DEFAULT_MAX_MOVES,
  levelState: 'PLAYING' as LevelState,
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
    contributionParticles: [],
  }),

  // Team Contribution Actions
  addContribution: (points: number) => {
    const { score, teamProgress, isLevelComplete } = get();
    
    // Don't add contribution if level is already complete
    if (isLevelComplete) return;
    
    const newScore = score + points;
    const newProgress = Math.min(newScore / CONTRIBUTION_CONFIG.targetScore, 1);
    const isComplete = newProgress >= 1;
    
    set({
      score: newScore,
      teamProgress: newProgress,
      isLevelComplete: isComplete,
      highScore: Math.max(get().highScore, newScore),
    });
  },

  addContributionParticle: (particle: ContributionParticle) => {
    set((state) => ({
      contributionParticles: [...state.contributionParticles, particle],
    }));
  },

  removeContributionParticle: (id: string) => {
    set((state) => ({
      contributionParticles: state.contributionParticles.filter(p => p.id !== id),
    }));
  },

  clearContributionParticles: () => {
    set({ contributionParticles: [] });
  },

  // Move Actions
  decrementMoves: () => {
    const { moves, levelState } = get();
    if (levelState !== 'PLAYING') return;
    
    const newMoves = Math.max(moves - 1, 0);
    set({ moves: newMoves });
    
    // Check win/loss after move decrement
    get().checkWinLossCondition();
  },

  addMoves: (count: number) => {
    set((state) => ({
      moves: state.moves + count,
      levelState: 'PLAYING' as LevelState, // Resume playing when moves added
    }));
  },

  setLevelState: (levelState: LevelState) => {
    set({ levelState });
  },

  checkWinLossCondition: () => {
    const { teamProgress, moves, levelState } = get();
    
    // Skip if already resolved
    if (levelState !== 'PLAYING') return;
    
    // Win: teamProgress >= 100%
    if (teamProgress >= 1) {
      set({ 
        levelState: 'WON',
        isLevelComplete: true,
      });
      return;
    }
    
    // Loss: moves == 0 AND teamProgress < 100%
    if (moves === 0 && teamProgress < 1) {
      set({ levelState: 'LOST' });
      return;
    }
  },
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
export const selectTeamProgress = (state: GameStore) => state.teamProgress;
export const selectIsLevelComplete = (state: GameStore) => state.isLevelComplete;
export const selectContributionParticles = (state: GameStore) => state.contributionParticles;
export const selectMoves = (state: GameStore) => state.moves;
export const selectMaxMoves = (state: GameStore) => state.maxMoves;
export const selectLevelState = (state: GameStore) => state.levelState;
