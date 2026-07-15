export interface ProgressiveHint {
  threshold: number;
  text: string;
}

export const DEFAULT_HINTS: ProgressiveHint[] = [
  { threshold: 3, text: '💡 输入 字段名:值 快速筛选 — 试试 key:value 语法' },
  { threshold: 8, text: '💡 按 / 可快速聚焦搜索框' },
  { threshold: 15, text: '💡 按空格→下一个条件，逗号→多选' },
  { threshold: 25, text: '💡 点击 ⭐ 可保存常用搜索条件' },
];

export function buildHints(configs: { label: string; type?: string; aliases?: string[]; prefix?: string; options?: unknown }[]): ProgressiveHint[] {
  const selectCfg = configs.find(c => Array.isArray(c.options));
  const firstOpt = selectCfg && Array.isArray(selectCfg.options) && (selectCfg.options as Array<{ label: string }>)?.[0];
  const aliasCfg = configs.find(c => c.aliases?.length && c.label);

  const hints: ProgressiveHint[] = [
    {
      threshold: 3,
      text: firstOpt
        ? `💡 如: ${selectCfg!.prefix ? selectCfg!.prefix + firstOpt.label : selectCfg!.label + ':' + firstOpt.label} — 字段:值 快速筛选`
        : '💡 字段名:值 可快速筛选，如: 操作人:张三',
    },
  ];

  if (aliasCfg) {
    hints.push({ threshold: 8, text: `💡 别名快速输入，如 ${aliasCfg.aliases![0]}:xxx 代替 ${aliasCfg.label}:xxx` });
    hints.push({ threshold: 15, text: '💡 按 / 可快速聚焦搜索框' });
  } else {
    hints.push({ threshold: 8, text: '💡 按 / 可快速聚焦搜索框' });
    hints.push({ threshold: 15, text: '💡 按空格→下一个条件，逗号→多选' });
  }

  hints.push({ threshold: 25, text: '💡 点击 ⭐ 可保存常用搜索条件' });
  return hints;
}

const USAGE_KEY = (ns: string) => `${ns}:usage`;

function resolveStorage(storage?: FilterChipBarStorage): FilterChipBarStorage | undefined {
  if (storage) return storage;
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

export function getUsageCount(namespace: string, storage?: FilterChipBarStorage): number {
  try {
    return Number(resolveStorage(storage)?.getItem(USAGE_KEY(namespace)) ?? '0');
  } catch {
    return 0;
  }
}

export function incrementUsage(namespace: string, storage?: FilterChipBarStorage): number {
  const next = getUsageCount(namespace, storage) + 1;
  try {
    resolveStorage(storage)?.setItem(USAGE_KEY(namespace), String(next));
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
  return next;
}

export function getPendingHint(
  namespace: string,
  hints: ProgressiveHint[],
  storage?: FilterChipBarStorage,
): ProgressiveHint | null {
  const count = getUsageCount(namespace, storage);
  for (const hint of hints) {
    if (count >= hint.threshold) {
      try {
        if (!resolveStorage(storage)?.getItem(`${namespace}:hint:${hint.threshold}`)) {
          return hint;
        }
      } catch {
        // privacy mode
      }
    }
  }
  return null;
}

export function markHintSeen(namespace: string, hint: ProgressiveHint, storage?: FilterChipBarStorage): void {
  try {
    resolveStorage(storage)?.setItem(`${namespace}:hint:${hint.threshold}`, '1');
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
}
import type { FilterChipBarStorage } from './types';
