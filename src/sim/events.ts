export type SimEvent =
  | { readonly type: 'boardStarted' }
  | {
      readonly type: 'segmentStomped';
      readonly ingredientId: number;
      readonly segment: number;
    }
  | {
      readonly type: 'ingredientsTriggered';
      readonly ingredientIds: readonly number[];
    }
  | {
      readonly type: 'ingredientLanded';
      readonly ingredientId: number;
      readonly plateId: number | null;
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
  | { readonly type: 'burgerDone'; readonly plateId: number; readonly points: number }
  | { readonly type: 'chefHit'; readonly livesLeft: number }
  | { readonly type: 'scoreChanged'; readonly score: number; readonly delta: number }
  | { readonly type: 'levelCleared'; readonly level: number }
  | { readonly type: 'gameOver' };

export type SimEventType = SimEvent['type'];

/**
 * Where entities report what happened (see SimEvent) without knowing who listens.
 */
export interface EventSink {
  emit(event: SimEvent): void;
}

/**
 * Collects the events emitted during a tick so the simulation can hand them to the view.
 */
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
