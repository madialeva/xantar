export interface Landing {
  readonly row: number;
  readonly plateId: number | undefined;
}

/**
 * Immutable tile map of platforms, ladders, plates and entry walkways, with the landing query
 * that decides where a falling ingredient stops. Walkways are not platforms: only entering
 * enemies walk them.
 */
export class Terrain {
  readonly cols: number;
  readonly rows: number;
  readonly #platforms: ReadonlySet<number>;
  readonly #ladders: ReadonlySet<number>;
  readonly #plateIds: ReadonlyMap<number, number>;
  readonly #walkways: ReadonlySet<number>;

  constructor(
    cols: number,
    rows: number,
    platforms: ReadonlySet<number>,
    ladders: ReadonlySet<number>,
    plateIds: ReadonlyMap<number, number>,
    walkways: ReadonlySet<number> = new Set()
  ) {
    this.cols = cols;
    this.rows = rows;
    this.#platforms = platforms;
    this.#ladders = ladders;
    this.#plateIds = plateIds;
    this.#walkways = walkways;
  }

  hasPlatform(row: number, col: number): boolean {
    return this.#platforms.has(this.#key(row, col));
  }

  hasLadder(row: number, col: number): boolean {
    return this.#ladders.has(this.#key(row, col));
  }

  hasWalkway(row: number, col: number): boolean {
    return this.#walkways.has(this.#key(row, col));
  }

  /** First and last column of the walkway run through a tile, or undefined off a walkway. */
  walkwayRunAt(
    row: number,
    col: number
  ): { readonly left: number; readonly right: number } | undefined {
    if (!this.hasWalkway(row, col)) return undefined;
    let left = col;
    let right = col;
    while (left > 0 && this.hasWalkway(row, left - 1)) left -= 1;
    while (right + 1 < this.cols && this.hasWalkway(row, right + 1)) right += 1;
    return { left, right };
  }

  plateIdAt(row: number, col: number): number | undefined {
    return this.#plateIds.get(this.#key(row, col));
  }

  landingBelow(row: number, left: number, right: number): Landing | undefined {
    for (let below = row + 1; below < this.rows; below++) {
      const plateId = this.#plateIdUnder(below, left, right);
      if (plateId !== undefined) return { row: below, plateId };
      if (this.#anyPlatform(below, left, right)) return { row: below, plateId: undefined };
    }
    return undefined;
  }

  #plateIdUnder(row: number, left: number, right: number): number | undefined {
    for (let col = left; col < right; col++) {
      const plateId = this.plateIdAt(row, col);
      if (plateId !== undefined) return plateId;
    }
    return undefined;
  }

  #anyPlatform(row: number, left: number, right: number): boolean {
    for (let col = left; col < right; col++) {
      if (this.hasPlatform(row, col)) return true;
    }
    return false;
  }

  #key(row: number, col: number): number {
    return row * this.cols + col;
  }
}
