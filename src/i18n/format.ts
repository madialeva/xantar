import type { Language } from './language';

export interface PluralForms {
  readonly one: string;
  readonly other: string;
}

/** Number and plural formatting for one language, handed to the messages that need it. */
export interface Format {
  number(value: number): string;
  plural(count: number, forms: PluralForms): string;
}

export function createFormat(language: Language): Format {
  const numbers = new Intl.NumberFormat(language, { useGrouping: 'always' });
  const plurals = new Intl.PluralRules(language);
  return {
    number: (value) => numbers.format(value),
    plural: (count, forms) => (plurals.select(count) === 'one' ? forms.one : forms.other)
  };
}
