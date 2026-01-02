/**
 * LevelSelect - Campaign Level Selection Grid
 * 
 * Match & Bloom - Garden Guardians
 * 
 * Features:
 * - 3-column grid of level tiles
 * - Locked/unlocked/completed visual states
 * - Stars and best score display
 * - Botanical themed design
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store';
import { getTotalLevels, getLevelById } from '../data';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LIST_PADDING = 20;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - LIST_PADDING * 2 - ITEM_MARGIN * 2) / 3;

const COLORS = {
  paper: '#FDFBF7',
  paperCream: '#F5F0E6',
  soil: '#4A4A4A',
  soilLight: '#6B6B6B',
  goldBorder: '#D4AF37',
  goldLight: '#E8C84B',
  petalPink: '#FFB7C5',
  petalPinkLight: '#FFD4DE',
  leafGreen: '#A0E8AF',
  leafGreenDark: '#7AC98A',
  locked: '#BDBDBD',
  lockedDark: '#9E9E9E',
  frostedWhite: 'rgba(255, 255, 255, 0.85)',
  frostedBorder: 'rgba(212, 175, 55, 0.3)',
};

// ============================================================================
// LEVEL TILE COMPONENT
// ============================================================================

interface LevelTileProps {
  levelId: number;
  isLocked: boolean;
  levelName: string;
  onPress: (levelId: number) => void;
  bestStars?: number;
  bestScore?: number;
  isCompleted?: boolean;
}

const LevelTile: React.FC<LevelTileProps> = ({
  levelId,
  isLocked,
  levelName,
  onPress,
  bestStars = 0,
  bestScore = 0,
  isCompleted = false,
}) => {
  const handlePress = useCallback(() => {
    if (isLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(levelId);
  }, [isLocked, onPress, levelId]);

  // Render stars
  const renderStars = () => {
    if (isLocked) return null;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              star <= bestStars ? styles.starFilled : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  // Render level icon based on state
  const renderIcon = () => {
    if (isLocked) {
      return (
        <View style={[styles.iconContainer, styles.iconLocked]}>
          <Text style={styles.iconEmoji}>🔒</Text>
        </View>
      );
    }
    
    if (isCompleted) {
      return (
        <View style={[styles.iconContainer, styles.iconCompleted]}>
          <Text style={styles.iconEmoji}>🌸</Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.iconContainer, styles.iconUnlocked]}>
        <Text style={styles.iconEmoji}>🌱</Text>
      </View>
    );
  };

  return (
    <Pressable
      style={[
        styles.tile,
        isLocked && styles.tileLocked,
      ]}
      onPress={handlePress}
      disabled={isLocked}
    >
      {/* Level number */}
      <Text style={[styles.levelNumber, isLocked && styles.levelNumberLocked]}>
        {levelId}
      </Text>

      {/* Icon */}
      {renderIcon()}

      {/* Level name */}
      <Text
        style={[
          styles.levelName,
          isLocked && styles.levelNameLocked,
        ]}
        numberOfLines={1}
      >
        {levelName}
      </Text>

      {/* Stars */}
      {renderStars()}

      {/* Best score (if completed) */}
      {isCompleted && !isLocked && (
        <Text style={styles.bestScore}>
          {bestScore.toLocaleString()}
        </Text>
      )}
    </Pressable>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface LevelSelectHeaderProps {
  onBack: () => void;
  progress: number;
  total: number;
}

const LevelSelectHeader: React.FC<LevelSelectHeaderProps> = ({
  onBack,
  progress,
  total,
}) => {
  const progressPercent = (progress / total) * 100;

  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Select Level</Text>
        <View style={styles.headerProgress}>
          <View style={styles.headerProgressBarOuter}>
            <View
              style={[
                styles.headerProgressBarInner,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.headerProgressText}>
            {progress}/{total}
          </Text>
        </View>
      </View>

      <View style={styles.headerSpacer} />
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface LevelSelectProps {
  onBack: () => void;
  onLevelSelect: (levelId: number) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  onBack,
  onLevelSelect,
}) => {
  const { highestUnlockedLevel, levelResults, startLevel } = useGameStore();

  const totalLevels = getTotalLevels();

  const handleLevelPress = useCallback((levelId: number) => {
    startLevel(levelId);
    onLevelSelect(levelId);
  }, [startLevel, onLevelSelect]);

  const renderLevelItem = useCallback(({ item }: { item: number }) => {
    const levelConfig = getLevelById(item);
    if (!levelConfig) return null;

    const result = levelResults[item];

    return (
      <LevelTile
        levelId={item}
        isLocked={item > highestUnlockedLevel}
        levelName={levelConfig.name}
        onPress={handleLevelPress}
        bestStars={result?.bestStars}
        bestScore={result?.bestScore}
        isCompleted={result?.completed}
      />
    );
  }, [highestUnlockedLevel, levelResults, handleLevelPress]);

  // Generate level numbers array
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LevelSelectHeader
        onBack={onBack}
        progress={highestUnlockedLevel}
        total={totalLevels}
      />

      {/* Level Grid */}
      <FlatList
        data={levels}
        renderItem={renderLevelItem}
        keyExtractor={(item) => `level-${item}`}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />

      {/* Decorative footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Complete levels to unlock more!
        </Text>
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostedBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.soil,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.soil,
  },
  headerProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  headerProgressBarOuter: {
    width: 100,
    height: 6,
    backgroundColor: COLORS.paperCream,
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressBarInner: {
    height: '100%',
    backgroundColor: COLORS.leafGreen,
  },
  headerProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.soilLight,
    marginLeft: 8,
  },
  headerSpacer: {
    width: 70,
  },
  gridContainer: {
    paddingHorizontal: LIST_PADDING,
    paddingTop: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  tile: {
    width: ITEM_WIDTH,
    aspectRatio: 0.75,
    backgroundColor: COLORS.frostedWhite,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
    marginBottom: ITEM_MARGIN,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tileLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: COLORS.locked,
    opacity: 0.7,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.soil,
  },
  levelNumberLocked: {
    color: COLORS.lockedDark,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnlocked: {
    backgroundColor: COLORS.paperCream,
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
  },
  iconCompleted: {
    backgroundColor: COLORS.leafGreen,
    borderWidth: 2,
    borderColor: COLORS.leafGreenDark,
  },
  iconLocked: {
    backgroundColor: COLORS.locked,
  },
  iconEmoji: {
    fontSize: 22,
  },
  levelName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.soil,
    textAlign: 'center',
  },
  levelNameLocked: {
    color: COLORS.lockedDark,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  starFilled: {
    color: COLORS.goldBorder,
  },
  starEmpty: {
    color: COLORS.paperCream,
  },
  bestScore: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.soilLight,
    marginTop: 2,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.soilLight,
    fontStyle: 'italic',
  },
});

export default LevelSelect;
