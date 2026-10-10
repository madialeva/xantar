type Listener = () => void;

/**
 * Whether the player has used the touch screen in this session (Observer): the touch controls
 * appear from the first touch on and stay.
 */
export class InputModality {
  readonly #listeners = new Set<Listener>();
  #touch = false;

  constructor(host: EventTarget) {
    const onPointer = (event: Event): void => {
      if ((event as PointerEvent).pointerType !== 'touch' || this.#touch) return;
      this.#touch = true;
      host.removeEventListener('pointerdown', onPointer, true);
      for (const listener of [...this.#listeners]) listener();
    };
    host.addEventListener('pointerdown', onPointer, true);
  }

  get touch(): boolean {
    return this.#touch;
  }

  onTouch(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
