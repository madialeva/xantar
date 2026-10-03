import type { NavigationGraph } from '../nav/NavigationGraph';
import type { EnemyKind, IngredientKind } from './kinds';
import type { Landing, Terrain } from './Terrain';

export interface Spawn {
  readonly row: number;
  readonly x: number;
}

export interface EnemySpawn extends Spawn {
  readonly kind: EnemyKind;
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
