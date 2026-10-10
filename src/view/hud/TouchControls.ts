import Phaser from 'phaser';
import type { Action } from '../../input/actions';
import { dpadDirection } from '../../input/dpad';
import type { TouchPad } from '../input/TouchPad';
import type { Layout, Rect } from '../layout/computeLayout';
import type { ArtFactory } from '../raster/ArtFactory';

const MARGIN = 8;
const PADDING = 10;
const MAX_SIZE = 160;
/** Share of the radius around the centre of the pad where a finger means no direction. */
const DEAD_ZONE = 0.22;
/** A touch a little outside a control still counts, as fingers are not precise. */
const REACH = 1.15;
const IDLE_ALPHA = 0.85;
const PRESSED_SCALE = 0.92;

type Control = 'dpad' | 'button';

/** A control drawn in a panel: its image, centre and radius in world units. */
interface Placed {
  readonly image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  radius: number;
}

/**
 * The on-screen controls for touch screens: a four-way pad at the bottom of the left panel and
 * a pepper button at the bottom of the right one. Every finger is followed on its own (it can
 * slide across the pad) and written to the shared TouchPad that the game reads.
 */
export class TouchControls {
  readonly #scene: Phaser.Scene;
  readonly #pad: TouchPad;
  readonly #dpad: Placed;
  readonly #button: Placed;
  readonly #fingers = new Map<number, Control>();

  constructor(scene: Phaser.Scene, art: ArtFactory, pad: TouchPad) {
    this.#scene = scene;
    this.#pad = pad;
    const place = (graphic: 'hud.dpad' | 'hud.pepperButton'): Placed => ({
      image: art.image(graphic).setAlpha(IDLE_ALPHA).setVisible(false),
      x: 0,
      y: 0,
      radius: 0
    });
    this.#dpad = place('hud.dpad');
    this.#button = place('hud.pepperButton');
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.#onDown);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.#onMove);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.#onUp);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.#onUp);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  get visible(): boolean {
    return this.#dpad.image.visible;
  }

  setVisible(visible: boolean): this {
    this.#dpad.image.setVisible(visible);
    this.#button.image.setVisible(visible);
    if (!visible) this.#liftAll();
    return this;
  }

  setDepth(depth: number): this {
    this.#dpad.image.setDepth(depth);
    this.#button.image.setDepth(depth);
    return this;
  }

  /** Puts the controls at the bottom of the side panels, as large as the panels allow. */
  layout({ leftPanel, rightPanel }: Layout): void {
    const fit = (panel: Rect, control: Placed): void => {
      const width = panel.width - 2 * MARGIN;
      const size = Math.min(width - MARGIN, MAX_SIZE);
      control.radius = size / 2;
      control.x = panel.x + panel.width / 2;
      control.y = panel.y + panel.height - MARGIN - PADDING - control.radius;
      control.image.setDisplaySize(size, size).setPosition(control.x, control.y);
    };
    fit(leftPanel, this.#dpad);
    fit(rightPanel, this.#button);
  }

  destroy(): void {
    const { input } = this.#scene;
    input.off(Phaser.Input.Events.POINTER_DOWN, this.#onDown);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.#onMove);
    input.off(Phaser.Input.Events.POINTER_UP, this.#onUp);
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.#onUp);
    this.#liftAll();
  }

  readonly #onDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.visible) return;
    const { x, y } = this.#world(pointer);
    if (this.#reaches(this.#dpad, x, y)) {
      this.#fingers.set(pointer.id, 'dpad');
      this.#steer(pointer.id, x, y);
    } else if (this.#reaches(this.#button, x, y)) {
      this.#fingers.set(pointer.id, 'button');
      this.#pad.press(pointer.id, ['pepper', 'confirm']);
    }
    this.#show();
  };

  readonly #onMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.#fingers.get(pointer.id) !== 'dpad') return;
    const { x, y } = this.#world(pointer);
    this.#steer(pointer.id, x, y);
    this.#show();
  };

  readonly #onUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.#fingers.delete(pointer.id)) return;
    this.#pad.lift(pointer.id);
    this.#show();
  };

  #steer(finger: number, x: number, y: number): void {
    const dpad = this.#dpad;
    const direction = dpadDirection(x - dpad.x, y - dpad.y, dpad.radius * DEAD_ZONE);
    const actions: readonly Action[] = direction ? [direction] : [];
    this.#pad.press(finger, actions);
  }

  #reaches(control: Placed, x: number, y: number): boolean {
    return Math.hypot(x - control.x, y - control.y) <= control.radius * REACH;
  }

  #world(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.#scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  /** Lights a control while a finger holds it. */
  #show(): void {
    const held = (control: Control): boolean =>
      [...this.#fingers].some(([finger, kind]) => kind === control && this.#pad.holds(finger));
    const light = (control: Placed, on: boolean): void => {
      const size = control.radius * 2 * (on ? PRESSED_SCALE : 1);
      control.image.setAlpha(on ? 1 : IDLE_ALPHA).setDisplaySize(size, size);
    };
    light(this.#dpad, held('dpad'));
    light(this.#button, held('button'));
  }

  #liftAll(): void {
    for (const finger of this.#fingers.keys()) this.#pad.lift(finger);
    this.#fingers.clear();
  }
}
