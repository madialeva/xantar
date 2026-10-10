import Phaser from 'phaser';
import type { SoundHandle, SoundSystem } from './GameAudio';
import { renderRecipe } from './synth/renderRecipe';
import { CUE_RECIPES, SOUND_CUES, type SoundCue } from './synth/soundCues';

type Adjustable = Phaser.Sound.BaseSound & { setVolume?(value: number): unknown };

/** Phaser's sound manager seen as the SoundSystem that GameAudio uses (Adapter). */
export function phaserSoundSystem(manager: Phaser.Sound.BaseSoundManager): SoundSystem {
  return {
    get locked(): boolean {
      return manager.locked;
    },
    add(key, config): SoundHandle {
      const sound = manager.add(key, config) as Adjustable;
      return {
        play: () => sound.play(),
        stop: () => sound.stop(),
        setVolume: (value) => sound.setVolume?.(value),
        once: (event, callback) => sound.once(event, callback),
        destroy: () => sound.destroy()
      };
    },
    setMute(muted): void {
      manager.mute = muted;
    }
  };
}

/**
 * Renders every sound effect recipe into Phaser's audio cache at the rate of the audio
 * context, so effects play like any loaded sound. Without Web Audio there are no effects.
 */
export function registerSoundEffects(scene: Phaser.Scene): SoundCue[] {
  const manager = scene.sound;
  if (!(manager instanceof Phaser.Sound.WebAudioSoundManager)) return [];
  const { context } = manager;
  return SOUND_CUES.filter((cue) => {
    try {
      const samples = renderRecipe(CUE_RECIPES[cue], context.sampleRate);
      const buffer = context.createBuffer(1, samples.length, context.sampleRate);
      buffer.copyToChannel(samples, 0);
      scene.cache.audio.add(cue, buffer);
      return true;
    } catch (error) {
      console.warn(`Sound effect "${cue}" not available:`, error);
      return false;
    }
  });
}
