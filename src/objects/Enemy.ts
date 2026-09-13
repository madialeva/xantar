import Phaser from 'phaser';
import { ENEMY_SPEED, GAME_WIDTH, STUN_MS, colX, entityY } from '../config';
import { type Ladder, bestLadderTowards } from '../level';

export type EnemyKind = 'hotdog' | 'pickle' | 'egg';

interface ClimbState {
  toRow: number;
  targetY: number;
}

export default class Enemy extends Phaser.GameObjects.Container {
  readonly kind: EnemyKind;
  row: number;
  private dirX = 1;
  private motion: 'walk' | 'climb' = 'walk';
  private climb: ClimbState | null = null;
  private pendingLadder: Ladder | null = null;
  private decisionTimer = 0;
  private stunTimer = 0;

  constructor(scene: Phaser.Scene, kind: EnemyKind, row: number, x: number) {
    super(scene, x, entityY(row));
    this.kind = kind;
    this.row = row;
    this.buildVisual();
    scene.add.existing(this);
  }

  get isStunned(): boolean {
    return this.stunTimer > 0;
  }

  stun(): void {
    this.stunTimer = STUN_MS;
    this.setAlpha(0.5);
  }

  clearStun(): void {
    this.stunTimer = 0;
    this.setAlpha(1);
    this.setAngle(0);
  }

  squash(): void {
    this.active = false;
    this.setVisible(false);
  }

  respawn(row: number, x: number): void {
    this.row = row;
    this.x = x;
    this.y = entityY(row);
    this.motion = 'walk';
    this.climb = null;
    this.pendingLadder = null;
    this.dirX = Math.random() < 0.5 ? -1 : 1;
    this.decisionTimer = 0;
    this.clearStun();
    this.active = true;
    this.setVisible(true);
  }

  override update(dt: number, chefRow: number, chefX: number): void {
    if (!this.active) return;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt * 1000;
      this.setAngle(Math.sin(this.stunTimer / 90) * 12);
      if (this.stunTimer <= 0) this.clearStun();
      return;
    }

    if (this.motion === 'climb' && this.climb) {
      const direction = Math.sign(this.climb.targetY - this.y);
      this.y += direction * ENEMY_SPEED * dt;
      if (Math.abs(this.y - this.climb.targetY) < 3) {
        this.y = this.climb.targetY;
        this.row = this.climb.toRow;
        this.motion = 'walk';
        this.climb = null;
      }
      return;
    }

    this.decisionTimer -= dt * 1000;
    if (this.decisionTimer <= 0) {
      this.decide(chefRow, chefX);
      this.decisionTimer = Phaser.Math.Between(500, 1100);
    }

    if (this.pendingLadder && Math.abs(colX(this.pendingLadder.col) - this.x) < 3) {
      this.beginClimb(this.pendingLadder, chefRow);
      return;
    }

    this.dirX = this.dirX === 0 ? 1 : this.dirX;
    this.x = Phaser.Math.Clamp(this.x + this.dirX * ENEMY_SPEED * dt, 12, GAME_WIDTH - 12);
    this.setScale(this.dirX < 0 ? -1 : 1, 1);
  }

  private decide(chefRow: number, chefX: number): void {
    if (this.row !== chefRow) {
      const ladder = bestLadderTowards(this.row, chefRow, this.x, colX);
      if (ladder) {
        this.pendingLadder = ladder;
        this.dirX = Math.sign(colX(ladder.col) - this.x) || 1;
        return;
      }
    }
    this.pendingLadder = null;
    this.dirX = Math.sign(chefX - this.x) || (Math.random() < 0.5 ? -1 : 1);
    if (Math.random() < 0.2) this.dirX *= -1;
  }

  private beginClimb(ladder: Ladder, chefRow: number): void {
    const goingUp = chefRow < this.row;
    const toRow = goingUp ? ladder.top : ladder.bottom;
    this.x = colX(ladder.col);
    this.setScale(1, 1);
    this.motion = 'climb';
    this.climb = { toRow, targetY: entityY(toRow) };
    this.pendingLadder = null;
  }

  private buildVisual(): void {
    if (this.kind === 'hotdog') {
      this.add(this.scene.add.rectangle(0, 0, 24, 8, 0xe08a3c));
      this.add(this.scene.add.rectangle(0, 0, 24, 4, 0xb53b2a));
      this.add(this.scene.add.circle(-10, 0, 5, 0xe08a3c));
      this.add(this.scene.add.circle(10, 0, 5, 0xe08a3c));
    } else if (this.kind === 'pickle') {
      this.add(this.scene.add.ellipse(0, 0, 14, 22, 0x4e8f3a));
      for (let i = -1; i <= 1; i++) {
        this.add(this.scene.add.circle(i * 3, -3, 1.1, 0x2f5f22));
      }
    } else {
      this.add(this.scene.add.ellipse(0, 0, 20, 15, 0xffffff));
      this.add(this.scene.add.circle(0, -1, 4.5, 0xf6c945));
    }
    this.add(this.scene.add.circle(-4, -2, 1.4, 0x101010));
    this.add(this.scene.add.circle(4, -2, 1.4, 0x101010));
  }
}
