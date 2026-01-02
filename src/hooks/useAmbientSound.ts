/**
 * useAmbientSound - Hook for managing ambient game audio
 * 
 * Handles:
 * - Starting/stopping ambient music based on game state
 * - Respecting mute settings
 * - Cleanup on unmount (properly unloads Sound objects to prevent memory leaks)
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../store';
import { soundManager } from '../utils';

export function useAmbientSound() {
  const isMuted = useGameStore((state) => state.isMuted);
  const levelState = useGameStore((state) => state.levelState);
  const isPlayingRef = useRef(false);
  const isMountedRef = useRef(true);

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
      if (!isMountedRef.current) return;
      
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

  // Cleanup on unmount - CRITICAL: Unload all sounds to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      soundManager.stopAmbient();
      isPlayingRef.current = false;
      
      // Full cleanup: unload all Sound objects to prevent memory leaks on restart
      soundManager.cleanup().catch((err) => {
        console.warn('[useAmbientSound] Cleanup error:', err);
      });
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
      if (!isMuted && isMountedRef.current) {
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
