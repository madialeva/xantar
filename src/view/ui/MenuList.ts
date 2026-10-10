import Phaser from 'phaser';
import type { RenderTier } from '../../config';
import { hudText } from '../hud/textStyle';

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

/**
 * A vertical menu driven by keyboard (arrows or WASD to move, Enter or Space to choose,
 * left and right to change a value, Esc to go back) and by pointer (click or tap an entry).
 */
export class MenuList {
  readonly #scene: Phaser.Scene;
  readonly #items: readonly MenuItem[];
  readonly #style: MenuListStyle;
  readonly #onBack: (() => void) | undefined;
  readonly #texts: Phaser.GameObjects.Text[];
  #selected = 0;
  #enabled = true;

  constructor(
    scene: Phaser.Scene,
    items: readonly MenuItem[],
    style: MenuListStyle,
    tier: RenderTier,
    onBack?: () => void
  ) {
    this.#scene = scene;
    this.#items = items;
    this.#style = style;
    this.#onBack = onBack;
    this.#selected = style.selected ?? 0;
    this.#texts = items.map((_item, index) => {
      const text = scene.add
        .text(style.x, style.y + index * style.spacing, '', hudText(style.size, style.color, tier))
        .setOrigin(0.5)
        .setDepth(style.depth)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.#select(index));
      text.on('pointerup', () => this.#activate(index));
      return text;
    });
    scene.input.keyboard?.on('keydown', this.#onKey);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.refresh();
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
    this.#scene.input.keyboard?.off('keydown', this.#onKey);
    for (const text of this.#texts) text.destroy();
    this.#texts.length = 0;
  }

  readonly #onKey = (event: KeyboardEvent): void => {
    if (!this.#enabled || this.#texts.length === 0) return;
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.#select((this.#selected + this.#items.length - 1) % this.#items.length);
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.#select((this.#selected + 1) % this.#items.length);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.#change(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.#change(1);
        break;
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        this.#activate(this.#selected);
        break;
      case 'Escape':
        this.#onBack?.();
        break;
    }
  };

  #select(index: number): void {
    if (index === this.#selected) return;
    this.#selected = index;
    this.refresh();
  }

  #change(direction: 1 | -1): void {
    const item = this.#items[this.#selected];
    if (!item?.change) return;
    item.change(direction);
    this.refresh();
  }

  #activate(index: number): void {
    if (!this.#enabled) return;
    this.#select(index);
    const item = this.#items[index];
    if (item?.select) item.select();
    else if (item?.change) this.#change(1);
  }
}
