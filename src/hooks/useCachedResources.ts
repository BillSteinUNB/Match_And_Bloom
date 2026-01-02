/**
 * useCachedResources - Asset Pre-loading Hook
 * 
 * The "Silent Loader" - ensures all assets are loaded before showing the app.
 * Keeps the native splash screen visible until everything is ready.
 * 
 * Assets loaded:
 * - Fonts: Nunito-Bold, Lora-Regular (when available)
 * - Audio: Pre-buffer ambient loop and sound effects
 * - Store: Wait for Zustand persistence hydration
 */

import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useGameStore } from '../store';
import { soundManager } from '../utils';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or failed to prevent - ignore
});

interface CachedResourcesState {
  isLoadingComplete: boolean;
  fontsLoaded: boolean;
  audioLoaded: boolean;
  storeHydrated: boolean;
}

/**
 * Custom hook to load and cache resources (fonts, audio, store hydration)
 * Returns true when all resources are ready and splash screen can be hidden
 */
export function useCachedResources(): boolean {
  const [state, setState] = useState<CachedResourcesState>({
    isLoadingComplete: false,
    fontsLoaded: false,
    audioLoaded: false,
    storeHydrated: false,
  });

  // Get hydration state from store
  const hasHydrated = useGameStore((s) => s._hasHydrated);

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        // Load custom fonts if available
        // For now, we'll use system fonts as fallback
        // When you add font files to assets/fonts/, uncomment below:
        // await Font.loadAsync({
        //   'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf'),
        //   'Lora-Regular': require('../../assets/fonts/Lora-Regular.ttf'),
        // });
        
        // For now, mark as loaded immediately (using system fonts)
        setState((prev) => ({ ...prev, fontsLoaded: true }));
      } catch (error) {
        console.warn('[useCachedResources] Font loading error:', error);
        // Continue anyway with system fonts
        setState((prev) => ({ ...prev, fontsLoaded: true }));
      }
    }

    loadFonts();
  }, []);

  // Pre-load audio
  useEffect(() => {
    async function loadAudio() {
      try {
        // Initialize sound manager and pre-buffer sounds
        await soundManager.initialize();
        setState((prev) => ({ ...prev, audioLoaded: true }));
      } catch (error) {
        console.warn('[useCachedResources] Audio loading error:', error);
        // Continue anyway - audio is non-critical
        setState((prev) => ({ ...prev, audioLoaded: true }));
      }
    }

    loadAudio();
  }, []);

  // Track store hydration
  useEffect(() => {
    if (hasHydrated) {
      setState((prev) => ({ ...prev, storeHydrated: true }));
    }
  }, [hasHydrated]);

  // Check if all resources are loaded
  useEffect(() => {
    const allLoaded = state.fontsLoaded && state.audioLoaded && state.storeHydrated;
    
    if (allLoaded && !state.isLoadingComplete) {
      setState((prev) => ({ ...prev, isLoadingComplete: true }));
    }
  }, [state.fontsLoaded, state.audioLoaded, state.storeHydrated, state.isLoadingComplete]);

  // Hide splash screen when loading is complete
  useEffect(() => {
    if (state.isLoadingComplete) {
      SplashScreen.hideAsync().catch(() => {
        // Already hidden - ignore
      });
    }
  }, [state.isLoadingComplete]);

  return state.isLoadingComplete;
}

export default useCachedResources;
