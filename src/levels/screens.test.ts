import { describe, expect, it } from 'vitest';
import { loadLevel } from '../sim/level/loadLevel';
import { parseLevelDocument } from '../sim/level/levelJson';
import { SCREEN_DOCUMENTS } from './screens';

describe('screens of the game', () => {
  it('are the classic one, the pyramid, the counter and the towers, in that order', () => {
    expect(SCREEN_DOCUMENTS.map((document) => parseLevelDocument(document).name)).toEqual([
      'Classic',
      'Pyramid',
      'Counter',
      'Towers'
    ]);
  });

  it('all load as playable levels of four burgers with the chef in the middle of the bottom', () => {
    for (const document of SCREEN_DOCUMENTS) {
      const level = loadLevel(parseLevelDocument(document));
      expect([level.cols, level.rows, level.plates.length]).toEqual([39, 30, 4]);
      expect(level.chefStart).toEqual({ row: 23, x: 19.5 });
    }
  });

  it('bring in more enemies screen after screen, with onions from the third one on', () => {
    const lineUps = SCREEN_DOCUMENTS.map((document) => {
      const kinds = loadLevel(parseLevelDocument(document)).enemySpawns.map((spawn) => spawn.kind);
      return ['hotdog', 'onion', 'egg'].map((kind) => kinds.filter((each) => each === kind).length);
    });
    expect(lineUps).toEqual([
      [3, 0, 1],
      [3, 0, 1],
      [2, 2, 1],
      [4, 2, 0]
    ]);
  });
});
