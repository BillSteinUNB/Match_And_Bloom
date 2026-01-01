/**
 * Game Type Definitions for Match & Bloom
 * Match-3 Game Engine Types - Botanical Zen Edition
 */

// ============================================================================
// CORE GAME TYPES
// ============================================================================

/**
 * Element types representing natural forces
 * Each has a unique organic shape and color
 */
export type ElementType = 
  | 'water'   // Blue Teardrop - Flow & Calm
  | 'sun'     // Yellow Circle - Warmth & Energy
  | 'leaf'    // Green Rhombus - Growth & Nature
  | 'bloom';  // Pink Flower - Beauty & Life

/**
 * Hex color mapping for Skia rendering - Soft Pastels
 */
export const ELEMENT_COLORS: Record<ElementType, string> = {
  'water': '#87CEEB',   // Sky Blue
  'sun': '#FFD93D',     // Warm Yellow
  'leaf': '#A0E8AF',    // Soft Green
  'bloom': '#FFB7C5',   // Petal Pink
} as const;

/**
 * Gradient pairs for watercolor effect - soft transitions
 */
export const ELEMENT_GRADIENTS: Record<ElementType, [string, string]> = {
  'water': ['#B0E2FF', '#5CACCE'],   // Light to deep blue
  'sun': ['#FFE566', '#E6C235'],     // Bright to warm yellow
  'leaf': ['#C4F5CE', '#7AC98A'],    // Light to deep green
  'bloom': ['#FFD4DE', '#E8A0AE'],   // Light to deep pink
} as const;

/**
 * Secondary accent colors for glow/highlight effects
 */
export const ELEMENT_ACCENTS: Record<ElementType, string> = {
  'water': '#E0F7FA',   // Ice white-blue
  'sun': '#FFF8E1',     // Cream yellow
  'leaf': '#E8F5E9',    // Mint white
  'bloom': '#FCE4EC',   // Blush white
} as const;

// Legacy type alias for backward compatibility
export type ElementColor = ElementType;
export const ELEMENT_COLORS_MAP: Record<ElementType, string> = ELEMENT_COLORS;
export const ELEMENT_GRADIENTS_MAP: Record<ElementType, [string, string]> = ELEMENT_GRADIENTS;
export type GemColor = ElementType;
export const GEM_COLORS = ELEMENT_COLORS;
export const GEM_GRADIENTS = ELEMENT_GRADIENTS;

/**
 * Individual tile/element in the grid
 */
export interface Element {
  /** Unique identifier for React keys and animation tracking */
  id: string;
  /** Element type (water, sun, leaf, bloom) */
  color: ElementType;
  /** Grid position index (0-63 for 8x8 grid) */
  index: number;
  /** Whether element is marked for removal */
  isMatched: boolean;
  /** Whether element is currently selected by user */
  isSelected: boolean;
}

// Legacy alias for backward compatibility
export type Gem = Element;

/**
 * Grid coordinates helper type
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * Swap operation between two elements
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
  | 'SWAPPING'   // Animating element swap
  | 'MATCHING'   // Detecting and marking matches
  | 'FALLING'    // Elements falling to fill gaps
  | 'REFILLING'; // New elements spawning at top

/**
 * Level state for win/loss conditions
 */
export type LevelState = 
  | 'PLAYING'    // Game in progress
  | 'WON'        // teamProgress >= 100%
  | 'LOST';      // moves == 0 AND teamProgress < 100%

/**
 * Match result from flood-fill detection
 */
export interface MatchResult {
  /** Indices of matched elements */
  matchedIndices: number[];
  /** Number of elements in the match */
  count: number;
  /** Whether this is a special match (4+, L-shape, etc.) */
  isSpecial: boolean;
}

/**
 * Full game state for zustand store
 */
export interface GameState {
  /** Current grid state (1D array, 64 elements for 8x8) */
  grid: Element[];
  /** Current game phase */
  phase: GamePhase;
  /** Player score (raw points) */
  score: number;
  /** Team contribution progress (0-100%) */
  teamProgress: number;
  /** Whether level is won */
  isLevelComplete: boolean;
  /** Current combo multiplier */
  combo: number;
  /** Currently selected element index (-1 if none) */
  selectedIndex: number;
  /** Grid dimensions */
  gridSize: number;
  /** Current remaining moves */
  moves: number;
  /** Maximum moves for the level */
  maxMoves: number;
  /** Level state (PLAYING, WON, LOST) */
  levelState: LevelState;
}

/**
 * Contribution particle for visual feedback
 */
export interface ContributionParticle {
  /** Unique ID for the particle */
  id: string;
  /** Source grid index where match occurred */
  sourceIndex: number;
  /** Source coordinates in screen space */
  sourceX: number;
  sourceY: number;
  /** Amount of contribution this particle represents */
  contributionAmount: number;
  /** Timestamp for animation */
  createdAt: number;
}

/**
 * Match event emitted to trigger visual effects
 */
export interface MatchEvent {
  /** Indices of matched elements */
  matchedIndices: number[];
  /** Total contribution gained from this match */
  contributionGained: number;
  /** Center position of match for particle emission */
  centerX: number;
  centerY: number;
}

/**
 * Game actions for zustand store
 */
export interface GameActions {
  /** Initialize a new grid */
  initializeGrid: () => void;
  /** Select an element at index */
  selectElement: (index: number) => void;
  /** Attempt swap between selected and target */
  swapElements: (fromIndex: number, toIndex: number) => void;
  /** Find and mark all matches */
  findMatches: () => MatchResult[];
  /** Remove matched elements and drop remaining */
  processMatches: () => void;
  /** Fill empty spaces with new elements */
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
 * Default spring config for element movements
 * Tuned for "floating petals" - gentle, organic motion
 */
export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  mass: 0.5,
  damping: 20,      // Increased from 12 for smoother, gentler motion
  stiffness: 80,    // Slightly reduced for floatier feel
} as const;

/**
 * Soft floating spring config for "Petal Float" effect
 * Mass 0.8, damping 20, stiffness 90 - soft, floating settle
 */
export const PETAL_FLOAT_SPRING: SpringConfig = {
  mass: 0.8,
  damping: 20,
  stiffness: 90,
} as const;

/**
 * Bloom animation config - scale up and fade out
 */
export const BLOOM_ANIMATION_CONFIG = {
  scale: 1.2,
  duration: 400,
  opacityDuration: 400,
} as const;

// ============================================================================
// CONTRIBUTION SYSTEM TYPES
// ============================================================================

/**
 * Contribution system configuration
 */
export const CONTRIBUTION_CONFIG = {
  /** Score needed to reach 100% team progress */
  targetScore: 10000,
  /** Points per matched element */
  pointsPerMatch: 10,
  /** Bonus multiplier for chain reactions */
  comboMultiplierBase: 1,
} as const;

/**
 * Element position for Skia rendering
 */
export interface ElementRenderPosition {
  x: number;
  y: number;
}

// Legacy alias
export type GemRenderPosition = ElementRenderPosition;

// ============================================================================
// THEME CONSTANTS
// ============================================================================

/**
 * Background colors for the Botanical Zen theme
 */
export const THEME_COLORS = {
  paper: '#FDFBF7',
  paperCream: '#F5F0E6',
  soil: '#4A4A4A',
  goldBorder: '#D4AF37',
  frostedWhite: 'rgba(255, 255, 255, 0.7)',
  gardenGradient: ['#E0F7FA', '#F3E5F5'] as [string, string],
} as const;

// ============================================================================
// GRID CONSTANTS
// ============================================================================

export const GRID_SIZE = 8;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 64
export const MIN_MATCH = 3;

/**
 * All available element types for random selection
 */
export const ALL_ELEMENT_TYPES: ElementType[] = [
  'water',
  'sun',
  'leaf',
  'bloom',
];

// Legacy alias
export const ALL_GEM_COLORS = ALL_ELEMENT_TYPES;

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
