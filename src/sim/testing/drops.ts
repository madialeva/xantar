import { type EnemyRoster, IngredientField } from '../entities/IngredientField';
import { EventQueue } from '../events';
import { GameStats } from '../GameStats';
import type { Level } from '../level/Level';
import { chefAt } from './chef';

/** What happened when the ingredients of a level were dropped one at a time. */
export interface DropRun {
  readonly complete: boolean;
  readonly drops: number;
  /** For each drop, whether it left the board secured but not finished yet. */
  readonly securedAtDrop: readonly boolean[];
}

const NO_ENEMIES: EnemyRoster = { board: () => 0, crushUnder: () => {}, release: () => {} };

/**
 * Drops the ingredients of a level with no enemies around, each time stomping the lowest one
 * still idle and waiting for the falls to settle, until every burger is done.
 */
export function dropFromBelow(level: Level, settleTicks = 900, maxDrops = 200): DropRun {
  const events = new EventQueue();
  const field = new IngredientField(level, events, new GameStats(events), NO_ENEMIES);
  const away = chefAt(0, 0.5);
  const securedAtDrop: boolean[] = [];
  while (!field.isComplete && securedAtDrop.length < maxDrops) {
    const next = field.ingredients
      .filter((ingredient) => ingredient.phase === 'idle')
      .sort((a, b) => b.row - a.row)[0];
    if (next === undefined) break;
    for (let segment = 0; segment < next.width; segment++) {
      field.step(chefAt(next.row, next.left + segment + 0.5));
    }
    securedAtDrop.push(field.isSecured && !field.isComplete);
    for (let tick = 0; tick < settleTicks; tick++) field.step(away);
  }
  return { complete: field.isComplete, drops: securedAtDrop.length, securedAtDrop };
}
