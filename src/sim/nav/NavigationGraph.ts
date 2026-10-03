import { LADDER_GRAB_DISTANCE } from '../rules';
import type { DanglingLadder, LadderEdge, PlatformEdge } from './edges';
import { NavPlace } from './NavPlace';

export type PathResult =
  | { readonly kind: 'same-platform' }
  | {
      readonly kind: 'ladder';
      readonly ladder: LadderEdge;
      readonly direction: 'up' | 'down';
      readonly junctionX: number;
    }
  | { readonly kind: 'none' };

export interface Reachable {
  readonly platforms: ReadonlySet<PlatformEdge>;
  readonly ladders: ReadonlySet<LadderEdge>;
}

interface Label {
  readonly cost: number;
  readonly firstLeg: number;
  readonly hops: number;
  readonly first: number;
}

const EPSILON = 1e-9;
const TOP = 0;

const compareLabels = (a: Label, b: Label): number => {
  if (Math.abs(a.cost - b.cost) > EPSILON) return a.cost - b.cost;
  if (a.hops !== b.hops) return a.hops - b.hops;
  return Math.abs(a.firstLeg - b.firstLeg) > EPSILON ? a.firstLeg - b.firstLeg : 0;
};

export class NavigationGraph {
  readonly platforms: readonly PlatformEdge[];
  readonly ladders: readonly LadderEdge[];
  readonly dangling: readonly DanglingLadder[];
  readonly #junctionsByPlatform: ReadonlyMap<number, readonly number[]>;

  constructor(
    platforms: readonly PlatformEdge[],
    ladders: readonly LadderEdge[],
    dangling: readonly DanglingLadder[]
  ) {
    this.platforms = platforms;
    this.ladders = ladders;
    this.dangling = dangling;
    const byPlatform = new Map<number, number[]>();
    for (const ladder of ladders) {
      for (const end of [0, 1]) {
        const platform = end === TOP ? ladder.top : ladder.bottom;
        byPlatform.set(platform.id, [...(byPlatform.get(platform.id) ?? []), ladder.id * 2 + end]);
      }
    }
    this.#junctionsByPlatform = byPlatform;
  }

  platformAt(row: number, x: number): PlatformEdge | undefined {
    return this.platforms.find((edge) => edge.row === row && edge.contains(x));
  }

  placeAt(row: number, x: number): NavPlace {
    const platform = this.platformAt(row, x);
    if (platform === undefined) throw new RangeError(`No platform at row ${row}, x ${x}`);
    return NavPlace.onPlatform(platform, x);
  }

  laddersOf(platform: PlatformEdge): readonly LadderEdge[] {
    return this.ladders.filter((ladder) => ladder.top === platform || ladder.bottom === platform);
  }

  ladderNear(
    platform: PlatformEdge,
    x: number,
    goingUp: boolean,
    maxDistance = LADDER_GRAB_DISTANCE
  ): LadderEdge | undefined {
    let best: LadderEdge | undefined;
    for (const ladder of this.ladders) {
      if ((goingUp ? ladder.bottom : ladder.top) !== platform) continue;
      const distance = Math.abs(ladder.x - x);
      if (distance > maxDistance) continue;
      if (best === undefined || distance < Math.abs(best.x - x)) best = ladder;
    }
    return best;
  }

  reachableFrom(place: NavPlace): Reachable {
    const platforms = new Set<PlatformEdge>();
    const ladders = new Set<LadderEdge>();
    const pending: PlatformEdge[] = [];
    const visit = (platform: PlatformEdge): void => {
      if (!platforms.has(platform)) {
        platforms.add(platform);
        pending.push(platform);
      }
    };
    if (place.edge.kind === 'platform') {
      visit(place.edge);
    } else {
      ladders.add(place.edge);
      visit(place.edge.top);
      visit(place.edge.bottom);
    }
    for (let platform = pending.pop(); platform !== undefined; platform = pending.pop()) {
      for (const ladder of this.laddersOf(platform)) {
        ladders.add(ladder);
        visit(ladder.top);
        visit(ladder.bottom);
      }
    }
    return { platforms, ladders };
  }

  shortestPath(from: NavPlace, to: NavPlace): PathResult {
    if (from.edge === to.edge) {
      if (from.edge.kind === 'platform') return { kind: 'same-platform' };
      return {
        kind: 'ladder',
        ladder: from.edge,
        direction: to.along < from.along ? 'up' : 'down',
        junctionX: from.edge.x
      };
    }

    const labels = new Map<number, Label>();
    const settled = new Set<number>();
    const offer = (node: number, label: Label): void => {
      const current = labels.get(node);
      if (current === undefined || compareLabels(label, current) < 0) labels.set(node, label);
    };

    for (const [node, cost] of this.#junctionCosts(from)) {
      offer(node, { cost, firstLeg: cost, hops: 1, first: node });
    }

    const finish = new Map(this.#junctionCosts(to));
    let best: { label: Label; node: number } | undefined;

    for (;;) {
      let current: number | undefined;
      for (const [node, label] of labels) {
        if (settled.has(node)) continue;
        const known = current === undefined ? undefined : labels.get(current);
        if (
          known === undefined ||
          compareLabels(label, known) < 0 ||
          (compareLabels(label, known) === 0 && node < (current as number))
        ) {
          current = node;
        }
      }
      if (current === undefined) break;
      settled.add(current);
      const label = labels.get(current) as Label;

      const toTarget = finish.get(current);
      if (toTarget !== undefined) {
        const total: Label = { ...label, cost: label.cost + toTarget };
        if (best === undefined || compareLabels(total, best.label) < 0) {
          best = { label: total, node: current };
        }
      }
      for (const [next, cost] of this.#arcsFrom(current)) {
        offer(next, { ...label, cost: label.cost + cost, hops: label.hops + 1 });
      }
    }

    if (best === undefined) return { kind: 'none' };
    return this.#resultFor(from, best.label.first);
  }

  #resultFor(from: NavPlace, firstJunction: number): PathResult {
    const end = firstJunction % 2;
    if (from.edge.kind === 'ladder') {
      return {
        kind: 'ladder',
        ladder: from.edge,
        direction: end === TOP ? 'up' : 'down',
        junctionX: from.edge.x
      };
    }
    const ladder = this.ladders[Math.floor(firstJunction / 2)];
    return {
      kind: 'ladder',
      ladder,
      direction: end === TOP ? 'down' : 'up',
      junctionX: ladder.x
    };
  }

  #junctionCosts(place: NavPlace): readonly (readonly [number, number])[] {
    if (place.edge.kind === 'platform') {
      return (this.#junctionsByPlatform.get(place.edge.id) ?? []).map(
        (node) => [node, Math.abs(this.ladders[Math.floor(node / 2)].x - place.along)] as const
      );
    }
    const ladder = place.edge;
    return [
      [ladder.id * 2 + TOP, place.along],
      [ladder.id * 2 + 1, ladder.length - place.along]
    ];
  }

  #arcsFrom(node: number): readonly (readonly [number, number])[] {
    const ladder = this.ladders[Math.floor(node / 2)];
    const end = node % 2;
    const arcs: (readonly [number, number])[] = [[ladder.id * 2 + (1 - end), ladder.length]];
    const platform = end === TOP ? ladder.top : ladder.bottom;
    for (const other of this.#junctionsByPlatform.get(platform.id) ?? []) {
      if (other === node) continue;
      arcs.push([other, Math.abs(this.ladders[Math.floor(other / 2)].x - ladder.x)]);
    }
    return arcs;
  }
}
