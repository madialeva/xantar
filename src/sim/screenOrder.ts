/**
 * Which screen a level is played on, counting screens from 0: each screen is played
 * `boardsPerScreen` levels in a row, in order, and after the last one the first comes back.
 */
export const screenIndexFor = (
  level: number,
  screenCount: number,
  boardsPerScreen: number
): number => Math.floor((Math.max(1, level) - 1) / boardsPerScreen) % screenCount;

/** The first level played on a screen, counting screens from 1. */
export const firstLevelOfScreen = (screen: number, boardsPerScreen: number): number =>
  (Math.max(1, screen) - 1) * boardsPerScreen + 1;
