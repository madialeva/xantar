import { describe, expect, it } from 'vitest';
import { TICK_MS } from './rules';
import { FixedStepper } from './stepper';

describe('FixedStepper', () => {
  it('runs three ticks for exactly three ticks of elapsed time', () => {
    expect(new FixedStepper().advance(50)).toBe(3);
  });

  it('keeps the fractional remainder for the next frame', () => {
    const stepper = new FixedStepper();
    expect(stepper.advance(55)).toBe(3);
    expect(stepper.alpha).toBeCloseTo(5 / TICK_MS, 5);
    expect(stepper.advance(12)).toBe(1);
  });

  it('runs no tick for a frame shorter than a tick and keeps its time', () => {
    const stepper = new FixedStepper();
    expect(stepper.advance(8)).toBe(0);
    expect(stepper.alpha).toBeCloseTo(0.48, 5);
    expect(stepper.advance(9)).toBe(1);
  });

  it('caps the ticks after a long pause and discards the surplus', () => {
    const stepper = new FixedStepper(5);
    expect(stepper.advance(5000)).toBe(5);
    expect(stepper.alpha).toBe(0);
    expect(stepper.advance(TICK_MS)).toBe(1);
  });

  it('gives the same number of ticks regardless of the frame rate', () => {
    for (const frameMs of [1000 / 30, 1000 / 60, 1000 / 144]) {
      const stepper = new FixedStepper();
      let ticks = 0;
      const frames = Math.round(1000 / frameMs);
      for (let i = 0; i < frames; i++) ticks += stepper.advance(frameMs);
      expect(ticks).toBeGreaterThanOrEqual(59);
      expect(ticks).toBeLessThanOrEqual(60);
    }
  });

  it('ignores negative elapsed time', () => {
    const stepper = new FixedStepper();
    expect(stepper.advance(-10)).toBe(0);
    expect(stepper.alpha).toBe(0);
  });

  it('forgets the accumulated time on reset', () => {
    const stepper = new FixedStepper();
    stepper.advance(10);
    stepper.reset();
    expect(stepper.alpha).toBe(0);
  });
});
