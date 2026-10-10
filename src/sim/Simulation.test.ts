import { describe, expect, it } from 'vitest';
import classicDocument from '../levels/classic.level.json';
import { loadLevel } from './level/loadLevel';
import { parseLevelDocument } from './level/levelJson';
import { SeededRng } from './rng';
import { READY_TICKS } from './rules';
import { NO_INPUT } from './SimInput';
import { Simulation } from './Simulation';
import { skipReady } from './testing/simulation';

const create = (): Simulation =>
  new Simulation({
    level: loadLevel(parseLevelDocument(classicDocument)),
    rng: new SeededRng(1)
  });

describe('Simulation', () => {
  it('starts getting ready with the chef at the level start and announces the board', () => {
    const sim = create();
    expect(sim.phase).toBe('ready');
    expect([sim.chef.x, sim.chef.row]).toEqual([10.5, 12]);
    expect(sim.step(NO_INPUT)).toEqual([{ type: 'boardStarted' }]);
  });

  it('keeps everyone still while getting ready and then starts playing', () => {
    const sim = create();
    const enemies = sim.enemies.map((enemy) => enemy.x);
    const events = [];
    for (let i = 0; i < READY_TICKS - 1; i++)
      events.push(...sim.step({ ...NO_INPUT, right: true }));
    expect(sim.phase).toBe('ready');
    expect(sim.chef.x).toBe(10.5);
    expect(sim.enemies.map((enemy) => enemy.x)).toEqual(enemies);
    expect(sim.step(NO_INPUT)).toEqual([{ type: 'phaseChanged', from: 'ready', to: 'playing' }]);
    expect(sim.phase).toBe('playing');
  });

  it('exposes the ingredients, the plates and the enemies of the level', () => {
    const sim = create();
    expect(sim.ingredients).toHaveLength(16);
    expect(sim.plates).toHaveLength(4);
    expect(sim.enemies.map((enemy) => enemy.kind)).toEqual(['hotdog', 'pickle', 'egg']);
  });

  it('returns no events for a tick without happenings', () => {
    const sim = skipReady(create());
    expect(sim.step(NO_INPUT)).toEqual([]);
  });

  it('moves the chef with the input of the tick and keeps the previous position', () => {
    const sim = skipReady(create());
    const before = sim.chef.x;
    sim.step({ ...NO_INPUT, right: true });
    expect(sim.chef.x).toBeGreaterThan(before);
    expect(sim.chef.prevX).toBe(before);
  });

  it('restarts the board and puts the chef back', () => {
    const sim = skipReady(create());
    for (let i = 0; i < 30; i++) sim.step({ ...NO_INPUT, left: true });
    sim.startBoard();
    expect([sim.chef.x, sim.chef.prevX]).toEqual([10.5, 10.5]);
    expect(sim.step(NO_INPUT)).toEqual([
      { type: 'boardStarted' },
      { type: 'phaseChanged', from: 'playing', to: 'ready' }
    ]);
  });

  it('restores the ingredients when the board restarts', () => {
    const sim = skipReady(create());
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
    expect(sim.phase).toBe('ready');
  });
});
