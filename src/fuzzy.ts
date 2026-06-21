export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

export function findClosest(
  input: string,
  options: string[],
  maxDistance: number,
): string | null {
  let best: { option: string; distance: number } | null = null;
  for (const option of options) {
    if (option.toLowerCase() === input.toLowerCase()) continue;
    const distance = levenshtein(input, option);
    if (distance > 0 && distance <= maxDistance) {
      if (!best || distance < best.distance) {
        best = { option, distance };
      }
    }
  }
  return best?.option ?? null;
}
