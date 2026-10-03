import { type Level } from './Level';
import { assembleLevel } from './assembleLevel';
import type { LevelDocument } from './LevelDocument';
import { LevelError } from './LevelError';
import { parseLevelJson } from './levelJson';
import type { PieceRegistry } from './pieces/PieceRegistry';
import type { LevelIssue } from './validation/LevelIssue';
import { validateLevel } from './validation/validateLevel';

export interface LoadLevelOptions {
  readonly registry?: PieceRegistry;
  readonly requirePlayable?: boolean;
}

/**
 * Thrown when a level is structurally valid but has playability errors; carries the issues.
 */
export class UnplayableLevelError extends LevelError {
  readonly issues: readonly LevelIssue[];

  constructor(issues: readonly LevelIssue[]) {
    super(`The level is not playable:\n${issues.map(describeIssue).join('\n')}`);
    this.name = 'UnplayableLevelError';
    this.issues = issues;
  }
}

const describeIssue = (issue: LevelIssue): string => {
  const where =
    issue.row === undefined
      ? ''
      : ` (row ${issue.row}${issue.col === undefined ? '' : `, column ${issue.col}`})`;
  return `- ${issue.code}: ${issue.message}${where}`;
};

export function loadLevel(document: LevelDocument, options: LoadLevelOptions = {}): Level {
  const level = assembleLevel(document, options.registry);
  if (options.requirePlayable ?? true) {
    const errors = validateLevel(level).filter((issue) => issue.severity === 'error');
    if (errors.length > 0) throw new UnplayableLevelError(errors);
  }
  return level;
}

export function loadLevelJson(text: string, options: LoadLevelOptions = {}): Level {
  return loadLevel(parseLevelJson(text), options);
}
