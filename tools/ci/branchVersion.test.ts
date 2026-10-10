import { describe, expect, it } from 'vitest';
import { expectedVersion } from './branchVersion.ts';

describe('expectedVersion', () => {
  it('reads the version of development and release branches and of tags', () => {
    expect(expectedVersion({ refName: 'develop/v1.2.3' })).toBe('1.2.3');
    expect(expectedVersion({ refName: 'release/v1.2.3' })).toBe('1.2.3');
    expect(expectedVersion({ refName: 'v1.2.3' })).toBe('1.2.3');
  });

  it('does not check other branches', () => {
    expect(expectedVersion({ refName: 'change/is6-input-audio-ci-electron' })).toBeNull();
    expect(expectedVersion({ refName: 'develop/next' })).toBeNull();
    expect(expectedVersion({ refName: 'feature/v1.2.3' })).toBeNull();
    expect(expectedVersion({ refName: '' })).toBeNull();
  });

  it('checks a pull request against its target branch', () => {
    expect(expectedVersion({ refName: '27/merge', baseRef: 'develop/v1.0.0' })).toBe('1.0.0');
    expect(expectedVersion({ refName: '27/merge', baseRef: 'change/other' })).toBeNull();
  });

  it('treats an empty target branch as a push', () => {
    expect(expectedVersion({ refName: 'release/v2.0.0', baseRef: '' })).toBe('2.0.0');
  });
});
