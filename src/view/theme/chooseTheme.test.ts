import { describe, expect, it } from 'vitest';
import { chooseTheme } from './chooseTheme';

const themes = { defaultId: 'classic', has: (id: string) => ['classic', 'midnight'].includes(id) };

describe('chooseTheme', () => {
  it('uses the default theme when nothing is requested', () => {
    expect(chooseTheme({}, themes)).toEqual({ id: 'classic', warnings: [] });
  });

  it('uses the theme of the level', () => {
    expect(chooseTheme({ levelTheme: 'midnight' }, themes)).toEqual({
      id: 'midnight',
      warnings: []
    });
  });

  it('lets the URL override the level', () => {
    expect(chooseTheme({ urlTheme: 'midnight', levelTheme: 'classic' }, themes).id).toBe(
      'midnight'
    );
  });

  it('skips an unknown URL theme and falls back to the level, warning about the URL', () => {
    const choice = chooseTheme({ urlTheme: 'neon', levelTheme: 'midnight' }, themes);
    expect(choice.id).toBe('midnight');
    expect(choice.warnings).toEqual(['Unknown theme "neon" requested by the URL; ignoring it']);
  });

  it('skips an unknown level theme and falls back to the default, warning about the level', () => {
    const choice = chooseTheme({ levelTheme: 'neon' }, themes);
    expect(choice.id).toBe('classic');
    expect(choice.warnings).toEqual(['Unknown theme "neon" requested by the level; ignoring it']);
  });

  it('warns about both when both are unknown', () => {
    const choice = chooseTheme({ urlTheme: 'a', levelTheme: 'b' }, themes);
    expect(choice.id).toBe('classic');
    expect(choice.warnings).toHaveLength(2);
  });

  it('treats an empty or missing URL value as no request', () => {
    expect(chooseTheme({ urlTheme: '', levelTheme: 'midnight' }, themes).id).toBe('midnight');
    expect(chooseTheme({ urlTheme: null }, themes)).toEqual({ id: 'classic', warnings: [] });
  });

  it('uses the theme the player chose over the level', () => {
    expect(chooseTheme({ optionTheme: 'midnight', levelTheme: 'classic' }, themes).id).toBe(
      'midnight'
    );
  });

  it('follows the level when the player chose automatic', () => {
    expect(chooseTheme({ optionTheme: 'auto', levelTheme: 'midnight' }, themes)).toEqual({
      id: 'midnight',
      warnings: []
    });
  });

  it('lets the URL override the player choice', () => {
    expect(chooseTheme({ urlTheme: 'classic', optionTheme: 'midnight' }, themes).id).toBe(
      'classic'
    );
  });

  it('skips a saved theme that no longer exists, warning about the settings', () => {
    const choice = chooseTheme({ optionTheme: 'neon', levelTheme: 'midnight' }, themes);
    expect(choice.id).toBe('midnight');
    expect(choice.warnings).toEqual([
      'Unknown theme "neon" requested by the settings; ignoring it'
    ]);
  });
});
