/** The sounds a menu makes; the audio system provides them (see GameAudio). */
export interface UiSounds {
  move(): void;
  select(): void;
  back(): void;
}

export const SILENT_UI: UiSounds = {
  move: () => undefined,
  select: () => undefined,
  back: () => undefined
};
