/**
 * useMatch3Engine - Core Match-3 Game Logic Hook
 * 
 * Manages the 8x8 grid as a 1D array with state machine:
 * IDLE -> SWAPPING -> MATCHING -> FALLING -> REFILLING
 * 
 * Uses flood-fill algorithm for match detection (3+ connected same-color elements)
 * Features swipe input support, contribution particle emission, and level config support
 */

import { useCallback, useRef, useState } from 'react';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Element,
  ElementColor,
  GamePhase,
  LevelState,
  MatchResult,
  GRID_SIZE,
  TOTAL_CELLS,
  MIN_MATCH,
  ALL_ELEMENT_TYPES,
  areAdjacent,
  isValidIndex,
  indexToPosition,
  positionToIndex,
  ContributionParticle,
  MatchEvent,
  CellType,
  LevelConfig,
} from '../types';
import { useGameStore } from '../store/gameStore';
import { soundManager, getChimeForCombo } from '../utils';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique element ID
 */
function generateElementId(): string {
  return `element_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get random element color
 */
function getRandomColor(): ElementColor {
  return ALL_ELEMENT_TYPES[Math.floor(Math.random() * ALL_ELEMENT_TYPES.length)];
}

/**
 * Create a new element at the specified index
 */
function createElement(index: number, color?: ElementColor): Element {
  return {
    id: generateElementId(),
    color: color ?? getRandomColor(),
    index,
    isMatched: false,
    isSelected: false,
  };
}

/**
 * Check if placing a color at index would create an immediate match
 */
function wouldCreateMatch(grid: (Element | null)[], index: number, color: ElementColor): boolean {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;

  if (col >= 2) {
    const left1 = grid[index - 1];
    const left2 = grid[index - 2];
    if (left1?.color === color && left2?.color === color) {
      return true;
    }
  }

  if (row >= 2) {
    const up1 = grid[index - GRID_SIZE];
    const up2 = grid[index - 2 * GRID_SIZE];
    if (up1?.color === color && up2?.color === color) {
      return true;
    }
  }

  return false;
}

/**
 * Generate initial grid without any matches
 * Supports LevelConfig for obstacles (rocks, locks)
 */
function generateInitialGrid(levelConfig?: LevelConfig): Element[] {
  const grid: (Element | null)[] = new Array(TOTAL_CELLS).fill(null);

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    
    // Check if this cell has a special type from level config
    let cellType = CellType.RANDOM;
    if (levelConfig?.grid && levelConfig.grid[row] && levelConfig.grid[row][col] !== undefined) {
      cellType = levelConfig.grid[row][col];
    }
    
    // Handle cell types
    if (cellType === CellType.ROCK) {
      // Rocks are represented as special elements that can't be matched
      // For now, we'll skip them - they need special rendering
      // TODO: Implement rock element type
      grid[i] = createElement(i); // Placeholder - will be replaced with rock element
    } else if (cellType === CellType.LOCK) {
      // Locked elements need to be unlocked before they can be moved
      // TODO: Implement locked element state
      grid[i] = createElement(i); // Placeholder - will add isLocked property
    } else {
      // Random element - avoid creating matches
      let color = getRandomColor();
      let attempts = 0;
      const maxAttempts = 20;

      while (wouldCreateMatch(grid, i, color) && attempts < maxAttempts) {
        color = getRandomColor();
        attempts++;
      }

      grid[i] = createElement(i, color);
    }
  }

  return grid as Element[];
}

// ============================================================================
// FLOOD FILL MATCH DETECTION
// ============================================================================

/**
 * Find all horizontal matches in the grid
 */
function findHorizontalMatches(grid: Element[]): Set<number> {
  const matched = new Set<number>();

  for (let row = 0; row < GRID_SIZE; row++) {
    let matchStart = 0;
    let matchColor = grid[row * GRID_SIZE].color;
    let matchLength = 1;

    for (let col = 1; col < GRID_SIZE; col++) {
      const index = row * GRID_SIZE + col;
      const element = grid[index];

      if (element.color === matchColor) {
        matchLength++;
      } else {
        if (matchLength >= MIN_MATCH) {
          for (let i = matchStart; i < col; i++) {
            matched.add(row * GRID_SIZE + i);
          }
        }
        matchStart = col;
        matchColor = element.color;
        matchLength = 1;
      }
    }

    if (matchLength >= MIN_MATCH) {
      for (let i = matchStart; i < GRID_SIZE; i++) {
        matched.add(row * GRID_SIZE + i);
      }
    }
  }

  return matched;
}

/**
 * Find all vertical matches in the grid
 */
function findVerticalMatches(grid: Element[]): Set<number> {
  const matched = new Set<number>();

  for (let col = 0; col < GRID_SIZE; col++) {
    let matchStart = 0;
    let matchColor = grid[col].color;
    let matchLength = 1;

    for (let row = 1; row < GRID_SIZE; row++) {
      const index = row * GRID_SIZE + col;
      const element = grid[index];

      if (element.color === matchColor) {
        matchLength++;
      } else {
        if (matchLength >= MIN_MATCH) {
          for (let i = matchStart; i < row; i++) {
            matched.add(i * GRID_SIZE + col);
          }
        }
        matchStart = row;
        matchColor = element.color;
        matchLength = 1;
      }
    }

    if (matchLength >= MIN_MATCH) {
      for (let i = matchStart; i < GRID_SIZE; i++) {
        matched.add(i * GRID_SIZE + col);
      }
    }
  }

  return matched;
}

/**
 * Flood fill to find connected matches
 */
function floodFill(grid: Element[], startIndex: number, visited: Set<number>): number[] {
  const connected: number[] = [];
  const queue: number[] = [startIndex];
  const targetColor = grid[startIndex].color;

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current)) continue;
    visited.add(current);

    const element = grid[current];
    if (element.color !== targetColor) continue;

    connected.push(current);

    const { row, col } = indexToPosition(current);
    
    const neighbors = [
      row > 0 ? positionToIndex(row - 1, col) : -1,
      row < GRID_SIZE - 1 ? positionToIndex(row + 1, col) : -1,
      col > 0 ? positionToIndex(row, col - 1) : -1,
      col < GRID_SIZE - 1 ? positionToIndex(row, col + 1) : -1,
    ];

    for (const neighbor of neighbors) {
      if (neighbor >= 0 && !visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return connected;
}

/**
 * Main match detection combining horizontal, vertical, and flood fill
 */
function detectAllMatches(grid: Element[]): MatchResult[] {
  const horizontalMatches = findHorizontalMatches(grid);
  const verticalMatches = findVerticalMatches(grid);
  
  const allMatched = new Set([...horizontalMatches, ...verticalMatches]);
  
  if (allMatched.size === 0) {
    return [];
  }

  const results: MatchResult[] = [];
  const processed = new Set<number>();

  for (const index of allMatched) {
    if (processed.has(index)) continue;

    const connected = floodFill(grid, index, new Set());
    const matchedConnected = connected.filter(i => allMatched.has(i));
    
    matchedConnected.forEach(i => processed.add(i));

    if (matchedConnected.length >= MIN_MATCH) {
      results.push({
        matchedIndices: matchedConnected,
        count: matchedConnected.length,
        isSpecial: matchedConnected.length >= 4,
      });
    }
  }

  return results;
}

/**
 * Calculate center position of matched indices for particle emission
 */
function getMatchCenterPosition(matchedIndices: number[]): { x: number; y: number } {
  let totalX = 0;
  let totalY = 0;

  for (const index of matchedIndices) {
    const { row, col } = indexToPosition(index);
    totalX += col;
    totalY += row;
  }

  return {
    x: totalX / matchedIndices.length,
    y: totalY / matchedIndices.length,
  };
}

// ============================================================================
// GRAVITY & REFILL
// ============================================================================

/**
 * Apply gravity - elements fall down to fill empty spaces
 */
function applyGravity(grid: Element[]): { 
  newGrid: (Element | null)[]; 
  movements: Map<number, number>;
} {
  const newGrid: (Element | null)[] = [...grid];
  const movements = new Map<number, number>();

  for (let col = 0; col < GRID_SIZE; col++) {
    let writePos = GRID_SIZE - 1;

    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const readIndex = row * GRID_SIZE + col;
      const element = newGrid[readIndex];

      if (element && !element.isMatched) {
        const writeIndex = writePos * GRID_SIZE + col;
        
        if (writeIndex !== readIndex) {
          movements.set(readIndex, writeIndex);
          newGrid[writeIndex] = { ...element, index: writeIndex };
          newGrid[readIndex] = null;
        }
        
        writePos--;
      }
    }

    for (let row = writePos; row >= 0; row--) {
      const index = row * GRID_SIZE + col;
      newGrid[index] = null;
    }
  }

  return { newGrid, movements };
}

/**
 * Fill empty cells with new elements
 */
function refillEmptyCells(grid: (Element | null)[]): Element[] {
  return grid.map((element, index) => {
    if (element === null) {
      return createElement(index);
    }
    return element;
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface UseMatch3EngineReturn {
  // State
  grid: Element[];
  phase: GamePhase;
  selectedIndex: number;
  score: number;
  combo: number;
  teamProgress: number;
  isLevelComplete: boolean;
  moves: number;
  maxMoves: number;
  levelState: LevelState;
  
  // Actions
  initializeGame: () => void;
  handleElementTap: (index: number) => void;
  handleSwipe: (fromIndex: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  processGameLoop: () => Promise<void>;
  addExtraMoves: (count: number) => void;
  
  // Utilities
  getElementAt: (index: number) => Element | undefined;
  isValidSwap: (from: number, to: number) => boolean;
  
  // Legacy aliases
  handleGemTap: (index: number) => void;
  getGemAt: (index: number) => Element | undefined;
}

export function useMatch3Engine(): UseMatch3EngineReturn {
  const {
    grid,
    phase,
    selectedIndex,
    score,
    combo,
    teamProgress,
    isLevelComplete,
    moves,
    maxMoves,
    levelState,
    currentLevelConfig,
    isMuted,
    setGrid,
    setPhase,
    setSelectedIndex,
    addScore,
    addContribution,
    incrementCombo,
    resetCombo,
    addContributionParticle,
    resetGame,
    decrementMoves,
    addMoves,
    checkWinLossCondition,
  } = useGameStore();

  const isProcessingRef = useRef(false);
  const [lastMatchEvent, setLastMatchEvent] = useState<MatchEvent | null>(null);

  /**
   * Initialize a new game with current level config
   */
  const initializeGame = useCallback(() => {
    const newGrid = generateInitialGrid(currentLevelConfig);
    setGrid(newGrid);
    setPhase('IDLE');
    setSelectedIndex(-1);
    resetCombo();
    
    // Start ambient music
    if (!isMuted) {
      soundManager.playAmbient();
    }
  }, [setGrid, setPhase, setSelectedIndex, resetCombo, currentLevelConfig, isMuted]);

  /**
   * Get element at specific index
   */
  const getElementAt = useCallback((index: number): Element | undefined => {
    if (!isValidIndex(index)) return undefined;
    return grid[index];
  }, [grid]);

  /**
   * Check if swap between two indices is valid
   */
  const isValidSwap = useCallback((from: number, to: number): boolean => {
    if (!isValidIndex(from) || !isValidIndex(to)) return false;
    return areAdjacent(from, to);
  }, []);

  /**
   * Get target index from swipe direction
   */
  const getSwipeTargetIndex = useCallback((
    fromIndex: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ): number | null => {
    const { row, col } = indexToPosition(fromIndex);

    let targetRow = row;
    let targetCol = col;

    switch (direction) {
      case 'up':
        targetRow = Math.max(0, row - 1);
        break;
      case 'down':
        targetRow = Math.min(GRID_SIZE - 1, row + 1);
        break;
      case 'left':
        targetCol = Math.max(0, col - 1);
        break;
      case 'right':
        targetCol = Math.min(GRID_SIZE - 1, col + 1);
        break;
    }

    if (targetRow !== row || targetCol !== col) {
      return positionToIndex(targetRow, targetCol);
    }

    return null;
  }, []);

  /**
   * Emit contribution particle for a match
   */
  const emitContributionParticle = useCallback((
    matchedIndices: number[],
    contributionGained: number
  ) => {
    // Calculate center position
    const { x, y } = getMatchCenterPosition(matchedIndices);

    // Create particle
    const particle: ContributionParticle = {
      id: `particle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sourceIndex: matchedIndices[Math.floor(matchedIndices.length / 2)],
      sourceX: x,
      sourceY: y,
      contributionAmount: contributionGained,
      createdAt: Date.now(),
    };

    addContributionParticle(particle);
  }, [addContributionParticle]);

  /**
   * Handle swipe gesture - attempt to swap with adjacent element
   */
  const handleSwipe = useCallback((
    fromIndex: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    if (phase !== 'IDLE' || levelState !== 'PLAYING') return;
    if (!isValidIndex(fromIndex)) return;

    const targetIndex = getSwipeTargetIndex(fromIndex, direction);

    if (targetIndex !== null && isValidSwap(fromIndex, targetIndex)) {
      // Perform the swap (same logic as tap-swipe)
      performSwap(fromIndex, targetIndex);
    }
  }, [phase, levelState, getSwipeTargetIndex, isValidSwap]);

  /**
   * Handle element tap - select or attempt swap
   */
  const handleElementTap = useCallback((index: number) => {
    if (phase !== 'IDLE' || levelState !== 'PLAYING') return;
    if (!isValidIndex(index)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedIndex === -1) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(-1);
    } else if (areAdjacent(selectedIndex, index)) {
      performSwap(selectedIndex, index);
    } else {
      setSelectedIndex(index);
    }
  }, [phase, levelState, selectedIndex, setSelectedIndex]);

  /**
   * Perform swap and trigger game loop
   */
  const performSwap = useCallback(async (fromIndex: number, toIndex: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setPhase('SWAPPING');
    setSelectedIndex(-1);

    const newGrid = [...grid];
    const temp = { ...newGrid[fromIndex], index: toIndex };
    newGrid[fromIndex] = { ...newGrid[toIndex], index: fromIndex };
    newGrid[toIndex] = temp;
    setGrid(newGrid);

    // Play swap sound
    soundManager.playSwap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await new Promise(resolve => setTimeout(resolve, 300));

    const matches = detectAllMatches(newGrid);

    if (matches.length === 0) {
      setPhase('SWAPPING');
      const revertGrid = [...newGrid];
      const temp2 = { ...revertGrid[fromIndex], index: toIndex };
      revertGrid[fromIndex] = { ...revertGrid[toIndex], index: fromIndex };
      revertGrid[toIndex] = temp2;
      setGrid(revertGrid);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setPhase('IDLE');
      isProcessingRef.current = false;
      return;
    }

    // Valid swap - decrement moves
    decrementMoves();

    await processCascade(newGrid);
    isProcessingRef.current = false;
  }, [grid, setGrid, setPhase, setSelectedIndex, decrementMoves]);

  /**
   * Process match cascade (matches -> fall -> refill -> repeat)
   */
  const processCascade = useCallback(async (currentGrid: Element[]) => {
    let workingGrid = [...currentGrid];
    let cascadeCount = 0;

    while (true) {
      setPhase('MATCHING');
      const matches = detectAllMatches(workingGrid);
      
      if (matches.length === 0) break;

      const matchedIndices = new Set(matches.flatMap(m => m.matchedIndices));
      workingGrid = workingGrid.map(element => ({
        ...element,
        isMatched: matchedIndices.has(element.index),
      }));
      setGrid(workingGrid);

      // Calculate score and contribution
      const totalMatched = matchedIndices.size;
      const baseScore = totalMatched * 10;
      const comboMultiplier = cascadeCount + 1;
      const finalScore = baseScore * comboMultiplier;

      addScore(finalScore);
      addContribution(finalScore);
      incrementCombo();

      // Play match chime based on combo (harmonic stacking: C, E, G)
      soundManager.playMatchChime(comboMultiplier);

      // Check win condition after contribution
      checkWinLossCondition();

      // Emit contribution particle and play bloom sound
      emitContributionParticle(Array.from(matchedIndices), finalScore);
      soundManager.playBloom();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Wait for match animation
      await new Promise(resolve => setTimeout(resolve, 400));

      setPhase('FALLING');
      const { newGrid: fallenGrid } = applyGravity(workingGrid);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      setPhase('REFILLING');
      workingGrid = refillEmptyCells(fallenGrid);
      setGrid(workingGrid);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await new Promise(resolve => setTimeout(resolve, 300));

      cascadeCount++;
    }

    if (cascadeCount === 0) {
      resetCombo();
    }

    setPhase('IDLE');
  }, [setGrid, setPhase, addScore, addContribution, incrementCombo, resetCombo, emitContributionParticle, checkWinLossCondition]);

  /**
   * Manual game loop trigger
   */
  const processGameLoop = useCallback(async () => {
    if (phase !== 'IDLE' || isProcessingRef.current) return;
    await processCascade(grid);
  }, [phase, grid, processCascade]);

  /**
   * Add extra moves (for revive/ad reward)
   */
  const addExtraMoves = useCallback((count: number) => {
    addMoves(count);
  }, [addMoves]);

  return {
    grid,
    phase,
    selectedIndex,
    score,
    combo,
    teamProgress,
    isLevelComplete,
    moves,
    maxMoves,
    levelState,
    initializeGame,
    handleElementTap,
    handleSwipe,
    processGameLoop,
    addExtraMoves,
    getElementAt,
    isValidSwap,
    handleGemTap: handleElementTap,
    getGemAt: getElementAt,
  };
}
