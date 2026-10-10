import type { Simulation } from '../Simulation';
import { NO_INPUT } from '../SimInput';

/** Steps through the ready countdown so a test starts with the game in play. */
export const skipReady = (sim: Simulation): Simulation => {
  while (sim.phase === 'ready') sim.step(NO_INPUT);
  return sim;
};
