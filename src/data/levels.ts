/**
 * Level Data - Campaign Level Definitions
 * 
 * Match & Bloom - Botanical Zen Edition
 * 
 * Level Structure:
 * - Level 1-3: Tutorial/Easy (no obstacles, generous moves)
 * - Level 4-6: Introduction of Rocks (obstacles)
 * - Level 7-10: Hard/Monetization Filter (tight moves, complex layouts)
 */

import { LevelConfig, CellType, GRID_SIZE } from '../types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an empty grid (all random elements)
 */
function createEmptyGrid(): CellType[][] {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CellType.RANDOM));
}

/**
 * Create a grid with rocks at specified positions
 * Positions are [row, col] tuples
 */
function createGridWithRocks(rockPositions: [number, number][]): CellType[][] {
  const grid = createEmptyGrid();
  for (const [row, col] of rockPositions) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      grid[row][col] = CellType.ROCK;
    }
  }
  return grid;
}

/**
 * Create a grid with locks at specified positions
 */
function createGridWithLocks(lockPositions: [number, number][]): CellType[][] {
  const grid = createEmptyGrid();
  for (const [row, col] of lockPositions) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      grid[row][col] = CellType.LOCK;
    }
  }
  return grid;
}

/**
 * Create a grid with both rocks and locks
 */
function createMixedGrid(
  rockPositions: [number, number][],
  lockPositions: [number, number][]
): CellType[][] {
  const grid = createEmptyGrid();
  for (const [row, col] of rockPositions) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      grid[row][col] = CellType.ROCK;
    }
  }
  for (const [row, col] of lockPositions) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      grid[row][col] = CellType.LOCK;
    }
  }
  return grid;
}

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================

export const LEVELS: LevelConfig[] = [
  // -------------------------------------------------------------------------
  // TUTORIAL LEVELS (1-3) - Easy introduction, no obstacles
  // -------------------------------------------------------------------------
  {
    id: 1,
    name: 'First Bloom',
    moves: 25,
    targetProgress: 3000,
    isTutorial: true,
    tutorialHint: 'Swipe to match 3 or more flowers of the same type!',
    // No grid = fully random
  },
  {
    id: 2,
    name: 'Growing Garden',
    moves: 22,
    targetProgress: 4500,
    isTutorial: true,
    tutorialHint: 'Chain matches together for combo bonuses!',
  },
  {
    id: 3,
    name: 'Spring Awakening',
    moves: 20,
    targetProgress: 6000,
    isTutorial: true,
    tutorialHint: 'Match 4 or more for special effects!',
  },

  // -------------------------------------------------------------------------
  // OBSTACLE INTRODUCTION (4-6) - Rocks appear
  // -------------------------------------------------------------------------
  {
    id: 4,
    name: 'Stone Garden',
    moves: 20,
    targetProgress: 6500,
    grid: createGridWithRocks([
      [3, 3], [3, 4],
      [4, 3], [4, 4],
    ]),
    tutorialHint: 'Rocks cannot be moved or matched. Work around them!',
  },
  {
    id: 5,
    name: 'Rocky Path',
    moves: 18,
    targetProgress: 7000,
    grid: createGridWithRocks([
      [2, 0], [2, 7],
      [5, 0], [5, 7],
      [3, 3], [4, 4],
    ]),
  },
  {
    id: 6,
    name: 'Boulder Valley',
    moves: 18,
    targetProgress: 7500,
    grid: createGridWithRocks([
      [1, 2], [1, 5],
      [3, 1], [3, 6],
      [4, 1], [4, 6],
      [6, 2], [6, 5],
    ]),
  },

  // -------------------------------------------------------------------------
  // LOCK INTRODUCTION (7-8) - Locked cells appear
  // -------------------------------------------------------------------------
  {
    id: 7,
    name: 'Frozen Petals',
    moves: 18,
    targetProgress: 8000,
    grid: createGridWithLocks([
      [0, 3], [0, 4],
      [7, 3], [7, 4],
    ]),
    tutorialHint: 'Match adjacent to locked cells to unlock them!',
  },
  {
    id: 8,
    name: 'Winter Thaw',
    moves: 16,
    targetProgress: 8500,
    grid: createMixedGrid(
      [[3, 3], [4, 4]], // rocks
      [[1, 1], [1, 6], [6, 1], [6, 6]], // locks
    ),
  },

  // -------------------------------------------------------------------------
  // HARD LEVELS (9-10) - Monetization Filter / Challenge
  // -------------------------------------------------------------------------
  {
    id: 9,
    name: 'Thorny Maze',
    moves: 15,
    targetProgress: 9000,
    grid: createMixedGrid(
      [
        [2, 2], [2, 5],
        [3, 3], [3, 4],
        [4, 3], [4, 4],
        [5, 2], [5, 5],
      ],
      [
        [0, 0], [0, 7],
        [7, 0], [7, 7],
      ],
    ),
  },
  {
    id: 10,
    name: 'Garden Mastery',
    moves: 12,
    targetProgress: 10000,
    grid: createMixedGrid(
      [
        [1, 3], [1, 4],
        [3, 1], [3, 6],
        [4, 1], [4, 6],
        [6, 3], [6, 4],
      ],
      [
        [0, 0], [0, 1], [0, 6], [0, 7],
        [7, 0], [7, 1], [7, 6], [7, 7],
      ],
    ),
  },
];

// ============================================================================
// LEVEL ACCESS FUNCTIONS
// ============================================================================

/**
 * Get level by ID
 */
export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find(level => level.id === id);
}

/**
 * Get next level after current
 */
export function getNextLevel(currentId: number): LevelConfig | undefined {
  const currentIndex = LEVELS.findIndex(level => level.id === currentId);
  if (currentIndex === -1 || currentIndex >= LEVELS.length - 1) {
    return undefined;
  }
  return LEVELS[currentIndex + 1];
}

/**
 * Check if there's a next level
 */
export function hasNextLevel(currentId: number): boolean {
  return getNextLevel(currentId) !== undefined;
}

/**
 * Get total number of levels
 */
export function getTotalLevels(): number {
  return LEVELS.length;
}

/**
 * Get first level
 */
export function getFirstLevel(): LevelConfig {
  return LEVELS[0];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LEVELS;
