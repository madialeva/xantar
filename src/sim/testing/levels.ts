import type { LevelData } from '../level/LevelData';

export const tinyLevelData: LevelData = {
  cols: 8,
  rows: 8,
  platforms: [
    { row: 2, x0: 0, x1: 7 },
    { row: 5, x0: 0, x1: 7 }
  ],
  ladders: [{ col: 3, topRow: 2, bottomRow: 5 }],
  plates: [{ row: 7, x0: 1, x1: 4 }],
  ingredients: [
    { kind: 'bunTop', row: 2, x0: 1, x1: 4 },
    { kind: 'bunBottom', row: 5, x0: 1, x1: 4 }
  ],
  chefStart: { row: 5, col: 6 },
  enemyStarts: [],
  respawnPoints: [{ row: 2, col: 7 }]
};

export const levelData = (overrides: Partial<LevelData> = {}): LevelData => ({
  ...tinyLevelData,
  ...overrides
});
