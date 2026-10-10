/** Where the player settings are kept between sessions. */
export interface SettingsStore {
  load(): unknown;
  save(record: unknown): void;
}

/** Keeps the settings in memory only; for tests and when no storage is available. */
export class MemorySettingsStore implements SettingsStore {
  #record: unknown;

  constructor(record?: unknown) {
    this.#record = record;
  }

  load(): unknown {
    return this.#record;
  }

  save(record: unknown): void {
    this.#record = structuredClone(record);
  }
}

export const SETTINGS_KEY = 'xantar.settings';

/**
 * Keeps the settings as JSON in the browser storage (also used by the desktop app). A
 * storage that cannot be read or written is treated as empty and silently skipped.
 */
export class LocalStorageSettingsStore implements SettingsStore {
  readonly #storage: Pick<Storage, 'getItem' | 'setItem'> | undefined;

  constructor(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined) {
    this.#storage = storage;
  }

  load(): unknown {
    try {
      const text = this.#storage?.getItem(SETTINGS_KEY);
      return text ? (JSON.parse(text) as unknown) : undefined;
    } catch {
      return undefined;
    }
  }

  save(record: unknown): void {
    try {
      this.#storage?.setItem(SETTINGS_KEY, JSON.stringify(record));
    } catch {
      // Blocked or full storage: the game keeps working without remembering.
    }
  }
}
