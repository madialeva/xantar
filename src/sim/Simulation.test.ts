import { describe, expect, it } from 'vitest';
import classicDocument from '../levels/classic.level.json';
import { loadLevel } from './level/loadLevel';
import { parseLevelDocument } from './level/levelJson';
import { SeededRng } from './rng';
import { NO_INPUT } from './SimInput';
import { Simulation } from './Simulation';

const create = (): Simulation =>
  new Simulation({
    level: loadLevel(parseLevelDocument(classicDocument)),
    rng: new SeededRng(1)
  });

describe('Simulation', () => {
  it('starts playing with the chef at the level start and announces the board', () => {
    const sim = create();
    expect(sim.status).toBe('playing');
    expect([sim.chef.x, sim.chef.row]).toEqual([10.5, 12]);
    expect(sim.step(NO_INPUT)).toEqual([{ type: 'boardStarted' }]);
  });

  it('exposes the ingredients, the plates and the enemies of the level', () => {
    const sim = create();
    expect(sim.ingredients).toHaveLength(16);
    expect(sim.plates).toHaveLength(4);
    expect(sim.enemies.map((enemy) => enemy.kind)).toEqual(['hotdog', 'pickle', 'egg']);
  });

  it('returns no events for a tick without happenings', () => {
    const sim = create();
    sim.step(NO_INPUT);
    expect(sim.step(NO_INPUT)).toEqual([]);
  });

  it('moves the chef with the input of the tick and keeps the previous position', () => {
    const sim = create();
    sim.step(NO_INPUT);
    const before = sim.chef.x;
    sim.step({ ...NO_INPUT, right: true });
    expect(sim.chef.x).toBeGreaterThan(before);
    expect(sim.chef.prevX).toBe(before);
  });

  it('restarts the board and puts the chef back', () => {
    const sim = create();
    for (let i = 0; i < 30; i++) sim.step({ ...NO_INPUT, left: true });
    sim.startBoard();
    expect([sim.chef.x, sim.chef.prevX]).toEqual([10.5, 10.5]);
    expect(sim.step(NO_INPUT)).toEqual([{ type: 'boardStarted' }]);
  });

  it('restores the ingredients when the board restarts', () => {
    const sim = create();
    const lane = sim.ingredients.find(
      (ingredient) => ingredient.col === 11 && ingredient.row === 12
    );
    for (let i = 0; i < 30; i++) sim.step({ ...NO_INPUT, right: true });
    expect(lane?.stomped.some(Boolean)).toBe(true);
    sim.startBoard();
    expect(sim.ingredients.every((ingredient) => !ingredient.stomped.some(Boolean))).toBe(true);
  });

  it('starts a new game with the initial stats', () => {
    const sim = create();
    sim.newGame();
    expect([sim.stats.score, sim.stats.lives, sim.stats.level]).toEqual([0, 3, 1]);
    expect(sim.status).toBe('playing');
  });

  it('ignores nextLevel when the level is not cleared', () => {
    const sim = create();
    sim.step(NO_INPUT);
    for (let i = 0; i < 10; i++) sim.step({ ...NO_INPUT, left: true });
    const x = sim.chef.x;
    sim.nextLevel();
    expect(sim.chef.x).toBe(x);
  });
});
