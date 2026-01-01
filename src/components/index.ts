// Element exports
export { ElementNode } from './ElementNode';
export type { ElementNodeProps } from './ElementNode';

// GameBoard exports
export { GameBoard } from './GameBoard';
export type { GameBoardProps } from './GameBoard';

// InputController exports (swipe gesture layer)
export { InputController } from './InputController';

// ContributionParticle exports (social spark particle)
export { ContributionParticle } from './ContributionParticle';

// BackgroundController exports (Living Garden background)
export { BackgroundController } from './BackgroundController';
export type { BackgroundControllerProps } from './BackgroundController';

// GameOverModal exports (Wither Warning - Loss screen)
export { GameOverModal } from './GameOverModal';
export type { GameOverModalProps } from './GameOverModal';

// WinModal exports (Garden Restored - Win screen)
export { WinModal } from './WinModal';
export type { WinModalProps } from './WinModal';

// Legacy aliases for backward compatibility (re-export for convenience)
import { ElementNode as GemNode } from './ElementNode';
import type { ElementNodeProps as GemNodeProps } from './ElementNode';
export { GemNode, GemNodeProps };
