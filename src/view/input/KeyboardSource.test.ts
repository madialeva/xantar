import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS, assign } from '../../input/bindings';
import { KeyboardSource } from './KeyboardSource';

class FakeDocument extends EventTarget {
  hidden = false;
}

interface KeyInit {
  readonly repeat?: boolean;
  readonly ctrlKey?: boolean;
}

const setup = (): {
  keyboard: KeyboardSource;
  press: (code: string, init?: KeyInit) => boolean;
  lift: (code: string) => void;
  host: EventTarget;
  page: FakeDocument;
} => {
  const host = new EventTarget();
  const page = new FakeDocument();
  const keyboard = new KeyboardSource(host, page, DEFAULT_BINDINGS);
  const key = (type: string, code: string, init: KeyInit = {}): boolean => {
    let prevented = false;
    const event = Object.assign(new Event(type), {
      code,
      repeat: init.repeat ?? false,
      ctrlKey: init.ctrlKey ?? false,
      metaKey: false,
      altKey: false
    });
    event.preventDefault = () => {
      prevented = true;
    };
    host.dispatchEvent(event);
    return prevented;
  };
  return {
    keyboard,
    press: (code, init) => key('keydown', code, init),
    lift: (code) => void key('keyup', code),
    host,
    page
  };
};

const held = (keyboard: KeyboardSource): string[] => [...keyboard.poll().held].sort();

describe('KeyboardSource', () => {
  it('reports a key tapped between two reads as held and pressed once', () => {
    const { keyboard, press, lift } = setup();
    press('ArrowDown');
    lift('ArrowDown');
    press('ArrowDown');
    lift('ArrowDown');
    const first = keyboard.poll();
    expect([...first.held]).toEqual(['down']);
    expect([...first.pressed]).toEqual(['down']);
    expect([...keyboard.poll().held]).toEqual([]);
  });

  it('does not count key repeats as presses', () => {
    const { keyboard, press } = setup();
    press('KeyW');
    keyboard.poll();
    press('KeyW', { repeat: true });
    const snapshot = keyboard.poll();
    expect([...snapshot.held]).toEqual(['up']);
    expect([...snapshot.pressed]).toEqual([]);
  });

  it('turns held keys into actions and lets them go on key up', () => {
    const { keyboard, press, lift } = setup();
    press('KeyD');
    press('Space');
    expect(held(keyboard)).toEqual(['confirm', 'pepper', 'right']);
    lift('KeyD');
    expect(held(keyboard)).toEqual(['confirm', 'pepper']);
  });

  it('only keeps the page from using the keys it understands', () => {
    const { press } = setup();
    expect(press('ArrowDown')).toBe(true);
    expect(press('KeyQ')).toBe(false);
    expect(press('KeyR', { ctrlKey: true })).toBe(false);
  });

  it('lets every key go when the window loses the focus or the page is hidden', () => {
    const { keyboard, press, host, page } = setup();
    press('ArrowRight');
    host.dispatchEvent(new Event('blur'));
    expect(held(keyboard)).toEqual([]);
    press('ArrowRight');
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    expect(held(keyboard)).toEqual([]);
  });

  it('follows new bindings', () => {
    const { keyboard, press } = setup();
    const result = assign(DEFAULT_BINDINGS, 'pepper', 0, 'KeyX');
    if (result.ok) keyboard.setBindings(result.bindings);
    press('KeyX');
    expect(held(keyboard)).toEqual(['confirm', 'pepper']);
  });

  it('captures the next key without turning it into an action', () => {
    const { keyboard, press } = setup();
    const captured: string[] = [];
    keyboard.capture((code) => captured.push(code));
    expect(press('KeyW')).toBe(true);
    expect(held(keyboard)).toEqual([]);
    press('KeyW');
    expect(captured).toEqual(['KeyW']);
    expect(held(keyboard)).toEqual(['up']);
  });

  it('ignores repeats and can be cancelled while capturing', () => {
    const { keyboard, press } = setup();
    const captured: string[] = [];
    const cancel = keyboard.capture((code) => captured.push(code));
    press('KeyZ', { repeat: true });
    cancel();
    press('KeyZ');
    expect(captured).toEqual([]);
  });
});
