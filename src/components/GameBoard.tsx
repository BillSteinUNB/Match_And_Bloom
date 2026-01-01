/**
 * GameBoard - Main Skia Canvas for the Match-3 Grid
 * Match & Bloom - Botanical Zen Edition
 * 
 * Renders all 64 elements in a single Canvas for optimal performance.
 * Features:
 * - Soft paper/garden background
 * - Floating petal physics (gentle spring animations)
 * - Bloom effect on match (scale + rotate)
 * - Swipe gesture support via InputController
 * - Contribution particle system for social mechanics
 */

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { 
  Canvas, 
  Group, 
  RoundedRect, 
  LinearGradient, 
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { ElementNode } from './ElementNode';
import { InputController } from './InputController';
import { ContributionParticle } from './ContributionParticle';
import { useMatch3Engine } from '../hooks';
import { 
  GRID_SIZE, 
  DEFAULT_SPRING_CONFIG, 
  PETAL_FLOAT_SPRING,
  BLOOM_ANIMATION_CONFIG,
  indexToPosition,
  THEME_COLORS,
  ElementType,
} from '../types';
import { useGameStore } from '../store';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;

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
  onMatchComplete?: (index: number) => void;
}

const AnimatedElement: React.FC<AnimatedElementProps> = React.memo(({
  id,
  color,
  gridIndex,
  isSelected,
  isMatched,
  onTap,
  onMatchComplete,
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

  // Track if bloom animation has completed
  const bloomCompleteRef = useRef(false);

  /**
   * Animate to new position with floating petal physics
   */
  useEffect(() => {
    x.value = withSpring(targetX, PETAL_FLOAT_SPRING);
    y.value = withSpring(targetY, PETAL_FLOAT_SPRING);
  }, [targetX, targetY, x, y]);

  /**
   * Selection animation - gentle pulse
   */
  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(0.92, PETAL_FLOAT_SPRING);
    } else {
      scale.value = withSpring(1, PETAL_FLOAT_SPRING);
    }
  }, [isSelected, scale]);

  /**
   * Match animation - BLOOM effect (scale up + fade out)
   * Uses the specified scale: 1.2 and opacity fade
   */
  useEffect(() => {
    if (isMatched && !bloomCompleteRef.current) {
      // Bloom: scale up to 1.2 and rotate slightly
      scale.value = withSequence(
        withSpring(BLOOM_ANIMATION_CONFIG.scale, { 
          ...PETAL_FLOAT_SPRING, 
          stiffness: 120 
        }),
        withTiming(scale.value, { duration: 50 }) // Hold briefly
      );
      
      rotation.value = withTiming(Math.PI * 0.15, { duration: 300 });
      
      // Fade out after bloom completes
      opacity.value = withTiming(0, { 
        duration: BLOOM_ANIMATION_CONFIG.opacityDuration 
      }, (finished) => {
        'worklet';
        if (finished && onMatchComplete) {
          bloomCompleteRef.current = true;
          runOnJS(onMatchComplete)(gridIndex);
        }
      });
    } else if (!isMatched) {
      // Reset bloom state
      bloomCompleteRef.current = false;
      opacity.value = 1;
      rotation.value = 0;
    }
  }, [isMatched, scale, opacity, rotation, gridIndex, onMatchComplete]);

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

// ============================================================================
// MAIN GAME BOARD COMPONENT
// ============================================================================

export interface GameBoardProps {
  onScoreChange?: (score: number) => void;
  onTeamProgressChange?: (progress: number) => void;
  onLevelComplete?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  onScoreChange,
  onTeamProgressChange,
  onLevelComplete,
}) => {
  const { 
    grid, 
    phase, 
    selectedIndex, 
    score,
    teamProgress,
    isLevelComplete,
    initializeGame, 
    handleElementTap,
    handleSwipe,
  } = useMatch3Engine();

  const contributionParticles = useGameStore((state) => state.contributionParticles);

  // Ref to track match completion callbacks
  const pendingMatchRef = useRef<Set<number>>(new Set());

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Notify parent of score changes
  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  // Notify parent of team progress changes
  useEffect(() => {
    onTeamProgressChange?.(teamProgress);
  }, [teamProgress, onTeamProgressChange]);

  // Notify parent of level completion
  useEffect(() => {
    if (isLevelComplete) {
      onLevelComplete?.();
    }
  }, [isLevelComplete, onLevelComplete]);

  /**
   * Handle tap with JS callback
   */
  const handleTap = useCallback((touchX: number, touchY: number) => {
    const col = Math.floor(touchX / CELL_SIZE);
    const row = Math.floor(touchY / CELL_SIZE);
    
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      return;
    }
    
    const index = row * GRID_SIZE + col;
    handleElementTap(index);
  }, [handleElementTap]);

  /**
   * Handle swipe gesture
   */
  const handleSwipeGesture = useCallback((
    fromIndex: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    handleSwipe(fromIndex, direction);
  }, [handleSwipe]);

  /**
   * Handle match completion (for data cascade trigger)
   */
  const handleMatchComplete = useCallback((index: number) => {
    // This callback fires after bloom animation completes
    // The actual data cascade is handled by useMatch3Engine
    // This is for any UI-specific cleanup if needed
  }, []);

  // Background gradient points
  const bgGradientStart = vec(0, 0);
  const bgGradientEnd = vec(BOARD_SIZE, BOARD_SIZE);
  const bgCenter = vec(BOARD_SIZE / 2, BOARD_SIZE / 2);

  return (
    <InputController onSwipe={handleSwipeGesture} onTap={handleTap}>
      <Canvas style={styles.canvas}>
        {/* Board Background - Soft Garden Gradient */}
        <RoundedRect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          r={20}
        >
          <RadialGradient
            c={bgCenter}
            r={BOARD_SIZE * 0.7}
            colors={[
              THEME_COLORS.gardenGradient[0],
              THEME_COLORS.gardenGradient[1],
              THEME_COLORS.paperCream,
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
              onMatchComplete={handleMatchComplete}
            />
          ))}
        </Group>

        {/* Contribution Particles */}
        <Group>
          {contributionParticles.map((particle) => (
            <ContributionParticle
              key={particle.id}
              particle={particle}
              boardSize={BOARD_SIZE}
            />
          ))}
        </Group>
      </Canvas>
    </InputController>
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
