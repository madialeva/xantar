import type { EnemyKind } from '../../sim';
import type { AnimationState } from './AnimationState';
import type { PoseOffset } from './CharacterRig';
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
/** How far the chorizo's tied tip leans each way, and how far behind the bend it lags. */
const KNOT_DEGREES = 14;
const KNOT_LAG_MS = STEP_MS / 4;
/**
 * The corn's hula: how far its body sways about its base each step, how far its eyes and its
 * silk, 16 and 22 above the base, move with the top of the body, how far the husk and the silk
 * swing the other way, and how far behind the body they lag.
 */
const HULA_DEGREES = 7;
const HULA_EYES_DX = 2;
const HULA_SILK_DX = 2.7;
const HULA_SILK_DEGREES = 9;
const HULA_HUSK_FRONT_DEGREES = 11;
const HULA_HUSK_BACK_DEGREES = 8;
const HULA_LAG_MS = STEP_MS / 4;
/**
 * How far the onion's eyes drop on each frame of its half turn (0°, 30°… 150°), riding the top
 * edge of the slice: its radius (12) less the height of the turned edge, 12·|cos a| + 2.5·|sin a|.
 */
/** Half a turn of the onion's slice for each stride (two steps), slow enough to follow. */
const ONION_TURN_MS = 2 * STEP_MS;
const ONION_EYES_DROP: readonly PoseOffset[] = [0, 0.36, 3.83, 9.5, 3.83, 0.36].map((dy) => ({
  dy
}));

const stepLegs = (motion: RigMotion): void => {
  motion.swing('legLeft', { angle: 28 }, { angle: -28 }, STEP_MS);
  motion.swing('legRight', { angle: -28 }, { angle: 28 }, STEP_MS);
};

const climbLegs = (motion: RigMotion): void => {
  motion.swing('legLeft', { dy: 0 }, { dy: -2 }, CLIMB_MS);
  motion.swing('legRight', { dy: -2 }, { dy: 0 }, CLIMB_MS);
};

/**
 * The onion's slice turns like a coin, half a turn every `ms`, and its eyes ride its top edge:
 * down to the middle when the slice is edge-on and up again.
 */
const turnSlice = (motion: RigMotion, ms: number): void => {
  motion.loop('body', ms, [{ part: 'eyes', poses: ONION_EYES_DROP }]);
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
      climbLegs(motion);
    }
  },
  stunned: {
    enter(motion) {
      motion.swing('body', { angle: -12 }, { angle: 12 }, 90);
      motion.swing('eyes', { angle: -40, scaleY: 0.6 }, { angle: 40, scaleY: 0.6 }, 140);
    }
  },
  ride: {
    enter() {
      // Nothing to animate: it goes down standing still on the ingredient, in its base pose.
    }
  },
  inactive: {
    enter() {
      // Nothing to animate: the view hides the enemy.
    }
  }
};

/**
 * The animations of each enemy kind. Each one dances its own way as it walks, in time with its
 * legs: the chorizo bends one way and the other through its frames, its tied tip swinging behind;
 * the onion's slice turns like a coin, half a turn a stride, and keeps turning, half as fast, on a
 * ladder; and the corn sways its hips, its husk and its silk swinging the other way.
 */
export const enemyStates: Readonly<
  Record<EnemyKind, Readonly<Record<EnemyAnimation, AnimationState>>>
> = {
  chorizo: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        enemyWalk.enter(motion);
        motion.cycle('body', STEP_MS);
        motion.swing('eyes', { dx: -BEND_EYES_DX }, { dx: BEND_EYES_DX }, STEP_MS);
        motion.swing('knot', { dy: 0 }, { dy: -1.2 }, STEP_MS / 2);
        motion.swing(
          'knot',
          { angle: KNOT_DEGREES },
          { angle: -KNOT_DEGREES },
          STEP_MS,
          KNOT_LAG_MS
        );
      }
    }
  },
  onion: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        stepLegs(motion);
        turnSlice(motion, ONION_TURN_MS);
      }
    },
    climb: {
      enter(motion) {
        climbLegs(motion);
        turnSlice(motion, 2 * ONION_TURN_MS);
      }
    }
  },
  corn: {
    ...commonEnemyStates,
    walk: {
      enter(motion) {
        stepLegs(motion);
        motion.swing('body', { angle: -HULA_DEGREES }, { angle: HULA_DEGREES }, STEP_MS);
        motion.swing(
          'eyes',
          { dx: -HULA_EYES_DX, angle: -HULA_DEGREES },
          { dx: HULA_EYES_DX, angle: HULA_DEGREES },
          STEP_MS
        );
        motion.swing('silk', { dx: -HULA_SILK_DX }, { dx: HULA_SILK_DX }, STEP_MS);
        motion.swing(
          'silk',
          { angle: HULA_SILK_DEGREES },
          { angle: -HULA_SILK_DEGREES },
          STEP_MS,
          HULA_LAG_MS
        );
        motion.swing(
          'huskFront',
          { angle: HULA_HUSK_FRONT_DEGREES },
          { angle: -HULA_HUSK_FRONT_DEGREES },
          STEP_MS,
          HULA_LAG_MS
        );
        motion.swing(
          'huskBack',
          { angle: HULA_HUSK_BACK_DEGREES },
          { angle: -HULA_HUSK_BACK_DEGREES },
          STEP_MS,
          HULA_LAG_MS
        );
      }
    }
  }
};
