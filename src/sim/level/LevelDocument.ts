import type { LayerId } from './LevelError';

export const LEVEL_FORMAT = 'xantar-level';
export const LEVEL_VERSION = 1;
export const DEFAULT_SEGMENTS = 4;
export const ALLOWED_SEGMENTS: readonly number[] = [2, 3, 4];

export type LevelLayers = Readonly<Record<LayerId, readonly string[]>>;

export interface LevelDocument {
  readonly format: typeof LEVEL_FORMAT;
  readonly version: number;
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly segments: number;
  readonly layers: LevelLayers;
}
