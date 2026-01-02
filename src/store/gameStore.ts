/**
 * Game Store - Zustand State Management with Persistence
 * 
 * Central state store for the Match-3 game engine
 * Features team contribution system with progress tracking
 * Includes level progression, audio state, and haptics management
 * 
 * Persisted to AsyncStorage for "Forever Garden" experience
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Element, GamePhase, LevelState, ContributionParticle, LevelConfig } from '../types';
import { getFirstLevel, getNextLevel, getLevelById } from '../data';

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
  
  // Level Management
  currentLevel: number;           // Current level ID
  currentLevelConfig: LevelConfig; // Current level configuration
  
  // Audio & Haptics State
  isMuted: boolean;               // Global mute state (Nature Sounds)
  isHapticsEnabled: boolean;      // Tactile Feel toggle
  
  // Hydration State
  _hasHydrated: boolean;          // True after persistence has loaded
  
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
  
  // Level Management Actions
  setCurrentLevel: (levelId: number) => void;
  nextLevel: () => boolean;       // Returns false if no next level
  restartLevel: () => void;
  
  // Audio & Haptics Actions
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleHaptics: () => void;
  
  // Storage Actions
  clearAllData: () => void;       // Reset Garden (debug)
  setHasHydrated: (state: boolean) => void;
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const firstLevel = getFirstLevel();

// ============================================================================
// INITIAL STATE (non-persisted fields reset on load)
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
  moves: firstLevel.moves,
  maxMoves: firstLevel.moves,
  levelState: 'PLAYING' as LevelState,
  currentLevel: firstLevel.id,
  currentLevelConfig: firstLevel,
  isMuted: false,
  isHapticsEnabled: true,
  _hasHydrated: false,
};

// ============================================================================
// STORE CREATION WITH PERSISTENCE
// ============================================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Hydration setter
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

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

      // Full reset (preserves settings, resets progress)
      resetGame: () => {
        const { highScore, isMuted, isHapticsEnabled } = get();
        const level = getFirstLevel();
        set({
          ...initialState,
          highScore,
          isMuted,
          isHapticsEnabled,
          currentLevel: level.id,
          currentLevelConfig: level,
          moves: level.moves,
          maxMoves: level.moves,
          _hasHydrated: true,
        });
      },

      // Team Contribution Actions
      addContribution: (points: number) => {
        const { score, isLevelComplete, currentLevelConfig } = get();
        
        // Don't add contribution if level is already complete
        if (isLevelComplete) return;
        
        const newScore = score + points;
        const targetScore = currentLevelConfig.targetProgress;
        const newProgress = Math.min(newScore / targetScore, 1);
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

      // Level Management Actions
      setCurrentLevel: (levelId: number) => {
        const levelConfig = getLevelById(levelId);
        if (!levelConfig) {
          console.warn(`[GameStore] Level ${levelId} not found`);
          return;
        }
        
        set({
          currentLevel: levelId,
          currentLevelConfig: levelConfig,
          moves: levelConfig.moves,
          maxMoves: levelConfig.moves,
          score: 0,
          teamProgress: 0,
          isLevelComplete: false,
          levelState: 'PLAYING',
          combo: 0,
          selectedIndex: -1,
          grid: [],
          contributionParticles: [],
        });
      },

      nextLevel: () => {
        const { currentLevel, highScore, isMuted, isHapticsEnabled } = get();
        const nextLevelConfig = getNextLevel(currentLevel);
        
        if (!nextLevelConfig) {
          // No more levels - player completed the game!
          return false;
        }
        
        set({
          currentLevel: nextLevelConfig.id,
          currentLevelConfig: nextLevelConfig,
          moves: nextLevelConfig.moves,
          maxMoves: nextLevelConfig.moves,
          score: 0,
          teamProgress: 0,
          isLevelComplete: false,
          levelState: 'PLAYING',
          combo: 0,
          selectedIndex: -1,
          grid: [],
          contributionParticles: [],
          highScore,
          isMuted,
          isHapticsEnabled,
        });
        
        return true;
      },

      restartLevel: () => {
        const { currentLevelConfig, highScore, isMuted, isHapticsEnabled } = get();
        
        set({
          moves: currentLevelConfig.moves,
          maxMoves: currentLevelConfig.moves,
          score: 0,
          teamProgress: 0,
          isLevelComplete: false,
          levelState: 'PLAYING',
          combo: 0,
          selectedIndex: -1,
          grid: [],
          contributionParticles: [],
          highScore,
          isMuted,
          isHapticsEnabled,
        });
      },

      // Audio Actions
      setMuted: (muted: boolean) => {
        set({ isMuted: muted });
      },

      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },

      // Haptics Actions
      setHapticsEnabled: (enabled: boolean) => {
        set({ isHapticsEnabled: enabled });
      },

      toggleHaptics: () => {
        set((state) => ({ isHapticsEnabled: !state.isHapticsEnabled }));
      },

      // Clear all persisted data (Reset Garden)
      clearAllData: () => {
        const level = getFirstLevel();
        set({
          ...initialState,
          currentLevel: level.id,
          currentLevelConfig: level,
          moves: level.moves,
          maxMoves: level.moves,
          highScore: 0,
          isMuted: false,
          isHapticsEnabled: true,
          _hasHydrated: true,
        });
      },
    }),
    {
      name: 'match-and-bloom-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data, not ephemeral game state
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        highScore: state.highScore,
        isMuted: state.isMuted,
        isHapticsEnabled: state.isHapticsEnabled,
        // Persist level progress so player can resume mid-level
        teamProgress: state.teamProgress,
        moves: state.moves,
        score: state.score,
      }),
      // Rehydrate level config from persisted level ID
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore the level config from the persisted level ID
          const levelConfig = getLevelById(state.currentLevel) || getFirstLevel();
          state.currentLevelConfig = levelConfig;
          state.maxMoves = levelConfig.moves;
          state._hasHydrated = true;
        }
      },
    }
  )
);

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
export const selectCurrentLevel = (state: GameStore) => state.currentLevel;
export const selectCurrentLevelConfig = (state: GameStore) => state.currentLevelConfig;
export const selectIsMuted = (state: GameStore) => state.isMuted;
export const selectIsHapticsEnabled = (state: GameStore) => state.isHapticsEnabled;
export const selectHasHydrated = (state: GameStore) => state._hasHydrated;
