import { useState } from 'react';
import { FilterChipBar, type ChipConfig, type TabOption, type FilterChipBarResult } from 'filter-chip-bar';
import { BookOpen, Package, Globe } from 'lucide-react';

const chipConfigs: ChipConfig[] = [
  {
    type: 'select',
    label: 'Status',
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
    options: [
      { value: 'eng', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'sales', label: 'Sales' },
    ],
  },
  { type: 'input', label: 'SKU' },
  { type: 'input', label: 'Name' },
  { type: 'numberRange', label: 'Orders', min: 0 },
];

const tabs: TabOption[] = [
  { value: -1, label: 'All' },
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Passing' },
  { value: 2, label: 'Failing' },
];

const examples = [
  'Status:Passing',
  'Status:Passing,Failing',
  'Orders:>=500',
  '-Status:Pending',
  'SKU:kxccaqvx12',
];

function App() {
  const [result, setResult] = useState<FilterChipBarResult | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [initialText, setInitialText] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-center mb-3">
          filter-chip-bar
        </h1>
        <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] mb-10 text-center font-medium">
          Search as the entry point. Simple, yet powerful.
        </p>

        <div className="w-full max-w-2xl">
          <FilterChipBar
            key={mountKey}
            chipConfigs={chipConfigs}
            storageNamespace="website-demo"
            tabs={tabs}
            onFiltersChange={setResult}
            initialSearchText={initialText}
            commands={[
              {
                keywords: ['docs', 'storybook', 'documentation'],
                label: 'View Documentation',
                hint: 'Open Storybook',
                action: () => window.open('https://filter-chip-bar.vercel.app', '_blank'),
              },
              {
                keywords: ['github', 'source', 'code'],
                label: 'View Source',
                hint: 'GitHub',
                action: () => window.open('https://github.com/675076143/filter-chip-bar', '_blank'),
              },
              {
                keywords: ['install', 'npm', 'download'],
                label: 'npm install',
                hint: 'Copy command',
                action: () => {
                  navigator.clipboard.writeText('npm install filter-chip-bar');
                },
              },
            ]}
          />

          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">
                Try:
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
              Or type <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">docs</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">install</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-mono text-[10px]">github</kbd>{' '}
              for quick actions
            </p>
          </div>

          {result && (result.searchText || result.chips && Object.keys(result.chips).length > 0) && (
            <div className="mt-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
              <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                onFiltersChange result
              </div>
              <pre className="text-xs font-mono text-[hsl(var(--foreground))] overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
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
            <BookOpen className="size-4" />
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
            href="https://github.com/675076143/filter-chip-bar/blob/main/README.zh-CN.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Globe className="size-4" />
            中文文档
          </a>
        </div>
        <div className="text-center mt-4 text-xs text-[hsl(var(--muted-foreground))]/60">
          MIT License · Built with React + Radix UI + Tailwind CSS
        </div>
      </footer>
    </div>
  );
}

export default App;
