import type { Level } from '../Level';
import type { LevelIssue, LevelRule } from './LevelIssue';

const reachableOf = (level: Level) =>
  level.graph.reachableFrom(level.graph.placeAt(level.chefStart.row, level.chefStart.x));

export const ingredientsReachable: LevelRule = {
  check(level) {
    const { platforms } = reachableOf(level);
    return level.ingredients.flatMap((ingredient): LevelIssue[] => {
      const platform = level.graph.platformAt(ingredient.row, ingredient.col + 0.5);
      return platform !== undefined && platforms.has(platform)
        ? []
        : [
            {
              severity: 'error',
              code: 'ingredient-unreachable',
              message: 'The chef cannot reach the platform of this ingredient',
              row: ingredient.row,
              col: ingredient.col
            }
          ];
    });
  }
};

export const ingredientsEndOnAPlate: LevelRule = {
  check(level) {
    return level.ingredients
      .filter((ingredient) => level.destinationOf(ingredient) === undefined)
      .map((ingredient): LevelIssue => ({
        severity: 'error',
        code: 'ingredient-no-plate',
        message: 'This ingredient does not fall onto a plate',
        row: ingredient.row,
        col: ingredient.col
      }));
  }
};

export const noDanglingLadders: LevelRule = {
  check(level) {
    return level.graph.dangling.map(({ row, col }): LevelIssue => ({
      severity: 'error',
      code: 'ladder-dangling',
      message: 'This ladder does not reach a platform',
      row,
      col
    }));
  }
};

/** A ladder an odd number of rows long is not a whole number of chefs tall. */
export const laddersSpanWholeChefs: LevelRule = {
  check(level) {
    return level.graph.ladders
      .filter((ladder) => (ladder.bottomRow - ladder.topRow) % 2 !== 0)
      .map((ladder): LevelIssue => ({
        severity: 'warning',
        code: 'ladder-odd-span',
        message: 'This ladder is not a whole number of chefs tall (an odd number of rows)',
        row: ladder.topRow,
        col: ladder.col
      }));
  }
};

/** An entry walkway must lead to the end of a platform of its row. */
export const walkwaysLeadToPlatforms: LevelRule = {
  check({ terrain }) {
    const issues: LevelIssue[] = [];
    for (let row = 0; row < terrain.rows; row++) {
      for (let col = 0; col < terrain.cols; col++) {
        const run = terrain.walkwayRunAt(row, col);
        if (run === undefined || run.left !== col) continue;
        const leads =
          terrain.hasPlatform(row, run.left - 1) || terrain.hasPlatform(row, run.right + 1);
        if (!leads) {
          issues.push({
            severity: 'error',
            code: 'walkway-detached',
            message: 'This entry walkway does not lead to a platform',
            row,
            col
          });
        }
      }
    }
    return issues;
  }
};

/** Every entry delay must belong to an enemy marker. */
export const entriesHaveEnemies: LevelRule = {
  check(level) {
    return level.entries
      .filter(
        (entry) =>
          !level.enemySpawns.some(
            (spawn) => spawn.row === entry.row && Math.floor(spawn.x) === entry.col
          )
      )
      .map((entry): LevelIssue => ({
        severity: 'error',
        code: 'entry-without-enemy',
        message: 'This entry delay names a tile with no enemy marker',
        row: entry.row,
        col: entry.col
      }));
  }
};

export const hasIngredients: LevelRule = {
  check(level) {
    return level.ingredients.length > 0
      ? []
      : [{ severity: 'error', code: 'no-ingredients', message: 'The level has no ingredients' }];
  }
};

export const platesReceiveIngredients: LevelRule = {
  check(level) {
    return level.plates
      .filter((plate) => plate.expected === 0)
      .map((plate): LevelIssue => ({
        severity: 'warning',
        code: 'plate-empty',
        message: 'No ingredient falls onto this plate',
        row: plate.row,
        col: plate.col
      }));
  }
};

export const platformsReachable: LevelRule = {
  check(level) {
    const { platforms } = reachableOf(level);
    return level.graph.platforms
      .filter((platform) => !platforms.has(platform))
      .map((platform): LevelIssue => ({
        severity: 'warning',
        code: 'platform-unreachable',
        message: 'The chef cannot reach this platform',
        row: platform.row,
        col: platform.left
      }));
  }
};

export const spawnsReachable: LevelRule = {
  check(level) {
    const { platforms } = reachableOf(level);
    return level.enemySpawns.flatMap((spawn): LevelIssue[] => {
      const platform = level.graph.platformAt(spawn.row, spawn.joinX ?? spawn.x);
      return platform !== undefined && platforms.has(platform)
        ? []
        : [
            {
              severity: 'warning',
              code: 'spawn-unreachable',
              message: 'The chef cannot reach this enemy spawn',
              row: spawn.row,
              col: Math.floor(spawn.x)
            }
          ];
    });
  }
};

export const defaultRules: readonly LevelRule[] = [
  hasIngredients,
  ingredientsReachable,
  ingredientsEndOnAPlate,
  noDanglingLadders,
  laddersSpanWholeChefs,
  walkwaysLeadToPlatforms,
  entriesHaveEnemies,
  platesReceiveIngredients,
  platformsReachable,
  spawnsReachable
];
