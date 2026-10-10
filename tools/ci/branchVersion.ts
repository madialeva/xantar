/** The git refs of a CI run: the branch or tag pushed, and the target branch of a pull request. */
export interface CiRefs {
  readonly refName: string;
  readonly baseRef?: string;
}

const VERSIONED_REF = /^(?:(?:develop|release)\/)?v(\d+\.\d+\.\d+)$/;

/**
 * The version that `package.json` must have for these refs, or `null` when they carry none.
 * A pull request is checked against its target branch; a push against the branch or tag.
 */
export function expectedVersion({ refName, baseRef }: CiRefs): string | null {
  const ref = baseRef ? baseRef : refName;
  return VERSIONED_REF.exec(ref)?.[1] ?? null;
}
