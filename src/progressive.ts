export interface ProgressiveHint {
  threshold: number;
  text: string;
}

export const DEFAULT_HINTS: ProgressiveHint[] = [
  { threshold: 3, text: '💡 Type field:value to filter — e.g., Status:Passing' },
  { threshold: 8, text: '💡 Tip: aliases like st:pass save keystrokes' },
  { threshold: 15, text: '💡 Press / to instantly focus the search bar' },
  { threshold: 25, text: '💡 Click ⭐ to save and reuse frequent searches' },
];

const USAGE_KEY = (ns: string) => `${ns}:usage`;

export function getUsageCount(namespace: string): number {
  try {
    return Number(localStorage.getItem(USAGE_KEY(namespace)) ?? '0');
  } catch {
    return 0;
  }
}

export function incrementUsage(namespace: string): number {
  const next = getUsageCount(namespace) + 1;
  try {
    localStorage.setItem(USAGE_KEY(namespace), String(next));
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
  return next;
}

export function getPendingHint(
  namespace: string,
  hints: ProgressiveHint[],
): ProgressiveHint | null {
  const count = getUsageCount(namespace);
  for (const hint of hints) {
    if (count >= hint.threshold) {
      try {
        if (!localStorage.getItem(`${namespace}:hint:${hint.threshold}`)) {
          return hint;
        }
      } catch {
        // privacy mode
      }
    }
  }
  return null;
}

export function markHintSeen(namespace: string, hint: ProgressiveHint): void {
  try {
    localStorage.setItem(`${namespace}:hint:${hint.threshold}`, '1');
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
}
