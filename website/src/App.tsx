import { useState } from 'react';
import { FilterChipBar, type ChipConfig, type TabOption, type FilterChipBarResult } from 'filter-chip-bar';
import { BookOpen, Package, Globe, Github, FileText } from 'lucide-react';

const i18n = {
  en: {
    eyebrow: 'Design System · v0.2.0',
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
    featuresDesc: 'Structured filters, keyboard navigation, async options, presets, and renderer choices.',
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
      { syntax: 'typo', desc: 'Nearby value suggestion', example: 'Pasing → Passing' },
      { syntax: '"value"', desc: 'Cross-field suggestion', example: 'Passing → Status:Passing' },
      { syntax: 'free text', desc: 'Full-text search', example: 'kxccaqvx12' },
      { syntax: 'date:range', desc: 'Date range shortcuts', example: 'Created:近7天 → 2026-06-20~2026-06-26' },
      { syntax: 'date:picker', desc: 'Date range picker', example: '→ 📅 日期范围选择器' },
    ],
    installNum: '03 · Install',
    installTitle: 'Quick Start',
    installDesc: 'One command, then import and render. Headless hook for custom UIs, built-in shadcn and antd6 renderers.',
    architectureNum: '04 · Architecture',
    architectureTitle: 'Headless by Design',
    architectureDesc: 'useFilterChipBar() is pure logic with zero UI dependency. Renderers are separate — shadcn (default), antd6, or build your own.',
    changelogNum: '05 · Changelog',
    changelogTitle: 'Recent Changes',
    changelogDesc: 'Release notes and migration-relevant changes from the repository changelog.',
    footer: 'MIT License · Built with React + Radix UI + Tailwind CSS',
    features: [
      { title: 'Structured Filtering', desc: 'Type Status:Passing to filter by field. Negation with -Status:Pending.', icon: '🔍' },
      { title: 'Multi-Protocol Prefix', desc: '#tag for tags, @user for mentions, /cmd for actions — mix freely in one box.', icon: '#️⃣' },
      { title: 'Label Aliases', desc: 'st:pass = Status:Passing. Shortcuts for frequently used fields.', icon: '⚡' },
      { title: 'Typo Suggestions', desc: 'Nearby valid values are offered when there is no exact match.', icon: '🛡️' },
      { title: 'Value Discovery', desc: 'Type a value like "Passing" and get the matching field suggested automatically.', icon: '🎯' },
      { title: 'Command Palette', desc: 'Type /docs or /install for quick navigation and actions.', icon: '⌘' },
      { title: 'Cascading Filters', desc: 'Selecting a department automatically filters available teams.', icon: '🔗' },
      { title: 'Progressive Hints', desc: 'Tips appear after a few uses — learn as you go, no tutorials needed.', icon: '💡' },
      { title: 'Case Insensitive', desc: 'status:passing works the same as Status:Passing throughout.', icon: '🔤' },
    ],
  },
  zh: {
    eyebrow: '设计系统 · v0.2.0',
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
    featuresDesc: '结构化筛选、键盘导航、异步选项、预设和多套渲染器。',
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
      { syntax: '笔误', desc: '相近值建议', example: 'Pasing → Passing' },
      { syntax: '"值"', desc: '跨字段建议', example: 'Passing → Status:Passing' },
      { syntax: '自由文本', desc: '全文搜索', example: 'kxccaqvx12' },
      { syntax: '日期:range', desc: '日期快捷范围', example: 'Created:近7天 → 2026-06-20~2026-06-26' },
      { syntax: '日期:picker', desc: '日期选择器', example: '→ 📅 日期范围选择器' },
    ],
    installNum: '03 · 安装',
    installTitle: '快速开始',
    installDesc: '一行命令安装，导入即用。Headless hook 适合自定义 UI，内置 shadcn / antd6 渲染器。',
    architectureNum: '04 · 架构',
    architectureTitle: 'Headless 设计',
    architectureDesc: 'useFilterChipBar() 纯逻辑零 UI 依赖。渲染器独立——shadcn（默认）、antd6，或自己写。',
    changelogNum: '05 · 更新记录',
    changelogTitle: '最近变更',
    changelogDesc: '从仓库 Changelog 摘取与接入和迁移相关的变更。',
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
  },
} as const;

const recentChanges = {
  en: [
    'Migrated builds and publishing to pnpm workspaces and Node.js 26.',
    'Upgraded to TypeScript 7.0.2 with declarations emitted by TypeScript.',
    'Added controlled values, duplicate policies, and abortable async options.',
    'Fixed quoted-value parsing, keyboard navigation, and renderer ARIA links.',
  ],
  zh: [
    '构建与发布迁移到 pnpm workspace 和 Node.js 26。',
    '升级 TypeScript 7.0.2，由 TypeScript 直接生成声明文件。',
    '新增受控值、重复字段策略和可中止异步选项。',
    '修复引号值解析、键盘导航和渲染器 ARIA 关联。',
  ],
} as const;

const chipConfigs: ChipConfig[] = [
  {
    type: 'select', label: 'Status', aliases: ['st'],
    options: [{ value: 0, label: 'Pending' },{ value: 1, label: 'Passing' },{ value: 2, label: 'Failing' },{ value: 3, label: 'Anomalous' }],
  },
  {
    type: 'select', label: 'Department', aliases: ['dept'],
    options: [{ value: 'eng', label: 'Engineering' },{ value: 'design', label: 'Design' },{ value: 'sales', label: 'Sales' }],
  },
  { type: 'input', label: 'SKU', aliases: ['sku'] },
  { type: 'input', label: 'Name', aliases: ['name'] },
  { type: 'numberRange', label: 'Orders', aliases: ['orders'], min: 0 },
  { type: 'select', label: 'User', prefix: '@', options: [{ value: 'robin', label: 'Robin' },{ value: 'alice', label: 'Alice' },{ value: 'bob', label: 'Bob' }] },
  { type: 'multiSelect', label: 'Tags', prefix: '#', options: [{ value: 'urgent', label: 'urgent' },{ value: 'bug', label: 'bug' },{ value: 'feature', label: 'feature' }] },
  { type: 'dateRange', label: 'Created' },
  { type: 'dateRange', label: 'Updated' },
];

const tabs: TabOption[] = [
  { value: -1, label: 'All', count: 1355 },
  { value: 0, label: 'Pending', count: 45 },
  { value: 1, label: 'Passing', count: 1280 },
  { value: 2, label: 'Failing', count: 23 },
  { value: 3, label: 'Anomalous', count: 7 },
];

const examples = ['Status:Passing','st:pass','Status:Passing,Failing','Orders:>=500','-Status:Pending','#urgent','@Robin','/docs','Status:Pasing','Passing','SKU:kxccaqvx12'];

function App() {
  const [result, setResult] = useState<FilterChipBarResult | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [initialText, setInitialText] = useState('');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [copied, setCopied] = useState(false);
  const t = i18n[lang];

  return (
    <main className="page">
      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="eyebrow">
          <span>{t.eyebrow} · 2026.06</span>
          <span className="eyebrow-links">
            <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="btn-ghost" style={{fontSize:11,padding:'3px 10px',height:'auto'}}>
              {lang === 'en' ? '中文' : 'English'}
            </button>
            <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener" aria-label="GitHub"><Github size={14} /></a>
          </span>
        </div>
        <h1>filter-chip-bar</h1>
        <p className="tagline">{t.tagline}</p>
      </header>

      {/* ============ 00 · DEMO ============ */}
      <section>
        <p className="section-num">{t.demoNum}</p>
        <h2 className="section-title">{t.demoTItle}</h2>
        <p className="section-lede">{t.demoDesc}</p>
        <div className="comp">
          <p className="hint">{lang === 'en' ? 'Interactive demo · shadcn renderer · type to see live suggestions' : '交互演示 · shadcn 渲染器 · 键入即见实时建议'}</p>
          <div className="demo">
            <FilterChipBar
              key={mountKey}
              chipConfigs={chipConfigs}
              storageNamespace="website-demo"
              tabs={tabs}
              onFiltersChange={setResult}
              initialSearchText={initialText}
              locale={lang}
              commands={[
                { keywords: ['docs','storybook','documentation'], label: lang === 'zh' ? '查看文档' : 'View Documentation', hint: 'Open Storybook', action: () => window.open('https://filter-chip-bar.vercel.app', '_blank') },
                { keywords: ['github','source','code'], label: lang === 'zh' ? '查看源码' : 'View Source', hint: 'GitHub', action: () => window.open('https://github.com/675076143/filter-chip-bar', '_blank') },
                { keywords: ['install','pnpm','download'], label: 'pnpm add filter-chip-bar', hint: lang === 'zh' ? '复制命令' : 'Copy command', action: () => navigator.clipboard.writeText('pnpm add filter-chip-bar') },
              ]}
            />
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',marginTop:20}}>
            <span style={{fontSize:11,color:'var(--stone)',fontWeight:500,letterSpacing:'0.8px',textTransform:'uppercase'}}>{t.tryLabel}</span>
            {examples.map(ex => <button key={ex} className="tag" style={{cursor:'pointer',border:'none',background:'#EEF2F7',fontFamily:'var(--mono)',fontSize:11}} onClick={() => { setInitialText(ex); setMountKey(k=>k+1); }}>{ex}</button>)}
          </div>
          <p className="hint" style={{marginTop:14,marginBottom:0}}>
            {t.orType} <code style={{fontFamily:'var(--mono)',fontSize:11,background:'#EEF2F7',color:'var(--brand)',padding:'1px 5px',borderRadius:2}}>/docs</code>{' '}
            <code style={{fontFamily:'var(--mono)',fontSize:11,background:'#EEF2F7',color:'var(--brand)',padding:'1px 5px',borderRadius:2}}>/install</code>{' '}
            <code style={{fontFamily:'var(--mono)',fontSize:11,background:'#EEF2F7',color:'var(--brand)',padding:'1px 5px',borderRadius:2}}>/github</code>{' '}
            {t.forActions}
          </p>
        </div>
        {result && (result.searchText || (result.chips && Object.keys(result.chips).length > 0)) && (
          <div className="result-panel" style={{marginTop:16}}>
            <span className="label">{t.resultLabel}</span>
            {JSON.stringify(result, null, 2)}
          </div>
        )}
      </section>

      {/* ============ 01 · FEATURES ============ */}
      <section>
        <p className="section-num">{t.featuresNum}</p>
        <h2 className="section-title">{t.featuresTitle}</h2>
        <p className="section-lede">{t.featuresDesc}</p>
        <div className="feature-grid">
          {t.features.map(f => (
            <div key={f.title} className="feature-card">
              <span className="icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 02 · SYNTAX ============ */}
      <section>
        <p className="section-num">{t.syntaxNum}</p>
        <h2 className="section-title">{t.syntaxTitle}</h2>
        <p className="section-lede">{t.syntaxDesc}</p>
        <div className="syntax-wrap">
          <table className="syntax-table">
            <thead><tr><th>Syntax</th><th>{lang === 'en' ? 'Description' : '说明'}</th><th>{lang === 'en' ? 'Example' : '示例'}</th></tr></thead>
            <tbody>
              {t.syntaxExamples.map((row,i) => (
                <tr key={i}><td>{row.syntax}</td><td>{row.desc}</td><td>{row.example}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ 03 · INSTALL ============ */}
      <section>
        <p className="section-num">{t.installNum}</p>
        <h2 className="section-title">{t.installTitle}</h2>
        <p className="section-lede">{t.installDesc}</p>
        <pre className="code-block"><span className="c">$ </span>pnpm add filter-chip-bar</pre>
        <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText('pnpm add filter-chip-bar'); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>{copied ? 'Copied' : t.copy}</button>
          <a href="https://filter-chip-bar.vercel.app" target="_blank" rel="noopener" className="btn btn-secondary" style={{textDecoration:'none'}}>Storybook →</a>
          <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener" className="btn btn-secondary" style={{textDecoration:'none'}}>GitHub →</a>
        </div>
      </section>

      {/* ============ 04 · ARCHITECTURE ============ */}
      <section>
        <p className="section-num">{t.architectureNum}</p>
        <h2 className="section-title">{t.architectureTitle}</h2>
        <p className="section-lede">{t.architectureDesc}</p>
        <div className="arch-card">
          <div style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:500,color:'var(--near-black)',marginBottom:6}}>useFilterChipBar()</div>
          <p style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--stone)',margin:'0 0 16px'}}>headless hook · zero UI deps</p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <span className="tag standard">shadcn (default)</span>
            <span className="tag standard">antd6</span>
            <span className="tag standard">custom</span>
          </div>
        </div>
      </section>

      <section>
        <p className="section-num">{t.changelogNum}</p>
        <h2 className="section-title">{t.changelogTitle}</h2>
        <p className="section-lede">{t.changelogDesc}</p>
        <div className="changelog-card">
          <div className="changelog-version">Unreleased</div>
          <ul>
            {recentChanges[lang].map(change => <li key={change}>{change}</li>)}
          </ul>
          <a href="https://github.com/675076143/filter-chip-bar/blob/main/CHANGELOG.md" target="_blank" rel="noopener" className="footer-link">
            {lang === 'zh' ? '查看完整 Changelog →' : 'View full changelog →'}
          </a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer" style={{marginTop:80}}>
        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          <a href="https://filter-chip-bar.vercel.app" target="_blank" rel="noopener" className="footer-link" style={{display:'flex',alignItems:'center',gap:4}}><BookOpen size={13} /> Storybook</a>
          <a href="https://github.com/675076143/filter-chip-bar" target="_blank" rel="noopener" className="footer-link" style={{display:'flex',alignItems:'center',gap:4}}><Github size={13} /> GitHub</a>
          <a href="https://www.npmjs.com/package/filter-chip-bar" target="_blank" rel="noopener" className="footer-link" style={{display:'flex',alignItems:'center',gap:4}}><Package size={13} /> npm</a>
          <a href="https://www.robin-tech.top/programming/yi-ge-sou-suo-kuang-de-shi-shi.html" target="_blank" rel="noopener" className="footer-link" style={{display:'flex',alignItems:'center',gap:4}}><FileText size={13} /> Blog</a>
          <a href={lang === 'zh' ? 'https://github.com/675076143/filter-chip-bar/blob/main/README.md' : 'https://github.com/675076143/filter-chip-bar/blob/main/README.zh-CN.md'} target="_blank" rel="noopener" className="footer-link" style={{display:'flex',alignItems:'center',gap:4}}><Globe size={13} /> {lang === 'zh' ? 'English' : '中文'}</a>
        </div>
        <p className="footer-colophon">{t.footer}</p>
      </footer>
    </main>
  );
}

export default App;
