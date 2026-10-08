import type { AnimationState } from './AnimationState';
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
      motion.once('eyes', { dy: 3, scaleY: 0.2 }, { dy: 0, scaleY: 0.2 }, 420);
      motion.hold('armLeft', { angle: 120 });
      motion.hold('armRight', { angle: -120 });
    }
  }
};

export const enemyStates: Readonly<Record<EnemyAnimation, AnimationState>> = {
  walk: {
    enter(motion) {
      motion.swing('body', { scaleY: 1, scaleX: 1 }, { scaleY: 1.12, scaleX: 0.94 }, STEP_MS);
      motion.swing('eyes', { dy: 0 }, { dy: -1.5 }, STEP_MS);
      motion.swing('feet', { scaleX: 1 }, { scaleX: 0.8 }, STEP_MS);
    }
  },
  climb: {
    enter(motion) {
      motion.swing('body', { angle: -6 }, { angle: 6 }, CLIMB_MS);
      motion.swing('eyes', { dx: -1 }, { dx: 1 }, CLIMB_MS);
      motion.swing('feet', { dy: 0 }, { dy: -2 }, CLIMB_MS);
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
