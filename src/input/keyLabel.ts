import type { KeyCode } from './bindings';

/** Keys whose label is a word, translated by the interface catalogs (`key.<name>`). */
export const KEY_NAMES = [
  'space',
  'shift',
  'control',
  'alt',
  'meta',
  'tab',
  'backspace',
  'capsLock',
  'delete',
  'insert',
  'home',
  'end',
  'pageUp',
  'pageDown'
] as const;

export type KeyName = (typeof KEY_NAMES)[number];

const NAMED: Readonly<Record<KeyCode, KeyName>> = {
  Space: 'space',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  ControlLeft: 'control',
  ControlRight: 'control',
  AltLeft: 'alt',
  AltRight: 'alt',
  MetaLeft: 'meta',
  MetaRight: 'meta',
  Tab: 'tab',
  Backspace: 'backspace',
  CapsLock: 'capsLock',
  Delete: 'delete',
  Insert: 'insert',
  Home: 'home',
  End: 'end',
  PageUp: 'pageUp',
  PageDown: 'pageDown'
};

const SYMBOLS: Readonly<Record<KeyCode, string>> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→'
};

/**
 * The label of a physical key: its character in the player's keyboard layout when the browser
 * provides it (`layout`), otherwise the character of a US layout; words come from `name`.
 */
export function keyLabel(
  code: KeyCode,
  layout: ReadonlyMap<string, string> | null,
  name: (key: KeyName) => string
): string {
  const named = NAMED[code];
  if (named) return name(named);
  const symbol = SYMBOLS[code];
  if (symbol) return symbol;
  const mapped = layout?.get(code);
  if (mapped && mapped.trim() !== '') return mapped.toUpperCase();
  const match = /^(?:Key|Digit)(.+)$/.exec(code) ?? /^Numpad(.+)$/.exec(code);
  if (match) return code.startsWith('Numpad') ? `NUM ${match[1].toUpperCase()}` : match[1];
  return code.toUpperCase();
}
