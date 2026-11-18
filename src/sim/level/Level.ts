import type { NavigationGraph } from '../nav/NavigationGraph';
import type { EnemyKind, IngredientKind } from './kinds';
import type { Landing, Terrain } from './Terrain';

export interface Spawn {
  readonly row: number;
  readonly x: number;
}

/**
 * Where an enemy appears and how long after play starts. On an entry walkway it appears off
 * the floor and walks in to `joinX` on the platform the walkway leads to.
 */
export interface EnemySpawn extends Spawn {
  readonly kind: EnemyKind;
  readonly delayTicks: number;
  readonly joinX?: number;
}

/** An entry delay of the level document, in ticks, at the tile it names. */
export interface EntryDelay {
  readonly row: number;
  readonly col: number;
  readonly delayTicks: number;
}

export interface IngredientSpec {
  readonly id: number;
  readonly kind: IngredientKind;
  readonly row: number;
  readonly col: number;
  readonly width: number;
}

export interface PlateSpec {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly width: number;
  readonly expected: number;
}

export interface LevelLanding {
  readonly row: number;
  readonly plate: PlateSpec | undefined;
}

export interface LevelParts {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly segments: number;
  readonly terrain: Terrain;
  readonly graph: NavigationGraph;
  readonly ingredients: readonly IngredientSpec[];
  readonly plates: readonly PlateSpec[];
  readonly chefStart: Spawn;
  readonly enemySpawns: readonly EnemySpawn[];
  readonly entries: readonly EntryDelay[];
}

/**
 * Immutable result of loading a level: ingredients, plates, spawns, terrain and navigation
 * graph, with the queries the rules need.
 */
export class Level {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly segments: number;
  readonly terrain: Terrain;
  readonly graph: NavigationGraph;
  readonly ingredients: readonly IngredientSpec[];
  readonly plates: readonly PlateSpec[];
  readonly chefStart: Spawn;
  readonly enemySpawns: readonly EnemySpawn[];
  readonly entries: readonly EntryDelay[];

  constructor(parts: LevelParts) {
    this.name = parts.name;
    this.cols = parts.cols;
    this.rows = parts.rows;
    this.segments = parts.segments;
    this.terrain = parts.terrain;
    this.graph = parts.graph;
    this.ingredients = parts.ingredients;
    this.plates = parts.plates;
    this.chefStart = parts.chefStart;
    this.enemySpawns = parts.enemySpawns;
    this.entries = parts.entries;
  }

  landingBelow(row: number, left: number, right: number): LevelLanding | undefined {
    const landing = this.terrain.landingBelow(row, left, right);
    return landing === undefined ? undefined : this.#toLevelLanding(landing);
  }

  destinationOf(ingredient: IngredientSpec): PlateSpec | undefined {
    const plateId = destinationPlateId(this.terrain, ingredient);
    return plateId === undefined ? undefined : this.plates[plateId];
  }

  #toLevelLanding(landing: Landing): LevelLanding {
    return {
      row: landing.row,
      plate: landing.plateId === undefined ? undefined : this.plates[landing.plateId]
    };
  }
}

export function destinationPlateId(
  terrain: Terrain,
  ingredient: Pick<IngredientSpec, 'row' | 'col' | 'width'>
): number | undefined {
  let row = ingredient.row;
  for (;;) {
    const landing = terrain.landingBelow(row, ingredient.col, ingredient.col + ingredient.width);
    if (landing === undefined) return undefined;
    if (landing.plateId !== undefined) return landing.plateId;
    row = landing.row;
  }
}
