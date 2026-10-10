type LayoutNavigator = Navigator & {
  keyboard?: { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> };
};

/**
 * The player's keyboard layout (physical key → character), so key labels match the keyboard;
 * `null` where the browser does not tell it (Firefox, Safari) or refuses.
 */
export async function loadKeyboardLayout(
  navigator: Navigator
): Promise<ReadonlyMap<string, string> | null> {
  try {
    return (await (navigator as LayoutNavigator).keyboard?.getLayoutMap?.()) ?? null;
  } catch {
    return null;
  }
}
