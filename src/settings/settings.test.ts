import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS, assign } from '../input/bindings';
import {
  type PlayerSettings,
  SETTINGS_VERSION,
  defaultSettings,
  parseSettings
} from './PlayerSettings';
import { Settings } from './Settings';
import { LocalStorageSettingsStore, MemorySettingsStore, SETTINGS_KEY } from './SettingsStore';

const defaults: PlayerSettings = defaultSettings('en');

describe('parseSettings', () => {
  it('uses the defaults without a record or for another version', () => {
    expect(parseSettings(undefined, defaults)).toEqual(defaults);
    expect(parseSettings('nonsense', defaults)).toEqual(defaults);
    expect(parseSettings({ version: 99, language: 'es' }, defaults)).toEqual(defaults);
  });

  it('keeps the valid fields and replaces only the invalid ones', () => {
    const record = {
      version: SETTINGS_VERSION,
      language: 'fr',
      theme: 'midnight',
      bestScore: 9000
    };
    expect(parseSettings(record, defaults)).toEqual({
      ...defaults,
      language: 'en',
      theme: 'midnight',
      bestScore: 9000
    });
    const bad = { version: SETTINGS_VERSION, language: 'es', theme: 'Mid Night', bestScore: -5 };
    expect(parseSettings(bad, defaults)).toEqual({ ...defaults, language: 'es' });
  });

  it('reads a record written before the sound and key settings existed', () => {
    const old = { version: 1, language: 'es', theme: 'midnight', bestScore: 4200 };
    expect(parseSettings(old, defaults)).toEqual({
      ...defaults,
      language: 'es',
      theme: 'midnight',
      bestScore: 4200
    });
  });

  it('keeps valid sound settings and replaces volumes out of range', () => {
    const record = { version: 1, musicVolume: 3, sfxVolume: 15, muted: true };
    const parsed = parseSettings(record, defaults);
    expect([parsed.musicVolume, parsed.sfxVolume, parsed.muted]).toEqual([3, 8, true]);
    expect(parseSettings({ version: 1, musicVolume: 2.5, muted: 'yes' }, defaults)).toEqual(
      defaults
    );
  });

  it('uses the default keys when the stored ones conflict, keeping everything else', () => {
    const keyBindings = { ...DEFAULT_BINDINGS, pause: ['Space'] };
    const parsed = parseSettings({ version: 1, bestScore: 900, keyBindings }, defaults);
    expect(parsed.keyBindings).toEqual(DEFAULT_BINDINGS);
    expect(parsed.bestScore).toBe(900);
    const result = assign(DEFAULT_BINDINGS, 'pepper', 0, 'KeyX');
    if (!result.ok) throw new Error('refused');
    expect(
      parseSettings({ version: 1, keyBindings: result.bindings }, defaults).keyBindings
    ).toEqual(result.bindings);
  });
});

describe('Settings', () => {
  it('starts from the stored record and saves every change', () => {
    const store = new MemorySettingsStore({
      version: 1,
      language: 'es',
      theme: 'auto',
      bestScore: 10
    });
    const settings = new Settings(store, defaults);
    expect([settings.language, settings.theme, settings.bestScore]).toEqual(['es', 'auto', 10]);
    settings.setLanguage('en');
    settings.setTheme('midnight');
    expect(store.load()).toEqual({
      ...defaults,
      version: 1,
      language: 'en',
      theme: 'midnight',
      bestScore: 10
    });
  });

  it('saves the sound and key settings and tells its listeners', () => {
    const store = new MemorySettingsStore();
    const settings = new Settings(store, defaults);
    const seen: PlayerSettings[] = [];
    const unsubscribe = settings.subscribe((values) => seen.push(values));
    settings.setVolume('music', 3);
    settings.setVolume('sfx', 42);
    settings.setMuted(true);
    const result = assign(DEFAULT_BINDINGS, 'pepper', 0, 'KeyX');
    if (result.ok) settings.setKeyBindings(result.bindings);
    unsubscribe();
    settings.setMuted(false);
    expect(seen).toHaveLength(4);
    expect([settings.volume('music'), settings.volume('sfx')]).toEqual([3, 10]);
    const reopened = new Settings(store, defaults);
    expect(reopened.volume('music')).toBe(3);
    expect(reopened.muted).toBe(false);
    expect(reopened.keyBindings.pepper).toEqual(['KeyX']);
  });

  it('keeps only a better score', () => {
    const settings = new Settings(new MemorySettingsStore(), { ...defaults, bestScore: 8000 });
    expect(settings.submitScore(3000)).toBe(false);
    expect(settings.submitScore(8000)).toBe(false);
    expect(settings.bestScore).toBe(8000);
    expect(settings.submitScore(12500)).toBe(true);
    expect(settings.bestScore).toBe(12500);
  });
});

describe('LocalStorageSettingsStore', () => {
  const memoryStorage = () => {
    const items = new Map<string, string>();
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      items
    };
  };

  it('stores the record as JSON under its key', () => {
    const storage = memoryStorage();
    const store = new LocalStorageSettingsStore(storage);
    store.save({ version: 1, bestScore: 5 });
    expect(storage.items.get(SETTINGS_KEY)).toBe('{"version":1,"bestScore":5}');
    expect(store.load()).toEqual({ version: 1, bestScore: 5 });
  });

  it('reads broken JSON as no record', () => {
    const storage = memoryStorage();
    storage.items.set(SETTINGS_KEY, '{ not json');
    expect(new Settings(new LocalStorageSettingsStore(storage), defaults).bestScore).toBe(0);
  });

  it('keeps working when the storage throws or is missing', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      }
    };
    const settings = new Settings(new LocalStorageSettingsStore(throwing), defaults);
    expect(() => settings.setLanguage('es')).not.toThrow();
    expect(settings.language).toBe('es');
    expect(new LocalStorageSettingsStore(undefined).load()).toBeUndefined();
  });
});
