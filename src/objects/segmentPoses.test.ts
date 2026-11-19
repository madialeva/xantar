import { describe, expect, it } from 'vitest';
import { TILE } from '../config';
import { ARCH_DEPTH, STOMP_STEP, type SegmentPose, segmentPoses } from './segmentPoses';

const level = (width: number): readonly number[] => Array.from({ length: width }, () => 0);

/** The heights of the left and right edges of a segment, below its resting place. */
const edges = ({ offset, angle }: SegmentPose): readonly [number, number] => {
  const half = (Math.tan(angle) * TILE) / 2;
  return [offset - half, offset + half];
};

describe('segmentPoses', () => {
  it('draws a resting or falling ingredient level, untilted and one cell wide', () => {
    for (const pose of segmentPoses({ sink: level(4), width: 4 }, false)) {
      expect(pose).toEqual({ offset: 0, angle: 0, widthScale: 1 });
    }
  });

  it('turns the stomped steps into an incline whose segments meet at their edges', () => {
    const poses = segmentPoses({ sink: [3, 2, 1, 0], width: 4 }, false);
    const joints = poses.map(edges);
    expect(joints[0]?.[0]).toBeCloseTo(3 * STOMP_STEP, 10);
    for (let index = 1; index < joints.length; index++) {
      expect(joints[index]?.[0]).toBeCloseTo(joints[index - 1]?.[1] ?? Number.NaN, 10);
    }
    expect(joints[3]?.[1]).toBeCloseTo(0, 10);
    expect(poses.map(({ offset }) => offset)).toEqual(
      [2.75, 2, 1, 0.25].map((s) => s * STOMP_STEP)
    );
  });

  it('tilts the stomped segments up towards the side the chef is heading to', () => {
    const angles = segmentPoses({ sink: [0, 1, 2, 3], width: 4 }, false).map((pose) => pose.angle);
    expect(angles.every((angle) => angle > 0)).toBe(true);
  });

  it('draws tilted segments a little wider, so that their joints overlap', () => {
    const poses = segmentPoses({ sink: [2, 1, 0, 0], width: 4 }, false);
    expect(poses.map((pose) => pose.widthScale > 1)).toEqual([true, true, true, false]);
  });

  it('lowers the two end segments when it arches', () => {
    const poses = segmentPoses({ sink: level(4), width: 4 }, true);
    expect(edges(poses[0] as SegmentPose)[0]).toBeCloseTo(ARCH_DEPTH, 10);
    expect(edges(poses[3] as SegmentPose)[1]).toBeCloseTo(ARCH_DEPTH, 10);
    expect(poses.map(({ offset }) => offset)).toEqual(
      [0.75, 0.25, 0.25, 0.75].map((s) => s * ARCH_DEPTH)
    );
  });

  it('does not arch an ingredient of two segments, which has no middle', () => {
    for (const pose of segmentPoses({ sink: level(2), width: 2 }, true)) {
      expect(pose.offset).toBe(0);
    }
  });
});
