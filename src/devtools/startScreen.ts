/**
 * The screen asked for with `?screen=N` in the address of a development build, from 1; the
 * first one when the address asks for none or for something that is not a screen number.
 */
export const requestedScreen = (search: string): number => {
  const screen = Number(new URLSearchParams(search).get('screen') ?? 1);
  return Number.isInteger(screen) && screen >= 1 ? screen : 1;
};
