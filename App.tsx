/**
 * Match & Bloom - Main Application Entry Point
 * 
 * A Match-3 game with "Botanical Zen" aesthetic.
 * Built with Expo, React Native Skia, and Reanimated.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameBoard } from './src/components';
import { useGameStore } from './src/store';
import './global.css';

// ============================================================================
// THEME CONSTANTS - Botanical Zen
// ============================================================================

const COLORS = {
  paper: '#FDFBF7',
  paperCream: '#F5F0E6',
  soil: '#4A4A4A',
  soilLight: '#6B6B6B',
  goldBorder: '#D4AF37',
  goldLight: '#E8C84B',
  petalPink: '#FFB7C5',
  leafGreen: '#A0E8AF',
  frostedWhite: 'rgba(255, 255, 255, 0.7)',
  frostedBorder: 'rgba(212, 175, 55, 0.3)',
};

// ============================================================================
// GUARDIAN AVATAR COMPONENT
// ============================================================================

const GuardianAvatar: React.FC = () => {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>🌸</Text>
      </View>
    </View>
  );
};

// ============================================================================
// TEAM CONTRIBUTION BAR (Progress Bar)
// ============================================================================

interface ContributionBarProps {
  score: number;
  maxScore?: number;
}

const ContributionBar: React.FC<ContributionBarProps> = ({ score, maxScore = 10000 }) => {
  const progress = Math.min(score / maxScore, 1);
  
  return (
    <View style={styles.contributionContainer}>
      <Text style={styles.contributionLabel}>Garden Growth</Text>
      <View style={styles.progressBarOuter}>
        <View style={[styles.progressBarInner, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.contributionValue}>{score.toLocaleString()}</Text>
    </View>
  );
};

// ============================================================================
// HUD COMPONENT - Frosted Glass Style
// ============================================================================

interface HUDProps {
  score: number;
  combo: number;
  highScore: number;
}

const HUD: React.FC<HUDProps> = ({ score, combo, highScore }) => {
  return (
    <View style={styles.hud}>
      {/* Guardian Avatar - Left */}
      <GuardianAvatar />
      
      {/* Center - Contribution Bar or Combo */}
      {combo > 0 ? (
        <View style={styles.comboContainer}>
          <Text style={styles.comboText}>x{combo}</Text>
          <Text style={styles.comboLabel}>BLOOM CHAIN</Text>
        </View>
      ) : (
        <ContributionBar score={score} />
      )}
      
      {/* Best Score - Right */}
      <View style={styles.hudItem}>
        <Text style={styles.hudLabel}>BEST</Text>
        <Text style={styles.hudValue}>{highScore.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [currentScore, setCurrentScore] = useState(0);
  const { combo, highScore, resetGame } = useGameStore();

  const handleScoreChange = useCallback((newScore: number) => {
    setCurrentScore(newScore);
  }, []);

  const handleNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Match & Bloom</Text>
          <Text style={styles.subtitle}>Botanical Zen Edition</Text>
        </View>

        {/* HUD */}
        <HUD score={currentScore} combo={combo} highScore={highScore} />

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <GameBoard onScoreChange={handleScoreChange} />
        </View>

        {/* Footer / Controls */}
        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
            onPress={handleNewGame}
          >
            <Text style={styles.buttonText}>New Garden</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// STYLES - Botanical Zen Theme
// ============================================================================

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
  },
  
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.soil,
    letterSpacing: 1,
    // Note: For true Nunito/Lora fonts, would need expo-font
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.soilLight,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  
  // HUD
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Guardian Avatar
  avatarContainer: {
    width: 56,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.frostedWhite,
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  
  // Contribution Bar
  contributionContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    backgroundColor: COLORS.frostedWhite,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
  },
  contributionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  progressBarOuter: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.paperCream,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.leafGreen,
    borderRadius: 4,
  },
  contributionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.soil,
    marginTop: 4,
  },
  
  // HUD Items
  hudItem: {
    alignItems: 'center',
    backgroundColor: COLORS.frostedWhite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 1.5,
  },
  hudValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.soil,
    marginTop: 2,
  },
  
  // Combo Container
  comboContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 183, 197, 0.3)', // Petal pink transparent
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.petalPink,
  },
  comboText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.petalPink,
  },
  comboLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.soil,
    letterSpacing: 1,
  },
  
  // Board Container
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  
  // Footer
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.frostedWhite,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: COLORS.paperCream,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.soil,
    letterSpacing: 1,
  },
});
