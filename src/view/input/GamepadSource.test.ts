import { describe, expect, it } from 'vitest';
import { GamepadSource, type PadState } from './GamepadSource';

const pad = (changes: Partial<PadState> & { pressed?: number[] } = {}): PadState => ({
  index: 0,
  connected: true,
  mapping: 'standard',
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, (_unused, index) => ({
    pressed: changes.pressed?.includes(index) ?? false
  })),
  ...changes
});

const held = (source: GamepadSource): string[] => [...source.poll().held].sort();

describe('GamepadSource', () => {
  it('maps the standard buttons to actions', () => {
    let pads: (PadState | null)[] = [pad({ pressed: [0] })];
    const source = new GamepadSource(() => pads);
    expect(held(source)).toEqual(['confirm', 'pepper']);
    pads = [pad({ pressed: [1, 9, 12] })];
    expect(held(source)).toEqual(['back', 'pause', 'up']);
    pads = [pad({ pressed: [2, 15] })];
    expect(held(source)).toEqual(['pepper', 'right']);
  });

  it('moves with the left stick beyond the dead zone only', () => {
    let pads: PadState[] = [pad({ axes: [0.2, -0.3, 0, 0] })];
    const source = new GamepadSource(() => pads);
    expect(held(source)).toEqual([]);
    pads = [pad({ axes: [-0.9, 0.7, 0, 0] })];
    expect(held(source)).toEqual(['down', 'left']);
  });

  it('ignores pads without the standard mapping and empty slots', () => {
    const source = new GamepadSource(() => [null, pad({ mapping: '', pressed: [0] })]);
    expect(held(source)).toEqual([]);
  });

  it('reports a disconnected pad and lets its actions go', () => {
    let pads: (PadState | null)[] = [pad({ axes: [1, 0, 0, 0] })];
    const source = new GamepadSource(() => pads);
    let lost = 0;
    source.onDisconnect(() => lost++);
    expect(held(source)).toEqual(['right']);
    pads = [null];
    expect(held(source)).toEqual([]);
    expect(lost).toBe(1);
    expect(held(source)).toEqual([]);
    expect(lost).toBe(1);
  });

  it('survives a browser that refuses to list the pads', () => {
    const source = new GamepadSource(() => {
      throw new Error('not allowed');
    });
    expect(held(source)).toEqual([]);
  });
});
