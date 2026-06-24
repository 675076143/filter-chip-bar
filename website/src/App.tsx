import { useState } from 'react';
import { FilterChipBar, type ChipConfig, type TabOption, type FilterChipBarResult } from 'filter-chip-bar';
import { BookOpen, Package, Globe, Github, FileText } from 'lucide-react';

const i18n = {
  en: {
    eyebrow: 'Design System · v0.2.0',
    heroTitle: 'filter-chip-bar',
    tagline: 'Search as the entry point. One box to filter, navigate, and command.',
    placeholder: 'Search or type filters...  (try: st:pass or #urgent)',
    tryLabel: 'Try:',
    orType: 'Or type',
    forActions: 'for quick actions',
    resultLabel: 'onFiltersChange result',
    quickStart: 'Quick Start',
    copy: 'copy',
    demoNum: '00 · Demo',
    demoTItle: 'Try It Live',
    demoDesc: 'Type a filter value like "Passing" and see it auto-suggest the matching field. Click any example below to pre-fill.',
    featuresNum: '01 · Features',
    featuresTitle: 'Capabilities',
    featuresDesc: 'Nine features, each backed by a discipline: math, comms theory, psychology, physics, engineering, and philosophy.',
    syntaxNum: '02 · Syntax',
    syntaxTitle: 'Search Syntax',
    syntaxDesc: 'One input box supports structured filtering, negation, aliases, prefixes, commands, and auto-correction.',
    syntaxExamples: [
      { syntax: 'key:value', desc: 'Filter by field', example: 'Status:Passing' },
      { syntax: '-key:value', desc: 'Exclude (negation)', example: '-Status:Pending' },
      { syntax: 'key:val1,val2', desc: 'Multi-value', example: 'Status:Passing,Failing' },
      { syntax: 'alias:value', desc: 'Shortcut (alias)', example: 'st:pass' },
      { syntax: '#tag', desc: 'Prefix syntax', example: '#urgent' },
      { syntax: '@user', desc: 'Mention syntax', example: '@Robin' },
      { syntax: '/command', desc: 'Slash command', example: '/docs' },
      { syntax: 'key:>=100', desc: 'Numeric compare', example: 'Orders:>=500' },
      { syntax: 'key:100~200', desc: 'Numeric range', example: 'Orders:100~500' },
      { syntax: 'typo', desc: 'Auto-correct (FEC)', example: 'Pasing → Passing' },
      { syntax: '"value"', desc: 'Cross-field suggestion', example: 'Passing → Status:Passing' },
      { syntax: 'free text', desc: 'Full-text search', example: 'kxccaqvx12' },
    ],
    installNum: '03 · Install',
    installTitle: 'Quick Start',
    installDesc: 'One command, then import and render. Headless hook for custom UIs, built-in shadcn and antd6 renderers.',
    architectureNum: '04 · Architecture',
    architectureTitle: 'Headless by Design',
    architectureDesc: 'useFilterChipBar() is pure logic with zero UI dependency. Renderers are separate — shadcn (default), antd6, or build your own.',
    footer: 'MIT License · Built with React + Radix UI + Tailwind CSS',
    features: [
      { title: 'Structured Filtering', desc: 'Type Status:Passing to filter by field. Negation with -Status:Pending.', icon: '🔍' },
      { title: 'Multi-Protocol Prefix', desc: '#tag for tags, @user for mentions, /cmd for actions — mix freely in one box.', icon: '#️⃣' },
      { title: 'Label Aliases', desc: 'st:pass = Status:Passing. Shortcuts for frequently used fields.', icon: '⚡' },
      { title: 'Typo Correction', desc: 'Misspelled a value? "Did you mean Passing?" — one click to fix via FEC.', icon: '🛡️' },
      { title: 'Value Discovery', desc: 'Type a value like "Passing" and get the matching field suggested automatically.', icon: '🎯' },
      { title: 'Command Palette', desc: 'Type /docs or /install for quick navigation and actions.', icon: '⌘' },
      { title: 'Cascading Filters', desc: 'Selecting a department automatically filters available teams.', icon: '🔗' },
      { title: 'Progressive Hints', desc: 'Tips appear after a few uses — learn as you go, no tutorials needed.', icon: '💡' },
      { title: 'Case Insensitive', desc: 'status:passing works the same as Status:Passing throughout.', icon: '🔤' },
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
    eyebrow: '设计系统 · v0.2.0',
    heroTitle: 'filter-chip-bar',
    tagline: '搜索即入口。一个框，筛选、导航、执行操作。',
    placeholder: '搜索或输入筛选条件...  (试试: st:pass 或 #urgent)',
    tryLabel: '试试:',
    orType: '或输入',
    forActions: '执行快捷操作',
    resultLabel: 'onFiltersChange 结果',
    quickStart: '快速开始',
    copy: '复制',
    demoNum: '00 · 演示',
    demoTItle: '在线体验',
    demoDesc: '直接输入筛选值如 "Passing"，系统自动提示对应字段。点击下方示例快速填充。',
    featuresNum: '01 · 特性',
    featuresTitle: '核心能力',
    featuresDesc: '九个特性，各有学科支撑：数学、通信学、心理学、物理学、工程学、哲学。',
    syntaxNum: '02 · 语法',
    syntaxTitle: '搜索语法',
    syntaxDesc: '一个输入框支持结构化筛选、排除、别名、前缀、命令、自动纠错。',
    syntaxExamples: [
      { syntax: 'key:value', desc: '按字段筛选', example: 'Status:Passing' },
      { syntax: '-key:value', desc: '排除匹配项', example: '-Status:Pending' },
      { syntax: 'key:val1,val2', desc: '多值选择', example: 'Status:Passing,Failing' },
      { syntax: 'alias:value', desc: '别名简写', example: 'st:pass' },
      { syntax: '#tag', desc: '前缀语法', example: '#urgent' },
      { syntax: '@user', desc: '提及语法', example: '@Robin' },
      { syntax: '/command', desc: '斜杠命令', example: '/docs' },
      { syntax: 'key:>=100', desc: '数值比较', example: 'Orders:>=500' },
      { syntax: 'key:100~200', desc: '数值区间', example: 'Orders:100~500' },
      { syntax: '笔误', desc: '自动纠错 (FEC)', example: 'Pasing → Passing' },
      { syntax: '"值"', desc: '跨字段建议', example: 'Passing → Status:Passing' },
      { syntax: '自由文本', desc: '全文搜索', example: 'kxccaqvx12' },
    ],
    installNum: '03 · 安装',
    installTitle: '快速开始',
    installDesc: '一行命令安装，导入即用。Headless hook 适合自定义 UI，内置 shadcn / antd6 渲染器。',
    architectureNum: '04 · 架构',
    architectureTitle: 'Headless 设计',
    architectureDesc: 'useFilterChipBar() 纯逻辑零 UI 依赖。渲染器独立——shadcn（默认）、antd6，或自己写。',
    footer: 'MIT 协议 · 基于 React + Radix UI + Tailwind CSS',
    features: [
      { title: '结构化筛选', desc: '输入 Status:Passing 按字段筛选。-Status:Pending 排除匹配。', icon: '🔍' },
      { title: '多协议前缀', desc: '#tag 标签、@user 提及、/cmd 命令，一个框里混用。', icon: '#️⃣' },
      { title: '标签别名', desc: 'st:pass = Status:Passing。常用字段的简写。', icon: '⚡' },
      { title: '笔误纠正', desc: '打错了？"Did you mean Passing?" 一键修正。', icon: '🛡️' },
      { title: '智能值匹配', desc: '输入 "Passing"，自动建议对应字段 "Status:Passing"。', icon: '🎯' },
      { title: '命令面板', desc: '输入 /docs 或 /install 快速导航和执行操作。', icon: '⌘' },
      { title: '级联筛选', desc: '选了部门后，团队列表自动过滤为该部门的团队。', icon: '🔗' },
      { title: '渐进提示', desc: '用过几次后自动弹出功能提示——边用边学。', icon: '💡' },
      { title: '大小写不敏感', desc: 'status:passing 和 Status:Passing 效果相同。', icon: '🔤' },
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
    type: 'select',
    label: 'User',
    prefix: '@',
    options: [
      { value: 'robin', label: 'Robin' },
      { value: 'alice', label: 'Alice' },
      { value: 'bob', label: 'Bob' },
    ],
  },
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
  '@Robin',
  '/docs',
  'Status:Pasing',
  'Passing',
  'SKU:kxccaqvx12',
];

function App() {
  const [result, setResult] = useState<FilterChipBarResult | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [initialText, setInitialText] = useState('');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [copied, setCopied] = useState(false);
  const t = i18n[lang];

  return (
    <div style={{ background: 'var(--canvas)', color: 'var(--near-black)', fontFamily: 'var(--serif)', minHeight: '100vh' }}>
      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '88px 64px 120px' }}>
        {/* ============ HERO ============ */}
        <header style={{ paddingBottom: '40px', borderBottom: '1px solid var(--border-cream)', marginBottom: '48px' }}>
          <div className="eyebrow">
            <span>{t.eyebrow}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
                className="btn-ghost"
                style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
              >
                {lang === 'en' ? '中文' : 'English'}
              </button>
              <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener" aria-label="GitHub">
                <Github size={15} />
              </a>
            </span>
          </div>
          <h1 className="hero-title">
            filter-chip-bar<span className="cn">欄</span>
          </h1>
          <p className="section-lede" style={{ fontSize: '17px', maxWidth: '640px', marginBottom: '20px' }}>
            {t.tagline}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="tag" style={{ background: '#EEF2F7', color: 'var(--brand)' }}>React 17+</span>
            <span className="tag" style={{ background: '#EEF2F7', color: 'var(--brand)' }}>Headless Hook</span>
            <span className="tag" style={{ background: '#EEF2F7', color: 'var(--brand)' }}>Shadcn + Antd6</span>
            <span className="tag" style={{ background: '#EEF2F7', color: 'var(--brand)' }}>48 Tests</span>
          </div>
        </header>

        {/* ============ 00 · DEMO ============ */}
        <section style={{ marginBottom: '72px' }}>
          <p className="section-num">{t.demoNum}</p>
          <h2 className="section-title">{t.demoTItle}</h2>
          <p className="section-lede">{t.demoDesc}</p>

          <div className="card" style={{ marginBottom: '20px' }}>
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
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--stone)' }}>{t.tryLabel}</span>
            {examples.map((ex) => (
              <button
                key={ex}
                className="try-btn"
                onClick={() => {
                  setInitialText(ex);
                  setMountKey((k) => k + 1);
                }}
              >
                {ex}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--stone)' }}>
            {t.orType} <code style={{ fontFamily: 'var(--mono)', fontSize: '11px', background: 'var(--ivory)', padding: '1px 6px', borderRadius: '3px' }}>/docs</code>{' '}
            <code style={{ fontFamily: 'var(--mono)', fontSize: '11px', background: 'var(--ivory)', padding: '1px 6px', borderRadius: '3px' }}>/install</code>{' '}
            <code style={{ fontFamily: 'var(--mono)', fontSize: '11px', background: 'var(--ivory)', padding: '1px 6px', borderRadius: '3px' }}>/github</code>{' '}
            {t.forActions}
          </p>

          {result && (result.searchText || (result.chips && Object.keys(result.chips).length > 0)) && (
            <div className="result-panel" style={{ marginTop: '16px' }}>
              <span className="label">{t.resultLabel}</span>
              {JSON.stringify(result, null, 2)}
            </div>
          )}
        </section>

        {/* ============ 01 · FEATURES ============ */}
        <section style={{ marginBottom: '72px' }}>
          <p className="section-num">{t.featuresNum}</p>
          <h2 className="section-title">{t.featuresTitle}</h2>
          <p className="section-lede">{t.featuresDesc}</p>

          <div className="feature-grid">
            {t.features.map((f) => (
              <div key={f.title} className="feature-card">
                <span className="icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="quote-bar" style={{ marginTop: '32px' }}>
            Beauty = constraints × intention ÷ noise. One accent, warm neutrals, serif authority, generous whitespace.
          </div>
        </section>

        {/* ============ 02 · SYNTAX ============ */}
        <section style={{ marginBottom: '72px' }}>
          <p className="section-num">{t.syntaxNum}</p>
          <h2 className="section-title">{t.syntaxTitle}</h2>
          <p className="section-lede">{t.syntaxDesc}</p>

          <div style={{ background: 'var(--ivory)', border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <table className="syntax-table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                {t.syntaxExamples.map((row, i) => (
                  <tr key={i}>
                    <td>{row.syntax}</td>
                    <td>{row.desc}</td>
                    <td>{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ 03 · INSTALL ============ */}
        <section style={{ marginBottom: '72px' }}>
          <p className="section-num">{t.installNum}</p>
          <h2 className="section-title">{t.installTitle}</h2>
          <p className="section-lede">{t.installDesc}</p>

          <div className="code-block">
            <span className="c">$ </span>npm install filter-chip-bar
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => { navigator.clipboard.writeText('npm install filter-chip-bar'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? 'Copied' : t.copy}
            </button>
            <a href="https://filter-chip-bar.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost">Storybook →</a>
            <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener noreferrer" className="btn-ghost">GitHub →</a>
          </div>
        </section>

        {/* ============ 04 · ARCHITECTURE ============ */}
        <section style={{ marginBottom: '72px' }}>
          <p className="section-num">{t.architectureNum}</p>
          <h2 className="section-title">{t.architectureTitle}</h2>
          <p className="section-lede">{t.architectureDesc}</p>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 500, color: 'var(--near-black)', marginBottom: '8px' }}>
              useFilterChipBar()
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', marginBottom: '16px' }}>
              headless hook · zero UI deps
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="tag">shadcn (default)</span>
              <span className="tag">antd6</span>
              <span className="tag">custom</span>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid var(--border-cream)', padding: '40px 64px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <a href="https://filter-chip-bar.vercel.app" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} /> Storybook
            </a>
            <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Github size={14} /> GitHub
            </a>
            <a href="https://www.npmjs.com/package/filter-chip-bar" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> npm
            </a>
            <a href="https://www.robin-tech.top/programming/yi-ge-sou-suo-kuang-de-shi-shi.html" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> Blog
            </a>
            <a href={lang === 'zh' ? 'https://github.com/675076143/filter-chip-bar/blob/main/README.md' : 'https://github.com/675076143/filter-chip-bar/blob/main/README.zh-CN.md'} target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> {lang === 'zh' ? 'English' : '中文'}
            </a>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--stone)' }}>
            {t.footer}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
