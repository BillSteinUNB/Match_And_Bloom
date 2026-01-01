/**
 * useMatch3Engine - Core Match-3 Game Logic Hook
 * 
 * Manages the 8x8 grid as a 1D array with state machine:
 * IDLE -> SWAPPING -> MATCHING -> FALLING -> REFILLING
 * 
 * Uses flood-fill algorithm for match detection (3+ connected same-color elements)
 */

import { useCallback, useRef } from 'react';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Element,
  ElementColor,
  GamePhase,
  MatchResult,
  GRID_SIZE,
  TOTAL_CELLS,
  MIN_MATCH,
  ALL_ELEMENT_TYPES,
  areAdjacent,
  isValidIndex,
  indexToPosition,
  positionToIndex,
} from '../types';
import { useGameStore } from '../store/gameStore';

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
 * Used during grid initialization to prevent starting with matches
 */
function wouldCreateMatch(grid: (Element | null)[], index: number, color: ElementColor): boolean {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;

  // Check horizontal (need 2 of same color to the left)
  if (col >= 2) {
    const left1 = grid[index - 1];
    const left2 = grid[index - 2];
    if (left1?.color === color && left2?.color === color) {
      return true;
    }
  }

  // Check vertical (need 2 of same color above)
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
 */
function generateInitialGrid(): Element[] {
  const grid: (Element | null)[] = new Array(TOTAL_CELLS).fill(null);

  for (let i = 0; i < TOTAL_CELLS; i++) {
    let color = getRandomColor();
    let attempts = 0;
    const maxAttempts = 20;

    // Keep trying until we find a color that doesn't create a match
    while (wouldCreateMatch(grid, i, color) && attempts < maxAttempts) {
      color = getRandomColor();
      attempts++;
    }

    grid[i] = createElement(i, color);
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
        // End of potential match, check if valid
        if (matchLength >= MIN_MATCH) {
          for (let i = matchStart; i < col; i++) {
            matched.add(row * GRID_SIZE + i);
          }
        }
        // Reset for new potential match
        matchStart = col;
        matchColor = element.color;
        matchLength = 1;
      }
    }

    // Check end of row
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
        // End of potential match
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

    // Check end of column
    if (matchLength >= MIN_MATCH) {
      for (let i = matchStart; i < GRID_SIZE; i++) {
        matched.add(i * GRID_SIZE + col);
      }
    }
  }

  return matched;
}

/**
 * Flood fill to find connected matches (for special detection)
 * Uses BFS to find all connected elements of the same color
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

    // Check 4 neighbors (up, down, left, right)
    const { row, col } = indexToPosition(current);
    
    const neighbors = [
      row > 0 ? positionToIndex(row - 1, col) : -1,              // up
      row < GRID_SIZE - 1 ? positionToIndex(row + 1, col) : -1,  // down
      col > 0 ? positionToIndex(row, col - 1) : -1,              // left
      col < GRID_SIZE - 1 ? positionToIndex(row, col + 1) : -1,  // right
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
  
  // Combine all matched indices
  const allMatched = new Set([...horizontalMatches, ...verticalMatches]);
  
  if (allMatched.size === 0) {
    return [];
  }

  // Group connected matches using flood fill
  const results: MatchResult[] = [];
  const processed = new Set<number>();

  for (const index of allMatched) {
    if (processed.has(index)) continue;

    // Find all connected matched gems
    const connected = floodFill(grid, index, new Set());
    const matchedConnected = connected.filter(i => allMatched.has(i));
    
    matchedConnected.forEach(i => processed.add(i));

    if (matchedConnected.length >= MIN_MATCH) {
      results.push({
        matchedIndices: matchedConnected,
        count: matchedConnected.length,
        isSpecial: matchedConnected.length >= 4, // 4+ elements = special
      });
    }
  }

  return results;
}

// ============================================================================
// GRAVITY & REFILL
// ============================================================================

/**
 * Apply gravity - elements fall down to fill empty spaces
 * Returns the new grid and a map of movements (fromIndex -> toIndex)
 */
function applyGravity(grid: Element[]): { 
  newGrid: (Element | null)[]; 
  movements: Map<number, number>;
 } {
  const newGrid: (Element | null)[] = [...grid];
  const movements = new Map<number, number>();

  // Process column by column, bottom to top
  for (let col = 0; col < GRID_SIZE; col++) {
    let writePos = GRID_SIZE - 1; // Start writing from bottom

    // Scan from bottom to top
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const readIndex = row * GRID_SIZE + col;
      const element = newGrid[readIndex];

      if (element && !element.isMatched) {
        const writeIndex = writePos * GRID_SIZE + col;
        
        if (writeIndex !== readIndex) {
          // Move element down
          movements.set(readIndex, writeIndex);
          newGrid[writeIndex] = { ...element, index: writeIndex };
          newGrid[readIndex] = null;
        }
        
        writePos--;
      }
    }

    // Mark remaining top cells as null (to be refilled)
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
  
  // Actions
  initializeGame: () => void;
  handleElementTap: (index: number) => void;
  processGameLoop: () => Promise<void>;
  
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
    setGrid,
    setPhase,
    setSelectedIndex,
    addScore,
    incrementCombo,
    resetCombo,
  } = useGameStore();

  const isProcessingRef = useRef(false);

  /**
   * Initialize a new game
   */
  const initializeGame = useCallback(() => {
    const newGrid = generateInitialGrid();
    setGrid(newGrid);
    setPhase('IDLE');
    setSelectedIndex(-1);
    resetCombo();
  }, [setGrid, setPhase, setSelectedIndex, resetCombo]);

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
   * Handle element tap - select or attempt swap
   */
  const handleElementTap = useCallback((index: number) => {
    if (phase !== 'IDLE') return;
    if (!isValidIndex(index)) return;

    // Haptic feedback on tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedIndex === -1) {
      // No element selected - select this one
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      // Tapped same element - deselect
      setSelectedIndex(-1);
    } else if (areAdjacent(selectedIndex, index)) {
      // Adjacent element - attempt swap
      performSwap(selectedIndex, index);
    } else {
      // Non-adjacent - select new element
      setSelectedIndex(index);
    }
  }, [phase, selectedIndex, setSelectedIndex]);

  /**
   * Perform swap and trigger game loop
   */
  const performSwap = useCallback(async (fromIndex: number, toIndex: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setPhase('SWAPPING');
    setSelectedIndex(-1);

    // Swap elements in grid
    const newGrid = [...grid];
    const temp = { ...newGrid[fromIndex], index: toIndex };
    newGrid[fromIndex] = { ...newGrid[toIndex], index: fromIndex };
    newGrid[toIndex] = temp;
    setGrid(newGrid);

    // Medium haptic for swap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Wait for swap animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check for matches
    const matches = detectAllMatches(newGrid);

    if (matches.length === 0) {
      // No matches - swap back
      setPhase('SWAPPING');
      const revertGrid = [...newGrid];
      const temp2 = { ...revertGrid[fromIndex], index: toIndex };
      revertGrid[fromIndex] = { ...revertGrid[toIndex], index: fromIndex };
      revertGrid[toIndex] = temp2;
      setGrid(revertGrid);
      
      // Error haptic for invalid swap
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setPhase('IDLE');
      isProcessingRef.current = false;
      return;
    }

    // Process matches cascade
    await processCascade(newGrid);
    isProcessingRef.current = false;
  }, [grid, setGrid, setPhase, setSelectedIndex]);

  /**
   * Process match cascade (matches -> fall -> refill -> repeat)
   */
  const processCascade = useCallback(async (currentGrid: Element[]) => {
    let workingGrid = [...currentGrid];
    let cascadeCount = 0;

    while (true) {
      // MATCHING PHASE
      setPhase('MATCHING');
      const matches = detectAllMatches(workingGrid);
      
      if (matches.length === 0) break;

      // Mark matched elements
      const matchedIndices = new Set(matches.flatMap(m => m.matchedIndices));
      workingGrid = workingGrid.map(element => ({
        ...element,
        isMatched: matchedIndices.has(element.index),
      }));
      setGrid(workingGrid);

      // Calculate score
      const totalMatched = matchedIndices.size;
      const baseScore = totalMatched * 10;
      const comboMultiplier = cascadeCount + 1;
      addScore(baseScore * comboMultiplier);
      incrementCombo();

      // Heavy haptic for match
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Wait for match animation
      await new Promise(resolve => setTimeout(resolve, 400));

      // FALLING PHASE
      setPhase('FALLING');
      const { newGrid: fallenGrid } = applyGravity(workingGrid);
      
      // Wait for fall animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // REFILLING PHASE
      setPhase('REFILLING');
      workingGrid = refillEmptyCells(fallenGrid);
      setGrid(workingGrid);

      // Light haptic for refill
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Wait for refill animation
      await new Promise(resolve => setTimeout(resolve, 300));

      cascadeCount++;
    }

    // Reset combo if no cascades happened
    if (cascadeCount === 0) {
      resetCombo();
    }

    setPhase('IDLE');
  }, [setGrid, setPhase, addScore, incrementCombo, resetCombo]);

  /**
   * Manual game loop trigger (for testing)
   */
  const processGameLoop = useCallback(async () => {
    if (phase !== 'IDLE' || isProcessingRef.current) return;
    await processCascade(grid);
  }, [phase, grid, processCascade]);

  return {
    grid,
    phase,
    selectedIndex,
    score,
    combo,
    initializeGame,
    handleElementTap,
    processGameLoop,
    getElementAt,
    isValidSwap,
    // Legacy aliases
    handleGemTap: handleElementTap,
    getGemAt: getElementAt,
  };
}
