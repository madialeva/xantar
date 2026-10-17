import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import type { CharacterRig } from './CharacterRig';
import { RigMotion } from './RigMotion';

interface TweenConfig {
  readonly targets: unknown;
  readonly frame?: number;
  readonly onUpdate?: () => void;
}

/** A rig with a body of `frames` frames that records which frame it was asked to show. */
function fakeRig(frames: number): { rig: CharacterRig; shown: number[] } {
  const shown: number[] = [];
  const rig = {
    frameCount: (name: string) => (name === 'body' ? frames : 0),
    showFrame: (_name: string, index: number) => shown.push(index),
    partImages: [],
    resetPose: () => undefined
  } as unknown as CharacterRig;
  return { rig, shown };
}

function fakeTweens(): {
  tweens: Phaser.Tweens.TweenManager;
  added: TweenConfig[];
  killed: unknown[];
} {
  const added: TweenConfig[] = [];
  const killed: unknown[] = [];
  const tweens = {
    add: (config: TweenConfig) => added.push(config),
    killTweensOf: (targets: unknown) => killed.push(targets)
  } as unknown as Phaser.Tweens.TweenManager;
  return { tweens, added, killed };
}

describe('RigMotion.cycle', () => {
  it('does nothing for a part without frames', () => {
    const { rig, shown } = fakeRig(0);
    const { tweens, added } = fakeTweens();
    new RigMotion(rig, tweens).cycle('body', 130);
    expect(added).toEqual([]);
    expect(shown).toEqual([]);
  });

  it('starts at the first frame and steps up to the last one, showing the nearest frame', () => {
    const { rig, shown } = fakeRig(5);
    const { tweens, added } = fakeTweens();
    new RigMotion(rig, tweens).cycle('body', 130);
    expect(shown).toEqual([0]);
    expect(added).toHaveLength(1);
    expect(added[0].frame).toBe(4);
    const counter = added[0].targets as { frame: number };
    counter.frame = 2.6;
    added[0].onUpdate?.();
    expect(shown).toEqual([0, 3]);
  });

  it('stops its frame tweens with the rest of the motion', () => {
    const { rig } = fakeRig(5);
    const { tweens, added, killed } = fakeTweens();
    const motion = new RigMotion(rig, tweens);
    motion.cycle('body', 130);
    const counter = added[0].targets;
    motion.stop();
    expect(killed).toContainEqual([counter]);
  });
});
