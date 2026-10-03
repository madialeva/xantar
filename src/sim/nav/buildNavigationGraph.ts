import type { Terrain } from '../level/Terrain';
import { type DanglingLadder, LadderEdge, PlatformEdge } from './edges';
import { NavigationGraph } from './NavigationGraph';

function derivePlatforms(terrain: Terrain): PlatformEdge[] {
  const platforms: PlatformEdge[] = [];
  for (let row = 0; row < terrain.rows; row++) {
    let col = 0;
    while (col < terrain.cols) {
      if (!terrain.hasPlatform(row, col)) {
        col += 1;
        continue;
      }
      let end = col;
      while (end + 1 < terrain.cols && terrain.hasPlatform(row, end + 1)) end += 1;
      platforms.push(new PlatformEdge(platforms.length, row, col, end + 1));
      col = end + 1;
    }
  }
  return platforms;
}

function deriveLadders(
  terrain: Terrain,
  platformAt: (row: number, col: number) => PlatformEdge | undefined
): { ladders: LadderEdge[]; dangling: DanglingLadder[] } {
  const ladders: LadderEdge[] = [];
  const dangling: DanglingLadder[] = [];
  for (let col = 0; col < terrain.cols; col++) {
    let row = 0;
    while (row < terrain.rows) {
      if (!terrain.hasLadder(row, col)) {
        row += 1;
        continue;
      }
      let end = row;
      while (end + 1 < terrain.rows && terrain.hasLadder(end + 1, col)) end += 1;
      const crossings: number[] = [];
      for (let r = row; r <= end; r++) if (terrain.hasPlatform(r, col)) crossings.push(r);
      const loose = [row, end].filter((r) => !terrain.hasPlatform(r, col));
      for (const r of new Set(loose)) dangling.push({ col, row: r });
      if (crossings.length < 2 && loose.length === 0) dangling.push({ col, row });
      for (let i = 0; i + 1 < crossings.length; i++) {
        const top = platformAt(crossings[i], col);
        const bottom = platformAt(crossings[i + 1], col);
        if (top !== undefined && bottom !== undefined) {
          ladders.push(
            new LadderEdge(ladders.length, col, crossings[i], crossings[i + 1], top, bottom)
          );
        }
      }
      row = end + 1;
    }
  }
  return { ladders, dangling };
}

export function buildNavigationGraph(terrain: Terrain): NavigationGraph {
  const platforms = derivePlatforms(terrain);
  const platformAt = (row: number, col: number): PlatformEdge | undefined =>
    platforms.find((edge) => edge.row === row && col >= edge.left && col < edge.right);
  const { ladders, dangling } = deriveLadders(terrain, platformAt);
  return new NavigationGraph(platforms, ladders, dangling);
}
