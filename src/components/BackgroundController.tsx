/**
 * BackgroundController - Living Garden Background
 * 
 * Implements the "Living Garden" meta-layer with two Skia image layers:
 * - Layer A (Bottom): Desaturated, "Withered" garden
 * - Layer B (Top): Vibrant, colorful "Bloomed" version
 * 
 * Layer B opacity is controlled by teamProgress (0-100%)
 * As users match and contribute, the world literally gains color.
 */

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Rect,
  LinearGradient,
  RadialGradient,
  vec,
  Group,
  Blur,
  ColorMatrix,
  Paint,
  RoundedRect,
  Circle,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolate,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useGameStore, selectTeamProgress } from '../store';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Color palettes for withered and bloomed states
const WITHERED_COLORS = {
  primary: '#9E9E9E',       // Gray
  secondary: '#BDBDBD',     // Light gray
  accent: '#8D8D8D',        // Dark gray
  background: '#E0E0E0',    // Very light gray
};

const BLOOMED_COLORS = {
  primary: '#A0E8AF',       // Leaf green
  secondary: '#FFB7C5',     // Petal pink
  accent: '#87CEEB',        // Water blue
  sunlight: '#FFD93D',      // Sun yellow
  background: '#FDFBF7',    // Paper cream
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface BackgroundControllerProps {
  children: React.ReactNode;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BackgroundController: React.FC<BackgroundControllerProps> = ({ children }) => {
  const teamProgress = useGameStore(selectTeamProgress);

  // Animated opacity for the bloomed layer
  const bloomedOpacity = useDerivedValue(() => {
    return withSpring(teamProgress, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    });
  }, [teamProgress]);

  // Floating animation for decorative elements
  const floatAnim = useSharedValue(0);
  React.useEffect(() => {
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [floatAnim]);

  const floatOffset = useDerivedValue(() => {
    return interpolate(floatAnim.value, [0, 1], [-5, 5]);
  });

  // BREATHING ANIMATION: Slow sine wave scale transform for the bloomed layer
  // Scale: 1.0 -> 1.05 over 20 seconds, creates "living garden" feel
  const breathingAnim = useSharedValue(0);
  React.useEffect(() => {
    breathingAnim.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [breathingAnim]);

  // Calculate breathing scale (1.0 to 1.05) - used directly in Skia transform
  const breathingTransform = useDerivedValue(() => {
    const scale = interpolate(breathingAnim.value, [0, 1], [1.0, 1.05]);
    // Return transformation matrix that scales from center
    const translateX = (SCREEN_WIDTH * (1 - scale)) / 2;
    const translateY = (SCREEN_HEIGHT * (1 - scale)) / 2;
    return [
      { translateX },
      { translateY },
      { scale },
    ];
  });

  return (
    <View style={styles.container}>
      {/* Skia Canvas Background */}
      <Canvas style={styles.canvas}>
        {/* ============================================================ */}
        {/* LAYER A: Withered Garden (Bottom Layer - Always Visible) */}
        {/* ============================================================ */}
        <Group>
          {/* Base gradient - desaturated */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, SCREEN_HEIGHT)}
              colors={[WITHERED_COLORS.background, WITHERED_COLORS.secondary]}
            />
          </Rect>

          {/* Subtle radial highlight - gray */}
          <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT * 0.3} r={SCREEN_WIDTH * 0.6}>
            <RadialGradient
              c={vec(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.3)}
              r={SCREEN_WIDTH * 0.6}
              colors={['rgba(158, 158, 158, 0.3)', 'transparent']}
            />
          </Circle>

          {/* Withered decorative circles (abstract garden elements) */}
          <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.15} r={40}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.2, SCREEN_HEIGHT * 0.15)}
              r={40}
              colors={[WITHERED_COLORS.primary, 'transparent']}
            />
          </Circle>
          <Circle cx={SCREEN_WIDTH * 0.8} cy={SCREEN_HEIGHT * 0.12} r={30}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.12)}
              r={30}
              colors={[WITHERED_COLORS.accent, 'transparent']}
            />
          </Circle>
          <Circle cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.85} r={50}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.15, SCREEN_HEIGHT * 0.85)}
              r={50}
              colors={[WITHERED_COLORS.secondary, 'transparent']}
            />
          </Circle>
          <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.88} r={35}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.85, SCREEN_HEIGHT * 0.88)}
              r={35}
              colors={[WITHERED_COLORS.primary, 'transparent']}
            />
          </Circle>
        </Group>

        {/* ============================================================ */}
        {/* LAYER B: Bloomed Garden (Top Layer - Opacity = teamProgress) */}
        {/* With Breathing Animation (slow scale 1.0 -> 1.05)            */}
        {/* ============================================================ */}
        <Group 
          opacity={bloomedOpacity}
          transform={breathingTransform}
        >
          {/* Vibrant base gradient */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, SCREEN_HEIGHT)}
              colors={[BLOOMED_COLORS.background, '#E8F5E9']}
            />
          </Rect>

          {/* Warm sunlight radial */}
          <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT * 0.25} r={SCREEN_WIDTH * 0.7}>
            <RadialGradient
              c={vec(SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.25)}
              r={SCREEN_WIDTH * 0.7}
              colors={['rgba(255, 217, 61, 0.2)', 'transparent']}
            />
          </Circle>

          {/* Bloomed decorative circles (colorful garden elements) */}
          {/* Green leaf - top left */}
          <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.15} r={40}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.2, SCREEN_HEIGHT * 0.15)}
              r={40}
              colors={[BLOOMED_COLORS.primary, 'transparent']}
            />
          </Circle>
          {/* Pink petal - top right */}
          <Circle cx={SCREEN_WIDTH * 0.8} cy={SCREEN_HEIGHT * 0.12} r={30}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.12)}
              r={30}
              colors={[BLOOMED_COLORS.secondary, 'transparent']}
            />
          </Circle>
          {/* Blue water - bottom left */}
          <Circle cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.85} r={50}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.15, SCREEN_HEIGHT * 0.85)}
              r={50}
              colors={[BLOOMED_COLORS.accent, 'transparent']}
            />
          </Circle>
          {/* Yellow sun - bottom right */}
          <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.88} r={35}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.85, SCREEN_HEIGHT * 0.88)}
              r={35}
              colors={[BLOOMED_COLORS.sunlight, 'transparent']}
            />
          </Circle>

          {/* Additional bloom accents */}
          <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.08} r={25}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.08)}
              r={25}
              colors={['rgba(255, 183, 197, 0.5)', 'transparent']}
            />
          </Circle>
          <Circle cx={SCREEN_WIDTH * 0.35} cy={SCREEN_HEIGHT * 0.92} r={20}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.35, SCREEN_HEIGHT * 0.92)}
              r={20}
              colors={['rgba(160, 232, 175, 0.5)', 'transparent']}
            />
          </Circle>
          <Circle cx={SCREEN_WIDTH * 0.65} cy={SCREEN_HEIGHT * 0.9} r={28}>
            <RadialGradient
              c={vec(SCREEN_WIDTH * 0.65, SCREEN_HEIGHT * 0.9)}
              r={28}
              colors={['rgba(135, 206, 235, 0.4)', 'transparent']}
            />
          </Circle>
        </Group>
      </Canvas>

      {/* Children overlay */}
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  childrenContainer: {
    flex: 1,
  },
});

export default BackgroundController;
