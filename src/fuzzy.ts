export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = Array.from<number>({ length: n + 1 });
  const curr = Array.from<number>({ length: n + 1 });

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
    if (!isFuzzyMatch(input, option, maxDistance)) continue;
    const distance = levenshtein(input, option);
    if (distance > 0) {
      if (!best || distance < best.distance) {
        best = { option, distance };
      }
    }
  }
  return best?.option ?? null;
}

export function isFuzzyMatch(input: string, option: string, maxDistance: number): boolean {
  const normalizedInput = input.trim().toLowerCase();
  const normalizedOption = option.trim().toLowerCase();
  if (normalizedInput === normalizedOption) return false;

  /**
   * 触发背景：用户在下拉筛选中输入不存在的短值时，纯编辑距离匹配会把差异很大的值误判为“您是不是要找”，例如 部门:MM 匹配到 11。
   * 影响面：会让部门、运营人员等 select/multiSelect 下拉出现无关候选，用户可能误选并带出错误查询条件。
   */
  if (normalizedInput.length < 3 || normalizedOption.length < 3) return false;

  const distance = levenshtein(normalizedInput, normalizedOption);
  if (distance <= 0 || distance > maxDistance) return false;

  const maxAllowedByRatio = Math.max(1, Math.floor(Math.max(normalizedInput.length, normalizedOption.length) * 0.4));
  return distance <= maxAllowedByRatio;
}
