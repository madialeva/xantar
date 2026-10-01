import type { LevelData } from '../sim/level/LevelData';

const PLATFORM_ROWS = [3, 6, 9, 12] as const;
const LADDER_COLS = [0, 9, 10, 19] as const;
const LANES = [
  { x0: 1, x1: 4 },
  { x0: 5, x1: 8 },
  { x0: 11, x1: 14 },
  { x0: 15, x1: 18 }
] as const;
const STACK = ['bunBottom', 'patty', 'lettuce', 'bunTop'] as const;
const PLATE_ROW = 14;
const COLS = 20;
const ROWS = 15;

export const classicLevel: LevelData = {
  cols: COLS,
  rows: ROWS,
  platforms: PLATFORM_ROWS.map((row) => ({ row, x0: 0, x1: COLS - 1 })),
  ladders: LADDER_COLS.flatMap((col) =>
    PLATFORM_ROWS.slice(0, -1).map((topRow, index) => ({
      col,
      topRow,
      bottomRow: PLATFORM_ROWS[index + 1]
    }))
  ),
  plates: LANES.map(({ x0, x1 }) => ({ row: PLATE_ROW, x0, x1 })),
  ingredients: LANES.flatMap(({ x0, x1 }) =>
    STACK.map((kind, index) => ({
      kind,
      row: PLATFORM_ROWS[PLATFORM_ROWS.length - 1 - index],
      x0,
      x1
    }))
  ),
  chefStart: { row: PLATFORM_ROWS[PLATFORM_ROWS.length - 1], col: 10 },
  enemyStarts: [
    { kind: 'hotdog', row: PLATFORM_ROWS[0], col: 1 },
    { kind: 'pickle', row: PLATFORM_ROWS[0], col: 9 },
    { kind: 'egg', row: PLATFORM_ROWS[0], col: 18 }
  ],
  respawnPoints: LADDER_COLS.map((col) => ({ row: PLATFORM_ROWS[0], col }))
};
