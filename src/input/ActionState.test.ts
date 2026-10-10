import { describe, expect, it } from 'vitest';
import { ActionState, REPEAT_DELAY_MS, REPEAT_INTERVAL_MS } from './ActionState';
import { type Action, type InputSnapshot, type InputSource, NO_ACTIONS, pollAll } from './actions';
import { toSimInput } from './toSimInput';

const held = (...actions: Action[]): InputSnapshot => ({
  held: new Set(actions),
  pressed: NO_ACTIONS
});

describe('ActionState', () => {
  it('reports a press only on the frame it starts', () => {
    const state = new ActionState();
    state.update(held('pepper'), 0);
    expect(state.justPressed('pepper')).toBe(true);
    expect(state.isDown('pepper')).toBe(true);
    for (let frame = 1; frame <= 60; frame++) {
      state.update(held('pepper'), frame * 16);
      expect(state.justPressed('pepper')).toBe(false);
      expect(state.isDown('pepper')).toBe(true);
    }
    state.update(held(), 1000);
    expect(state.isDown('pepper')).toBe(false);
    state.update(held('pepper'), 1016);
    expect(state.justPressed('pepper')).toBe(true);
  });

  it('repeats a held action after a delay and then at a steady interval', () => {
    const state = new ActionState();
    const repeats: number[] = [];
    for (let now = 0; now <= 1000; now += 10) {
      state.update(held('down'), now);
      if (state.repeated('down')) repeats.push(now);
    }
    expect(repeats.slice(0, 4)).toEqual([
      0,
      REPEAT_DELAY_MS,
      REPEAT_DELAY_MS + REPEAT_INTERVAL_MS,
      REPEAT_DELAY_MS + 2 * REPEAT_INTERVAL_MS
    ]);
  });

  it('restarts the repeat delay after letting go', () => {
    const state = new ActionState();
    state.update(held('up'), 0);
    state.update(held(), 100);
    state.update(held('up'), 200);
    expect(state.repeated('up')).toBe(true);
    state.update(held('up'), 500);
    expect(state.repeated('up')).toBe(false);
    state.update(held('up'), 600);
    expect(state.repeated('up')).toBe(true);
  });

  it('tracks several actions at once', () => {
    const state = new ActionState();
    state.update(held('right'), 0);
    state.update(held('right', 'pepper'), 16);
    expect(state.isDown('right')).toBe(true);
    expect(state.justPressed('right')).toBe(false);
    expect(state.justPressed('pepper')).toBe(true);
  });
});

describe('toSimInput', () => {
  it('takes held directions and the pending one-shot presses', () => {
    const state = new ActionState();
    state.update(held('left', 'up', 'pepper'), 0);
    expect(toSimInput(state, { pepper: true, confirm: false })).toEqual({
      left: true,
      right: false,
      up: true,
      down: false,
      pepper: true,
      confirm: false
    });
  });

  it('turns a held pepper into a single press', () => {
    const state = new ActionState();
    let pending = false;
    let peppers = 0;
    for (let frame = 0; frame < 60; frame++) {
      state.update(held('pepper'), frame * 16);
      if (state.justPressed('pepper')) pending = true;
      if (toSimInput(state, { pepper: pending, confirm: false }).pepper) peppers++;
      pending = false;
    }
    expect(peppers).toBe(1);
  });
});

describe('a press between two frames', () => {
  it('counts a key let go and pressed again before the next frame as a new press', () => {
    const state = new ActionState();
    state.update(held('down'), 0);
    state.update(held('down'), 16);
    expect(state.justPressed('down')).toBe(false);
    state.update({ held: new Set(['down']), pressed: new Set(['down']) }, 32);
    expect(state.justPressed('down')).toBe(true);
    expect(state.repeated('down')).toBe(true);
  });
});

describe('pollAll', () => {
  const source = (heldActions: Action[], pressed: Action[] = []): InputSource => ({
    poll: () => ({ held: new Set(heldActions), pressed: new Set(pressed) }),
    release: () => undefined
  });

  it('holds or presses an action when any device does', () => {
    const snapshot = pollAll([
      source(['right']),
      source(['pepper', 'confirm'], ['pepper']),
      source([])
    ]);
    expect([...snapshot.held].sort()).toEqual(['confirm', 'pepper', 'right']);
    expect([...snapshot.pressed]).toEqual(['pepper']);
  });
});
