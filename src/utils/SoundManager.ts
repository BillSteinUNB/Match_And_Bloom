/**
 * SoundManager - Organic ASMR Audio System
 * 
 * Handles three distinct audio layers:
 * 1. Ambience: Looping garden breeze/soft rain
 * 2. Interactions: Swap whoosh, match chimes (C Major scale), bloom shimmer
 * 3. UI: Button clicks, modal sounds
 * 
 * Uses expo-av with sound pooling for low-latency overlapping effects.
 */

import { Audio, AVPlaybackStatus } from 'expo-av';

// ============================================================================
// SOUND ASSET DEFINITIONS
// ============================================================================

/**
 * Sound names for type-safe access
 */
export type SoundName =
  | 'ambient'
  | 'swap'
  | 'chime_c'
  | 'chime_e'
  | 'chime_g'
  | 'shimmer'
  | 'victory'
  | 'defeat'
  | 'click';

/**
 * Chime notes for combo-based harmonic stacking
 * Combo 1 = C, Combo 2 = E, Combo 3+ = G
 */
export const CHIME_NOTES: Record<number, SoundName> = {
  1: 'chime_c',
  2: 'chime_e',
  3: 'chime_g',
};

/**
 * Get chime note based on combo count
 */
export function getChimeForCombo(combo: number): SoundName {
  if (combo <= 1) return 'chime_c';
  if (combo === 2) return 'chime_e';
  return 'chime_g'; // 3+ cycles through G
}

// ============================================================================
// SOUND MANAGER CLASS
// ============================================================================

/**
 * Audio configuration for different sound types
 */
interface SoundConfig {
  volume: number;
  isLooping: boolean;
}

const SOUND_CONFIGS: Record<SoundName, SoundConfig> = {
  ambient: { volume: 0.3, isLooping: true },
  swap: { volume: 0.5, isLooping: false },
  chime_c: { volume: 0.6, isLooping: false },
  chime_e: { volume: 0.6, isLooping: false },
  chime_g: { volume: 0.6, isLooping: false },
  shimmer: { volume: 0.4, isLooping: false },
  victory: { volume: 0.7, isLooping: false },
  defeat: { volume: 0.5, isLooping: false },
  click: { volume: 0.4, isLooping: false },
};

/**
 * Placeholder sound assets - these will use generated tones until real assets are added
 * In production, replace with: require('./assets/audio/swap.wav')
 */
const SOUND_ASSETS: Record<SoundName, number | null> = {
  ambient: null,  // Will be added when asset exists
  swap: null,
  chime_c: null,
  chime_e: null,
  chime_g: null,
  shimmer: null,
  victory: null,
  defeat: null,
  click: null,
};

class SoundManager {
  private sounds: Map<SoundName, Audio.Sound> = new Map();
  private _isSetup = false;
  private _isMuted = false;
  private _masterVolume = 1.0;
  private _pendingLoads: Map<SoundName, Promise<Audio.Sound | null>> = new Map();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Configure audio mode for game playback
   */
  async setupAsync(): Promise<void> {
    if (this._isSetup) return;
    this._isSetup = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('[SoundManager] Failed to configure audio mode:', error);
    }
  }

  // ============================================================================
  // SOUND LOADING
  // ============================================================================

  /**
   * Load a sound asset with caching and deduplication
   */
  private async loadAsync(name: SoundName): Promise<Audio.Sound | null> {
    await this.setupAsync();

    // Return cached sound
    const cached = this.sounds.get(name);
    if (cached) return cached;

    // Check for pending load
    const pending = this._pendingLoads.get(name);
    if (pending) return pending;

    // Get asset
    const asset = SOUND_ASSETS[name];
    if (!asset) {
      // No asset available - silently skip
      return null;
    }

    // Create loading promise
    const loadPromise = (async (): Promise<Audio.Sound | null> => {
      try {
        const config = SOUND_CONFIGS[name];
        const { sound } = await Audio.Sound.createAsync(asset, {
          volume: config.volume * this._masterVolume,
          isLooping: config.isLooping,
        });
        this.sounds.set(name, sound);
        this._pendingLoads.delete(name);
        return sound;
      } catch (error) {
        console.warn(`[SoundManager] Failed to load ${name}:`, error);
        this._pendingLoads.delete(name);
        return null;
      }
    })();

    this._pendingLoads.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Preload all game sounds for faster playback
   */
  async preloadAll(): Promise<void> {
    const names = Object.keys(SOUND_ASSETS) as SoundName[];
    await Promise.all(names.map(name => this.loadAsync(name)));
  }

  /**
   * Initialize the sound manager (alias for setup + preload)
   * Called by useCachedResources during app startup
   */
  async initialize(): Promise<void> {
    await this.setupAsync();
    await this.preloadAll();
  }

  // ============================================================================
  // PLAYBACK CONTROLS
  // ============================================================================

  /**
   * Play a sound effect (non-looping)
   */
  async playSFX(name: SoundName): Promise<void> {
    if (this._isMuted) return;

    const sound = await this.loadAsync(name);
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(SOUND_CONFIGS[name].volume * this._masterVolume);
      await sound.playAsync();
    } catch (error) {
      console.warn(`[SoundManager] Failed to play ${name}:`, error);
    }
  }

  /**
   * Play ambient/background music (looping)
   */
  async playAmbient(): Promise<void> {
    if (this._isMuted) return;

    const sound = await this.loadAsync('ambient');
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(SOUND_CONFIGS.ambient.volume * this._masterVolume);
      await sound.playAsync();
    } catch (error) {
      console.warn('[SoundManager] Failed to play ambient:', error);
    }
  }

  /**
   * Stop ambient music
   */
  async stopAmbient(): Promise<void> {
    const sound = this.sounds.get('ambient');
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.warn('[SoundManager] Failed to stop ambient:', error);
      }
    }
  }

  /**
   * Pause ambient music
   */
  async pauseAmbient(): Promise<void> {
    const sound = this.sounds.get('ambient');
    if (sound) {
      try {
        await sound.pauseAsync();
      } catch (error) {
        console.warn('[SoundManager] Failed to pause ambient:', error);
      }
    }
  }

  /**
   * Resume ambient music
   */
  async resumeAmbient(): Promise<void> {
    if (this._isMuted) return;
    
    const sound = this.sounds.get('ambient');
    if (sound) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.warn('[SoundManager] Failed to resume ambient:', error);
      }
    }
  }

  // ============================================================================
  // GAME-SPECIFIC SOUND METHODS
  // ============================================================================

  /**
   * Play swap sound (soft whoosh)
   */
  async playSwap(): Promise<void> {
    await this.playSFX('swap');
  }

  /**
   * Play match chime based on combo count (harmonic stacking)
   * Combo 1 = C, Combo 2 = E, Combo 3+ = G
   */
  async playMatchChime(combo: number): Promise<void> {
    const chimeName = getChimeForCombo(combo);
    await this.playSFX(chimeName);
  }

  /**
   * Play bloom/shimmer sound for particle fly-out
   */
  async playBloom(): Promise<void> {
    await this.playSFX('shimmer');
  }

  /**
   * Play victory fanfare
   */
  async playVictory(): Promise<void> {
    await this.playSFX('victory');
  }

  /**
   * Play defeat sound
   */
  async playDefeat(): Promise<void> {
    await this.playSFX('defeat');
  }

  /**
   * Play UI click sound
   */
  async playClick(): Promise<void> {
    await this.playSFX('click');
  }

  // ============================================================================
  // VOLUME & MUTE CONTROLS
  // ============================================================================

  /**
   * Set master volume (0.0 to 1.0)
   */
  async setMasterVolume(volume: number): Promise<void> {
    this._masterVolume = Math.max(0, Math.min(1, volume));

    // Update all loaded sounds
    for (const [name, sound] of this.sounds) {
      try {
        const config = SOUND_CONFIGS[name];
        await sound.setVolumeAsync(config.volume * this._masterVolume);
      } catch (error) {
        console.warn(`[SoundManager] Failed to set volume for ${name}:`, error);
      }
    }
  }

  /**
   * Get current master volume
   */
  getMasterVolume(): number {
    return this._masterVolume;
  }

  /**
   * Set muted state
   */
  async setMuted(muted: boolean): Promise<void> {
    this._isMuted = muted;

    if (muted) {
      await this.pauseAmbient();
    } else {
      await this.resumeAmbient();
    }
  }

  /**
   * Toggle mute state
   */
  async toggleMute(): Promise<boolean> {
    await this.setMuted(!this._isMuted);
    return this._isMuted;
  }

  /**
   * Get current mute state
   */
  isMuted(): boolean {
    return this._isMuted;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Unload all sounds and cleanup resources
   */
  async cleanup(): Promise<void> {
    for (const [name, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn(`[SoundManager] Failed to unload ${name}:`, error);
      }
    }
    this.sounds.clear();
    this._pendingLoads.clear();
    this._isSetup = false;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const soundManager = new SoundManager();
export default soundManager;
