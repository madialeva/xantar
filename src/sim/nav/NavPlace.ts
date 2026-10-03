import { clamp } from '../geometry';
import { LadderEdge, type NavEdge, PlatformEdge } from './edges';

export interface NavPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Immutable position on the navigation graph: an edge (platform or ladder) plus a distance
 * along it. Moving returns a new place.
 */
export class NavPlace {
  readonly edge: NavEdge;
  readonly along: number;

  private constructor(edge: NavEdge, along: number) {
    this.edge = edge;
    this.along = along;
  }

  static onPlatform(edge: PlatformEdge, x: number): NavPlace {
    return new NavPlace(edge, clamp(x, edge.minAlong, edge.maxAlong));
  }

  static onLadder(edge: LadderEdge, along: number): NavPlace {
    return new NavPlace(edge, clamp(along, 0, edge.length));
  }

  get isOnPlatform(): boolean {
    return this.edge instanceof PlatformEdge;
  }

  get platform(): PlatformEdge | undefined {
    return this.edge instanceof PlatformEdge ? this.edge : undefined;
  }

  get ladder(): LadderEdge | undefined {
    return this.edge instanceof LadderEdge ? this.edge : undefined;
  }

  get point(): NavPoint {
    return this.edge instanceof LadderEdge
      ? { x: this.edge.x, y: this.edge.topRow + this.along }
      : { x: this.along, y: this.edge.row };
  }

  moveAlong(delta: number): NavPlace {
    return this.edge instanceof LadderEdge
      ? NavPlace.onLadder(this.edge, this.along + delta)
      : NavPlace.onPlatform(this.edge, this.along + delta);
  }
}
