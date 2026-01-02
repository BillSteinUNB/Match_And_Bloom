/**
 * TextureOverlay - Global Perlin Noise "Film Grain" Effect
 * 
 * Adds an organic paper texture overlay on top of the entire app
 * using Skia's FractalNoise shader. This removes the "flat digital" look
 * and gives the game a high-quality, tactile aesthetic.
 * 
 * Settings:
 * - Opacity: 0.03 (subtle, not distracting)
 * - BlendMode: overlay (enhances contrast while adding texture)
 * - FractalNoise: baseFrequency 0.5, octaves 4 (paper-like grain)
 */

import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Canvas,
  Rect,
  FractalNoise,
  BlendMode,
  Skia,
} from '@shopify/react-native-skia';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Noise settings for organic paper texture
const NOISE_SETTINGS = {
  baseFrequencyX: 0.5,  // Horizontal grain frequency
  baseFrequencyY: 0.5,  // Vertical grain frequency
  octaves: 4,           // Complexity/detail level
  seed: 42,             // Consistent pattern
};

// Overlay opacity (very subtle - 3%)
const OVERLAY_OPACITY = 0.03;

// ============================================================================
// COMPONENT
// ============================================================================

export interface TextureOverlayProps {
  /**
   * Override default opacity (0-1)
   */
  opacity?: number;
}

export const TextureOverlay: React.FC<TextureOverlayProps> = ({
  opacity = OVERLAY_OPACITY,
}) => {
  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      <Rect
        x={0}
        y={0}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        opacity={opacity}
        blendMode="overlay"
      >
        <FractalNoise
          freqX={NOISE_SETTINGS.baseFrequencyX}
          freqY={NOISE_SETTINGS.baseFrequencyY}
          octaves={NOISE_SETTINGS.octaves}
          seed={NOISE_SETTINGS.seed}
        />
      </Rect>
    </Canvas>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    // Ensure overlay is above all content
    zIndex: 9999,
    // Disable pointer events so touches pass through
    pointerEvents: 'none',
  },
});

export default TextureOverlay;
