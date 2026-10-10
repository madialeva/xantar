import Phaser from 'phaser';
import { TILE, type RenderTier, platformY } from '../config';
import IngredientView from '../objects/IngredientView';
import { type IngredientKind, type IngredientSnapshot } from '../sim';
import { HUD_FONT } from '../view/hud/textStyle';
import { ArtFactory } from '../view/raster/ArtFactory';
import { SvgRasterizer } from '../view/raster/SvgRasterizer';
import { CharacterRig } from '../view/rigs/CharacterRig';
import type { AnimationState } from '../view/rigs/AnimationState';
import { RigAnimator } from '../view/rigs/RigAnimator';
import { RigMotion } from '../view/rigs/RigMotion';
import { chefRig, enemyRigs } from '../view/rigs/rigs';
import type { RigDefinition } from '../view/rigs/RigDefinition';
import { chefStates, enemyStates } from '../view/rigs/states';
import { GRAPHIC_IDS, type GraphicId, segmentParts } from '../view/theme/graphics';
import type { ResolvedTheme } from '../view/theme/Theme';

export const SHEET_WIDTH = 1000;
export const SHEET_HEIGHT = 940;

const MARGIN = 20;
const GRID_COLUMNS = 10;
const GRID_CELL = { width: 96, height: 66 };
const HIT_REPLAY_MS = 1600;
const SPECIMEN_ZOOM = 1.6;
const SPECIMEN_SPACING = 104;
const KINDS: readonly IngredientKind[] = ['bunTop', 'lettuce', 'patty', 'bunBottom'];
const RUN_WIDTHS = [4, 3, 2] as const;

export interface ArtSheetDependencies {
  readonly theme: ResolvedTheme;
  readonly tier: RenderTier;
}

/** A character shown in one animation state that replays when its state only plays once. */
interface Specimen {
  readonly animator: RigAnimator<string>;
  readonly state: string;
  readonly replay: boolean;
}

/**
 * Development-only page scene: draws every graphic of a theme with the real rasterizer,
 * ingredient and plate runs, a piece of maze and each character in each animation state.
 */
export default class ArtSheetScene extends Phaser.Scene {
  readonly #theme: ResolvedTheme;
  readonly #tier: RenderTier;
  #art!: ArtFactory;
  readonly #specimens: Specimen[] = [];
  #nextReplay = 0;

  constructor({ theme, tier }: ArtSheetDependencies) {
    super({ key: 'ArtSheetScene' });
    this.#theme = theme;
    this.#tier = tier;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.#theme.palette.background).setZoom(this.#tier);
    this.cameras.main.setOrigin(0, 0);
    this.#art = new ArtFactory(this, this.#theme.id, this.#tier);
    void new SvgRasterizer(this.textures, this.#tier)
      .rasterizeTheme(this.#theme)
      .then(() => this.#draw());
  }

  override update(time: number): void {
    if (time < this.#nextReplay) return;
    this.#nextReplay = time + HIT_REPLAY_MS;
    for (const specimen of this.#specimens.filter(({ replay }) => replay)) {
      specimen.animator.stop();
      specimen.animator.show(specimen.state);
    }
  }

  #draw(): void {
    this.#label(MARGIN, 8, `Lámina de arte · tema ${this.#theme.id}`, 16);
    this.#drawCharacters(40);
    const gridBottom = this.#drawGraphics(270);
    this.#drawRuns(gridBottom + 20);
  }

  #drawCharacters(top: number): void {
    this.#label(MARGIN, top, 'Personajes por estado de animación', 12);
    const chef = Object.keys(chefStates).map((state) => ({
      rig: chefRig,
      states: chefStates,
      state,
      name: `chef · ${state}`
    }));
    const enemies = Object.entries(enemyRigs).flatMap(([kind, rig]) =>
      (['walk', 'climb', 'stunned'] as const).map((state) => ({
        rig,
        states: enemyStates,
        state,
        name: `${kind} · ${state}`
      }))
    );
    [chef, enemies].forEach((row, rowIndex) => {
      row.forEach(({ rig, states, state, name }, index) => {
        const x = MARGIN + 40 + index * SPECIMEN_SPACING;
        const y = top + 64 + rowIndex * 100;
        this.#specimen(rig, states, state, x, y);
        this.#label(x - 44, y + 34, name, 9);
      });
    });
  }

  #specimen(
    definition: RigDefinition,
    states: Readonly<Record<string, AnimationState>>,
    state: string,
    x: number,
    y: number
  ): void {
    const stage = this.add.container(x, y).setScale(SPECIMEN_ZOOM);
    for (const [index, part] of segmentParts(2).entries()) {
      stage.add(this.#art.image(`platform.${part}`, (index - 0.5) * TILE, TILE / 2));
    }
    const rig = new CharacterRig(this, this.#art, definition);
    stage.add(rig);
    const animator = new RigAnimator(new RigMotion(rig, this.tweens), states);
    animator.show(state);
    this.#specimens.push({ animator, state, replay: state === 'hit' });
  }

  #drawGraphics(top: number): number {
    this.#label(MARGIN, top, 'Gráficos del catálogo (tamaño lógico)', 12);
    const graphics = GRAPHIC_IDS.filter((id) => id !== 'board.backdrop');
    graphics.forEach((id, index) => {
      const x = MARGIN + (index % GRID_COLUMNS) * GRID_CELL.width + GRID_CELL.width / 2;
      const y = top + 24 + Math.floor(index / GRID_COLUMNS) * GRID_CELL.height;
      this.#art.image(id, x, y + 20);
      this.#label(x - GRID_CELL.width / 2 + 4, y + 44, id, 8);
    });
    return top + 24 + Math.ceil(graphics.length / GRID_COLUMNS) * GRID_CELL.height;
  }

  #drawRuns(top: number): void {
    this.#label(MARGIN, top, 'Ingredientes y platos de 4, 3 y 2 segmentos; tramo con escalera', 12);
    [...KINDS, 'plate' as const].forEach((kind, rowIndex) => {
      const y = top + 30 + rowIndex * 34;
      this.#label(MARGIN, y + 10, kind, 9);
      let x = MARGIN + 80;
      for (const width of RUN_WIDTHS) {
        const run = this.add.container(x, y);
        if (kind === 'plate') {
          segmentParts(width).forEach((part, index) =>
            run.add(this.#art.image(`plate.${part}`, (index + 0.5) * TILE, platformY(0)))
          );
        } else {
          segmentParts(width).forEach((part, index) =>
            run.add(this.#art.image(`platform.${part}`, (index + 0.5) * TILE, platformY(0)))
          );
          run.add(new IngredientView(this, this.#art, this.#snapshot(kind, width)));
        }
        x += width * TILE + 24;
      }
    });
    this.#drawMaze(MARGIN + 440, top + 30);
    const backdrop = this.#art.image('board.backdrop', SHEET_WIDTH - MARGIN - 80, top + 76);
    backdrop.setScale(backdrop.scale * 0.25);
    this.#label(SHEET_WIDTH - MARGIN - 160, top + 140, 'board.backdrop (25 %)', 8);
  }

  #drawMaze(left: number, top: number): void {
    const maze = this.add.container(left, top);
    const tile = (graphic: GraphicId, col: number, y: number): void => {
      maze.add(this.#art.image(graphic, (col + 0.5) * TILE, y));
    };
    for (const row of [0, 1]) {
      maze.add(this.#art.image('ladder', 1.5 * TILE, platformY(row)).setOrigin(0.5, 0));
    }
    for (const row of [0, 2]) {
      segmentParts(6).forEach((part, col) => tile(`platform.${part}`, col, platformY(row)));
      tile('crossing', 1, platformY(row));
    }
    segmentParts(4).forEach((part, index) => tile(`plate.${part}`, index + 2, platformY(3)));
    maze.add(
      new IngredientView(this, this.#art, {
        ...this.#snapshot('patty', 4),
        col: 2,
        left: 2,
        right: 6
      })
    );
  }

  #snapshot(kind: IngredientKind, width: number): IngredientSnapshot {
    return {
      id: 0,
      kind,
      col: 0,
      width,
      left: 0,
      right: width,
      row: 0,
      phase: 'idle',
      stomped: Array.from({ length: width }, (_, index) => index === 1),
      fallFromRow: 0,
      fallToRow: 0,
      fallProgress: 0,
      landsOnPlate: false,
      stackSlot: null
    };
  }

  #label(x: number, y: number, text: string, size: number): void {
    this.add.text(x, y, text, {
      fontFamily: HUD_FONT,
      fontSize: `${size}px`,
      color: this.#theme.palette.hudText,
      resolution: this.#tier
    });
  }
}
