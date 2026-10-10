import Phaser from 'phaser';
import type { RenderTier } from '../../config';
import type { ActionReader } from '../../input/actions';
import { hudText } from '../hud/textStyle';
import { SILENT_UI, type UiSounds } from './UiSounds';

/** One entry of a menu: an action, a value that can be changed, or both. */
export interface MenuItem {
  label(): string;
  value?(): string;
  select?(): void;
  change?(direction: 1 | -1): void;
}

export interface MenuListStyle {
  readonly x: number;
  readonly y: number;
  readonly spacing: number;
  readonly size: number;
  readonly color: string;
  readonly accent: string;
  readonly depth: number;
  readonly selected?: number;
}

const MARKER = '▶ ';

/** What drives a menu: the input it reads, its sounds and what going back does. */
export interface MenuControls {
  readonly tier: RenderTier;
  readonly input: ActionReader;
  readonly sounds?: UiSounds;
  readonly onBack?: () => void;
}

/**
 * A vertical menu driven by actions (up and down to move, confirm to choose, left and right to
 * change a value, back to go back) from any device, and by pointer (click or tap an entry).
 * Its scene calls `update` every frame.
 */
export class MenuList {
  readonly #items: readonly MenuItem[];
  readonly #style: MenuListStyle;
  readonly #input: ActionReader;
  readonly #sounds: UiSounds;
  readonly #onBack: (() => void) | undefined;
  readonly #texts: Phaser.GameObjects.Text[];
  #selected = 0;
  #enabled = true;

  constructor(
    scene: Phaser.Scene,
    items: readonly MenuItem[],
    style: MenuListStyle,
    controls: MenuControls
  ) {
    this.#items = items;
    this.#style = style;
    this.#input = controls.input;
    this.#sounds = controls.sounds ?? SILENT_UI;
    this.#onBack = controls.onBack;
    this.#selected = style.selected ?? 0;
    this.#texts = items.map((_item, index) => {
      const text = scene.add
        .text(
          style.x,
          style.y + index * style.spacing,
          '',
          hudText(style.size, style.color, controls.tier)
        )
        .setOrigin(0.5)
        .setDepth(style.depth)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.#select(index, true));
      text.on('pointerup', () => this.#activate(index));
      return text;
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.refresh();
  }

  /** Reads this frame's actions; call it once per frame from the scene's `update`. */
  update(): void {
    if (!this.#enabled || this.#texts.length === 0) return;
    const input = this.#input;
    const count = this.#items.length;
    if (input.repeated('up')) this.#select((this.#selected + count - 1) % count, true);
    else if (input.repeated('down')) this.#select((this.#selected + 1) % count, true);
    else if (input.repeated('left')) this.#change(-1);
    else if (input.repeated('right')) this.#change(1);
    else if (input.justPressed('confirm')) this.#activate(this.#selected);
    else if (input.justPressed('back') && this.#onBack) {
      this.#sounds.back();
      this.#onBack();
    }
  }

  selectIndex(index: number): void {
    this.#select(Math.max(0, Math.min(index, this.#items.length - 1)), true);
  }

  setEnabled(enabled: boolean): void {
    this.#enabled = enabled;
    for (const text of this.#texts) text.setVisible(enabled);
  }

  refresh(): void {
    if (this.#texts.length === 0) return;
    this.#items.forEach((item, index) => {
      const selected = index === this.#selected;
      const value = item.value ? `  ‹ ${item.value()} ›` : '';
      this.#texts[index]
        .setText(`${selected ? MARKER : ''}${item.label()}${value}`)
        .setColor(selected ? this.#style.accent : this.#style.color);
    });
  }

  destroy(): void {
    for (const text of this.#texts) text.destroy();
    this.#texts.length = 0;
  }

  #select(index: number, audible: boolean): void {
    if (index === this.#selected) return;
    this.#selected = index;
    if (audible) this.#sounds.move();
    this.refresh();
  }

  #change(direction: 1 | -1): void {
    const item = this.#items[this.#selected];
    if (!item?.change) return;
    this.#sounds.move();
    item.change(direction);
    this.refresh();
  }

  #activate(index: number): void {
    if (!this.#enabled || this.#texts.length === 0) return;
    this.#select(index, false);
    const item = this.#items[index];
    if (item?.select) {
      this.#sounds.select();
      item.select();
    } else if (item?.change) this.#change(1);
  }
}
