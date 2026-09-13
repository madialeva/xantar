import { LADDER_COLS, PLATFORM_ROWS } from './config';

export interface Ladder {
  col: number;
  top: number;
  bottom: number;
}

export const LADDERS: Ladder[] = (() => {
  const out: Ladder[] = [];
  for (const col of LADDER_COLS) {
    for (let i = 0; i < PLATFORM_ROWS.length - 1; i++) {
      out.push({ col, top: PLATFORM_ROWS[i], bottom: PLATFORM_ROWS[i + 1] });
    }
  }
  return out;
})();

export function laddersFromRow(row: number, goingUp: boolean): Ladder[] {
  return LADDERS.filter((ladder) => (goingUp ? ladder.bottom === row : ladder.top === row));
}

export function bestLadderTowards(
  row: number,
  targetRow: number,
  x: number,
  colX: (col: number) => number
): Ladder | null {
  const goingUp = targetRow < row;
  const options = laddersFromRow(row, goingUp);
  if (options.length === 0) return null;
  let best = options[0];
  let bestDistance = Math.abs(colX(best.col) - x);
  for (const ladder of options) {
    const distance = Math.abs(colX(ladder.col) - x);
    if (distance < bestDistance) {
      best = ladder;
      bestDistance = distance;
    }
  }
  return best;
}
