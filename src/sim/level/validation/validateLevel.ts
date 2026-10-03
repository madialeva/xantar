import type { Level } from '../Level';
import type { LevelIssue, LevelRule } from './LevelIssue';
import { defaultRules } from './rules';

export function validateLevel(
  level: Level,
  rules: readonly LevelRule[] = defaultRules
): readonly LevelIssue[] {
  return rules.flatMap((rule) => rule.check(level));
}
