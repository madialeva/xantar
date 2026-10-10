import { describe, expect, it } from 'vitest';
import { InputModality } from './InputModality';
import { TouchPad } from './TouchPad';

const sorted = (actions: ReadonlySet<string>): string[] => [...actions].sort();

describe('TouchPad', () => {
  it('lets two fingers move and throw pepper at once', () => {
    const pad = new TouchPad();
    pad.press(1, ['right']);
    pad.press(2, ['pepper', 'confirm']);
    const snapshot = pad.poll();
    expect(sorted(snapshot.held)).toEqual(['confirm', 'pepper', 'right']);
    expect(sorted(snapshot.pressed)).toEqual(['confirm', 'pepper', 'right']);
    pad.lift(2);
    const next = pad.poll();
    expect(sorted(next.held)).toEqual(['right']);
    expect(sorted(next.pressed)).toEqual([]);
  });

  it('changes direction when a finger slides, as a new press', () => {
    const pad = new TouchPad();
    pad.press(1, ['left']);
    pad.poll();
    pad.press(1, ['up']);
    const snapshot = pad.poll();
    expect(sorted(snapshot.held)).toEqual(['up']);
    expect(sorted(snapshot.pressed)).toEqual(['up']);
  });

  it('reports a tap that ends before the next frame', () => {
    const pad = new TouchPad();
    pad.press(3, ['pepper', 'confirm']);
    pad.lift(3);
    expect(sorted(pad.poll().pressed)).toEqual(['confirm', 'pepper']);
    expect(sorted(pad.poll().held)).toEqual([]);
  });

  it('forgets every finger on release', () => {
    const pad = new TouchPad();
    pad.press(1, ['down']);
    pad.release();
    expect(sorted(pad.poll().held)).toEqual([]);
  });
});

describe('InputModality', () => {
  const pointer = (pointerType: string): Event =>
    Object.assign(new Event('pointerdown'), { pointerType });

  it('switches to touch on the first touch and tells its listeners once', () => {
    const host = new EventTarget();
    const modality = new InputModality(host);
    let told = 0;
    modality.onTouch(() => told++);
    host.dispatchEvent(pointer('mouse'));
    expect(modality.touch).toBe(false);
    host.dispatchEvent(pointer('touch'));
    host.dispatchEvent(pointer('touch'));
    expect(modality.touch).toBe(true);
    expect(told).toBe(1);
  });
});
