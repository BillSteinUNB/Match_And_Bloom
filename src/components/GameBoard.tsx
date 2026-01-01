/**
 * GameBoard - Main Skia Canvas for the Match-3 Grid
 * 
 * Renders all 64 gems in a single Canvas for optimal performance.
 * Handles touch gestures for gem selection and swapping.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Group, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GemNode } from './GemNode';
import { useMatch3Engine } from '../hooks';
import { GRID_SIZE, DEFAULT_SPRING_CONFIG, indexToPosition } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;

// Spring config for animations
const SPRING_CONFIG = {
  mass: DEFAULT_SPRING_CONFIG.mass,
  damping: DEFAULT_SPRING_CONFIG.damping,
  stiffness: DEFAULT_SPRING_CONFIG.stiffness,
};

// ============================================================================
// GEM WRAPPER WITH ANIMATION STATE
// ============================================================================

interface AnimatedGemProps {
  id: string;
  color: string;
  gridIndex: number;
  isSelected: boolean;
  isMatched: boolean;
  onTap: (index: number) => void;
}

const AnimatedGem: React.FC<AnimatedGemProps> = React.memo(({
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
  const y = useSharedValue(row < 0 ? -CELL_SIZE : targetY); // Start above if new
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animate to new position when grid index changes
  useEffect(() => {
    x.value = withSpring(targetX, SPRING_CONFIG);
    y.value = withSpring(targetY, SPRING_CONFIG);
  }, [targetX, targetY]);

  // Selection scale animation
  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(0.9, SPRING_CONFIG);
    } else {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
  }, [isSelected]);

  // Match animation (pulse then fade)
  useEffect(() => {
    if (isMatched) {
      scale.value = withSpring(1.2, SPRING_CONFIG);
      opacity.value = withTiming(0, { duration: 300 });
    } else {
      opacity.value = 1;
    }
  }, [isMatched]);

  return (
    <GemNode
      color={color as any}
      x={x}
      y={y}
      size={CELL_SIZE}
      isSelected={isSelected}
      isMatched={isMatched}
      scale={scale}
      opacity={opacity}
    />
  );
});

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
    handleGemTap 
  } = useMatch3Engine();

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Notify parent of score changes
  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  // Calculate which gem was tapped based on touch coordinates
  const getTappedGemIndex = useCallback((touchX: number, touchY: number): number => {
    const col = Math.floor(touchX / CELL_SIZE);
    const row = Math.floor(touchY / CELL_SIZE);
    
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      return -1;
    }
    
    return row * GRID_SIZE + col;
  }, []);

  // Handle tap with JS callback
  const handleTap = useCallback((touchX: number, touchY: number) => {
    const index = getTappedGemIndex(touchX, touchY);
    if (index >= 0) {
      handleGemTap(index);
    }
  }, [getTappedGemIndex, handleGemTap]);

  // Gesture handler for taps
  const tapGesture = useMemo(() => 
    Gesture.Tap()
      .onEnd((event) => {
        runOnJS(handleTap)(event.x, event.y);
      }),
    [handleTap]
  );

  // Background gradient colors (Deep Purple)
  const bgGradientStart = vec(0, 0);
  const bgGradientEnd = vec(BOARD_SIZE, BOARD_SIZE);

  return (
    <GestureDetector gesture={tapGesture}>
      <Canvas style={styles.canvas}>
        {/* Board Background */}
        <RoundedRect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          r={16}
        >
          <LinearGradient
            start={bgGradientStart}
            end={bgGradientEnd}
            colors={['#2A004E', '#190028']}
          />
        </RoundedRect>

        {/* Gem Grid */}
        <Group>
          {grid.map((gem) => (
            <AnimatedGem
              key={gem.id}
              id={gem.id}
              color={gem.color}
              gridIndex={gem.index}
              isSelected={gem.index === selectedIndex}
              isMatched={gem.isMatched}
              onTap={handleGemTap}
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
  },
});

export default GameBoard;
