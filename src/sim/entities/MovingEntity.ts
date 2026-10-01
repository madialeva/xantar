export interface PositionSnapshot {
  readonly x: number;
  readonly y: number;
  readonly prevX: number;
  readonly prevY: number;
}

export abstract class MovingEntity implements PositionSnapshot {
  #x: number;
  #y: number;
  #prevX: number;
  #prevY: number;

  constructor(x: number, y: number) {
    this.#x = x;
    this.#y = y;
    this.#prevX = x;
    this.#prevY = y;
  }

  get x(): number {
    return this.#x;
  }

  get y(): number {
    return this.#y;
  }

  get prevX(): number {
    return this.#prevX;
  }

  get prevY(): number {
    return this.#prevY;
  }

  beginTick(): void {
    this.#prevX = this.#x;
    this.#prevY = this.#y;
  }

  teleportTo(x: number, y: number): void {
    this.#x = x;
    this.#y = y;
    this.#prevX = x;
    this.#prevY = y;
  }

  protected moveTo(x: number, y: number): void {
    this.#x = x;
    this.#y = y;
  }
}
