import { en } from './catalogs/en';
import { es } from './catalogs/es';
import type { Language } from './language';
import { type Catalog, type MessageKey, type MessageParams, Translator } from './Translator';

const CATALOGS: Readonly<Record<Language, Catalog>> = { es, en };

type Listener = (language: Language) => void;

/** The active language of the interface; tells its listeners when it changes (Observer). */
export class Localization {
  readonly #listeners = new Set<Listener>();
  #translator: Translator;

  constructor(language: Language) {
    this.#translator = new Translator(language, CATALOGS[language]);
  }

  get language(): Language {
    return this.#translator.language;
  }

  t<K extends MessageKey>(key: K, ...params: MessageParams<K>): string {
    return this.#translator.t(key, ...params);
  }

  setLanguage(language: Language): void {
    if (language === this.language) return;
    this.#translator = new Translator(language, CATALOGS[language]);
    for (const listener of this.#listeners) listener(language);
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
