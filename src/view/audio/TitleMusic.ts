/**
 * The looping title and menu music, played with a plain audio element so it also works
 * under `file://`. Browsers only let it start after a user gesture.
 */
export class TitleMusic {
  readonly #url: string;
  #audio: HTMLAudioElement | null = null;

  constructor(url: string) {
    this.#url = url;
  }

  play(): void {
    if (this.#audio) return;
    try {
      const audio = new Audio(this.#url);
      audio.loop = true;
      void audio.play().catch(() => undefined);
      this.#audio = audio;
    } catch {
      this.#audio = null;
    }
  }

  stop(): void {
    if (!this.#audio) return;
    try {
      this.#audio.pause();
      this.#audio.currentTime = 0;
    } catch {
      // Nothing else to do: the music is simply not playing.
    }
    this.#audio = null;
  }
}
