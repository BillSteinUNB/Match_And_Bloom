/**
 * ElementNode - Skia Rendered Element Component
 * Match & Bloom - Botanical Zen Edition
 * 
 * Organic shapes for each element type:
 * - Water: Blue Teardrop (circle with pinched top)
 * - Sun: Yellow Circle with radial glow
 * - Leaf: Green Rhombus with rounded corners
 * - Bloom: Pink Flower (5-petal shape)
 * 
 * Features:
 * - Soft watercolor gradient effect
 * - Gentle selection glow (gold border)
 * - Bloom animation on match (scale + rotate)
 */

import React from 'react';
import {
  Group,
  Path,
  Circle,
  RadialGradient,
  LinearGradient,
  Shadow,
  vec,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { 
  ElementType, 
  ELEMENT_COLORS, 
  ELEMENT_GRADIENTS, 
  ELEMENT_ACCENTS,
  THEME_COLORS,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SELECTION_GLOW_BLUR = 6;
const GOLD_BORDER_WIDTH = 2;

// ============================================================================
// SHAPE PATH GENERATORS
// ============================================================================

/**
 * Create a teardrop/water drop shape
 * Circle with a pinched top vertex
 */
function createWaterDropPath(cx: number, cy: number, size: number): string {
  const r = size * 0.4;
  const tipY = cy - size * 0.45;
  const bottomY = cy + r * 0.8;
  
  // Teardrop using cubic bezier curves
  return `
    M ${cx} ${tipY}
    C ${cx + r * 0.3} ${cy - r * 0.3}, ${cx + r} ${cy}, ${cx + r} ${cy + r * 0.3}
    C ${cx + r} ${cy + r * 0.8}, ${cx + r * 0.5} ${bottomY}, ${cx} ${bottomY}
    C ${cx - r * 0.5} ${bottomY}, ${cx - r} ${cy + r * 0.8}, ${cx - r} ${cy + r * 0.3}
    C ${cx - r} ${cy}, ${cx - r * 0.3} ${cy - r * 0.3}, ${cx} ${tipY}
    Z
  `;
}

/**
 * Create a rhombus/diamond shape with rounded corners for Leaf
 */
function createLeafPath(cx: number, cy: number, size: number): string {
  const halfW = size * 0.35;
  const halfH = size * 0.42;
  const curve = size * 0.08; // Corner rounding
  
  return `
    M ${cx} ${cy - halfH}
    Q ${cx + curve} ${cy - halfH + curve}, ${cx + halfW} ${cy}
    Q ${cx + halfW - curve} ${cy + curve}, ${cx} ${cy + halfH}
    Q ${cx - curve} ${cy + halfH - curve}, ${cx - halfW} ${cy}
    Q ${cx - halfW + curve} ${cy - curve}, ${cx} ${cy - halfH}
    Z
  `;
}

/**
 * Create a 5-petal flower shape for Bloom
 */
function createBloomPath(cx: number, cy: number, size: number): string {
  const petalR = size * 0.28;
  const centerR = size * 0.15;
  const petalDist = size * 0.22;
  
  let path = '';
  
  // Draw 5 petals
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * (Math.PI / 180); // Start from top
    const px = cx + Math.cos(angle) * petalDist;
    const py = cy + Math.sin(angle) * petalDist;
    
    // Each petal is an ellipse approximated with bezier
    const nextAngle = ((i + 1) * 72 - 90) * (Math.PI / 180);
    const cpx1 = cx + Math.cos(angle) * (petalDist + petalR);
    const cpy1 = cy + Math.sin(angle) * (petalDist + petalR);
    
    if (i === 0) {
      path += `M ${px + Math.cos(angle) * petalR} ${py + Math.sin(angle) * petalR}`;
    }
    
    // Outer petal curve
    const outerX = cx + Math.cos(angle) * (petalDist + petalR);
    const outerY = cy + Math.sin(angle) * (petalDist + petalR);
    
    // Between petals (back to center area)
    const midAngle = angle + (36 * Math.PI / 180);
    const innerX = cx + Math.cos(midAngle) * centerR;
    const innerY = cy + Math.sin(midAngle) * centerR;
    
    path += ` Q ${outerX} ${outerY}, ${innerX} ${innerY}`;
  }
  
  path += ' Z';
  return path;
}

/**
 * Create a simple sun circle path (for consistent API)
 */
function createSunPath(cx: number, cy: number, size: number): string {
  const r = size * 0.38;
  // Circle approximation with bezier curves
  const k = 0.5522847498; // Magic number for circle approximation
  
  return `
    M ${cx} ${cy - r}
    C ${cx + r * k} ${cy - r}, ${cx + r} ${cy - r * k}, ${cx + r} ${cy}
    C ${cx + r} ${cy + r * k}, ${cx + r * k} ${cy + r}, ${cx} ${cy + r}
    C ${cx - r * k} ${cy + r}, ${cx - r} ${cy + r * k}, ${cx - r} ${cy}
    C ${cx - r} ${cy - r * k}, ${cx - r * k} ${cy - r}, ${cx} ${cy - r}
    Z
  `;
}

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface ElementNodeProps {
  /** Element type (water, sun, leaf, bloom) */
  color: ElementType;
  /** Animated X position */
  x: SharedValue<number>;
  /** Animated Y position */
  y: SharedValue<number>;
  /** Element size (width = height) */
  size: number;
  /** Whether this element is currently selected */
  isSelected: boolean;
  /** Whether this element is matched (about to bloom away) */
  isMatched: boolean;
  /** Animated scale value (for tap feedback) */
  scale: SharedValue<number>;
  /** Animated opacity (for match removal) */
  opacity: SharedValue<number>;
  /** Animated rotation for bloom effect */
  rotation?: SharedValue<number>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ElementNode: React.FC<ElementNodeProps> = React.memo(({
  color,
  x,
  y,
  size,
  isSelected,
  isMatched,
  scale,
  opacity,
  rotation,
}) => {
  // Get colors for this element type
  const baseColor = ELEMENT_COLORS[color];
  const gradientColors = ELEMENT_GRADIENTS[color];
  const accentColor = ELEMENT_ACCENTS[color];

  // Padding inside the cell
  const padding = size * 0.08;
  const elementSize = size - padding * 2;

  // Center position for shape drawing
  const centerX = useDerivedValue(() => x.value + size / 2);
  const centerY = useDerivedValue(() => y.value + size / 2);

  // Scaled center (for scale-from-center animation)
  const scaledCenterX = useDerivedValue(() => x.value + size / 2);
  const scaledCenterY = useDerivedValue(() => y.value + size / 2);
  const scaledSize = useDerivedValue(() => elementSize * scale.value);

  // Generate SVG path string based on element type (string, not SkPath, for compatibility)
  const elementPathString = useDerivedValue(() => {
    const cx = scaledCenterX.value;
    const cy = scaledCenterY.value;
    const sz = scaledSize.value;
    
    switch (color) {
      case 'water':
        return createWaterDropPath(cx, cy, sz);
      case 'leaf':
        return createLeafPath(cx, cy, sz);
      case 'bloom':
        return createBloomPath(cx, cy, sz);
      case 'sun':
      default:
        return createSunPath(cx, cy, sz);
    }
  });

  // Gradient points
  const gradientStart = useDerivedValue(() => 
    vec(scaledCenterX.value - scaledSize.value / 2, scaledCenterY.value - scaledSize.value / 2)
  );
  const gradientEnd = useDerivedValue(() => 
    vec(scaledCenterX.value + scaledSize.value / 2, scaledCenterY.value + scaledSize.value / 2)
  );
  const gradientCenter = useDerivedValue(() => 
    vec(scaledCenterX.value, scaledCenterY.value)
  );

  // Rotation transform for bloom effect
  const transform = useDerivedValue(() => {
    const rot = rotation?.value ?? 0;
    return [
      { translateX: scaledCenterX.value },
      { translateY: scaledCenterY.value },
      { rotate: rot },
      { translateX: -scaledCenterX.value },
      { translateY: -scaledCenterY.value },
    ];
  });

  return (
    <Group opacity={opacity} transform={transform}>
      {/* Selection Glow - Soft gold aura */}
      {isSelected && (
        <Circle
          cx={scaledCenterX}
          cy={scaledCenterY}
          r={useDerivedValue(() => scaledSize.value * 0.55)}
          color={THEME_COLORS.goldBorder}
        >
          <BlurMask blur={SELECTION_GLOW_BLUR} style="solid" />
        </Circle>
      )}

      {/* Main Element Shape */}
      {color === 'sun' ? (
        // Sun uses radial gradient for glowing effect
        <Circle
          cx={scaledCenterX}
          cy={scaledCenterY}
          r={useDerivedValue(() => scaledSize.value * 0.38)}
        >
          <RadialGradient
            c={gradientCenter}
            r={useDerivedValue(() => scaledSize.value * 0.4)}
            colors={[gradientColors[0], gradientColors[1]]}
          />
          <Shadow dx={0} dy={2} blur={6} color="rgba(255, 217, 61, 0.4)" />
        </Circle>
      ) : (
        // Other elements use path shapes
        <Path
          path={elementPathString}
          color={baseColor}
        >
          <LinearGradient
            start={gradientStart}
            end={gradientEnd}
            colors={[gradientColors[0], gradientColors[1]]}
          />
          <Shadow dx={0} dy={2} blur={4} color="rgba(0, 0, 0, 0.15)" />
        </Path>
      )}

      {/* Watercolor Edge Effect - Subtle blur on edges */}
      {color !== 'sun' && (
        <Path
          path={elementPathString}
          color="transparent"
          style="stroke"
          strokeWidth={3}
        >
          <LinearGradient
            start={gradientStart}
            end={gradientEnd}
            colors={[`${accentColor}88`, `${gradientColors[1]}44`]}
          />
          <BlurMask blur={2} style="normal" />
        </Path>
      )}

      {/* Sun Rays (glow effect) */}
      {color === 'sun' && (
        <Circle
          cx={scaledCenterX}
          cy={scaledCenterY}
          r={useDerivedValue(() => scaledSize.value * 0.5)}
          color={`${ELEMENT_ACCENTS.sun}66`}
        >
          <BlurMask blur={8} style="normal" />
        </Circle>
      )}

      {/* Specular Highlight - Soft white shine */}
      <Circle
        cx={useDerivedValue(() => scaledCenterX.value - elementSize * 0.12)}
        cy={useDerivedValue(() => scaledCenterY.value - elementSize * 0.12)}
        r={useDerivedValue(() => scaledSize.value * 0.1)}
        color="rgba(255, 255, 255, 0.5)"
      >
        <BlurMask blur={3} style="normal" />
      </Circle>

      {/* Gold Selection Border */}
      {isSelected && color !== 'sun' && (
        <Path
          path={elementPathString}
          color={THEME_COLORS.goldBorder}
          style="stroke"
          strokeWidth={GOLD_BORDER_WIDTH}
        />
      )}
      {isSelected && color === 'sun' && (
        <Circle
          cx={scaledCenterX}
          cy={scaledCenterY}
          r={useDerivedValue(() => scaledSize.value * 0.38)}
          color={THEME_COLORS.goldBorder}
          style="stroke"
          strokeWidth={GOLD_BORDER_WIDTH}
        />
      )}

      {/* Match Bloom Effect - Soft radiant glow */}
      {isMatched && (
        <Circle
          cx={scaledCenterX}
          cy={scaledCenterY}
          r={useDerivedValue(() => scaledSize.value * 0.6)}
          color={`${accentColor}CC`}
        >
          <BlurMask blur={12} style="solid" />
        </Circle>
      )}
    </Group>
  );
});

ElementNode.displayName = 'ElementNode';

// Legacy alias for backward compatibility
export { ElementNode as GemNode };
export type { ElementNodeProps as GemNodeProps };
