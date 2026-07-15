[English](./README.md) | [中文](./README.zh-CN.md)

# filter-chip-bar

> 搜索即入口 — Headless filter + command palette component for React.

Turn one search box into the primary entry point of your app: **filter**, **navigate**, and **execute actions** — all from a single input. Inspired by Linear, Raycast, and VS Code Command Palette.

[![Storybook](https://img.shields.io/badge/Storybook-View%20Docs-ff4685)](https://filter-chip-bar.vercel.app)
[![npm](https://img.shields.io/npm/v/filter-chip-bar)](https://www.npmjs.com/package/filter-chip-bar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)

---

## Why

Traditional backends give users a row of dropdowns, date pickers, and checkboxes. Every extra control is cognitive overhead.

**filter-chip-bar** condenses all filtering into a single search box. Users don't learn a UI layout — they just type what they want.

| Layer | Example Input | What Happens |
|-------|--------------|-------------|
| **Filter** | `status:passing orders:>=100` | Filter data by structured conditions |
| **Navigate** | `create ticket` | Jump to another page or open a modal |
| **Free text** | `kxccaqvx12` | Full-text search across SKU, name, etc. |

## Features

- 🧠 **Headless hook** — `useFilterChipBar()` provides all state/logic, zero UI dependency
- 🎨 **shadcn renderer** — Built-in renderer using Radix UI + Tailwind CSS + lucide icons
- 🐜 **antd6 adapter** — Drop-in renderer for Ant Design 6 projects
- ⌨️ **Full keyboard navigation** — ↑↓ Enter Tab Esc Backspace
- 🏷️ **Syntax highlighting** — `key:value` with real-time validation colors
- 🔖 **Presets** — Save/recall/share search configurations via URL
- 🕐 **Recent searches** — Auto-tracked, localStorage-persisted, namespaced
- 📋 **Smart paste** — Multi-line paste → comma-separated values
- 🔄 **Multi-value select** — Type comma to add more values, space to finish
- ❌ **Negation** — `-key:value` to exclude matches
- 🎯 **Command Palette** — Register action commands for route navigation / modal triggers
- 🌗 **Dark mode** — Via `class="dark"` (shadcn CSS variables)

## Install

```bash
npm install filter-chip-bar
```

**Peer dependencies** (only React is required — antd is optional):

```json
{
  "react": ">=17",
  "react-dom": ">=17"
}
```

If using the **antd6 adapter**, also install:
```bash
npm install antd @ant-design/icons
```

## Quick Start

### shadcn / Tailwind (default)

```tsx
import { FilterChipBar, type ChipConfig, type FilterChipBarResult } from 'filter-chip-bar';

const chipConfigs: ChipConfig[] = [
  {
    type: 'select',
    label: 'Status',
    options: [
      { value: 0, label: 'Pending' },
      { value: 1, label: 'Passing' },
      { value: 2, label: 'Failing' },
    ],
  },
  { type: 'input', label: 'SKU' },
  { type: 'numberRange', label: 'Orders', min: 0 },
];

function App() {
  return (
    <FilterChipBar
      chipConfigs={chipConfigs}
      storageNamespace="my-page"
      onFiltersChange={(result: FilterChipBarResult) => {
        console.log(result.chips, result.freeText, result.tab);
      }}
      tabs={[
        { value: -1, label: 'All' },
        { value: 0, label: 'Pending' },
        { value: 1, label: 'Passing' },
        { value: 2, label: 'Failing' },
      ]}
    />
  );
}
```

> **Tailwind required**: The shadcn renderer uses Tailwind CSS classes. Make sure your project has Tailwind configured, and import the CSS variables from the package:
> ```ts
> import 'filter-chip-bar/styles'
> ```

### antd6

```tsx
import { FilterChipBarAntd6, type ChipConfig, type FilterChipBarResult } from 'filter-chip-bar/antd6';

function App() {
  return (
    <FilterChipBarAntd6
      chipConfigs={chipConfigs}
      storageNamespace="my-page"
      onFiltersChange={(result) => { /* ... */ }}
    />
  );
}
```

### Headless (build your own renderer)

```tsx
import { useFilterChipBar } from 'filter-chip-bar/headless';

function MyFilterBar({ chipConfigs, onFiltersChange }) {
  const fcb = useFilterChipBar({
    chipConfigs,
    storageNamespace: 'my-page',
    onFiltersChange,
  });

  return (
    <div>
      <input
        ref={fcb.inputRef}
        value={fcb.searchText}
        onChange={fcb.handleInputChange}
        onKeyDown={fcb.handleKeyDown}
        onFocus={() => fcb.setDropdownOpen(true)}
      />
      {fcb.isDropdownOpen && (
        <ul>
          {fcb.suggestions.map((s, i) => (
            <li
              key={i}
              ref={(el) => { fcb.itemRefs.current[i] = el; }}
              onMouseDown={(e) => {
                e.preventDefault();
                fcb.handleSuggestionClick(s.value);
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Search Syntax

| Syntax | Meaning | Example |
|--------|---------|---------|
| `key:value` | Filter by field | `Status:Passing` |
| `-key:value` | Exclude matches (negation) | `-Status:Failing` |
| `key:val1,val2` | Multi-value (select/multiSelect) | `Status:Passing,Failing` |
| `key:"two words"` | Quote values with spaces | `Name:"iPhone 15 Pro"` |
| `key:>=100` | Numeric comparison (≥ ≤ =) | `Orders:>=100` |
| `key:100~200` | Numeric range | `Orders:100~200` |
| `key:2024-01-01~2024-12-31` | Date range | `Date:2024-01-01~2024-12-31` |
| free text | Non-`key:value` text → full-text search | `kxccaqvx12` |
| `space` | Separate multiple conditions | `Status:Passing Orders:>=100` |

### Interaction Details

- **Select continuation**: After choosing a select/multiSelect value, type `,` to add more or `space` to finish
- **Negation toggle**: In the value phase, the suggestion list offers a one-click "exclude" toggle
- **Multi-line paste**: Pasting from Excel/CSV auto-converts newlines to commas
- **Auto-quoting**: Typing a space after an `input` field value auto-wraps it in quotes

## Command Palette

Register action commands so users can navigate or trigger actions directly from the search bar:

```tsx
<FilterChipBar
  chipConfigs={chipConfigs}
  storageNamespace="my-page"
  onFiltersChange={handleChange}
  commands={[
    {
      keywords: ['create ticket', 'new ticket'],
      label: 'Create Ticket',
      hint: 'Open ticket form',
      action: () => navigate('/tickets/new'),
    },
    {
      keywords: ['export', 'download'],
      label: 'Export Data',
      hint: 'Download CSV',
      action: () => exportModal.open(),
    },
  ]}
/>
```

When the user types a keyword that matches a command, it appears in the dropdown with a `→` indicator. Press Enter or click to execute.

## API

### `<FilterChipBar />` Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `chipConfigs` | `ChipConfig[]` | ✅ | Filter field configurations |
| `storageNamespace` | `string` | ✅ | localStorage namespace (must be unique per page) |
| `onFiltersChange` | `(result: FilterChipBarResult) => void` | ✅ | Called when search is committed |
| `tabs` | `TabOption[]` | | Tab bar options with optional count (empty = no tab bar) |
| `commands` | `ActionCommand[]` | | Command Palette actions |
| `initialSearchText` | `string` | | Pre-fill search text (e.g. from URL) |
| `value` | `string` | | Controlled query text |
| `onValueChange` | `(value: string) => void` | | Called whenever query text changes |
| `initialTab` | `string \| number` | | Pre-select tab (default: `-1` = All) |
| `placeholder` | `string` | | Input placeholder |
| `syntaxHelp` | `ReactNode` | | Custom syntax help popover content |
| `onImageSearch` | `() => void` | | Provide to render image search button |
| `rightExtra` | `ReactNode` | | Custom content to the right of the search input |
| `footerExtra` | `ReactNode` | | Custom content on the tab bar row (right-aligned) |
| `searchResultCount` | `number` | | Total result count (for recent search tracking) |
| `searchLoading` | `boolean` | | Loading state (triggers recent search save on completion) |

### `FilterChipBarResult`

```typescript
interface FilterChipBarResult {
  searchText: string;                  // Raw search text
  chips: Record<string, unknown>;      // Parsed conditions (label-keyed)
  freeText: string[];                  // Non-key:value text tokens
  tab: string | number;                // Tab value (-1 = All)
}
```

### `ChipConfig`

```typescript
interface ChipConfig {
  type: 'select' | 'multiSelect' | 'input' | 'dateRange' | 'numberRange';
  label: string;
  options?: FilterOption[] | ((chips, { signal }) => Promise<FilterOption[]>);
  duplicatePolicy?: 'replace' | 'preserve'; // Default: replace
  precision?: number;      // numberRange decimal places
  min?: number;            // numberRange minimum
}
```

### `TabOption`

```typescript
interface TabOption {
  value: string | number;
  label: string;
  count?: number;          // Optional count badge
}
```

### `ActionCommand`

```typescript
interface ActionCommand {
  keywords: string[];      // Matched against user input
  label: string;           // Display label
  hint?: string;           // Side hint text
  action: () => void;      // Executed on click/Enter
}
```

### `useFilterChipBar(options)`

Returns all state, refs, and handlers needed to build a custom renderer. See [Quick Start > Headless](#headless-build-your-own-renderer) for usage.

<details>
<summary>Full return type</summary>

```typescript
interface UseFilterChipBarReturn {
  // Refs
  inputRef: RefObject<HTMLInputElement | null>;
  itemRefs: MutableRefObject<(HTMLDivElement | null)[]>;

  // Search state
  searchText: string;
  setSearchText: (text: string) => void;
  textTokens: TextToken[];
  activeFilterCount: number;

  // Status state
  stat: number;
  setStat: (stat: number) => void;

  // Dropdown state
  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  activeSuggestionIdx: number;
  setActiveSuggestionIdx: (idx: number) => void;
  dropdownOffsetX: number;
  inputScrollLeft: number;
  parsedToken: ParsedToken;
  suggestions: SuggestionItem[];
  filteredHistory: RecentSearch[];
  isLoadingDynamic: boolean;

  // Preset state
  isPresetOpen: boolean;
  setPresetOpen: (open: boolean) => void;
  presetName: string;
  setPresetName: (name: string) => void;
  presets: SearchPreset[];

  // Handlers
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  handleClear: () => void;
  handleSuggestionClick: (value: string) => void;
  handleToggleNegate: () => void;
  executeCommand: (cmd: ActionCommand) => void;
  handleSavePreset: () => void;
  handleLoadPreset: (preset: SearchPreset) => void;
  handleDeletePreset: (id: string) => void;
  buildShareUrl: (preset: SearchPreset) => string;
  clearRecent: () => void;
  onInputScroll: (scrollLeft: number) => void;
}
```

</details>

## Architecture

```
filter-chip-bar
├── useFilterChipBar()          ← Headless hook (pure logic, zero UI deps)
│   ├── State: searchText / stat / dropdown / presets / recent
│   ├── Parser: parseCurrentToken / parseQuery
│   ├── Keyboard: ↑↓ Enter Tab Esc Backspace
│   ├── Suggestions: autocomplete + fuzzy match + selected exclusion
│   └── Persistence: namespaced localStorage (presets + recent)
│
├── FilterChipBar               ← shadcn renderer (default export)
│   Radix Popover + Tailwind CSS + lucide-react
│
├── FilterChipBarPanel          ← shared UI primitives (filter-chip-bar/primitives)
│
└── FilterChipBarAntd6          ← antd6 adapter (filter-chip-bar/antd6)
    Ant Design 6 + @ant-design/icons
```

### Package Exports

| Import Path | What You Get |
|------------|-------------|
| `filter-chip-bar` | shadcn renderer + hook + all types |
| `filter-chip-bar/headless` | Hook only (zero UI dependency) |
| `filter-chip-bar/primitives` | Shared panel, calendar and ViewModel types |
| `filter-chip-bar/antd6` | antd6 renderer + hook + all types |
| `filter-chip-bar/styles` | shadcn CSS variables and Tailwind layers |

## Development

```bash
# Install dependencies
npm install

# Start Storybook dev server
npm run storybook

# Build for production
npm run build

# Build Storybook static
npm run build-storybook
```

## License

[MIT](./LICENSE)
