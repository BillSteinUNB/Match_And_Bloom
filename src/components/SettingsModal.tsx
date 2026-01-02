/**
 * SettingsModal - Frosted Glass Settings Overlay
 * 
 * Organic Luxury design system modal with toggles for:
 * - Nature Sounds (Music/Audio)
 * - Tactile Feel (Haptics)
 * - Reset Garden (Debug - with confirmation)
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store';
import { soundManager } from '../utils';

// ============================================================================
// THEME CONSTANTS - Botanical Zen (Layer 2 Style)
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
  frostedWhite: 'rgba(255, 255, 255, 0.85)',
  frostedBorder: 'rgba(212, 175, 55, 0.4)',
  overlay: 'rgba(74, 74, 74, 0.6)',
  danger: '#EF5350',
};

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// SETTINGS MODAL COMPONENT
// ============================================================================

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    isMuted,
    isHapticsEnabled,
    toggleMute,
    toggleHaptics,
    clearAllData,
  } = useGameStore();

  // Handle sound toggle
  const handleSoundToggle = useCallback(async () => {
    toggleMute();
    await soundManager.setMuted(!isMuted);
    
    // Play haptic feedback if enabled
    if (isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isMuted, isHapticsEnabled, toggleMute]);

  // Handle haptics toggle
  const handleHapticsToggle = useCallback(() => {
    toggleHaptics();
    
    // Give immediate feedback on toggle
    if (!isHapticsEnabled) {
      // About to be enabled - give feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [isHapticsEnabled, toggleHaptics]);

  // Handle reset garden with confirmation
  const handleResetGarden = useCallback(() => {
    if (isHapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      'Reset Garden?',
      'This will erase all progress and start fresh. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            if (isHapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onClose();
          },
        },
      ],
      { cancelable: true }
    );
  }, [isHapticsEnabled, clearAllData, onClose]);

  // Handle close with haptic
  const handleClose = useCallback(() => {
    if (isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [isHapticsEnabled, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Settings List */}
          <View style={styles.settingsList}>
            {/* Nature Sounds Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🎵</Text>
                <View>
                  <Text style={styles.settingLabel}>Nature Sounds</Text>
                  <Text style={styles.settingDescription}>
                    Ambient garden audio
                  </Text>
                </View>
              </View>
              <Switch
                value={!isMuted}
                onValueChange={handleSoundToggle}
                trackColor={{ false: COLORS.paperCream, true: COLORS.leafGreen }}
                thumbColor={COLORS.paper}
                ios_backgroundColor={COLORS.paperCream}
              />
            </View>

            {/* Tactile Feel Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>📳</Text>
                <View>
                  <Text style={styles.settingLabel}>Tactile Feel</Text>
                  <Text style={styles.settingDescription}>
                    Haptic feedback
                  </Text>
                </View>
              </View>
              <Switch
                value={isHapticsEnabled}
                onValueChange={handleHapticsToggle}
                trackColor={{ false: COLORS.paperCream, true: COLORS.leafGreen }}
                thumbColor={COLORS.paper}
                ios_backgroundColor={COLORS.paperCream}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Reset Garden Button */}
            <Pressable
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.dangerButtonPressed,
              ]}
              onPress={handleResetGarden}
            >
              <Text style={styles.dangerButtonIcon}>🗑️</Text>
              <View>
                <Text style={styles.dangerButtonLabel}>Reset Garden</Text>
                <Text style={styles.dangerButtonDescription}>
                  Erase all progress
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Match & Bloom v1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES - Organic Luxury / Frosted Glass
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.frostedWhite,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.goldBorder,
    shadowColor: COLORS.goldBorder,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.soil,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.frostedBorder,
  },
  closeButtonPressed: {
    backgroundColor: COLORS.paperCream,
    transform: [{ scale: 0.95 }],
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.soilLight,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.frostedBorder,
    marginHorizontal: 24,
  },
  settingsList: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.soil,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.soilLight,
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 83, 80, 0.3)',
  },
  dangerButtonPressed: {
    backgroundColor: 'rgba(239, 83, 80, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  dangerButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  dangerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  dangerButtonDescription: {
    fontSize: 12,
    color: COLORS.soilLight,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.soilLight,
    letterSpacing: 0.5,
  },
});

export default SettingsModal;
