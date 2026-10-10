import { describe, expect, it } from 'vitest';
import { GameAudio, type SoundHandle, type SoundSystem, TITLE_MUSIC } from './GameAudio';

class FakeSound implements SoundHandle {
  volume: number;
  playing = false;
  destroyed = false;
  #onComplete: (() => void) | null = null;

  constructor(
    readonly key: string,
    readonly loop: boolean,
    volume: number
  ) {
    this.volume = volume;
  }

  play(): boolean {
    this.playing = true;
    return true;
  }

  stop(): boolean {
    this.playing = false;
    return true;
  }

  setVolume(value: number): void {
    this.volume = value;
  }

  once(_event: 'complete', callback: () => void): void {
    this.#onComplete = callback;
  }

  finish(): void {
    this.playing = false;
    this.#onComplete?.();
  }

  destroy(): void {
    this.destroyed = true;
  }
}

class FakeSystem implements SoundSystem {
  locked = false;
  muted = false;
  readonly sounds: FakeSound[] = [];

  add(key: string, config: { loop?: boolean; volume?: number }): FakeSound {
    const sound = new FakeSound(key, config.loop ?? false, config.volume ?? 1);
    this.sounds.push(sound);
    return sound;
  }

  setMute(muted: boolean): void {
    this.muted = muted;
  }
}

const levels = { musicVolume: 10, sfxVolume: 5, muted: false };

const setup = (): { audio: GameAudio; system: FakeSystem; clock: { now: number } } => {
  const clock = { now: 0 };
  const audio = new GameAudio(levels, () => clock.now);
  const system = new FakeSystem();
  audio.attach(system, ['land', 'menuMove', 'hit']);
  return { audio, system, clock };
};

describe('GameAudio', () => {
  it('plays effects on the effects bus and music on the music bus', () => {
    const { audio, system } = setup();
    audio.playMusic(TITLE_MUSIC);
    audio.cue('hit');
    const [music, hit] = system.sounds;
    expect([music.key, music.loop, music.volume, music.playing]).toEqual([
      TITLE_MUSIC,
      true,
      1,
      true
    ]);
    expect([hit.key, hit.loop, hit.volume]).toEqual(['hit', false, 0.25]);
  });

  it('changes the volume of sounds already playing, bus by bus', () => {
    const { audio, system } = setup();
    audio.playMusic(TITLE_MUSIC);
    audio.cue('hit');
    audio.apply({ musicVolume: 0, sfxVolume: 10, muted: false });
    const [music, hit] = system.sounds;
    expect(music.volume).toBe(0);
    expect(hit.volume).toBe(1);
  });

  it('mutes everything and keeps the volumes for when it is unmuted', () => {
    const { audio, system } = setup();
    audio.apply({ ...levels, muted: true });
    expect(system.muted).toBe(true);
    audio.apply(levels);
    expect(system.muted).toBe(false);
    audio.cue('hit');
    expect(system.sounds[0].volume).toBe(0.25);
  });

  it('does not restart the music that is already playing, and stops it', () => {
    const { audio, system } = setup();
    audio.playMusic(TITLE_MUSIC);
    audio.playMusic(TITLE_MUSIC);
    expect(system.sounds).toHaveLength(1);
    audio.stopMusic();
    expect(system.sounds[0].playing).toBe(false);
    expect(system.sounds[0].destroyed).toBe(true);
  });

  it('starts music asked for before the sound manager is attached', () => {
    const audio = new GameAudio(levels, () => 0);
    audio.playMusic(TITLE_MUSIC);
    const system = new FakeSystem();
    audio.attach(system, []);
    expect(system.sounds.map((sound) => sound.key)).toEqual([TITLE_MUSIC]);
  });

  it('skips unknown effects, effects while audio is locked and bursts of the same effect', () => {
    const { audio, system, clock } = setup();
    audio.cue('burger');
    system.locked = true;
    audio.cue('hit');
    system.locked = false;
    audio.cue('land');
    audio.cue('land');
    clock.now = 100;
    audio.cue('land');
    expect(system.sounds.map((sound) => sound.key)).toEqual(['land', 'land']);
  });

  it('forgets an effect once it has finished', () => {
    const { audio, system } = setup();
    audio.cue('hit');
    const [hit] = system.sounds;
    hit.finish();
    expect(hit.destroyed).toBe(true);
    audio.apply({ ...levels, sfxVolume: 10 });
    expect(hit.volume).toBe(0.25);
  });

  it('gives the menus their sounds', () => {
    const { audio, system } = setup();
    audio.ui.move();
    expect(system.sounds.map((sound) => sound.key)).toEqual(['menuMove']);
  });
});
