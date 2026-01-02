/**
 * useAmbientSound - Hook for managing ambient game audio
 * 
 * Handles:
 * - Starting/stopping ambient music based on game state
 * - Respecting mute settings
 * - Cleanup on unmount
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../store';
import { soundManager } from '../utils';

export function useAmbientSound() {
  const isMuted = useGameStore((state) => state.isMuted);
  const levelState = useGameStore((state) => state.levelState);
  const isPlayingRef = useRef(false);

  // Handle mute state changes
  useEffect(() => {
    if (isMuted) {
      soundManager.pauseAmbient();
      isPlayingRef.current = false;
    } else if (levelState === 'PLAYING' && !isPlayingRef.current) {
      soundManager.playAmbient();
      isPlayingRef.current = true;
    }
  }, [isMuted, levelState]);

  // Handle app state changes (pause when app goes to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        soundManager.pauseAmbient();
      } else if (nextAppState === 'active' && !isMuted && levelState === 'PLAYING') {
        soundManager.resumeAmbient();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isMuted, levelState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundManager.stopAmbient();
      isPlayingRef.current = false;
    };
  }, []);

  // Play victory/defeat sounds on level end
  useEffect(() => {
    if (levelState === 'WON') {
      soundManager.stopAmbient();
      soundManager.playVictory();
      isPlayingRef.current = false;
    } else if (levelState === 'LOST') {
      soundManager.stopAmbient();
      soundManager.playDefeat();
      isPlayingRef.current = false;
    }
  }, [levelState]);

  return {
    startAmbient: () => {
      if (!isMuted) {
        soundManager.playAmbient();
        isPlayingRef.current = true;
      }
    },
    stopAmbient: () => {
      soundManager.stopAmbient();
      isPlayingRef.current = false;
    },
  };
}

export default useAmbientSound;
