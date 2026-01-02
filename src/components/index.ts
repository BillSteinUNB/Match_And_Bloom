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

// SettingsModal exports (Settings gear overlay)
export { SettingsModal } from './SettingsModal';

// TextureOverlay exports (Global film grain effect)
export { TextureOverlay } from './TextureOverlay';
export type { TextureOverlayProps } from './TextureOverlay';

// MainMenu exports (Botanical Zen entry screen)
export { MainMenu } from './MainMenu';
export type { MainMenuProps } from './MainMenu';

// LevelSelect exports (Campaign level selection grid)
export { LevelSelect } from './LevelSelect';
export type { LevelSelectProps } from './LevelSelect';

// Legacy aliases for backward compatibility (re-export for convenience)
import { ElementNode as GemNode } from './ElementNode';
import type { ElementNodeProps as GemNodeProps } from './ElementNode';
export { GemNode, GemNodeProps };
