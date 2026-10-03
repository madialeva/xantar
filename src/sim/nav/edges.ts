import { EDGE_MARGIN } from '../rules';

export class PlatformEdge {
  readonly kind = 'platform';
  readonly id: number;
  readonly row: number;
  readonly left: number;
  readonly right: number;

  constructor(id: number, row: number, left: number, right: number) {
    this.id = id;
    this.row = row;
    this.left = left;
    this.right = right;
  }

  get minAlong(): number {
    return this.left + EDGE_MARGIN;
  }

  get maxAlong(): number {
    return this.right - EDGE_MARGIN;
  }

  contains(x: number): boolean {
    return x >= this.left && x <= this.right;
  }
}

export class LadderEdge {
  readonly kind = 'ladder';
  readonly id: number;
  readonly col: number;
  readonly topRow: number;
  readonly bottomRow: number;
  readonly top: PlatformEdge;
  readonly bottom: PlatformEdge;

  constructor(
    id: number,
    col: number,
    topRow: number,
    bottomRow: number,
    top: PlatformEdge,
    bottom: PlatformEdge
  ) {
    this.id = id;
    this.col = col;
    this.topRow = topRow;
    this.bottomRow = bottomRow;
    this.top = top;
    this.bottom = bottom;
  }

  get length(): number {
    return this.bottomRow - this.topRow;
  }

  get x(): number {
    return this.col + 0.5;
  }
}

export type NavEdge = PlatformEdge | LadderEdge;

export interface DanglingLadder {
  readonly col: number;
  readonly row: number;
}
