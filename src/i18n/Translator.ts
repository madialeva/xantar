import type { es } from './catalogs/es';
import { type Format, createFormat } from './format';
import type { Language } from './language';

export type Catalog = typeof es;

export type MessageKey = keyof Catalog;

export type MessageParams<K extends MessageKey> = Catalog[K] extends (
  params: infer P,
  format: Format
) => string
  ? [params: P]
  : [];

/** Turns message keys into text of one language, filling in their parameters. */
export class Translator {
  readonly language: Language;
  readonly #catalog: Catalog;
  readonly #format: Format;

  constructor(language: Language, catalog: Catalog) {
    this.language = language;
    this.#catalog = catalog;
    this.#format = createFormat(language);
  }

  t<K extends MessageKey>(key: K, ...params: MessageParams<K>): string {
    const message: unknown = this.#catalog[key];
    if (typeof message === 'string') return message;
    return (message as (params: unknown, format: Format) => string)(params[0], this.#format);
  }
}
