import type { EnemyKind } from '../../sim';
import type { AnimationState } from './AnimationState';
import type { RigMotion } from './RigMotion';
import type { ChefAnimation, EnemyAnimation } from './chooseAnimation';

const STEP_MS = 130;
const CLIMB_MS = 150;

export const chefStates: Readonly<Record<ChefAnimation, AnimationState>> = {
  idle: {
    enter(motion) {
      motion.swing('body', { scaleY: 1 }, { scaleY: 1.05 }, 700);
      motion.swing('head', { dy: 0 }, { dy: -0.6 }, 700);
      motion.swing('eyes', { dy: 0 }, { dy: -0.6 }, 700);
      motion.swing('hat', { dy: 0 }, { dy: -0.8 }, 700);
      motion.swing('ponytail', { dy: 0, angle: 0 }, { dy: -0.6, angle: 4 }, 700);
    }
  },
  walk: {
    enter(motion) {
      motion.swing('legLeft', { angle: 28 }, { angle: -28 }, STEP_MS);
      motion.swing('legRight', { angle: -28 }, { angle: 28 }, STEP_MS);
      motion.swing('armLeft', { angle: -30 }, { angle: 30 }, STEP_MS);
      motion.swing('armRight', { angle: 30 }, { angle: -30 }, STEP_MS);
      for (const part of ['body', 'head', 'eyes', 'hat']) {
        motion.swing(part, { dy: 0 }, { dy: -1.5 }, STEP_MS / 2);
      }
      motion.swing('ponytail', { angle: 16 }, { angle: -6 }, STEP_MS);
    }
  },
  climbIdle: {
    enter(motion) {
      motion.hold('armLeft', { angle: 165, dy: 2 });
      motion.hold('armRight', { angle: -165, dy: 2 });
      motion.hold('eyes', { dx: -1 });
    }
  },
  climb: {
    enter(motion) {
      motion.swing('armLeft', { angle: 150, dy: 3 }, { angle: 180, dy: 0 }, CLIMB_MS);
      motion.swing('armRight', { angle: -180, dy: 0 }, { angle: -150, dy: 3 }, CLIMB_MS);
      motion.swing('legLeft', { dy: 0 }, { dy: -2 }, CLIMB_MS);
      motion.swing('legRight', { dy: -2 }, { dy: 0 }, CLIMB_MS);
      motion.hold('eyes', { dx: -1 });
    }
  },
  hit: {
    enter(motion) {
      motion.once('body', { scaleX: 1.35, scaleY: 0.55 }, { scaleX: 1, scaleY: 1 }, 420);
      motion.once('hat', { dy: 0, angle: 0 }, { dy: -7, angle: 35 }, 300, 'Quad.easeOut');
      motion.once('head', { dy: 3 }, { dy: 0 }, 420);
      motion.once('ponytail', { dy: 3, angle: 50 }, { dy: 0, angle: 20 }, 420);
      motion.once('eyes', { dy: 3, scaleY: 0.2 }, { dy: 0, scaleY: 0.2 }, 420);
      motion.hold('armLeft', { angle: 120 });
      motion.hold('armRight', { angle: -120 });
    }
  }
};

/** How far the eyes follow a dancing body between its first and last frames. */
const BEND_EYES_DX = 3;
const WIGGLE_EYES_DX = 2.2;

const stepLegs = (motion: RigMotion): void => {
  motion.swing('legLeft', { angle: 28 }, { angle: -28 }, STEP_MS);
  motion.swing('legRight', { angle: -28 }, { angle: 28 }, STEP_MS);
};

const enemyWalk: AnimationState = {
  enter(motion) {
    stepLegs(motion);
    motion.swing('body', { scaleY: 1, scaleX: 1 }, { scaleY: 1.04, scaleX: 0.97 }, STEP_MS / 2);
    motion.swing('eyes', { dy: 0 }, { dy: -1.2 }, STEP_MS / 2);
  }
};

const commonEnemyStates: Readonly<Record<EnemyAnimation, AnimationState>> = {
  walk: enemyWalk,
  climb: {
    enter(motion) {
      motion.swing('body', { angle: -4 }, { angle: 4 }, CLIMB_MS);
      motion.swing('eyes', { dx: -1 }, { dx: 1 }, CLIMB_MS);
      motion.swing('legLeft', { dy: 0 }, { dy: -2 }, CLIMB_MS);
      motion.swing('legRight', { dy: -2 }, { dy: 0 }, CLIMB_MS);
    }
  },
  stunned: {
    enter(motion) {
      motion.swing('body', { angle: -12 }, { angle: 12 }, 90);
      motion.swing('eyes', { angle: -40, scaleY: 0.6 }, { angle: 40, scaleY: 0.6 }, 140);
    }
  },
  inactive: {
    enter() {
      // Nothing to animate: the view hides the enemy.
    }
  }
};

/**
 * The animations of each enemy kind. Each one dances its own way as it walks, stepping its
 * body through its frames in time with its legs: the hot dog bends one way and the other,
 * the pickle wiggles in an S and the egg's white wobbles like jelly as it bounces.
 */
export const enemyStates: Readonly<
  Record<EnemyKind, Readonly<Record<EnemyAnimation, AnimationState>>>
> = {
  hotdog: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        enemyWalk.enter(motion);
        motion.cycle('body', STEP_MS);
        motion.swing('eyes', { dx: -BEND_EYES_DX }, { dx: BEND_EYES_DX }, STEP_MS);
      }
    }
  },
  egg: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        stepLegs(motion);
        motion.cycle('body', STEP_MS);
        motion.swing(
          'body',
          { scaleY: 0.93, scaleX: 1.05 },
          { scaleY: 1.06, scaleX: 0.96 },
          STEP_MS / 2
        );
        motion.swing('eyes', { dy: 1.2 }, { dy: -1 }, STEP_MS / 2);
      }
    }
  },
  pickle: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        enemyWalk.enter(motion);
        motion.cycle('body', STEP_MS);
        motion.swing('eyes', { dx: WIGGLE_EYES_DX }, { dx: -WIGGLE_EYES_DX }, STEP_MS);
      }
    }
  }
};
