import { describe, expect, it } from 'vitest';
import { parseFilterTrial } from './parseFilterTrial';

describe('parseFilterTrial', () => {
  it('asks for no trial without a value', () => {
    expect(parseFilterTrial(null)).toBeNull();
    expect(parseFilterTrial('')).toBeNull();
  });

  it('asks for a trial without filters with none', () => {
    expect(parseFilterTrial('none')).toEqual([]);
  });

  it('reads a list and ignores unknown names', () => {
    expect(parseFilterTrial('shadow,sparkles,glow')).toEqual(['glow', 'shadow']);
  });

  it('expands all', () => {
    expect(parseFilterTrial('all')).toEqual(['glow', 'shadow', 'bloom']);
  });
});
