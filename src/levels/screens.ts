import classic from './classic.level.json';
import counter from './counter.level.json';
import pyramid from './pyramid.level.json';
import towers from './towers.level.json';

/** The screens of a game, as level documents, in the order they are played. */
export const SCREEN_DOCUMENTS: readonly unknown[] = [classic, pyramid, counter, towers];
