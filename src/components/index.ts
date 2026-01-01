// Element exports
export { ElementNode } from './ElementNode';
export type { ElementNodeProps } from './ElementNode';

// GameBoard exports
export { GameBoard } from './GameBoard';
export type { GameBoardProps } from './GameBoard';

// Legacy aliases for backward compatibility (re-export for convenience)
import { ElementNode as GemNode } from './ElementNode';
import type { ElementNodeProps as GemNodeProps } from './ElementNode';
export { GemNode, GemNodeProps };
