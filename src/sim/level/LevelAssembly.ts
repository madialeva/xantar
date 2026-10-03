import { columnCenter } from '../geometry';
import { buildNavigationGraph } from '../nav/buildNavigationGraph';
import type { EnemyKind, IngredientKind } from './kinds';
import {
  destinationPlateId,
  type EnemySpawn,
  type IngredientSpec,
  Level,
  type PlateSpec,
  type Spawn
} from './Level';
import { LevelError } from './LevelError';
import type { LevelBuilder, Placement } from './pieces/PieceDefinition';
import { Terrain } from './Terrain';

interface Anchored<T> {
  readonly value: T;
  readonly placement: Placement;
}

/**
 * Builder that collects what the pieces of a level document contribute and assembles the
 * immutable Level, checking the structural rules.
 */
export class LevelAssembly implements LevelBuilder {
  readonly #name: string;
  readonly #cols: number;
  readonly #rows: number;
  readonly #segments: number;
  readonly #platforms = new Set<number>();
  readonly #ladders = new Set<number>();
  readonly #plates: Placement[] = [];
  readonly #ingredients: Anchored<IngredientKind>[] = [];
  readonly #chefStarts: Placement[] = [];
  readonly #enemies: Anchored<EnemyKind>[] = [];

  constructor(name: string, cols: number, rows: number, segments: number) {
    this.#name = name;
    this.#cols = cols;
    this.#rows = rows;
    this.#segments = segments;
  }

  addPlatform(row: number, col: number): void {
    this.#platforms.add(row * this.#cols + col);
  }

  addLadder(row: number, col: number): void {
    this.#ladders.add(row * this.#cols + col);
  }

  addPlate(placement: Placement): void {
    this.#plates.push(placement);
  }

  addIngredient(kind: IngredientKind, placement: Placement): void {
    this.#ingredients.push({ value: kind, placement });
  }

  setChefStart(placement: Placement): void {
    this.#chefStarts.push(placement);
  }

  addEnemySpawn(kind: EnemyKind, placement: Placement): void {
    this.#enemies.push({ value: kind, placement });
  }

  build(): Level {
    const chef = this.#requireChefStart();
    this.#requireSupport('Chef start', chef);
    for (const { placement } of this.#enemies) this.#requireSupport('Enemy spawn', placement);
    for (const { placement } of this.#ingredients) this.#requireIngredientSupport(placement);

    const plateIds = new Map<number, number>();
    this.#plates.forEach(({ row, col, width }, id) => {
      for (let c = col; c < col + width; c++) plateIds.set(row * this.#cols + c, id);
    });
    const terrain = new Terrain(this.#cols, this.#rows, this.#platforms, this.#ladders, plateIds);

    const ingredients: IngredientSpec[] = this.#ingredients.map(({ value, placement }, id) => ({
      id,
      kind: value,
      row: placement.row,
      col: placement.col,
      width: placement.width
    }));
    const expected = new Array<number>(this.#plates.length).fill(0);
    for (const ingredient of ingredients) {
      const plateId = destinationPlateId(terrain, ingredient);
      if (plateId !== undefined) expected[plateId] += 1;
    }
    const plates: PlateSpec[] = this.#plates.map((placement, id) => ({
      id,
      row: placement.row,
      col: placement.col,
      width: placement.width,
      expected: expected[id]
    }));

    return new Level({
      name: this.#name,
      cols: this.#cols,
      rows: this.#rows,
      segments: this.#segments,
      terrain,
      graph: buildNavigationGraph(terrain),
      ingredients,
      plates,
      chefStart: this.#spawnOf(chef),
      enemySpawns: this.#enemies.map(({ value, placement }): EnemySpawn => ({
        kind: value,
        ...this.#spawnOf(placement)
      }))
    });
  }

  #requireChefStart(): Placement {
    const [first, second] = this.#chefStarts;
    if (first === undefined) {
      throw new LevelError('The level has no chef start (symbol C in the actors layer)', {
        layer: 'actors'
      });
    }
    if (second !== undefined) {
      throw new LevelError('The level has more than one chef start', {
        layer: 'actors',
        row: second.row,
        col: second.col
      });
    }
    return first;
  }

  #requireSupport(label: string, placement: Placement): void {
    if (!this.#platforms.has(placement.row * this.#cols + placement.col)) {
      throw new LevelError(`${label} is not on a platform tile`, {
        layer: 'actors',
        row: placement.row,
        col: placement.col
      });
    }
  }

  #requireIngredientSupport({ row, col, width }: Placement): void {
    for (let c = col; c < col + width; c++) {
      if (!this.#platforms.has(row * this.#cols + c)) {
        throw new LevelError('Ingredient segment has no platform tile below it', {
          layer: 'ingredients',
          row,
          col: c
        });
      }
    }
  }

  #spawnOf(placement: Placement): Spawn {
    return { row: placement.row, x: columnCenter(placement.col) };
  }
}
