import { type Action, REMAPPABLE_ACTIONS, type RemappableAction } from './actions';

/** A physical key, as `KeyboardEvent.code` names it (`KeyW`, `Space`, `ArrowUp`…). */
export type KeyCode = string;

/** The keys of every remappable action: one or two each, never shared between actions. */
export type KeyBindings = Readonly<Record<RemappableAction, readonly KeyCode[]>>;

export const MAX_KEYS_PER_ACTION = 2;

/** Keys with a fixed meaning that cannot be assigned: back and pause, confirm, fullscreen. */
export const RESERVED_KEYS: readonly KeyCode[] = ['Escape', 'Enter', 'NumpadEnter', 'F11'];

const FIXED_KEYS: Readonly<Record<KeyCode, readonly Action[]>> = {
  Escape: ['back', 'pause'],
  Enter: ['confirm'],
  NumpadEnter: ['confirm']
};

export const DEFAULT_BINDINGS: KeyBindings = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  pepper: ['Space'],
  pause: ['KeyP'],
  mute: ['KeyM']
};

const KEY_CODE = /^[A-Za-z][A-Za-z0-9]*$/;

export const isAssignable = (code: KeyCode): boolean =>
  KEY_CODE.test(code) && !RESERVED_KEYS.includes(code);

/** Why a key could not be assigned. */
export type AssignRefusal = 'reserved' | 'lastKey';

export type AssignResult =
  | { readonly ok: true; readonly bindings: KeyBindings }
  | { readonly ok: false; readonly reason: AssignRefusal };

const owner = (
  bindings: KeyBindings,
  code: KeyCode
): { action: RemappableAction; slot: number } | null => {
  for (const action of REMAPPABLE_ACTIONS) {
    const slot = bindings[action].indexOf(code);
    if (slot >= 0) return { action, slot };
  }
  return null;
};

const withKey = (keys: readonly KeyCode[], slot: number, code: KeyCode | undefined): KeyCode[] => {
  const next = [...keys];
  if (code === undefined) next.splice(slot, 1);
  else next[slot] = code;
  return next;
};

/**
 * Puts `code` in a slot of an action. A key already used elsewhere is swapped with the key that
 * was in the slot, so no action is left without a key; a reserved key is refused, and so is
 * taking the only key of another action into an empty slot.
 */
export function assign(
  bindings: KeyBindings,
  action: RemappableAction,
  slot: number,
  code: KeyCode
): AssignResult {
  if (!isAssignable(code)) return { ok: false, reason: 'reserved' };
  const keys = bindings[action];
  const target = Math.max(0, Math.min(slot, keys.length, MAX_KEYS_PER_ACTION - 1));
  const previous = keys[target];
  if (previous === code) return { ok: true, bindings };
  const current = owner(bindings, code);
  if (current === null) {
    return { ok: true, bindings: { ...bindings, [action]: withKey(keys, target, code) } };
  }
  if (current.action === action) {
    const swapped = withKey(withKey(keys, current.slot, previous), target, code);
    return { ok: true, bindings: { ...bindings, [action]: swapped.filter(Boolean) } };
  }
  const otherKeys = withKey(bindings[current.action], current.slot, previous);
  if (otherKeys.length === 0) return { ok: false, reason: 'lastKey' };
  return {
    ok: true,
    bindings: { ...bindings, [action]: withKey(keys, target, code), [current.action]: otherKeys }
  };
}

/** Removes the key in a slot, unless it is the only key of the action. */
export function clearSlot(
  bindings: KeyBindings,
  action: RemappableAction,
  slot: number
): KeyBindings {
  const keys = bindings[action];
  if (keys.length <= 1 || slot < 0 || slot >= keys.length) return bindings;
  return { ...bindings, [action]: withKey(keys, slot, undefined) };
}

/**
 * Reads stored bindings as a whole: every remappable action with one or two assignable keys
 * and no key shared. Anything else is `null`, so the caller falls back to the defaults.
 */
export function validateBindings(raw: unknown): KeyBindings | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const seen = new Set<KeyCode>();
  const bindings: Partial<Record<RemappableAction, readonly KeyCode[]>> = {};
  for (const action of REMAPPABLE_ACTIONS) {
    const keys = record[action];
    if (!Array.isArray(keys) || keys.length < 1 || keys.length > MAX_KEYS_PER_ACTION) return null;
    for (const key of keys) {
      if (typeof key !== 'string' || !isAssignable(key) || seen.has(key)) return null;
      seen.add(key);
    }
    bindings[action] = [...(keys as KeyCode[])];
  }
  return bindings as KeyBindings;
}

/** The actions a key triggers: its fixed meaning, or its action (the pepper also confirms). */
export function actionsForKey(bindings: KeyBindings, code: KeyCode): readonly Action[] {
  const fixed = FIXED_KEYS[code];
  if (fixed) return fixed;
  const bound = owner(bindings, code);
  if (bound === null) return [];
  return bound.action === 'pepper' ? ['pepper', 'confirm'] : [bound.action];
}
