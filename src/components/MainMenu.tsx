/**
 * MainMenu - Botanical Zen Garden Entry Screen
 * 
 * Match & Bloom - Garden Guardians
 * 
 * Features:
 * - Frosted glass card design
 * - Play button to Level Select
 * - Continue button for last played level
 * - Settings access
 * - Campaign progress indicator
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store';
import { getTotalLevels } from '../data';

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
  petalPink: '#FFB7C5',
  leafGreen: '#A0E8AF',
  leafGreenDark: '#7AC98A',
  frostedWhite: 'rgba(255, 255, 255, 0.85)',
  frostedBorder: 'rgba(212, 175, 55, 0.4)',
  overlay: 'rgba(74, 74, 74, 0.5)',
};

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MainMenuProps {
  onNavigateToLevelSelect: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNavigateToLevelSelect,
  onOpenSettings,
}) => {
  const {
    lastVisitedLevel,
    highestUnlockedLevel,
    isMuted,
    isHapticsEnabled,
    startLevel,
    goToLevelSelect,
  } = useGameStore();

  // Animation refs
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const progressOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const settingsButtonScale = useSharedValue(0.9);
  const leafRotate = useSharedValue(0);

  // Entry animations
  useEffect(() => {
    // Title animation
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    titleScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));

    // Card animation
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    cardTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 100 }));

    // Progress bar animation
    progressOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // Button animation
    buttonScale.value = withDelay(600, withSpring(1, { damping: 15, stiffness: 150 }));

    // Settings button animation
    settingsButtonScale.value = withDelay(700, withSpring(1, { damping: 15, stiffness: 150 }));

    // Gentle leaf rotation loop
    leafRotate.value = withDelay(800, withSequence(
      withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    ));
  }, []);

  // Animated styles
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const continueButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const settingsButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsButtonScale.value }],
  }));

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leafRotate.value}deg` }],
  }));

  // Handlers
  const handlePlay = useCallback(() => {
    if (isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNavigateToLevelSelect();
  }, [isHapticsEnabled, onNavigateToLevelSelect]);

  const handleContinue = useCallback(() => {
    if (isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    startLevel(lastVisitedLevel);
  }, [isHapticsEnabled, startLevel, lastVisitedLevel]);

  const handleSettings = useCallback(() => {
    if (isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenSettings();
  }, [isHapticsEnabled, onOpenSettings]);

  // Calculate progress
  const totalLevels = getTotalLevels();
  const progressPercent = (highestUnlockedLevel / totalLevels) * 100;

  return (
    <View style={styles.container}>
      {/* Decorative leaf */}
      <Animated.View style={[styles.decorativeLeaf, leafStyle]}>
        <Text style={styles.decorativeLeafEmoji}>🌿</Text>
      </Animated.View>

      {/* Title Card */}
      <Animated.View style={[styles.titleCard, titleStyle]}>
        <Text style={styles.titleEmoji}>🌸</Text>
        <Text style={styles.title}>Match & Bloom</Text>
        <Text style={styles.subtitle}>Garden Guardians</Text>
      </Animated.View>

      {/* Main Menu Card */}
      <Animated.View style={[styles.menuCard, cardStyle]}>
        {/* Progress Section */}
        <Animated.View style={[styles.progressSection, progressStyle]}>
          <Text style={styles.progressLabel}>Your Garden</Text>
          <View style={styles.progressBarOuter}>
            <View
              style={[
                styles.progressBarInner,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {highestUnlockedLevel} of {totalLevels} levels
          </Text>
        </Animated.View>

        {/* Play Button */}
        <AnimatedPressable
          style={[styles.playButton, playButtonStyle]}
          onPress={handlePlay}
        >
          <View style={styles.playButtonInner}>
            <Text style={styles.playButtonIcon}>🌱</Text>
            <Text style={styles.playButtonText}>Play</Text>
          </View>
        </AnimatedPressable>

        {/* Continue Button */}
        <AnimatedPressable
          style={[styles.continueButton, continueButtonStyle]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            Continue from Level {lastVisitedLevel}
          </Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Settings Button (top right) */}
      <AnimatedPressable
        style={[styles.settingsButton, settingsButtonStyle]}
        onPress={handleSettings}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </AnimatedPressable>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  decorativeLeaf: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.08,
    right: SCREEN_WIDTH * 0.15,
  },
  decorativeLeafEmoji: {
    fontSize: 48,
  },
  titleCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.soil,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.soilLight,
    marginTop: 4,
    letterSpacing: 2,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.frostedWhite,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
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
    height: 10,
    backgroundColor: COLORS.paperCream,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.soil,
    marginTop: 8,
  },
  playButton: {
    width: '100%',
    marginBottom: 12,
  },
  playButtonInner: {
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
  },
  playButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 0.5,
  },
  settingsButton: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.06,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.frostedWhite,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  settingsButtonText: {
    fontSize: 22,
  },
  version: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: COLORS.soilLight,
    letterSpacing: 0.5,
  },
});

export default MainMenu;
