/**
 * GameOverModal - "Wither Warning" Loss Screen
 * 
 * CRITICAL REVENUE SCREEN - This is the monetization hook
 * 
 * Features:
 * - "The Garden is Fading!" urgency header
 * - Sad Guardian Avatar visual
 * - "Revive Garden (+5 Moves)" premium gold button with heartbeat animation
 * - "Give Up" small ghost button
 * - BlurView backdrop for focus
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
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

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
  danger: '#E57373',
  dangerDark: '#C62828',
  frostedWhite: 'rgba(255, 255, 255, 0.95)',
  frostedBorder: 'rgba(212, 175, 55, 0.3)',
  witheredGray: '#9E9E9E',
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface GameOverModalProps {
  visible: boolean;
  teamProgress: number;
  onRevive: () => void;
  onGiveUp: () => void;
}

// ============================================================================
// ANIMATED PRESSABLE
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  teamProgress,
  onRevive,
  onGiveUp,
}) => {
  // Heartbeat animation for revive button
  const heartbeat = useSharedValue(1);
  const fadeIn = useSharedValue(0);
  const avatarBounce = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start heartbeat animation
      heartbeat.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false
      );

      // Fade in content
      fadeIn.value = withDelay(200, withTiming(1, { duration: 400 }));

      // Avatar bounce (sad wobble)
      avatarBounce.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      );
    } else {
      fadeIn.value = 0;
      heartbeat.value = 1;
    }
  }, [visible, heartbeat, fadeIn, avatarBounce]);

  const reviveButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartbeat.value }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [20, 0]) }],
    };
  });

  const avatarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${avatarBounce.value}deg` }],
    };
  });

  const progressPercent = Math.round(teamProgress * 100);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <BlurView intensity={40} tint="light" style={styles.blurContainer}>
        <Animated.View 
          entering={SlideInDown.springify().damping(15)}
          style={styles.modalContainer}
        >
          {/* Modal Card */}
          <View style={styles.card}>
            {/* Urgency Header */}
            <Animated.View style={[styles.header, contentStyle]}>
              <Text style={styles.headerEmoji}>!</Text>
              <Text style={styles.headerTitle}>The Garden is Fading!</Text>
              <Text style={styles.headerSubtitle}>You're so close...</Text>
            </Animated.View>

            {/* Sad Guardian Avatar */}
            <Animated.View style={[styles.avatarContainer, avatarStyle]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🥀</Text>
              </View>
              <View style={styles.teardrop}>
                <Text style={styles.teardropEmoji}>💧</Text>
              </View>
            </Animated.View>

            {/* Progress indicator */}
            <Animated.View style={[styles.progressSection, contentStyle]}>
              <Text style={styles.progressLabel}>Garden Growth</Text>
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercent}% Complete</Text>
            </Animated.View>

            {/* Primary CTA - Revive Button with Heartbeat */}
            <AnimatedPressable
              style={[styles.reviveButton, reviveButtonStyle]}
              onPress={onRevive}
            >
              <View style={styles.reviveButtonInner}>
                <Text style={styles.reviveIcon}>✨</Text>
                <View style={styles.reviveTextContainer}>
                  <Text style={styles.reviveButtonText}>Revive Garden</Text>
                  <Text style={styles.reviveButtonSubtext}>+5 Moves</Text>
                </View>
              </View>
            </AnimatedPressable>

            {/* Ad indicator (placeholder) */}
            <Animated.View style={[styles.adIndicator, contentStyle]}>
              <Text style={styles.adIndicatorText}>Watch a short video</Text>
            </Animated.View>

            {/* Secondary CTA - Give Up (Ghost Button) */}
            <Pressable style={styles.giveUpButton} onPress={onGiveUp}>
              <Text style={styles.giveUpText}>Give Up</Text>
            </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    borderColor: COLORS.danger,
    shadowColor: COLORS.dangerDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 32,
    color: COLORS.danger,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dangerDark,
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
    marginVertical: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.paperCream,
    borderWidth: 3,
    borderColor: COLORS.witheredGray,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.witheredGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  teardrop: {
    position: 'absolute',
    right: -8,
    bottom: 8,
  },
  teardropEmoji: {
    fontSize: 20,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 1,
    marginBottom: 8,
  },
  progressBarOuter: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.paperCream,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.witheredGray,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.danger,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.soil,
    marginTop: 6,
  },
  reviveButton: {
    width: '100%',
    marginBottom: 8,
  },
  reviveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldBorder,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.goldLight,
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  reviveIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reviveTextContainer: {
    alignItems: 'flex-start',
  },
  reviveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  reviveButtonSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  adIndicator: {
    marginBottom: 16,
  },
  adIndicatorText: {
    fontSize: 11,
    color: COLORS.soilLight,
    letterSpacing: 0.5,
  },
  giveUpButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  giveUpText: {
    fontSize: 14,
    color: COLORS.witheredGray,
    fontWeight: '500',
  },
});

export default GameOverModal;
