import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE, platformY } from '../../config';
import type { Level } from '../../sim';
import type { ArtFactory } from '../raster/ArtFactory';
import { segmentParts } from '../theme/graphics';

/**
 * Static drawing of a level with the game graphics: backdrop, ladders, platform runs
 * with their end caps, crossings and plates.
 */
export class MazeView extends Phaser.GameObjects.Container {
  readonly #art: ArtFactory;

  constructor(scene: Phaser.Scene, art: ArtFactory, level: Level) {
    super(scene, 0, 0);
    this.#art = art;
    this.add(art.image('board.backdrop', GAME_WIDTH / 2, GAME_HEIGHT / 2));
    this.#drawLadders(level);
    this.#drawPlatforms(level);
    this.#drawCrossings(level);
    this.#drawPlates(level);
    scene.add.existing(this);
  }

  #drawLadders({ terrain }: Level): void {
    for (let row = 0; row + 1 < terrain.rows; row++) {
      for (let col = 0; col < terrain.cols; col++) {
        if (terrain.hasLadder(row, col) && terrain.hasLadder(row + 1, col)) {
          this.add(this.#art.image('ladder', (col + 0.5) * TILE, platformY(row)).setOrigin(0.5, 0));
        }
      }
    }
  }

  #drawPlatforms(level: Level): void {
    for (const run of level.graph.platforms) {
      segmentParts(run.right - run.left).forEach((part, index) => {
        const x = (run.left + index + 0.5) * TILE;
        this.add(this.#art.image(`platform.${part}`, x, platformY(run.row)));
      });
    }
  }

  #drawCrossings({ terrain }: Level): void {
    for (let row = 0; row < terrain.rows; row++) {
      for (let col = 0; col < terrain.cols; col++) {
        if (terrain.hasPlatform(row, col) && terrain.hasLadder(row, col)) {
          this.add(this.#art.image('crossing', (col + 0.5) * TILE, platformY(row)));
        }
      }
    }
  }

  #drawPlates(level: Level): void {
    for (const plate of level.plates) {
      segmentParts(plate.width).forEach((part, index) => {
        const x = (plate.col + index + 0.5) * TILE;
        this.add(this.#art.image(`plate.${part}`, x, platformY(plate.row)));
      });
    }
  }
}
