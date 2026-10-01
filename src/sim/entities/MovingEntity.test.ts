import { describe, expect, it } from 'vitest';
import { MovingEntity } from './MovingEntity';

class Probe extends MovingEntity {
  shift(dx: number, dy: number): void {
    this.moveTo(this.x + dx, this.y + dy);
  }
}

describe('MovingEntity', () => {
  it('starts with the previous position equal to the current one', () => {
    const entity = new Probe(2, 3);
    expect([entity.x, entity.y, entity.prevX, entity.prevY]).toEqual([2, 3, 2, 3]);
  });

  it('copies the current position into the previous one at the beginning of a tick', () => {
    const entity = new Probe(2, 3);
    entity.shift(1, 0.5);
    expect([entity.prevX, entity.prevY]).toEqual([2, 3]);
    entity.beginTick();
    expect([entity.prevX, entity.prevY]).toEqual([3, 3.5]);
  });

  it('equals the previous position to the new one when teleporting', () => {
    const entity = new Probe(2, 3);
    entity.shift(1, 1);
    entity.teleportTo(9, 9);
    expect([entity.x, entity.y, entity.prevX, entity.prevY]).toEqual([9, 9, 9, 9]);
  });
});
