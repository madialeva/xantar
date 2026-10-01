import { columnCenter } from '../geometry';
import { INGREDIENT_INSET } from '../rules';
import {
  type BurgerColumn,
  type IngredientSpec,
  Level,
  type Plate,
  type PlatformRun,
  type Spawn
} from './Level';
import type {
  CellData,
  IngredientData,
  LadderData,
  LevelData,
  PlateData,
  PlatformData
} from './LevelData';

export class LevelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelError';
  }
}

const fail = (message: string): never => {
  throw new LevelError(message);
};

const isInteger = (value: unknown): value is number => Number.isInteger(value);

function requireSize(data: LevelData): void {
  if (!isInteger(data.cols) || data.cols <= 0) fail('The level width must be a positive integer');
  if (!isInteger(data.rows) || data.rows <= 0) fail('The level height must be a positive integer');
}

function requireColumns(label: string, x0: number, x1: number, cols: number): void {
  if (!isInteger(x0) || !isInteger(x1) || x0 > x1) fail(`${label}: invalid column range`);
  if (x0 < 0 || x1 >= cols) fail(`${label}: columns ${x0}-${x1} are outside the board`);
}

function requireRow(label: string, row: number, rows: number): void {
  if (!isInteger(row) || row < 0 || row >= rows) fail(`${label}: row ${row} is outside the board`);
}

function describe(kind: string, index: number): string {
  return `${kind} #${index}`;
}

function mergePlatforms(platforms: readonly PlatformData[], cols: number, rows: number) {
  platforms.forEach((platform, index) => {
    const label = describe('Platform', index);
    requireRow(label, platform.row, rows);
    requireColumns(label, platform.x0, platform.x1, cols);
  });

  const runs: PlatformRun[] = [];
  const byRow = Map.groupBy(platforms, (platform) => platform.row);
  for (const row of [...byRow.keys()].sort((a, b) => a - b)) {
    const spans = (byRow.get(row) ?? [])
      .map((platform) => ({ left: platform.x0, right: platform.x1 + 1 }))
      .sort((a, b) => a.left - b.left);
    let current: { left: number; right: number } | undefined;
    for (const span of spans) {
      if (current !== undefined && span.left <= current.right) {
        current = { left: current.left, right: Math.max(current.right, span.right) };
      } else {
        if (current !== undefined) runs.push({ row, ...current });
        current = span;
      }
    }
    if (current !== undefined) runs.push({ row, ...current });
  }
  return runs;
}

function requireSupport(
  label: string,
  runs: readonly PlatformRun[],
  row: number,
  left: number,
  right: number
): void {
  const supported = runs.some((run) => run.row === row && run.left <= left && run.right >= right);
  if (!supported) fail(`${label} is not supported by a platform on row ${row}`);
}

function requireCell(
  label: string,
  cell: CellData | undefined,
  runs: readonly PlatformRun[],
  data: LevelData
): Spawn {
  if (cell === undefined) return fail(`${label} is missing`);
  requireRow(label, cell.row, data.rows);
  if (!isInteger(cell.col) || cell.col < 0 || cell.col >= data.cols) {
    fail(`${label}: column ${cell.col} is outside the board`);
  }
  const x = columnCenter(cell.col);
  requireSupport(label, runs, cell.row, x, x);
  return { row: cell.row, x };
}

function validateLadders(
  ladders: readonly LadderData[],
  runs: readonly PlatformRun[],
  data: LevelData
): void {
  ladders.forEach((ladder, index) => {
    const label = describe('Ladder', index);
    requireRow(label, ladder.topRow, data.rows);
    requireRow(label, ladder.bottomRow, data.rows);
    if (ladder.topRow >= ladder.bottomRow) fail(`${label}: the top row must be above the bottom`);
    if (!isInteger(ladder.col) || ladder.col < 0 || ladder.col >= data.cols) {
      fail(`${label}: column ${ladder.col} is outside the board`);
    }
    const x = columnCenter(ladder.col);
    requireSupport(label, runs, ladder.topRow, x, x);
    requireSupport(label, runs, ladder.bottomRow, x, x);
  });
}

function validatePlates(plates: readonly PlateData[], data: LevelData): readonly Plate[] {
  return plates.map((plate, index) => {
    const label = describe('Plate', index);
    requireRow(label, plate.row, data.rows);
    requireColumns(label, plate.x0, plate.x1, data.cols);
    return { row: plate.row, left: plate.x0, right: plate.x1 + 1 };
  });
}

function buildColumns(
  ingredients: readonly IngredientData[],
  plates: readonly Plate[],
  runs: readonly PlatformRun[],
  data: LevelData
): readonly BurgerColumn[] {
  const specs: IngredientSpec[] = ingredients.map((ingredient, index) => {
    const label = describe('Ingredient', index);
    requireRow(label, ingredient.row, data.rows);
    requireColumns(label, ingredient.x0, ingredient.x1, data.cols);
    requireSupport(label, runs, ingredient.row, ingredient.x0, ingredient.x1 + 1);
    return {
      id: index,
      kind: ingredient.kind,
      row: ingredient.row,
      left: ingredient.x0 + INGREDIENT_INSET,
      right: ingredient.x1 + 1 - INGREDIENT_INSET
    };
  });

  const groups = Map.groupBy(
    ingredients.map((ingredient, index) => ({ ingredient, spec: specs[index] })),
    ({ ingredient }) => `${ingredient.x0}:${ingredient.x1}`
  );

  const columns = [...groups.values()].map((members, id): BurgerColumn => {
    const { x0, x1 } = members[0].ingredient;
    const left = x0;
    const right = x1 + 1;
    const rows = members.map(({ ingredient }) => ingredient.row);
    if (new Set(rows).size !== rows.length) {
      fail(`Ingredient column ${x0}-${x1} has two ingredients on the same row`);
    }
    const plate = plates.find(
      (candidate) =>
        candidate.left <= left && candidate.right >= right && candidate.row > Math.max(...rows)
    );
    if (plate === undefined) fail(`Ingredient column ${x0}-${x1} has no plate below it`);
    return {
      id,
      left,
      right,
      ingredients: members.map(({ spec }) => spec).sort((a, b) => a.row - b.row),
      plate: plate as Plate
    };
  });

  columns.forEach((a, index) => {
    for (const b of columns.slice(index + 1)) {
      if (a.left < b.right && b.left < a.right) {
        fail(`Ingredient columns ${a.left}-${a.right - 1} and ${b.left}-${b.right - 1} overlap`);
      }
    }
  });

  return columns;
}

export function loadLevel(data: LevelData): Level {
  requireSize(data);
  const platformRuns = mergePlatforms(data.platforms, data.cols, data.rows);
  validateLadders(data.ladders, platformRuns, data);
  const plates = validatePlates(data.plates, data);
  const columns = buildColumns(data.ingredients, plates, platformRuns, data);
  const chefStart = requireCell('Chef start', data.chefStart, platformRuns, data);
  const enemyStarts = data.enemyStarts.map((enemy, index) => ({
    kind: enemy.kind,
    ...requireCell(describe('Enemy start', index), enemy, platformRuns, data)
  }));
  const respawnPoints = data.respawnPoints.map((point, index) =>
    requireCell(describe('Respawn point', index), point, platformRuns, data)
  );
  if (enemyStarts.length > 0 && respawnPoints.length === 0) {
    fail('The level has enemies but no respawn points');
  }

  return new Level({
    cols: data.cols,
    rows: data.rows,
    platformRuns,
    ladders: data.ladders.map((ladder) => ({ ...ladder })),
    columns,
    chefStart,
    enemyStarts,
    respawnPoints
  });
}
