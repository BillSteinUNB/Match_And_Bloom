/**
 * ContributionParticle - Social Spark Particle Animation
 * Match & Bloom - Botanical Zen Edition
 *
 * Creates a glowing orb that flies from match location to Guardian Avatar
 * using bezier curve animation for organic, floating motion.
 *
 * Features:
 * - Bezier curve path from match to Guardian
 * - Glow effect with radial gradient
 * - Scale animation (pulse effect)
 * - Automatic cleanup on animation complete
 */

import React, { useEffect, useCallback } from 'react';
import {
  Group,
  Circle,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { ContributionParticle as ContributionParticleType } from '../types';
import { useGameStore } from '../store';

// ============================================================================
// CONSTANTS
// ============================================================================

const BOARD_SIZE = 350; // Approximate, will be set by props

// Guardian Avatar position
const GUARDIAN_X = 40; // Approximate guardian position
const GUARDIAN_Y = 80;

// Animation timing
const FLIGHT_DURATION = 800; // ms
const GLOW_PULSE_DURATION = 400; // ms

// ============================================================================
// PROPS
// ============================================================================

interface ContributionParticleProps {
  particle: ContributionParticleType;
  boardSize?: number;
  onAnimationComplete?: (particleId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ContributionParticle: React.FC<ContributionParticleProps> = ({
  particle,
  boardSize = BOARD_SIZE,
  onAnimationComplete,
}) => {
  const removeContributionParticle = useGameStore(
    (state) => state.removeContributionParticle
  );

  const cellSize = boardSize / 8;

  // Calculate source position in board coordinates
  const { row, col } = (() => {
    const r = Math.floor(particle.sourceIndex / 8);
    const c = particle.sourceIndex % 8;
    return { row: r, col: c };
  })();

  const sourceX = col * cellSize + cellSize / 2;
  const sourceY = row * cellSize + cellSize / 2;

  // Target position (Guardian Avatar) - top left of HUD area
  const targetX = GUARDIAN_X;
  const targetY = GUARDIAN_Y;

  // Calculate bezier control points for organic curve
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const controlOffset = 60;

  // Animation shared values
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  /**
   * Calculate bezier curve position at given progress (0 to 1)
   * Uses quadratic bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
   */
  const getBezierPosition = useCallback((t: number): { x: number; y: number } => {
    const p0 = { x: sourceX, y: sourceY };
    const p1 = { x: midX + controlOffset, y: midY - controlOffset };
    const p2 = { x: targetX, y: targetY };

    const oneMinusT = 1 - t;

    return {
      x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
      y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
    };
  }, [sourceX, sourceY, targetX, targetY, midX, midY]);

  /**
   * Handle animation completion
   */
  const handleAnimationComplete = useCallback(() => {
    'worklet';
    runOnJS(removeContributionParticle)(particle.id);
    if (onAnimationComplete) {
      runOnJS(onAnimationComplete)(particle.id);
    }
  }, [particle.id, removeContributionParticle, onAnimationComplete]);

  /**
   * Animation effect
   */
  useEffect(() => {
    // Start flight animation
    progress.value = withTiming(
      1,
      {
        duration: FLIGHT_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        'worklet';
        if (finished) {
          // Fade out and pulse on arrival
          opacity.value = withTiming(0, { duration: 200 });
          scale.value = withSequence(
            withTiming(1.5, { duration: 150 }),
            withTiming(0, { duration: 100 }, (isFinished) => {
              'worklet';
              if (isFinished) {
                handleAnimationComplete();
              }
            })
          );
        }
      }
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  /**
   * Animated position using useDerivedValue
   */
  const animatedTransform = useDerivedValue(() => {
    const pos = getBezierPosition(progress.value);
    return [
      { translateX: pos.x },
      { translateY: pos.y },
      { scale: scale.value },
    ];
  }, [getBezierPosition]);

  const animatedOpacity = useDerivedValue(() => opacity.value, []);

  // Get contribution color based on amount
  const getContributionColor = (amount: number): string => {
    if (amount >= 100) return '#FFD700'; // Gold
    if (amount >= 50) return '#FFB7C5';  // Pink
    return '#A0E8AF'; // Green
  };

  const particleColor = getContributionColor(particle.contributionAmount);

  return (
    <Group transform={animatedTransform} opacity={animatedOpacity}>
      {/* Outer glow */}
      <Circle
        cx={0}
        cy={0}
        r={20}
        color={particleColor}
      >
        <RadialGradient
          c={vec(0, 0)}
          r={20}
          colors={[`${particleColor}66`, `${particleColor}00`]}
        />
        <BlurMask blur={10} style="normal" />
      </Circle>

      {/* Main particle body */}
      <Circle
        cx={0}
        cy={0}
        r={8}
        color={particleColor}
      >
        <RadialGradient
          c={vec(-2, -2)}
          r={8}
          colors={['#FFFFFF', particleColor]}
        />
      </Circle>

      {/* Inner bright core */}
      <Circle
        cx={0}
        cy={0}
        r={4}
        color="#FFFFFF"
      >
        <RadialGradient
          c={vec(0, 0)}
          r={4}
          colors={['#FFFFFF', `${particleColor}99`]}
        />
      </Circle>
    </Group>
  );
};

export default ContributionParticle;
