/**
 * Dopamine Match - Main Application Entry Point
 * 
 * A Match-3 game with "Digital Opulence" aesthetic.
 * Built with Expo, React Native Skia, and Reanimated.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameBoard } from './src/components';
import { useGameStore } from './src/store';
import './global.css';

// ============================================================================
// HUD COMPONENT
// ============================================================================

interface HUDProps {
  score: number;
  combo: number;
  highScore: number;
}

const HUD: React.FC<HUDProps> = ({ score, combo, highScore }) => {
  return (
    <View style={styles.hud}>
      <View style={styles.hudItem}>
        <Text style={styles.hudLabel}>SCORE</Text>
        <Text style={styles.hudValue}>{score.toLocaleString()}</Text>
      </View>
      
      {combo > 0 && (
        <View style={styles.comboContainer}>
          <Text style={styles.comboText}>x{combo}</Text>
          <Text style={styles.comboLabel}>COMBO</Text>
        </View>
      )}
      
      <View style={styles.hudItem}>
        <Text style={styles.hudLabel}>BEST</Text>
        <Text style={styles.hudValueSmall}>{highScore.toLocaleString()}</Text>
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
        <StatusBar barStyle="light-content" backgroundColor="#190028" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DOPAMINE MATCH</Text>
          <Text style={styles.subtitle}>Digital Opulence Edition</Text>
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
            <Text style={styles.buttonText}>NEW GAME</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// STYLES - Digital Opulence Theme
// ============================================================================

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#190028', // Deep purple dark
    alignItems: 'center',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF007F', // Electric pink
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 0, 127, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FF6600', // Sunset orange
    letterSpacing: 2,
    marginTop: 4,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
  },
  hudValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  hudValueSmall: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  comboContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6600',
  },
  comboText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6600',
  },
  comboLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FF6600',
    letterSpacing: 1,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(255, 0, 127, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF007F',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 0, 127, 0.4)',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF007F',
    letterSpacing: 2,
  },
});
