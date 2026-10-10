import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINDINGS,
  type KeyBindings,
  actionsForKey,
  assign,
  clearSlot,
  validateBindings
} from './bindings';
import { keyLabel } from './keyLabel';

const assigned = (result: ReturnType<typeof assign>): KeyBindings => {
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.bindings;
};

describe('assign', () => {
  it('puts a free key in a slot', () => {
    const bindings = assigned(assign(DEFAULT_BINDINGS, 'pepper', 0, 'KeyX'));
    expect(bindings.pepper).toEqual(['KeyX']);
    expect(actionsForKey(bindings, 'KeyX')).toEqual(['pepper', 'confirm']);
    expect(actionsForKey(bindings, 'Space')).toEqual([]);
  });

  it('adds a second key in the empty slot', () => {
    expect(assigned(assign(DEFAULT_BINDINGS, 'pepper', 1, 'KeyX')).pepper).toEqual([
      'Space',
      'KeyX'
    ]);
  });

  it('swaps a key used by another action, so no action is left without one', () => {
    const bindings = assigned(assign(DEFAULT_BINDINGS, 'pepper', 0, 'KeyW'));
    expect(bindings.pepper).toEqual(['KeyW']);
    expect(bindings.up).toEqual(['ArrowUp', 'Space']);
    expect(actionsForKey(bindings, 'Space')).toEqual(['up']);
  });

  it('swaps the two keys of the same action', () => {
    expect(assigned(assign(DEFAULT_BINDINGS, 'up', 0, 'KeyW')).up).toEqual(['KeyW', 'ArrowUp']);
  });

  it('refuses reserved keys', () => {
    for (const code of ['Escape', 'Enter', 'NumpadEnter', 'F11']) {
      expect(assign(DEFAULT_BINDINGS, 'pepper', 0, code)).toEqual({
        ok: false,
        reason: 'reserved'
      });
    }
  });

  it('refuses taking the only key of another action into an empty slot', () => {
    expect(assign(DEFAULT_BINDINGS, 'pause', 1, 'Space')).toEqual({ ok: false, reason: 'lastKey' });
    expect(assign(DEFAULT_BINDINGS, 'pepper', 1, 'KeyP')).toEqual({
      ok: false,
      reason: 'lastKey'
    });
  });

  it('keeps the bindings when the key is already there', () => {
    expect(assigned(assign(DEFAULT_BINDINGS, 'up', 1, 'KeyW'))).toBe(DEFAULT_BINDINGS);
  });
});

describe('clearSlot', () => {
  it('removes a second key but never the only one', () => {
    expect(clearSlot(DEFAULT_BINDINGS, 'up', 1).up).toEqual(['ArrowUp']);
    expect(clearSlot(DEFAULT_BINDINGS, 'pepper', 0)).toBe(DEFAULT_BINDINGS);
  });
});

describe('validateBindings', () => {
  it('accepts a complete set', () => {
    expect(validateBindings(DEFAULT_BINDINGS)).toEqual(DEFAULT_BINDINGS);
  });

  it('rejects the whole set on any problem', () => {
    const broken = (changes: Record<string, unknown>): unknown => ({
      ...DEFAULT_BINDINGS,
      ...changes
    });
    expect(validateBindings(broken({ pause: ['Space'] }))).toBeNull();
    expect(validateBindings(broken({ pepper: [] }))).toBeNull();
    expect(validateBindings(broken({ pepper: ['KeyX', 'KeyY', 'KeyZ'] }))).toBeNull();
    expect(validateBindings(broken({ pepper: ['Enter'] }))).toBeNull();
    expect(validateBindings(broken({ pepper: [42] }))).toBeNull();
    expect(validateBindings(broken({ mute: undefined }))).toBeNull();
    expect(validateBindings('nope')).toBeNull();
    expect(validateBindings(null)).toBeNull();
  });
});

describe('actionsForKey', () => {
  it('gives fixed keys their fixed meaning', () => {
    expect(actionsForKey(DEFAULT_BINDINGS, 'Escape')).toEqual(['back', 'pause']);
    expect(actionsForKey(DEFAULT_BINDINGS, 'Enter')).toEqual(['confirm']);
    expect(actionsForKey(DEFAULT_BINDINGS, 'NumpadEnter')).toEqual(['confirm']);
    expect(actionsForKey(DEFAULT_BINDINGS, 'KeyD')).toEqual(['right']);
    expect(actionsForKey(DEFAULT_BINDINGS, 'KeyQ')).toEqual([]);
  });
});

describe('keyLabel', () => {
  const name = (key: string): string => `<${key}>`;

  it('names keys by the layout when the browser provides it', () => {
    const azerty = new Map([
      ['KeyQ', 'a'],
      ['KeyW', 'z']
    ]);
    expect(keyLabel('KeyQ', azerty, name)).toBe('A');
    expect(keyLabel('KeyW', azerty, name)).toBe('Z');
  });

  it('falls back to the US layout, symbols and translated words', () => {
    expect(keyLabel('KeyW', null, name)).toBe('W');
    expect(keyLabel('Digit7', null, name)).toBe('7');
    expect(keyLabel('Numpad4', null, name)).toBe('NUM 4');
    expect(keyLabel('ArrowLeft', null, name)).toBe('←');
    expect(keyLabel('Space', null, name)).toBe('<space>');
    expect(keyLabel('ShiftRight', null, name)).toBe('<shift>');
    expect(keyLabel('Semicolon', null, name)).toBe('SEMICOLON');
    expect(keyLabel('Semicolon', new Map([['Semicolon', 'ñ']]), name)).toBe('Ñ');
  });
});
