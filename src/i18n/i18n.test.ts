import { describe, expect, it } from 'vitest';
import { en } from './catalogs/en';
import { es } from './catalogs/es';
import { detectLanguage, isLanguage } from './language';
import { Localization } from './Localization';
import { Translator } from './Translator';

describe('Translator', () => {
  it('returns plain messages as they are', () => {
    expect(new Translator('es', es).t('menu.play')).toBe('JUGAR');
    expect(new Translator('en', en).t('menu.play')).toBe('PLAY');
  });

  it('fills in parameters and chooses the plural form of each language', () => {
    const spanish = new Translator('es', es);
    const english = new Translator('en', en);
    expect(spanish.t('phase.lives', { lives: 1 })).toBe('1 VIDA');
    expect(spanish.t('phase.lives', { lives: 3 })).toBe('3 VIDAS');
    expect(english.t('phase.lives', { lives: 1 })).toBe('1 LIFE');
    expect(english.t('phase.lives', { lives: 0 })).toBe('0 LIVES');
  });

  it('formats numbers with the thousands separator of each language', () => {
    expect(new Translator('en', en).t('gameOver.score', { score: 12500 })).toBe('SCORE  12,500');
    expect(new Translator('es', es).t('gameOver.score', { score: 12500 })).toBe('PUNTOS  12.500');
  });

  it('has the same keys in every catalog', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });
});

describe('detectLanguage', () => {
  it('picks Spanish for any Spanish first preference', () => {
    expect(detectLanguage(['es-MX', 'en'])).toBe('es');
    expect(detectLanguage(['ES'])).toBe('es');
  });

  it('picks English otherwise', () => {
    expect(detectLanguage(['ca', 'es'])).toBe('en');
    expect(detectLanguage(['en-GB'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('recognises the supported languages', () => {
    expect([isLanguage('es'), isLanguage('en'), isLanguage('fr'), isLanguage(3)]).toEqual([
      true,
      true,
      false,
      false
    ]);
  });
});

describe('Localization', () => {
  it('translates with the active language and tells its listeners when it changes', () => {
    const localization = new Localization('es');
    const heard: string[] = [];
    const unsubscribe = localization.subscribe((language) => heard.push(language));
    expect(localization.t('pause.title')).toBe('PAUSA');
    localization.setLanguage('en');
    expect(localization.t('pause.title')).toBe('PAUSED');
    localization.setLanguage('en');
    unsubscribe();
    localization.setLanguage('es');
    expect(heard).toEqual(['en']);
    expect(localization.language).toBe('es');
  });
});
