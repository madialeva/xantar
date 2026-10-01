import { columnCenter } from '../geometry';
import { LADDER_GRAB_DISTANCE } from '../rules';
import type { EnemyKind, IngredientKind } from './LevelData';

export interface PlatformRun {
  readonly row: number;
  readonly left: number;
  readonly right: number;
}

export interface Ladder {
  readonly col: number;
  readonly topRow: number;
  readonly bottomRow: number;
}

export interface Plate {
  readonly row: number;
  readonly left: number;
  readonly right: number;
}

export interface IngredientSpec {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly row: number;
  readonly left: number;
  readonly right: number;
}

export interface BurgerColumn {
  readonly id: number;
  readonly left: number;
  readonly right: number;
  readonly ingredients: readonly IngredientSpec[];
  readonly plate: Plate;
}

export interface Spawn {
  readonly row: number;
  readonly x: number;
}

export interface EnemySpawn extends Spawn {
  readonly kind: EnemyKind;
}

export interface LevelParts {
  readonly cols: number;
  readonly rows: number;
  readonly platformRuns: readonly PlatformRun[];
  readonly ladders: readonly Ladder[];
  readonly columns: readonly BurgerColumn[];
  readonly chefStart: Spawn;
  readonly enemyStarts: readonly EnemySpawn[];
  readonly respawnPoints: readonly Spawn[];
}

export class Level {
  readonly cols: number;
  readonly rows: number;
  readonly platformRuns: readonly PlatformRun[];
  readonly ladders: readonly Ladder[];
  readonly columns: readonly BurgerColumn[];
  readonly chefStart: Spawn;
  readonly enemyStarts: readonly EnemySpawn[];
  readonly respawnPoints: readonly Spawn[];

  constructor(parts: LevelParts) {
    this.cols = parts.cols;
    this.rows = parts.rows;
    this.platformRuns = parts.platformRuns;
    this.ladders = parts.ladders;
    this.columns = parts.columns;
    this.chefStart = parts.chefStart;
    this.enemyStarts = parts.enemyStarts;
    this.respawnPoints = parts.respawnPoints;
  }

  platformRunAt(row: number, x: number): PlatformRun | undefined {
    return this.platformRuns.find((run) => run.row === row && x >= run.left && x <= run.right);
  }

  laddersFromRow(row: number, goingUp: boolean): readonly Ladder[] {
    return this.ladders.filter((ladder) => (goingUp ? ladder.bottomRow : ladder.topRow) === row);
  }

  ladderNear(
    row: number,
    x: number,
    goingUp: boolean,
    maxDistance = LADDER_GRAB_DISTANCE
  ): Ladder | undefined {
    return this.laddersFromRow(row, goingUp).find(
      (ladder) => Math.abs(columnCenter(ladder.col) - x) <= maxDistance
    );
  }

  bestLadderTowards(row: number, targetRow: number, x: number): Ladder | undefined {
    const options = this.laddersFromRow(row, targetRow < row);
    return options.reduce<Ladder | undefined>(
      (best, ladder) =>
        best === undefined ||
        Math.abs(columnCenter(ladder.col) - x) < Math.abs(columnCenter(best.col) - x)
          ? ladder
          : best,
      undefined
    );
  }

  landingRowBelow(row: number, left: number, right: number): number | undefined {
    return this.platformRuns
      .filter((run) => run.row > row && run.left <= left && run.right >= right)
      .reduce<number | undefined>(
        (nearest, run) => (nearest === undefined || run.row < nearest ? run.row : nearest),
        undefined
      );
  }
}
