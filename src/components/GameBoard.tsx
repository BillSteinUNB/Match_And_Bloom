/**
 * GameBoard - Main Skia Canvas for the Match-3 Grid
 * Match & Bloom - Botanical Zen Edition
 * 
 * Renders all 64 elements in a single Canvas for optimal performance.
 * Features:
 * - Soft paper/garden background
 * - Floating petal physics (gentle spring animations)
 * - Bloom effect on match (scale + rotate)
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { 
  Canvas, 
  Group, 
  RoundedRect, 
  LinearGradient, 
  RadialGradient,
  vec,
  Rect,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ElementNode } from './ElementNode';
import { useMatch3Engine } from '../hooks';
import { 
  GRID_SIZE, 
  DEFAULT_SPRING_CONFIG, 
  indexToPosition,
  THEME_COLORS,
  ElementType,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;

// Floating petal spring config (gentle, organic motion)
const SPRING_CONFIG = {
  mass: DEFAULT_SPRING_CONFIG.mass,
  damping: DEFAULT_SPRING_CONFIG.damping,  // Now 20 for gentler motion
  stiffness: DEFAULT_SPRING_CONFIG.stiffness,
};

// ============================================================================
// ANIMATED ELEMENT WRAPPER
// ============================================================================

interface AnimatedElementProps {
  id: string;
  color: ElementType;
  gridIndex: number;
  isSelected: boolean;
  isMatched: boolean;
  onTap: (index: number) => void;
}

const AnimatedElement: React.FC<AnimatedElementProps> = React.memo(({
  id,
  color,
  gridIndex,
  isSelected,
  isMatched,
  onTap,
}) => {
  const { row, col } = indexToPosition(gridIndex);
  
  // Target positions
  const targetX = col * CELL_SIZE;
  const targetY = row * CELL_SIZE;

  // Animated values
  const x = useSharedValue(targetX);
  const y = useSharedValue(row < 0 ? -CELL_SIZE : targetY);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Animate to new position with floating petal physics
  useEffect(() => {
    x.value = withSpring(targetX, SPRING_CONFIG);
    y.value = withSpring(targetY, SPRING_CONFIG);
  }, [targetX, targetY]);

  // Selection animation - gentle pulse
  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(0.92, SPRING_CONFIG);
    } else {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
  }, [isSelected]);

  // Match animation - BLOOM effect (scale up + rotate before disappearing)
  useEffect(() => {
    if (isMatched) {
      // Bloom: scale up and rotate
      scale.value = withSequence(
        withSpring(1.3, { ...SPRING_CONFIG, stiffness: 120 }),
        withTiming(1.4, { duration: 150 })
      );
      rotation.value = withTiming(Math.PI * 0.25, { duration: 300 }); // 45 degree rotation
      opacity.value = withTiming(0, { duration: 400 });
    } else {
      opacity.value = 1;
      rotation.value = 0;
    }
  }, [isMatched]);

  return (
    <ElementNode
      color={color}
      x={x}
      y={y}
      size={CELL_SIZE}
      isSelected={isSelected}
      isMatched={isMatched}
      scale={scale}
      opacity={opacity}
      rotation={rotation}
    />
  );
});

AnimatedElement.displayName = 'AnimatedElement';

// Legacy alias for backward compatibility
const AnimatedGem = AnimatedElement;
AnimatedGem.displayName = 'AnimatedGem';

// ============================================================================
// MAIN GAME BOARD COMPONENT
// ============================================================================

export interface GameBoardProps {
  onScoreChange?: (score: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onScoreChange }) => {
  const { 
    grid, 
    phase, 
    selectedIndex, 
    score,
    initializeGame, 
    handleElementTap 
  } = useMatch3Engine();

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Notify parent of score changes
  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  // Calculate which element was tapped
  const getTappedElementIndex = useCallback((touchX: number, touchY: number): number => {
    const col = Math.floor(touchX / CELL_SIZE);
    const row = Math.floor(touchY / CELL_SIZE);
    
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      return -1;
    }
    
    return row * GRID_SIZE + col;
  }, []);

  // Handle tap with JS callback
  const handleTap = useCallback((touchX: number, touchY: number) => {
    const index = getTappedElementIndex(touchX, touchY);
    if (index >= 0) {
      handleElementTap(index);
    }
  }, [getTappedElementIndex, handleElementTap]);

  // Gesture handler for taps
  const tapGesture = useMemo(() => 
    Gesture.Tap()
      .onEnd((event) => {
        runOnJS(handleTap)(event.x, event.y);
      }),
    [handleTap]
  );

  // Background gradient points
  const bgGradientStart = vec(0, 0);
  const bgGradientEnd = vec(BOARD_SIZE, BOARD_SIZE);
  const bgCenter = vec(BOARD_SIZE / 2, BOARD_SIZE / 2);

  return (
    <GestureDetector gesture={tapGesture}>
      <Canvas style={styles.canvas}>
        {/* Board Background - Soft Garden Gradient */}
        <RoundedRect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          r={20}
        >
          {/* Soft pastel garden bokeh gradient */}
          <RadialGradient
            c={bgCenter}
            r={BOARD_SIZE * 0.7}
            colors={[
              THEME_COLORS.gardenGradient[0], // Light cyan
              THEME_COLORS.gardenGradient[1], // Light lavender
              THEME_COLORS.paperCream,         // Warm paper edge
            ]}
          />
        </RoundedRect>

        {/* Subtle inner shadow for depth */}
        <RoundedRect
          x={2}
          y={2}
          width={BOARD_SIZE - 4}
          height={BOARD_SIZE - 4}
          r={18}
          color="transparent"
          style="stroke"
          strokeWidth={4}
        >
          <LinearGradient
            start={bgGradientStart}
            end={bgGradientEnd}
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.02)']}
          />
        </RoundedRect>

        {/* Gold border accent */}
        <RoundedRect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          r={20}
          color={`${THEME_COLORS.goldBorder}40`}
          style="stroke"
          strokeWidth={1.5}
        />

        {/* Element Grid */}
        <Group>
          {grid.map((element) => (
            <AnimatedElement
              key={element.id}
              id={element.id}
              color={element.color}
              gridIndex={element.index}
              isSelected={element.index === selectedIndex}
              isMatched={element.isMatched}
              onTap={handleElementTap}
            />
          ))}
        </Group>
      </Canvas>
    </GestureDetector>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  canvas: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 20,
  },
});

export default GameBoard;
