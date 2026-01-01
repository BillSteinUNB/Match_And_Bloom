/**
 * GemNode - Skia Rendered Gem Component
 * 
 * A single gem with:
 * - Rounded rect with gradient shader ("Gummy 3D" look)
 * - White rim light stroke
 * - Selection glow effect
 * - Tap scale animation (0.9 on press)
 * - Match pulse animation
 */

import React, { useMemo } from 'react';
import {
  Group,
  RoundedRect,
  LinearGradient,
  Shadow,
  vec,
  Circle,
  Paint,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GemColor, GEM_COLORS, GEM_GRADIENTS } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const GEM_CORNER_RADIUS = 12;
const RIM_LIGHT_WIDTH = 2;
const SELECTION_GLOW_RADIUS = 4;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface GemNodeProps {
  /** Gem color type */
  color: GemColor;
  /** Animated X position */
  x: SharedValue<number>;
  /** Animated Y position */
  y: SharedValue<number>;
  /** Gem size (width = height) */
  size: number;
  /** Whether this gem is currently selected */
  isSelected: boolean;
  /** Whether this gem is matched (about to be removed) */
  isMatched: boolean;
  /** Animated scale value (for tap feedback) */
  scale: SharedValue<number>;
  /** Animated opacity (for match removal) */
  opacity: SharedValue<number>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GemNode: React.FC<GemNodeProps> = React.memo(({
  color,
  x,
  y,
  size,
  isSelected,
  isMatched,
  scale,
  opacity,
}) => {
  // Get colors for this gem type
  const baseColor = GEM_COLORS[color];
  const gradientColors = GEM_GRADIENTS[color];

  // Padding inside the gem cell
  const padding = size * 0.08;
  const gemSize = size - padding * 2;

  // Derived animated transform origin (center of gem)
  const centerX = useDerivedValue(() => x.value + size / 2);
  const centerY = useDerivedValue(() => y.value + size / 2);

  // Scaled position (scale from center)
  const scaledX = useDerivedValue(() => {
    const s = scale.value;
    return x.value + padding + (1 - s) * gemSize / 2;
  });

  const scaledY = useDerivedValue(() => {
    const s = scale.value;
    return y.value + padding + (1 - s) * gemSize / 2;
  });

  const scaledSize = useDerivedValue(() => gemSize * scale.value);

  // Gradient start/end points
  const gradientStart = useDerivedValue(() => vec(scaledX.value, scaledY.value));
  const gradientEnd = useDerivedValue(() => 
    vec(scaledX.value + scaledSize.value, scaledY.value + scaledSize.value)
  );

  // Selection glow color (white with transparency)
  const selectionGlowColor = isSelected ? 'rgba(255, 255, 255, 0.6)' : 'transparent';

  return (
    <Group opacity={opacity}>
      {/* Selection Glow (rendered behind gem) */}
      {isSelected && (
        <RoundedRect
          x={scaledX}
          y={scaledY}
          width={scaledSize}
          height={scaledSize}
          r={GEM_CORNER_RADIUS}
          color="white"
        >
          <BlurMask blur={SELECTION_GLOW_RADIUS} style="solid" />
        </RoundedRect>
      )}

      {/* Main Gem Body with Gradient */}
      <RoundedRect
        x={scaledX}
        y={scaledY}
        width={scaledSize}
        height={scaledSize}
        r={GEM_CORNER_RADIUS}
      >
        <LinearGradient
          start={gradientStart}
          end={gradientEnd}
          colors={[gradientColors[0], gradientColors[1]]}
        />
        {/* Inner shadow for 3D depth */}
        <Shadow dx={0} dy={2} blur={4} color="rgba(0, 0, 0, 0.3)" inner />
      </RoundedRect>

      {/* Rim Light (top-left highlight) */}
      <RoundedRect
        x={scaledX}
        y={scaledY}
        width={scaledSize}
        height={scaledSize}
        r={GEM_CORNER_RADIUS}
        color="transparent"
        style="stroke"
        strokeWidth={RIM_LIGHT_WIDTH}
      >
        <LinearGradient
          start={gradientStart}
          end={gradientEnd}
          colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.1)']}
        />
      </RoundedRect>

      {/* Specular Highlight (small white shine) */}
      <Circle
        cx={useDerivedValue(() => scaledX.value + gemSize * 0.25)}
        cy={useDerivedValue(() => scaledY.value + gemSize * 0.25)}
        r={useDerivedValue(() => scaledSize.value * 0.12)}
        color="rgba(255, 255, 255, 0.4)"
      >
        <BlurMask blur={2} style="normal" />
      </Circle>

      {/* Match Pulse Effect */}
      {isMatched && (
        <RoundedRect
          x={scaledX}
          y={scaledY}
          width={scaledSize}
          height={scaledSize}
          r={GEM_CORNER_RADIUS}
          color="rgba(255, 255, 255, 0.8)"
        >
          <BlurMask blur={8} style="solid" />
        </RoundedRect>
      )}
    </Group>
  );
});

GemNode.displayName = 'GemNode';
