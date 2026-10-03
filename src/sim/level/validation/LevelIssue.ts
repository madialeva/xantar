import type { Level } from '../Level';

export type IssueSeverity = 'error' | 'warning';

export interface LevelIssue {
  readonly severity: IssueSeverity;
  readonly code: string;
  readonly message: string;
  readonly row?: number;
  readonly col?: number;
}

/**
 * A playability check: looks at a loaded level and reports the issues it finds.
 */
export interface LevelRule {
  check(level: Level): readonly LevelIssue[];
}
