/**
 * Match & Bloom - Main Application Entry Point
 * 
 * A Match-3 game with "Botanical Zen" aesthetic.
 * Built with Expo, React Native Skia, and Reanimated.
 * 
 * Phase 6: Added persistence, asset pre-loading, and settings modal.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Pressable, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  GameBoard, 
  BackgroundController, 
  GameOverModal, 
  WinModal,
  SettingsModal,
  TextureOverlay,
} from './src/components';
import { useGameStore } from './src/store';
import { useAmbientSound, useCachedResources } from './src/hooks';
import { getTotalLevels } from './src/data';
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
// LOADING SCREEN COMPONENT
// ============================================================================

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>🌸</Text>
      <Text style={styles.loadingText}>Loading Garden...</Text>
      <ActivityIndicator size="large" color={COLORS.goldBorder} style={styles.spinner} />
    </View>
  );
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
  moves: number;
  maxMoves: number;
  maxScore: number;
  onSettingsPress: () => void;
}

const HUD: React.FC<HUDProps> = ({ score, combo, highScore, moves, maxMoves, maxScore, onSettingsPress }) => {
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
        <ContributionBar score={score} maxScore={maxScore} />
      )}
      
      {/* Moves Counter - Right Side */}
      <View style={styles.movesContainer}>
        <Text style={styles.movesLabel}>MOVES</Text>
        <Text style={[
          styles.movesValue,
          moves <= 5 && styles.movesLow,
          moves <= 3 && styles.movesCritical
        ]}>{moves}</Text>
      </View>
      
      {/* Settings Gear - Far Right */}
      <Pressable 
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.settingsButtonPressed,
        ]}
        onPress={onSettingsPress}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </Pressable>
    </View>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  // Asset pre-loading (keeps splash screen until ready)
  const isLoadingComplete = useCachedResources();
  
  const [currentScore, setCurrentScore] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { 
    combo, 
    highScore, 
    moves, 
    maxMoves,
    teamProgress,
    levelState,
    resetGame,
    addMoves,
    currentLevel,
    currentLevelConfig,
    isMuted,
    toggleMute,
    nextLevel,
    restartLevel,
  } = useGameStore();

  // Initialize ambient sound
  useAmbientSound();

  const handleScoreChange = useCallback((newScore: number) => {
    setCurrentScore(newScore);
  }, []);

  const handleNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Handle revive from GameOverModal
  const handleRevive = useCallback(() => {
    addMoves(5);
  }, [addMoves]);

  // Handle give up from GameOverModal
  const handleGiveUp = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Handle continue from WinModal
  const handleContinue = useCallback(() => {
    const hasMore = nextLevel();
    if (!hasMore) {
      // Game complete - all levels finished!
      // For now, just restart from level 1
      resetGame();
    }
  }, [nextLevel, resetGame]);

  // Settings modal handlers
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Show loading screen while assets are being loaded
  if (!isLoadingComplete) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <BackgroundController>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Match & Bloom</Text>
            <View style={styles.levelIndicator}>
              <Text style={styles.levelText}>Level {currentLevel} of {getTotalLevels()}</Text>
              {currentLevelConfig.name && (
                <Text style={styles.levelName}>{currentLevelConfig.name}</Text>
              )}
            </View>
          </View>

          {/* HUD */}
          <HUD 
            score={currentScore} 
            combo={combo} 
            highScore={highScore} 
            moves={moves}
            maxMoves={maxMoves}
            maxScore={currentLevelConfig.targetProgress}
            onSettingsPress={handleOpenSettings}
          />

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <GameBoard onScoreChange={handleScoreChange} />
          </View>

          {/* Footer / Controls */}
          <View style={styles.footer}>
            <View style={styles.footerControls}>
              {/* Sound Toggle */}
              <Pressable 
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={toggleMute}
              >
                <Text style={styles.iconButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
              </Pressable>

              {/* New Garden Button */}
              <Pressable 
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleNewGame}
              >
                <Text style={styles.buttonText}>New Garden</Text>
              </Pressable>

              {/* Restart Level */}
              <Pressable 
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={restartLevel}
              >
                <Text style={styles.iconButtonText}>🔄</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Game Over Modal (Loss) */}
        <GameOverModal
          visible={levelState === 'LOST'}
          teamProgress={teamProgress}
          onRevive={handleRevive}
          onGiveUp={handleGiveUp}
        />

        {/* Win Modal */}
        <WinModal
          visible={levelState === 'WON'}
          score={currentScore}
          onContinue={handleContinue}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={isSettingsOpen}
          onClose={handleCloseSettings}
        />

        {/* Texture Overlay - Organic paper grain effect (on top of everything) */}
        <TextureOverlay />
      </BackgroundController>
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
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  
  // Loading Screen
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.soil,
    letterSpacing: 1,
  },
  spinner: {
    marginTop: 24,
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
  
  // Moves Counter
  movesContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.frostedWhite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
    marginRight: 8,
  },
  movesLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 1.5,
  },
  movesValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.soil,
    marginTop: 2,
  },
  movesLow: {
    color: '#FFA726', // Orange warning
  },
  movesCritical: {
    color: '#EF5350', // Red danger
  },
  
  // Settings Button
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.frostedWhite,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonPressed: {
    backgroundColor: COLORS.paperCream,
    transform: [{ scale: 0.95 }],
  },
  settingsButtonText: {
    fontSize: 20,
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
  
  // Level Indicator
  levelIndicator: {
    alignItems: 'center',
    marginTop: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.soilLight,
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.soilLight,
    letterSpacing: 0.5,
    marginTop: 2,
    fontStyle: 'italic',
  },
  
  // Footer Controls
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.frostedWhite,
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 22,
  },
});
