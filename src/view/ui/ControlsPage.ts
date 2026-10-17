import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, type RenderTier } from '../../config';
import type { Localization } from '../../i18n/Localization';
import { type ActionReader, REMAPPABLE_ACTIONS, type RemappableAction } from '../../input/actions';
import {
  DEFAULT_BINDINGS,
  type KeyBindings,
  type KeyCode,
  MAX_KEYS_PER_ACTION,
  assign,
  clearSlot
} from '../../input/bindings';
import { keyLabel } from '../../input/keyLabel';
import type { Settings } from '../../settings/Settings';
import { hudText } from '../hud/textStyle';
import type { Palette } from '../art/palette';
import { SILENT_UI, type UiSounds } from './UiSounds';

/** The part of the keyboard the page needs: capturing the next key. */
export interface KeyCapture {
  capture(listener: (code: KeyCode) => void): () => void;
}

export interface ControlsPageDependencies {
  readonly tier: RenderTier;
  readonly input: ActionReader;
  readonly keyboard: KeyCapture;
  readonly settings: Settings;
  readonly localization: Localization;
  readonly palette: Palette;
  /** The player's keyboard layout, when the browser gives it. */
  readonly keyLayout: () => ReadonlyMap<string, string> | null;
  readonly sounds?: UiSounds;
  readonly onBack: () => void;
}

/** One line of the page: an action with its two key slots, or a command. */
type Row =
  | { readonly kind: 'action'; readonly action: RemappableAction }
  | { readonly kind: 'reset' }
  | { readonly kind: 'back' };

const ROWS: readonly Row[] = [
  ...REMAPPABLE_ACTIONS.map((action): Row => ({ kind: 'action', action })),
  { kind: 'reset' },
  { kind: 'back' }
];

const LAYOUT = {
  titleY: 62,
  top: 122,
  spacing: 30,
  size: 18,
  labelX: GAME_WIDTH / 2 - 40,
  slotX: [GAME_WIDTH / 2 + 50, GAME_WIDTH / 2 + 170],
  noticeY: GAME_HEIGHT - 72,
  hintY: GAME_HEIGHT - 40
} as const;

const BACKSPACE = 'Backspace';

/**
 * The Controls page of the options: shows the keys of each remappable action and changes one
 * by capturing the next key pressed. Reads the same actions as the menus (any device) and
 * the pointer; its scene calls `update` every frame.
 */
export class ControlsPage {
  readonly #deps: ControlsPageDependencies;
  readonly #sounds: UiSounds;
  readonly #objects: Phaser.GameObjects.Text[] = [];
  readonly #labels: Phaser.GameObjects.Text[] = [];
  readonly #slots: Phaser.GameObjects.Text[][] = [];
  readonly #notice: Phaser.GameObjects.Text;
  readonly #hint: Phaser.GameObjects.Text;
  #row = 0;
  #slot = 0;
  #cancelCapture: (() => void) | null = null;
  #message = '';

  constructor(scene: Phaser.Scene, deps: ControlsPageDependencies) {
    this.#deps = deps;
    this.#sounds = deps.sounds ?? SILENT_UI;
    const { tier, palette, localization } = deps;
    const text = (x: number, y: number, size: number, color: string): Phaser.GameObjects.Text => {
      const object = scene.add.text(x, y, '', hudText(size, color, tier)).setDepth(1);
      this.#objects.push(object);
      return object;
    };
    text(GAME_WIDTH / 2, LAYOUT.titleY, 36, palette.hudAccent)
      .setOrigin(0.5)
      .setText(localization.t('controls.title'));
    ROWS.forEach((row, index) => {
      const y = LAYOUT.top + index * LAYOUT.spacing;
      const isAction = row.kind === 'action';
      const label = text(isAction ? LAYOUT.labelX : GAME_WIDTH / 2, y, LAYOUT.size, palette.hudText)
        .setOrigin(isAction ? 1 : 0.5, 0.5)
        .setInteractive({ useHandCursor: true });
      label.on('pointerover', () => this.#focus(index, this.#slot));
      label.on('pointerup', () => this.#activate(index, isAction ? 0 : this.#slot));
      this.#labels.push(label);
      this.#slots.push(
        isAction
          ? LAYOUT.slotX.map((x, slot) => {
              const cell = text(x, y, LAYOUT.size, palette.hudText)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
              cell.on('pointerover', () => this.#focus(index, slot));
              cell.on('pointerup', () => this.#activate(index, slot));
              return cell;
            })
          : []
      );
    });
    this.#notice = text(GAME_WIDTH / 2, LAYOUT.noticeY, 14, palette.danger).setOrigin(0.5);
    this.#hint = text(GAME_WIDTH / 2, LAYOUT.hintY, 12, palette.hudText).setOrigin(0.5);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.#refresh();
  }

  /** Reads this frame's actions; call it once per frame from the scene's `update`. */
  update(): void {
    const { input } = this.#deps;
    if (this.#cancelCapture) {
      if (input.justPressed('back')) this.#stopCapture();
      return;
    }
    const count = ROWS.length;
    if (input.repeated('up')) this.#focus((this.#row + count - 1) % count, this.#slot);
    else if (input.repeated('down')) this.#focus((this.#row + 1) % count, this.#slot);
    else if (input.repeated('left')) this.#focus(this.#row, 0);
    else if (input.repeated('right')) this.#focus(this.#row, 1);
    else if (input.justPressed('confirm')) this.#activate(this.#row, this.#slot);
    else if (input.justPressed('back')) {
      this.#sounds.back();
      this.#deps.onBack();
    }
  }

  destroy(): void {
    this.#stopCapture();
    for (const object of this.#objects) object.destroy();
    this.#objects.length = 0;
  }

  #focus(row: number, slot: number): void {
    if (this.#cancelCapture || (row === this.#row && slot === this.#slot)) return;
    this.#row = row;
    this.#slot = slot;
    this.#message = '';
    this.#sounds.move();
    this.#refresh();
  }

  #activate(index: number, slot: number): void {
    if (this.#objects.length === 0) return;
    const row = ROWS[index];
    this.#row = index;
    this.#slot = slot;
    this.#message = '';
    this.#sounds.select();
    switch (row.kind) {
      case 'action':
        this.#startCapture(row.action);
        break;
      case 'reset':
        this.#deps.settings.setKeyBindings(DEFAULT_BINDINGS);
        this.#message = this.#deps.localization.t('controls.restored');
        break;
      case 'back':
        this.#deps.onBack();
        return;
    }
    this.#refresh();
  }

  #startCapture(action: RemappableAction): void {
    this.#stopCapture();
    const listen = (): void => {
      this.#cancelCapture = this.#deps.keyboard.capture((code) => {
        this.#cancelCapture = null;
        if (code === 'Escape') {
          this.#refresh();
          return;
        }
        if (this.#apply(action, code)) {
          this.#refresh();
          return;
        }
        listen();
        this.#refresh();
      });
    };
    listen();
  }

  /** Tries the captured key; tells whether the capture is over. */
  #apply(action: RemappableAction, code: KeyCode): boolean {
    const { settings, localization } = this.#deps;
    const bindings: KeyBindings = settings.keyBindings;
    if (code === BACKSPACE) {
      settings.setKeyBindings(clearSlot(bindings, action, this.#slot));
      return true;
    }
    const result = assign(bindings, action, this.#slot, code);
    if (result.ok) {
      settings.setKeyBindings(result.bindings);
      this.#message = '';
      return true;
    }
    if (result.reason === 'reserved') {
      this.#message = localization.t('controls.reserved');
    } else {
      const other = REMAPPABLE_ACTIONS.find((candidate) => bindings[candidate].includes(code));
      this.#message = localization.t('controls.lastKey', {
        action: other ? localization.t(`action.${other}`) : code
      });
    }
    return false;
  }

  #stopCapture(): void {
    this.#cancelCapture?.();
    this.#cancelCapture = null;
  }

  #refresh(): void {
    if (this.#objects.length === 0) return;
    const { palette, localization, settings, keyLayout } = this.#deps;
    const capturing = this.#cancelCapture !== null;
    const name = (code: KeyCode): string =>
      keyLabel(code, keyLayout(), (key) => localization.t(`key.${key}`));
    ROWS.forEach((row, index) => {
      const focused = index === this.#row;
      const marker = focused && row.kind !== 'action' ? '▶ ' : '';
      const label =
        row.kind === 'action'
          ? localization.t(`action.${row.action}`)
          : localization.t(row.kind === 'reset' ? 'controls.reset' : 'controls.back');
      this.#labels[index]
        .setText(`${marker}${label}`)
        .setColor(focused ? palette.hudAccent : palette.hudText);
      if (row.kind !== 'action') return;
      const keys = settings.keyBindings[row.action];
      this.#slots[index].forEach((cell, slot) => {
        const selected = focused && slot === this.#slot;
        const key = slot < MAX_KEYS_PER_ACTION ? keys[slot] : undefined;
        const value = selected && capturing ? '…' : key ? name(key) : '—';
        cell
          .setText(selected ? `[ ${value} ]` : value)
          .setColor(selected ? palette.hudAccent : palette.hudText);
      });
    });
    this.#notice.setText(this.#message);
    this.#hint.setText(localization.t(capturing ? 'controls.waiting' : 'controls.hint'));
  }
}
