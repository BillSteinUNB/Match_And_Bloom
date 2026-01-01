/**
 * Game Type Definitions for Dopamine Match
 * Match-3 Game Engine Types
 */

// ============================================================================
// CORE GAME TYPES
// ============================================================================

/**
 * Available gem colors in the Digital Opulence palette
 */
export type GemColor = 
  | 'electric-pink'    // #FF007F
  | 'sunset-orange'    // #FF6600
  | 'royal-purple'     // #8B00FF
  | 'cyber-blue'       // #00D4FF
  | 'neon-green'       // #00FF88
  | 'golden-amber';    // #FFB800

/**
 * Hex color mapping for Skia rendering
 */
export const GEM_COLORS: Record<GemColor, string> = {
  'electric-pink': '#FF007F',
  'sunset-orange': '#FF6600',
  'royal-purple': '#8B00FF',
  'cyber-blue': '#00D4FF',
  'neon-green': '#00FF88',
  'golden-amber': '#FFB800',
} as const;

/**
 * Gradient pairs for 3D gummy effect
 */
export const GEM_GRADIENTS: Record<GemColor, [string, string]> = {
  'electric-pink': ['#FF4DA6', '#CC0066'],
  'sunset-orange': ['#FF9933', '#CC5200'],
  'royal-purple': ['#B84DFF', '#6600CC'],
  'cyber-blue': ['#4DE0FF', '#00A3CC'],
  'neon-green': ['#4DFFAA', '#00CC6A'],
  'golden-amber': ['#FFCC4D', '#CC9200'],
} as const;

/**
 * Individual gem in the grid
 */
export interface Gem {
  /** Unique identifier for React keys and animation tracking */
  id: string;
  /** Gem color type */
  color: GemColor;
  /** Grid position index (0-63 for 8x8 grid) */
  index: number;
  /** Whether gem is marked for removal */
  isMatched: boolean;
  /** Whether gem is currently selected by user */
  isSelected: boolean;
}

/**
 * Grid coordinates helper type
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * Swap operation between two gems
 */
export interface SwapOperation {
  fromIndex: number;
  toIndex: number;
}

// ============================================================================
// GAME STATE MACHINE
// ============================================================================

/**
 * Game loop phases - strict state machine
 * IDLE -> SWAPPING -> MATCHING -> FALLING -> REFILLING -> (loop or IDLE)
 */
export type GamePhase = 
  | 'IDLE'       // Waiting for player input
  | 'SWAPPING'   // Animating gem swap
  | 'MATCHING'   // Detecting and marking matches
  | 'FALLING'    // Gems falling to fill gaps
  | 'REFILLING'; // New gems spawning at top

/**
 * Match result from flood-fill detection
 */
export interface MatchResult {
  /** Indices of matched gems */
  matchedIndices: number[];
  /** Number of gems in the match */
  count: number;
  /** Whether this is a special match (4+, L-shape, etc.) */
  isSpecial: boolean;
}

/**
 * Full game state for zustand store
 */
export interface GameState {
  /** Current grid state (1D array, 64 elements for 8x8) */
  grid: Gem[];
  /** Current game phase */
  phase: GamePhase;
  /** Player score */
  score: number;
  /** Current combo multiplier */
  combo: number;
  /** Currently selected gem index (-1 if none) */
  selectedIndex: number;
  /** Grid dimensions */
  gridSize: number;
}

/**
 * Game actions for zustand store
 */
export interface GameActions {
  /** Initialize a new grid */
  initializeGrid: () => void;
  /** Select a gem at index */
  selectGem: (index: number) => void;
  /** Attempt swap between selected and target */
  swapGems: (fromIndex: number, toIndex: number) => void;
  /** Find and mark all matches */
  findMatches: () => MatchResult[];
  /** Remove matched gems and drop remaining */
  processMatches: () => void;
  /** Fill empty spaces with new gems */
  refillGrid: () => void;
  /** Set game phase */
  setPhase: (phase: GamePhase) => void;
  /** Add to score */
  addScore: (points: number) => void;
  /** Reset combo */
  resetCombo: () => void;
  /** Increment combo */
  incrementCombo: () => void;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Animation configuration for spring physics
 */
export interface SpringConfig {
  mass: number;
  damping: number;
  stiffness: number;
}

/**
 * Default spring config for gem movements
 * Tuned for "tactile satisfaction"
 */
export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  mass: 0.5,
  damping: 12,
  stiffness: 100,
} as const;

/**
 * Gem position for Skia rendering
 */
export interface GemRenderPosition {
  x: number;
  y: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRID_SIZE = 8;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 64
export const MIN_MATCH = 3;

/**
 * All available gem colors as array for random selection
 */
export const ALL_GEM_COLORS: GemColor[] = [
  'electric-pink',
  'sunset-orange', 
  'royal-purple',
  'cyber-blue',
  'neon-green',
  'golden-amber',
];

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isValidIndex(index: number): boolean {
  return index >= 0 && index < TOTAL_CELLS;
}

export function areAdjacent(indexA: number, indexB: number): boolean {
  const rowA = Math.floor(indexA / GRID_SIZE);
  const colA = indexA % GRID_SIZE;
  const rowB = Math.floor(indexB / GRID_SIZE);
  const colB = indexB % GRID_SIZE;
  
  const rowDiff = Math.abs(rowA - rowB);
  const colDiff = Math.abs(colA - colB);
  
  // Adjacent means exactly 1 step in row OR column, not both
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function indexToPosition(index: number): GridPosition {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

export function positionToIndex(row: number, col: number): number {
  return row * GRID_SIZE + col;
}
