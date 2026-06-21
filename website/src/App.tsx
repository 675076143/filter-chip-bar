import { useState } from 'react';
import { FilterChipBar, type ChipConfig, type TabOption, type FilterChipBarResult } from 'filter-chip-bar';
import { BookOpen, Package, Globe, Github, Terminal, Sparkles, ArrowRight, Languages } from 'lucide-react';

const i18n = {
  en: {
    badge: 'Headless filter + command palette for React',
    tagline: 'Search as the entry point.',
    tagline2: 'One box to filter, navigate, and command.',
    placeholder: 'Search or type filters...  (try: st:pass or #urgent)',
    tryLabel: 'Try:',
    orType: 'Or type',
    forActions: 'for quick actions',
    resultLabel: 'onFiltersChange result',
    quickStart: 'Quick Start',
    copy: 'copy',
    docsLinks: ['Storybook Docs', 'README (EN)', 'Design Notes'],
    featuresHeading: 'Features',
    disciplinesHeading: '7 Features · 6 Disciplines',
    syntaxHeading: 'Search Syntax',
    syntaxExamples: [
      { syntax: 'key:value', desc: 'Filter by field', example: 'Status:Passing' },
      { syntax: '-key:value', desc: 'Exclude (negation)', example: '-Status:Pending' },
      { syntax: 'key:val1,val2', desc: 'Multi-value', example: 'Status:Passing,Failing' },
      { syntax: 'alias:value', desc: 'Shortcut (alias)', example: 'st:pass' },
      { syntax: '#tag', desc: 'Prefix syntax', example: '#urgent' },
      { syntax: '/command', desc: 'Slash command', example: '/docs' },
      { syntax: 'key:>=100', desc: 'Numeric compare', example: 'Orders:>=500' },
      { syntax: 'key:100~200', desc: 'Numeric range', example: 'Orders:100~500' },
      { syntax: 'typo', desc: 'Auto-correct (FEC)', example: 'Pasing → Passing' },
      { syntax: 'free text', desc: 'Full-text search', example: 'kxccaqvx12' },
    ],
    footer: 'MIT License · Built with React + Radix UI + Tailwind CSS · 48 tests · 6 disciplines',
    features: [
      { title: 'Structured Filtering', desc: 'Type Status:Passing to filter by field. Negation with -Status:Pending.', icon: '🔍' },
      { title: 'Multi-Protocol Prefix', desc: '#tag, @user, >date — FDMA multiplexing on one channel.', icon: '#️⃣' },
      { title: 'Label Aliases', desc: 'st:pass = Status:Passing. Lossless compression for power users.', icon: '⚡' },
      { title: 'Forward Error Correction', desc: 'Typo? "Did you mean Passing?" — Levenshtein auto-correction.', icon: '🛡️' },
      { title: 'Command Palette', desc: 'Type "docs" or "install" for quick navigation and actions.', icon: '⌘' },
      { title: 'Cascading Filters', desc: 'options(chips) — dependent fields auto-resolve via graph traversal.', icon: '🔗' },
      { title: 'Progressive Discovery', desc: 'Hints appear as you learn — ZPD scaffolding, not tutorials.', icon: '💡' },
      { title: 'Headless Architecture', desc: 'useFilterChipBar() hook + any renderer (shadcn / antd6 / custom).', icon: '🧠' },
    ],
    disciplines: [
      { name: 'Math', detail: 'Graph · Info Theory · Bayes' },
      { name: 'Comms', detail: 'FEC · TCP · FDMA' },
      { name: 'Psychology', detail: 'ZPD · Dunning-Kruger' },
      { name: 'Physics', detail: 'Least Action Principle' },
      { name: 'Engineering', detail: 'SOLID · Tolerance · Safety' },
      { name: 'Philosophy', detail: 'Hegel · Occam · Dao' },
    ],
  },
  zh: {
    badge: '面向 React 的 Headless 筛选 + 命令面板组件',
    tagline: '搜索即入口。',
    tagline2: '一个框,筛选、导航、执行操作。',
    placeholder: '搜索或输入筛选条件...  (试试: st:pass 或 #urgent)',
    tryLabel: '试试:',
    orType: '或输入',
    forActions: '执行快捷操作',
    resultLabel: 'onFiltersChange 结果',
    quickStart: '快速开始',
    copy: '复制',
    docsLinks: ['Storybook 文档', 'README (中文)', '设计笔记'],
    featuresHeading: '特性',
    disciplinesHeading: '7 个特性 · 6 个学科',
    syntaxHeading: '搜索语法',
    syntaxExamples: [
      { syntax: 'key:value', desc: '按字段筛选', example: 'Status:Passing' },
      { syntax: '-key:value', desc: '排除匹配项', example: '-Status:Pending' },
      { syntax: 'key:val1,val2', desc: '多值选择', example: 'Status:Passing,Failing' },
      { syntax: 'alias:value', desc: '别名简写', example: 'st:pass' },
      { syntax: '#tag', desc: '前缀语法', example: '#urgent' },
      { syntax: '/command', desc: '斜杠命令', example: '/docs' },
      { syntax: 'key:>=100', desc: '数值比较', example: 'Orders:>=500' },
      { syntax: 'key:100~200', desc: '数值区间', example: 'Orders:100~500' },
      { syntax: '笔误', desc: '自动纠错 (FEC)', example: 'Pasing → Passing' },
      { syntax: '自由文本', desc: '全文搜索', example: 'kxccaqvx12' },
    ],
    footer: 'MIT 协议 · 基于 React + Radix UI + Tailwind CSS · 48 个测试 · 6 个学科',
    features: [
      { title: '结构化筛选', desc: '输入 Status:Passing 按字段筛选。-Status:Pending 排除匹配。', icon: '🔍' },
      { title: '多协议前缀', desc: '#tag、@user、>date — FDMA 频分复用,一个信道多种语法。', icon: '#️⃣' },
      { title: '标签别名', desc: 'st:pass = Status:Passing。面向 power user 的无损压缩。', icon: '⚡' },
      { title: '前向纠错 (FEC)', desc: '打错了?"Did you mean Passing?" — Levenshtein 自动纠正。', icon: '🛡️' },
      { title: '命令面板', desc: '输入 "docs" 或 "install" 快速导航和执行操作。', icon: '⌘' },
      { title: '级联筛选', desc: 'options(chips) — 依赖字段通过图遍历自动 resolve。', icon: '🔗' },
      { title: '渐进式发现', desc: '使用中学习 — ZPD 脚手架,不是教程。', icon: '💡' },
      { title: 'Headless 架构', desc: 'useFilterChipBar() hook + 任意 renderer (shadcn / antd6 / 自定义)。', icon: '🧠' },
    ],
    disciplines: [
      { name: '数学', detail: '图论 · 信息论 · 贝叶斯' },
      { name: '通信学', detail: 'FEC · TCP · FDMA' },
      { name: '心理学', detail: 'ZPD · 邓宁-克鲁格' },
      { name: '物理学', detail: '最小作用量原理' },
      { name: '工程学', detail: 'SOLID · 公差 · 安全系数' },
      { name: '哲学', detail: '黑格尔 · 奥卡姆 · 道家' },
    ],
  },
} as const;

const chipConfigs: ChipConfig[] = [
  {
    type: 'select',
    label: 'Status',
    aliases: ['st'],
    options: [
      { value: 0, label: 'Pending' },
      { value: 1, label: 'Passing' },
      { value: 2, label: 'Failing' },
      { value: 3, label: 'Anomalous' },
    ],
  },
  {
    type: 'select',
    label: 'Department',
    aliases: ['dept'],
    options: [
      { value: 'eng', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'sales', label: 'Sales' },
    ],
  },
  { type: 'input', label: 'SKU', aliases: ['sku'] },
  { type: 'input', label: 'Name', aliases: ['name'] },
  { type: 'numberRange', label: 'Orders', aliases: ['orders'], min: 0 },
  {
    type: 'multiSelect',
    label: 'Tags',
    prefix: '#',
    options: [
      { value: 'urgent', label: 'urgent' },
      { value: 'bug', label: 'bug' },
      { value: 'feature', label: 'feature' },
    ],
  },
];

const tabs: TabOption[] = [
  { value: -1, label: 'All', count: 1355 },
  { value: 0, label: 'Pending', count: 45 },
  { value: 1, label: 'Passing', count: 1280 },
  { value: 2, label: 'Failing', count: 23 },
  { value: 3, label: 'Anomalous', count: 7 },
];

const examples = [
  'Status:Passing',
  'st:pass',
  'Status:Passing,Failing',
  'Orders:>=500',
  '-Status:Pending',
  '#urgent',
  '/docs',
  'Status:Pasing',
  'SKU:kxccaqvx12',
];

function App() {
  const [result, setResult] = useState<FilterChipBarResult | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [initialText, setInitialText] = useState('');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const t = i18n[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative">
      <button
        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
        className="fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors shadow-sm"
      >
        <Languages className="size-3.5" />
        {lang === 'en' ? '中文' : 'English'}
      </button>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-xs font-medium text-[hsl(var(--muted-foreground))] mb-6">
          <Sparkles className="size-3" />
          {t.badge}
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-center mb-4">
          filter-chip-bar
        </h1>
        <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-12 text-center max-w-lg">
          {t.tagline}<br />{t.tagline2}
        </p>

        <div className="w-full max-w-2xl">
          <FilterChipBar
            key={mountKey}
            chipConfigs={chipConfigs}
            storageNamespace="website-demo"
            tabs={tabs}
            onFiltersChange={setResult}
            initialSearchText={initialText}
            placeholder={t.placeholder}
            commands={[
              {
                keywords: ['docs', 'storybook', 'documentation'],
                label: lang === 'zh' ? '查看文档' : 'View Documentation',
                hint: 'Open Storybook',
                action: () => window.open('https://filter-chip-bar.vercel.app', '_blank'),
              },
              {
                keywords: ['github', 'source', 'code'],
                label: lang === 'zh' ? '查看源码' : 'View Source',
                hint: 'GitHub',
                action: () => window.open('https://github.com/675076143/filter-chip-bar', '_blank'),
              },
              {
                keywords: ['install', 'npm', 'download'],
                label: 'npm install filter-chip-bar',
                hint: lang === 'zh' ? '复制命令' : 'Copy command',
                action: () => {
                  navigator.clipboard.writeText('npm install filter-chip-bar');
                },
              },
            ]}
          />

          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">
                {t.tryLabel}
              </span>
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setInitialText(ex);
                    setMountKey((k) => k + 1);
                  }}
                  className="px-2.5 py-1 text-xs font-mono rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]/70">
              {t.orType} <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">/docs</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">/install</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">/github</kbd>{' '}
              {t.forActions}
            </p>
          </div>

          {result && (result.searchText || (result.chips && Object.keys(result.chips).length > 0)) && (
            <div className="mt-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
              <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                {t.resultLabel}
              </div>
              <pre className="text-xs font-mono text-[hsl(var(--foreground))] overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="w-full max-w-3xl mt-20">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="size-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-semibold">{t.quickStart}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm bg-[hsl(var(--background))] rounded-md border border-[hsl(var(--border))] px-4 py-3">
              <span className="text-[hsl(var(--muted-foreground))]">$</span>
              <span>npm install filter-chip-bar</span>
              <button
                onClick={() => navigator.clipboard.writeText('npm install filter-chip-bar')}
                className="ml-auto text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                {t.copy}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <a href="https://filter-chip-bar.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <ArrowRight className="size-3" /> {t.docsLinks[0]}
              </a>
              <a href={lang === 'zh' ? 'https://github.com/675076143/filter-chip-bar/blob/main/README.zh-CN.md' : 'https://github.com/675076143/filter-chip-bar/blob/main/README.md'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <ArrowRight className="size-3" /> {t.docsLinks[1]}
              </a>
              <a href={lang === 'zh' ? 'https://github.com/675076143/filter-chip-bar/blob/main/DESIGN.zh-CN.md' : 'https://github.com/675076143/filter-chip-bar/blob/main/DESIGN.md'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <ArrowRight className="size-3" /> {t.docsLinks[2]}
              </a>
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl mt-12">
          <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide text-center mb-6">
            {t.featuresHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.features.map((f) => (
              <div key={f.title} className="rounded-lg border border-[hsl(var(--border))] p-4 hover:border-[hsl(var(--ring))]/30 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-sm font-semibold mb-0.5">{f.title}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-3xl mt-12">
          <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide text-center mb-6">
            {t.syntaxHeading}
          </h2>
          <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {t.syntaxExamples.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[hsl(var(--muted))]/40' : ''}>
                    <td className="px-4 py-2.5 font-mono text-[hsl(var(--foreground))] whitespace-nowrap">
                      {row.syntax}
                    </td>
                    <td className="px-4 py-2.5 text-[hsl(var(--muted-foreground))]">
                      {row.desc}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[hsl(var(--primary))] whitespace-nowrap">
                      {row.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full max-w-3xl mt-12">
          <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide text-center mb-6">
            {t.disciplinesHeading}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
            {t.disciplines.map((d) => (
              <div key={d.name} className="rounded-md border border-[hsl(var(--border))] p-3">
                <div className="font-semibold mb-0.5">{d.name}</div>
                <div className="text-[hsl(var(--muted-foreground))]">{d.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[hsl(var(--border))] py-6 px-4">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href="https://filter-chip-bar.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <BookOpen className="size-4" />
            Storybook
          </a>
          <a
            href="https://github.com/675076143/filter-chip-bar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/filter-chip-bar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Package className="size-4" />
            npm
          </a>
          <a
            href={lang === 'zh' ? 'https://github.com/675076143/filter-chip-bar/blob/main/README.md' : 'https://github.com/675076143/filter-chip-bar/blob/main/README.zh-CN.md'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Globe className="size-4" />
            {lang === 'zh' ? 'English' : '中文文档'}
          </a>
        </div>
        <div className="text-center mt-4 text-xs text-[hsl(var(--muted-foreground))]/60">
          {t.footer}
        </div>
      </footer>
    </div>
  );
}

export default App;
