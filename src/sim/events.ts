export type SimEvent =
  | { readonly type: 'boardStarted' }
  | {
      readonly type: 'ingredientsTriggered';
      readonly burgerId: number;
      readonly ingredientIds: readonly number[];
    }
  | {
      readonly type: 'ingredientLanded';
      readonly burgerId: number;
      readonly ingredientId: number;
      readonly stackSlot: number | null;
    }
  | {
      readonly type: 'enemySquashed';
      readonly enemyId: number;
      readonly x: number;
      readonly y: number;
      readonly points: number;
      readonly combo: number;
    }
  | {
      readonly type: 'enemyRespawned';
      readonly enemyId: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: 'enemyStunned';
      readonly enemyId: number;
    }
  | {
      readonly type: 'pepperThrown';
      readonly x: number;
      readonly y: number;
      readonly direction: 1 | -1;
    }
  | { readonly type: 'burgerDone'; readonly burgerId: number; readonly points: number }
  | { readonly type: 'chefHit'; readonly livesLeft: number }
  | { readonly type: 'scoreChanged'; readonly score: number; readonly delta: number }
  | { readonly type: 'levelCleared'; readonly level: number }
  | { readonly type: 'gameOver' };

export type SimEventType = SimEvent['type'];

export interface EventSink {
  emit(event: SimEvent): void;
}

export class EventQueue implements EventSink {
  #events: SimEvent[] = [];

  emit(event: SimEvent): void {
    this.#events.push(event);
  }

  drain(): readonly SimEvent[] {
    const drained = this.#events;
    this.#events = [];
    return drained;
  }
}
