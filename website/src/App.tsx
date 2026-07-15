import { useEffect, useMemo, useState } from 'react';
import { FilterChipBar, type ChipConfig, type FilterChipBarResult, type TabOption } from 'filter-chip-bar';
import { BookOpen, Check, Clipboard, Github, Moon, Package, RotateCcw, Sun } from 'lucide-react';
import changelogSource from '../../CHANGELOG.md?raw';

type Lang = 'en' | 'zh';
type ScenarioKey = 'orders' | 'issues' | 'logs';
type ResultView = 'expressions' | 'chips' | 'result';

const copy = {
  en: {
    tagline: 'A structured filter and command bar for React applications.',
    intro: 'Combine field filters, free text, keyboard navigation, async options, presets, and commands in one input.',
    demo: 'Interactive demo',
    demoLead: 'Choose a real-world configuration, then type or select one of the examples.',
    scenarios: { orders: 'Orders', issues: 'Issues', logs: 'Logs' },
    reset: 'Reset',
    copyQuery: 'Copy query',
    copied: 'Copied',
    features: 'Capabilities',
    syntax: 'Syntax',
    install: 'Install',
    integrations: 'Integration examples',
    changelog: 'Changelog',
    docs: 'Storybook',
    latest: 'Latest unreleased changes, read directly from CHANGELOG.md.',
    theme: 'Toggle color theme',
    language: '切换到中文',
  },
  zh: {
    tagline: '面向 React 应用的结构化筛选与命令输入框。',
    intro: '在一个输入框中组合字段筛选、自由文本、键盘导航、异步选项、预设和命令。',
    demo: '交互演示',
    demoLead: '选择一个真实业务配置，然后输入或点击示例。',
    scenarios: { orders: '订单', issues: 'Issue', logs: '日志' },
    reset: '重置',
    copyQuery: '复制查询',
    copied: '已复制',
    features: '核心能力',
    syntax: '语法',
    install: '安装',
    integrations: '接入示例',
    changelog: '更新记录',
    docs: 'Storybook',
    latest: '直接读取 CHANGELOG.md 中尚未发布的最新变更。',
    theme: '切换颜色主题',
    language: 'Switch to English',
  },
} as const;

const scenarios: Record<ScenarioKey, { configs: ChipConfig[]; tabs: TabOption[]; examples: string[] }> = {
  orders: {
    configs: [
      { type: 'select', label: 'Status', aliases: ['st'], options: ['Pending', 'Passing', 'Failing'].map((label, value) => ({ label, value })) },
      { type: 'select', label: 'Department', aliases: ['dept'], options: ['Engineering', 'Design', 'Sales'].map(label => ({ label, value: label.toLowerCase() })) },
      { type: 'input', label: 'SKU', aliases: ['sku'] },
      { type: 'numberRange', label: 'Orders', aliases: ['count'], min: 0 },
      { type: 'dateRange', label: 'Created' },
    ],
    tabs: [{ value: -1, label: 'All', count: 1355 }, { value: 0, label: 'Pending', count: 45 }, { value: 1, label: 'Passing', count: 1280 }],
    examples: ['Status:Passing', 'st:Passing Orders:>=500', '-Department:Sales', 'SKU:"iPhone 15 Pro"'],
  },
  issues: {
    configs: [
      { type: 'select', label: 'State', options: ['Open', 'Closed'].map(label => ({ label, value: label.toLowerCase() })) },
      { type: 'multiSelect', label: 'Label', prefix: '#', options: ['bug', 'urgent', 'feature'].map(label => ({ label, value: label })) },
      { type: 'select', label: 'Assignee', prefix: '@', options: ['Robin', 'Alice', 'Bob'].map(label => ({ label, value: label.toLowerCase() })) },
      { type: 'dateRange', label: 'Updated' },
    ],
    tabs: [{ value: -1, label: 'All', count: 218 }, { value: 'open', label: 'Open', count: 76 }, { value: 'closed', label: 'Closed', count: 142 }],
    examples: ['State:Open #bug', '@Robin #urgent', '-State:Closed', 'Updated:近7天'],
  },
  logs: {
    configs: [
      { type: 'select', label: 'Level', aliases: ['lv'], options: ['Debug', 'Info', 'Warn', 'Error'].map(label => ({ label, value: label.toLowerCase() })) },
      { type: 'select', label: 'Service', options: ['api', 'worker', 'billing'].map(label => ({ label, value: label })) },
      { type: 'input', label: 'Trace' },
      { type: 'numberRange', label: 'Duration', min: 0 },
      { type: 'dateRange', label: 'Time' },
    ],
    tabs: [{ value: -1, label: 'All' }, { value: 'error', label: 'Errors' }, { value: 'slow', label: 'Slow requests' }],
    examples: ['Level:Error Service:api', 'Duration:>=500', 'Trace:"req 42"', '-Service:billing timeout'],
  },
};

const installCommands = {
  pnpm: 'pnpm add filter-chip-bar',
  npm: 'npm install filter-chip-bar',
  yarn: 'yarn add filter-chip-bar',
  bun: 'bun add filter-chip-bar',
} as const;

const integrationExamples = {
  default: `import { FilterChipBar } from 'filter-chip-bar';\nimport 'filter-chip-bar/styles';\n\n<FilterChipBar\n  chipConfigs={configs}\n  storageNamespace="orders"\n  onFiltersChange={runQuery}\n/>`,
  headless: `import { useFilterChipBar } from 'filter-chip-bar/headless';\n\nconst filter = useFilterChipBar({\n  chipConfigs: configs,\n  storageNamespace: 'orders',\n  onFiltersChange: runQuery,\n});`,
  antd6: `import FilterChipBarAntd6 from 'filter-chip-bar/antd6';\n\n<FilterChipBarAntd6\n  chipConfigs={configs}\n  storageNamespace="orders"\n  onFiltersChange={runQuery}\n/>`,
} as const;

const syntaxRows = [
  ['key:value', 'Status:Passing'],
  ['-key:value', '-Status:Failing'],
  ['key:a,b', 'Label:bug,urgent'],
  ['key:>=n', 'Orders:>=100'],
  ['key:a~b', 'Created:2026-07-01~2026-07-15'],
  ['key:"two words"', 'Name:"iPhone 15"'],
];

const features = [
  ['Structured output', 'Receive both the legacy chips map and typed field/operator/value expressions.'],
  ['Keyboard first', 'Navigate suggestions and commit filters without leaving the input.'],
  ['Async options', 'Load cascading options with cancellation through AbortSignal.'],
  ['Renderer choices', 'Use the default renderer, Ant Design 6, shared primitives, or the headless hook.'],
  ['Local persistence', 'Namespace presets and recent searches, or inject a custom storage adapter.'],
  ['Serializable queries', 'searchText remains the source of truth for URLs, sharing, and controlled state.'],
];

function extractUnreleased(markdown: string): string[] {
  const section = markdown.split('## [Unreleased]')[1]?.split(/\n## /)[0] ?? '';
  return section.split('\n').map(line => line.trim()).filter(line => line.startsWith('- ')).map(line => line.slice(2));
}

function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light');
  const [scenario, setScenario] = useState<ScenarioKey>('orders');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FilterChipBarResult | null>(null);
  const [resultView, setResultView] = useState<ResultView>('expressions');
  const [manager, setManager] = useState<keyof typeof installCommands>('pnpm');
  const [integration, setIntegration] = useState<keyof typeof integrationExamples>('default');
  const [copied, setCopied] = useState<string | null>(null);
  const t = copy[lang];
  const current = scenarios[scenario];
  const changes = useMemo(() => extractUnreleased(changelogSource), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('site-theme', theme);
  }, [theme]);

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const switchScenario = (next: ScenarioKey) => {
    setScenario(next);
    setQuery('');
    setResult(null);
  };

  const visibleResult = resultView === 'expressions' ? result?.expressions : resultView === 'chips' ? result?.chips : result;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top">filter-chip-bar</a>
        <div className="nav-links">
          <a href="#demo">Demo</a><a href="#features">Features</a><a href="#syntax">Syntax</a><a href="#install">Install</a><a href="#changelog">Changelog</a>
        </div>
        <div className="nav-actions">
          <button aria-label={t.language} onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中文' : 'EN'}</button>
          <button aria-label={t.theme} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}</button>
          <a href="https://github.com/675076143/filter-chip-bar" aria-label="GitHub"><Github size={17}/></a>
        </div>
      </nav>

      <main id="main" className="page">
        <header id="top" className="hero">
          <div className="status-row"><span>React</span><span>TypeScript 7</span><span>Node 26</span><span>68 tests</span></div>
          <h1>filter-chip-bar</h1>
          <p className="tagline">{t.tagline}</p>
          <p className="hero-copy">{t.intro}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#demo">{t.demo}</a>
            <a className="btn btn-secondary" href="https://filter-chip-bar.vercel.app"><BookOpen size={15}/>{t.docs}</a>
          </div>
        </header>

        <section id="demo">
          <div className="section-heading"><span>01</span><div><h2>{t.demo}</h2><p>{t.demoLead}</p></div></div>
          <div className="segmented" aria-label="Demo scenario">
            {(Object.keys(scenarios) as ScenarioKey[]).map(key => <button key={key} aria-pressed={scenario === key} onClick={() => switchScenario(key)}>{t.scenarios[key]}</button>)}
          </div>
          <div className="demo-shell">
            <FilterChipBar
              chipConfigs={current.configs}
              tabs={current.tabs}
              storageNamespace={`website-${scenario}`}
              value={query}
              onValueChange={setQuery}
              onFiltersChange={setResult}
              locale={lang}
            />
            <div className="example-row">
              {current.examples.map(example => <button key={example} onClick={() => setQuery(example)}>{example}</button>)}
            </div>
            <div className="demo-actions">
              <button onClick={() => { setQuery(''); setResult(null); }}><RotateCcw size={14}/>{t.reset}</button>
              <button disabled={!query} onClick={() => copyText('query', query)}>{copied === 'query' ? <Check size={14}/> : <Clipboard size={14}/>} {copied === 'query' ? t.copied : t.copyQuery}</button>
            </div>
          </div>
          <div className="result-card">
            <div className="result-tabs">
              {(['expressions', 'chips', 'result'] as ResultView[]).map(view => <button key={view} aria-pressed={resultView === view} onClick={() => setResultView(view)}>{view}</button>)}
            </div>
            <pre>{JSON.stringify(visibleResult ?? (resultView === 'expressions' ? [] : {}), null, 2)}</pre>
          </div>
        </section>

        <section id="features">
          <div className="section-heading"><span>02</span><div><h2>{t.features}</h2></div></div>
          <div className="feature-grid">{features.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section id="syntax">
          <div className="section-heading"><span>03</span><div><h2>{t.syntax}</h2></div></div>
          <div className="syntax-grid">{syntaxRows.map(([syntax, example]) => <div key={syntax}><code>{syntax}</code><span>{example}</span></div>)}</div>
        </section>

        <section id="install">
          <div className="section-heading"><span>04</span><div><h2>{t.install}</h2></div></div>
          <div className="code-card">
            <div className="tab-row">{(Object.keys(installCommands) as Array<keyof typeof installCommands>).map(key => <button key={key} aria-pressed={manager === key} onClick={() => setManager(key)}>{key}</button>)}</div>
            <pre><code>{installCommands[manager]}</code></pre>
            <button className="copy-button" aria-label="Copy install command" onClick={() => copyText('install', installCommands[manager])}>{copied === 'install' ? <Check size={15}/> : <Clipboard size={15}/>}</button>
          </div>
        </section>

        <section id="integrations">
          <div className="section-heading"><span>05</span><div><h2>{t.integrations}</h2></div></div>
          <div className="code-card">
            <div className="tab-row">{(Object.keys(integrationExamples) as Array<keyof typeof integrationExamples>).map(key => <button key={key} aria-pressed={integration === key} onClick={() => setIntegration(key)}>{key}</button>)}</div>
            <pre><code>{integrationExamples[integration]}</code></pre>
            <button className="copy-button" aria-label="Copy integration example" onClick={() => copyText('integration', integrationExamples[integration])}>{copied === 'integration' ? <Check size={15}/> : <Clipboard size={15}/>}</button>
          </div>
        </section>

        <section id="changelog">
          <div className="section-heading"><span>06</span><div><h2>{t.changelog}</h2><p>{t.latest}</p></div></div>
          <div className="changelog-card"><strong>Unreleased</strong><ul>{changes.map(change => <li key={change}>{change}</li>)}</ul><a href="https://github.com/675076143/filter-chip-bar/blob/main/CHANGELOG.md">View full changelog →</a></div>
        </section>

        <footer><span>MIT License</span><div><a href="https://filter-chip-bar.vercel.app">Storybook</a><a href="https://www.npmjs.com/package/filter-chip-bar"><Package size={14}/>npm</a><a href="https://github.com/675076143/filter-chip-bar"><Github size={14}/>GitHub</a></div></footer>
      </main>
    </>
  );
}

export default App;
