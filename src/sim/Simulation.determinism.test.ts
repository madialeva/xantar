import { describe, expect, it } from 'vitest';
import classicDocument from '../levels/classic.level.json';
import type { SimEvent } from './events';
import { parseLevelDocument } from './level/levelJson';
import { loadLevel } from './level/loadLevel';
import { SeededRng } from './rng';
import { NO_INPUT, type SimInput } from './SimInput';
import { Simulation } from './Simulation';

const level = loadLevel(parseLevelDocument(classicDocument));
const TICKS = 3600;

const scriptedInputs = (ticks: number): SimInput[] => {
  const script = new SeededRng(12345);
  const inputs: SimInput[] = [];
  let current = NO_INPUT;
  for (let tick = 0; tick < ticks; tick++) {
    if (tick % 25 === 0) {
      const horizontal = script.int(0, 2);
      const vertical = script.int(0, 5);
      current = {
        left: horizontal === 1,
        right: horizontal === 2,
        up: vertical === 1,
        down: vertical === 2,
        pepper: script.chance(0.15)
      };
    } else {
      current = { ...current, pepper: false };
    }
    inputs.push(current);
  }
  return inputs;
};

const stateOf = (sim: Simulation): string =>
  JSON.stringify({
    status: sim.status,
    stats: { ...sim.stats },
    chef: [sim.chef.x, sim.chef.y, sim.chef.row, sim.chef.facing],
    enemies: sim.enemies.map((e) => [e.x, e.y, e.row, e.active, e.stunTicksLeft]),
    ingredients: sim.ingredients.map((i) => [
      i.row,
      i.phase,
      i.fallProgress,
      i.stackSlot,
      i.stomped.map(Number).join('')
    ]),
    plates: sim.plates.map((p) => [p.landed, p.isComplete])
  });

const play = (seed: number): { states: string[]; events: SimEvent[] } => {
  const sim = new Simulation({ level, rng: new SeededRng(seed) });
  const states: string[] = [];
  const events: SimEvent[] = [];
  for (const input of scriptedInputs(TICKS)) {
    if (sim.status === 'gameOver') sim.newGame();
    if (sim.status === 'levelClear') sim.nextLevel();
    events.push(...sim.step(input));
    states.push(stateOf(sim));
  }
  return { states, events };
};

describe('Simulation determinism', () => {
  it('produces the same states and events for the same seed and inputs', () => {
    const first = play(7);
    const second = play(7);
    expect(second.states).toEqual(first.states);
    expect(second.events).toEqual(first.events);
  });

  it('exercises the rules during the scripted run', () => {
    const { events } = play(7);
    const types = new Set(events.map((event) => event.type));
    expect(types.has('chefHit')).toBe(true);
    expect(types.has('scoreChanged')).toBe(true);
    expect(types.has('pepperThrown')).toBe(true);
  });

  it('diverges for a different seed', () => {
    expect(play(8).states).not.toEqual(play(7).states);
  });
});

describe('Simulation interpolation state', () => {
  it('has no interpolation streak after the chef is hit', () => {
    const sim = new Simulation({ level, rng: new SeededRng(3) });
    sim.step(NO_INPUT);
    let hit = false;
    for (let tick = 0; tick < 3000 && !hit; tick++) {
      hit = sim.step(NO_INPUT).some((event) => event.type === 'chefHit');
    }
    expect(hit).toBe(true);
    for (const entity of [sim.chef, ...sim.enemies]) {
      expect([entity.prevX, entity.prevY]).toEqual([entity.x, entity.y]);
    }
  });

  it('has no interpolation streak after the board restarts', () => {
    const sim = new Simulation({ level, rng: new SeededRng(3) });
    for (let tick = 0; tick < 100; tick++) sim.step({ ...NO_INPUT, left: true });
    sim.startBoard();
    for (const entity of [sim.chef, ...sim.enemies]) {
      expect([entity.prevX, entity.prevY]).toEqual([entity.x, entity.y]);
    }
  });
});
