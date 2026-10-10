import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './scenarios';
import { parseSize, parseSteps } from './steps';

describe('parseSteps', () => {
  it('reads every kind of step', () => {
    expect(parseSteps('wait:2500, click,key:Space,key:Left:300,down:Up,up:Up,shot:game')).toEqual([
      { kind: 'wait', ms: 2500 },
      { kind: 'click' },
      { kind: 'key', key: 'Space', ms: 100 },
      { kind: 'key', key: 'Left', ms: 300 },
      { kind: 'down', key: 'Up' },
      { kind: 'up', key: 'Up' },
      { kind: 'shot', name: 'game' }
    ]);
  });

  it('rejects unknown steps, bad durations and missing arguments', () => {
    expect(() => parseSteps('jump')).toThrow(/Unknown step "jump"/);
    expect(() => parseSteps('wait:soon')).toThrow(/Invalid duration/);
    expect(() => parseSteps('shot')).toThrow(/Missing argument/);
  });
});

describe('parseSize', () => {
  it('reads WIDTHxHEIGHT', () => {
    expect(parseSize('1920x1080')).toEqual({ width: 1920, height: 1080 });
    expect(() => parseSize('1920')).toThrow(/Invalid size/);
  });
});

describe('SCENARIOS', () => {
  it('captures both themes at three aspect ratios in the review', () => {
    expect(SCENARIOS.review?.map((run) => run.name)).toEqual([
      'classic-16x9',
      'classic-4x3',
      'classic-19.5x9',
      'midnight-16x9',
      'midnight-4x3',
      'midnight-19.5x9'
    ]);
  });

  it('only has valid sizes and steps', () => {
    for (const run of Object.values(SCENARIOS).flat()) {
      expect(() => parseSize(run.size)).not.toThrow();
      expect(() => parseSteps(run.steps)).not.toThrow();
    }
  });
});
