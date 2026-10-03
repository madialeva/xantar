import type { Level } from '../Level';

export type IssueSeverity = 'error' | 'warning';

export interface LevelIssue {
  readonly severity: IssueSeverity;
  readonly code: string;
  readonly message: string;
  readonly row?: number;
  readonly col?: number;
}

export interface LevelRule {
  check(level: Level): readonly LevelIssue[];
}
