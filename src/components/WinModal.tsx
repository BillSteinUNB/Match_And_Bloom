/**
 * WinModal - "Garden Restored" Victory Screen
 * 
 * Features:
 * - Full-screen "Bloom" shockwave animation (white ring expands)
 * - Celebration confetti/particle effects
 * - Happy Guardian Avatar
 * - "Continue Journey" CTA (Next Level)
 * - BlurView backdrop
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  SlideInDown,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Circle,
  vec,
  RadialGradient,
  Group,
  Paint,
} from '@shopify/react-native-skia';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  paper: '#FDFBF7',
  paperCream: '#F5F0E6',
  soil: '#4A4A4A',
  soilLight: '#6B6B6B',
  goldBorder: '#D4AF37',
  goldLight: '#E8C84B',
  goldGlow: 'rgba(212, 175, 55, 0.4)',
  petalPink: '#FFB7C5',
  leafGreen: '#A0E8AF',
  leafGreenDark: '#7AC98A',
  skyBlue: '#87CEEB',
  sunYellow: '#FFD93D',
  frostedWhite: 'rgba(255, 255, 255, 0.95)',
  frostedBorder: 'rgba(212, 175, 55, 0.3)',
  success: '#66BB6A',
  successDark: '#388E3C',
  white: '#FFFFFF',
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface WinModalProps {
  visible: boolean;
  score: number;
  onContinue: () => void;
}

// ============================================================================
// ANIMATED PRESSABLE
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// BLOOM SHOCKWAVE COMPONENT
// ============================================================================

interface BloomShockwaveProps {
  visible: boolean;
}

const BloomShockwave: React.FC<BloomShockwaveProps> = ({ visible }) => {
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Ring 1 - Main shockwave
      ringOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
      );
      ringScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(2, { duration: 900, easing: Easing.out(Easing.quad) })
      );
    }
  }, [visible, ringScale, ringOpacity]);

  const ringRadius = SCREEN_WIDTH * 0.8;
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group
        transform={[
          { translateX: centerX },
          { translateY: centerY },
          { scale: ringScale.value },
          { translateX: -centerX },
          { translateY: -centerY },
        ]}
        opacity={ringOpacity.value}
      >
        {/* Outer ring */}
        <Circle cx={centerX} cy={centerY} r={ringRadius} style="stroke" strokeWidth={8}>
          <RadialGradient
            c={vec(centerX, centerY)}
            r={ringRadius}
            colors={[COLORS.white, COLORS.sunYellow, 'transparent']}
          />
        </Circle>
        {/* Inner glow */}
        <Circle cx={centerX} cy={centerY} r={ringRadius * 0.8}>
          <RadialGradient
            c={vec(centerX, centerY)}
            r={ringRadius * 0.8}
            colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
          />
        </Circle>
      </Group>
    </Canvas>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WinModal: React.FC<WinModalProps> = ({
  visible,
  score,
  onContinue,
}) => {
  const fadeIn = useSharedValue(0);
  const avatarScale = useSharedValue(0);
  const celebrateRotate = useSharedValue(0);
  const buttonPulse = useSharedValue(1);
  const starsRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Fade in content
      fadeIn.value = withDelay(300, withTiming(1, { duration: 500 }));

      // Avatar pop in
      avatarScale.value = withDelay(
        400,
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      // Celebrate rotation
      celebrateRotate.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.sin) }),
            withTiming(5, { duration: 300, easing: Easing.inOut(Easing.sin) }),
          ),
          3,
          true
        )
      );

      // Button pulse
      buttonPulse.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(1.03, { duration: 600 }),
            withTiming(1, { duration: 600 }),
          ),
          -1,
          true
        )
      );

      // Stars rotate
      starsRotate.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      fadeIn.value = 0;
      avatarScale.value = 0;
      buttonPulse.value = 1;
    }
  }, [visible, fadeIn, avatarScale, celebrateRotate, buttonPulse, starsRotate]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
    };
  });

  const avatarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: avatarScale.value },
        { rotate: `${celebrateRotate.value}deg` },
      ],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonPulse.value }],
    };
  });

  const starsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${starsRotate.value}deg` }],
    };
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      {/* Bloom Shockwave Effect */}
      <BloomShockwave visible={visible} />

      <BlurView intensity={50} tint="light" style={styles.blurContainer}>
        <Animated.View
          entering={SlideInDown.springify().damping(12)}
          style={styles.modalContainer}
        >
          {/* Modal Card */}
          <View style={styles.card}>
            {/* Decorative stars */}
            <Animated.View style={[styles.starsContainer, starsStyle]}>
              <Text style={[styles.star, styles.star1]}>✨</Text>
              <Text style={[styles.star, styles.star2]}>⭐</Text>
              <Text style={[styles.star, styles.star3]}>✨</Text>
              <Text style={[styles.star, styles.star4]}>🌟</Text>
            </Animated.View>

            {/* Success Header */}
            <Animated.View style={[styles.header, contentStyle]}>
              <Text style={styles.headerTitle}>Garden Restored!</Text>
              <Text style={styles.headerSubtitle}>Your care has brought life back</Text>
            </Animated.View>

            {/* Happy Guardian Avatar */}
            <Animated.View style={[styles.avatarContainer, avatarStyle]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🌸</Text>
              </View>
              <View style={styles.sparkle1}>
                <Text style={styles.sparkleEmoji}>✨</Text>
              </View>
              <View style={styles.sparkle2}>
                <Text style={styles.sparkleEmoji}>💫</Text>
              </View>
            </Animated.View>

            {/* Score Display */}
            <Animated.View style={[styles.scoreSection, contentStyle]}>
              <Text style={styles.scoreLabel}>Final Score</Text>
              <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
            </Animated.View>

            {/* Achievement Badges */}
            <Animated.View style={[styles.badgesContainer, contentStyle]}>
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🌱</Text>
                <Text style={styles.badgeText}>Garden Master</Text>
              </View>
            </Animated.View>

            {/* Primary CTA - Continue Button */}
            <AnimatedPressable
              style={[styles.continueButton, buttonStyle]}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>Continue Journey</Text>
              <Text style={styles.continueArrow}>→</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(160, 232, 175, 0.2)',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 360,
  },
  card: {
    backgroundColor: COLORS.frostedWhite,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.leafGreen,
    shadowColor: COLORS.leafGreenDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'visible',
  },
  starsContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -40,
  },
  star: {
    position: 'absolute',
    fontSize: 20,
  },
  star1: {
    top: 0,
    left: 20,
  },
  star2: {
    top: 10,
    right: 30,
  },
  star3: {
    bottom: 40,
    left: 0,
  },
  star4: {
    bottom: 30,
    right: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.successDark,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.soilLight,
    marginTop: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.paperCream,
    borderWidth: 4,
    borderColor: COLORS.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.leafGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -5,
    left: -15,
  },
  sparkleEmoji: {
    fontSize: 24,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.goldBorder,
    letterSpacing: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(160, 232, 175, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.leafGreen,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.successDark,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.leafGreen,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.leafGreenDark,
    shadowColor: COLORS.leafGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  continueArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 8,
  },
});

export default WinModal;
