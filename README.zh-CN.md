[English](./README.md) | [中文](./README.zh-CN.md)

# filter-chip-bar

> 搜索即入口 — 面向 React 的 Headless 筛选 + 命令面板组件。

把一个搜索框变成应用的第一个入口:**筛选**、**导航**、**执行操作**——全部从一个输入框完成。受 Linear、Raycast、VS Code Command Palette 启发。

[![Storybook](https://img.shields.io/badge/Storybook-查看文档-ff4685)](https://filter-chip-bar.vercel.app)
[![npm](https://img.shields.io/npm/v/filter-chip-bar)](https://www.npmjs.com/package/filter-chip-bar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)

---

## 为什么

传统后台给用户的是一排下拉框、几个日期选择器、若干复选框。每多一个控件,用户就多一次"理解 UI 结构"的认知负担。

**filter-chip-bar** 把所有筛选浓缩进一个搜索框。用户不需要学习 UI 布局——想找什么,就输入什么。

| 层次 | 示例输入 | 效果 |
|------|---------|------|
| **筛选** | `审核状态:通过 订单量:>=100` | 按条件过滤数据 |
| **导航** | `创建工单` | 跳转到对应页面或打开弹窗 |
| **自由文本** | `kxccaqvx12` | 全文搜索 SKU、产品名等 |

## 特性

- 🧠 **Headless hook** — `useFilterChipBar()` 提供全部状态/逻辑,零 UI 依赖
- 🎨 **shadcn 渲染器** — 内置渲染器,使用 Radix UI + Tailwind CSS + lucide 图标
- 🐜 **antd6 适配器** — Ant Design 6 项目即插即用
- ⌨️ **全键盘导航** — ↑↓ Enter Tab Esc Backspace
- 🏷️ **语法高亮** — `key:value` 实时校验着色
- 🔖 **预设** — 保存/恢复/分享搜索配置(支持 URL 分享)
- 🕐 **搜索历史** — 自动记录,localStorage 持久化,命名空间隔离
- 📋 **智能粘贴** — 多行粘贴自动转为逗号分隔
- 🔄 **多值选择** — 输入逗号继续选,空格结束
- ❌ **反选** — `-key:value` 排除匹配项
- 🎯 **命令面板** — 注册快捷操作,支持路由跳转/弹窗触发
- 🌗 **暗色模式** — 通过 `class="dark"` (shadcn CSS 变量)

## 安装

```bash
pnpm add filter-chip-bar
```

**Peer dependencies**(只需 React,antd 是可选的):

```json
{
  "react": ">=17",
  "react-dom": ">=17"
}
```

如果使用 **antd6 适配器**,还需安装:
```bash
pnpm add antd @ant-design/icons
```

## 快速开始

### shadcn / Tailwind(默认)

```tsx
import { FilterChipBar, type ChipConfig, type FilterChipBarResult } from 'filter-chip-bar';

const chipConfigs: ChipConfig[] = [
  {
    type: 'select',
    label: '审核状态',
    options: [
      { value: 0, label: '未审核' },
      { value: 1, label: '通过' },
      { value: 2, label: '失败' },
    ],
  },
  { type: 'input', label: '虚拟SKU' },
  { type: 'numberRange', label: '订单量', min: 0 },
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
        { value: -1, label: '全部' },
        { value: 0, label: '未审核' },
        { value: 1, label: '通过' },
        { value: 2, label: '失败' },
      ]}
    />
  );
}
```

> **需要 Tailwind**: shadcn 渲染器使用 Tailwind CSS 类名。请确保项目已配置 Tailwind,并导入包的 CSS 变量:
> ```ts
> import 'filter-chip-bar/styles'
> ```

### antd6

```tsx
import { FilterChipBarAntd6, type ChipConfig } from 'filter-chip-bar/antd6';

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

### Headless(自己写渲染器)

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

## 搜索语法

| 语法 | 含义 | 示例 |
|------|------|------|
| `key:value` | 按字段筛选 | `审核状态:通过` |
| `-key:value` | 排除匹配项(反选) | `-审核状态:失败` |
| `key:val1,val2` | 多值选择(select/multiSelect 通用) | `审核状态:通过,失败` |
| `key:"带空格的值"` | 引号包裹含空格的值 | `产品名称:"iPhone 15 Pro"` |
| `key:>=100` | 数值比较(≥ ≤ =) | `订单量:>=100` |
| `key:100~200` | 数值区间 | `订单量:100~200` |
| `key:2024-01-01~2024-12-31` | 日期区间 | `日期:2024-01-01~2024-12-31` |
| 自由文本 | 非 `key:value` 格式 → 全文搜索 | `kxccaqvx12` |
| `空格` | 分隔多个条件 | `审核状态:通过 订单量:>=100` |

### 交互细节

- **选择续选**: select/multiSelect 选了一个值后,输入逗号继续选或空格结束
- **反选切换**: 在 value 阶段,建议列表提供一键"排除"切换
- **多行粘贴**: 从 Excel/CSV 粘贴自动把换行转为逗号
- **自动加引号**: input 类型输入空格结束 token 时自动包裹引号

## 命令面板(Command Palette)

注册快捷操作,让用户直接从搜索框导航或触发动作:

```tsx
<FilterChipBar
  chipConfigs={chipConfigs}
  storageNamespace="my-page"
  onFiltersChange={handleChange}
  commands={[
    {
      keywords: ['创建工单', '新建工单'],
      label: '创建工单',
      hint: '跳转到工单页',
      action: () => navigate('/tickets/new'),
    },
    {
      keywords: ['导出', '下载'],
      label: '导出数据',
      hint: '下载 CSV',
      action: () => exportModal.open(),
    },
  ]}
/>
```

用户输入匹配关键词时,下拉框出现带 `→` 标识的快捷操作。按 Enter 或点击即可执行。

## API

### `<FilterChipBar />` Props

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chipConfigs` | `ChipConfig[]` | ✅ | 筛选项配置 |
| `storageNamespace` | `string` | ✅ | localStorage 命名空间(每个页面必须唯一) |
| `onFiltersChange` | `(result: FilterChipBarResult) => void` | ✅ | 搜索提交时回调 |
| `tabs` | `TabOption[]` | | Tab 栏选项,含可选 count(空数组 = 不渲染) |
| `commands` | `ActionCommand[]` | | 命令面板操作 |
| `initialSearchText` | `string` | | 预填搜索文本(如从 URL 恢复) |
| `value` | `string` | | 受控查询文本 |
| `onValueChange` | `(value: string) => void` | | 查询文本变化时调用 |
| `initialTab` | `string \| number` | | 预选 tab(默认 `-1` = 全部) |
| `placeholder` | `string` | | 输入框占位文本 |
| `syntaxHelp` | `ReactNode` | | 自定义语法帮助内容 |
| `onImageSearch` | `() => void` | | 传入则渲染以图搜图按钮 |
| `rightExtra` | `ReactNode` | | 搜索框右侧自定义内容 |
| `footerExtra` | `ReactNode` | | Tab 栏右侧自定义内容(靠右对齐) |
| `searchResultCount` | `number` | | 搜索结果总数(用于记录搜索历史) |
| `searchLoading` | `boolean` | | 加载状态(加载结束时自动保存搜索历史) |
| `storage` | `FilterChipBarStorage` | | 可选同步存储适配器，默认使用 `localStorage` |

### `FilterChipBarResult`

```typescript
interface FilterChipBarResult {
  searchText: string;                  // 原始搜索文本
  chips: Record<string, unknown>;      // 解析后的条件(label 为 key)
  expressions: FilterExpression[];     // 带字段、操作符和值的表达式
  freeText: string[];                  // 非 key:value 的文本片段
  tab: string | number;                // Tab 选中值(-1 = 全部)
}

interface FilterExpression {
  field: string;
  operator: 'eq' | 'in' | 'gte' | 'lte' | 'range';
  negated: boolean;
  value: unknown;
}
```

### `ChipConfig`

```typescript
interface ChipConfig {
  type: 'select' | 'multiSelect' | 'input' | 'dateRange' | 'numberRange';
  label: string;
  options?: FilterOption[] | ((chips, { signal }) => Promise<FilterOption[]>);
  duplicatePolicy?: 'replace' | 'preserve'; // 默认 replace
  precision?: number;      // numberRange 小数位数
  min?: number;            // numberRange 最小值
}
```

### `TabOption`

```typescript
interface TabOption {
  value: string | number;
  label: string;
  count?: number;          // 可选计数徽标
}
```

### `ActionCommand`

```typescript
interface ActionCommand {
  keywords: string[];      // 与用户输入匹配的关键词
  label: string;           // 显示标签
  hint?: string;           // 右侧提示文本
  action: () => void;      // 点击/Enter 时执行
}
```

### `useFilterChipBar(options)`

返回构建自定义渲染器所需的全部 state、ref 和 handler。参见[快速开始 > Headless](#headless自己写渲染器)。

<details>
<summary>完整返回类型</summary>

```typescript
interface UseFilterChipBarReturn {
  // Refs
  inputRef: RefObject<HTMLInputElement | null>;
  itemRefs: MutableRefObject<(HTMLDivElement | null)[]>;

  // 搜索状态
  searchText: string;
  setSearchText: (text: string) => void;
  textTokens: TextToken[];
  activeFilterCount: number;

  // 状态栏
  stat: number;
  setStat: (stat: number) => void;

  // 下拉框
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

  // 预设
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

## 架构

```
filter-chip-bar
├── useFilterChipBar()          ← Headless hook(纯逻辑,零 UI 依赖)
│   ├── 状态: searchText / stat / dropdown / presets / recent
│   ├── 解析: parseCurrentToken / parseQuery
│   ├── 键盘: ↑↓ Enter Tab Esc Backspace
│   ├── 建议: 自动补全 + 模糊匹配 + 已选排除
│   └── 持久化: 命名空间化 localStorage(预设 + 历史)
│
├── FilterChipBar               ← shadcn 渲染器(默认导出)
│   Radix Popover + Tailwind CSS + lucide-react
│
├── FilterChipBarPanel          ← 共享 UI primitives(filter-chip-bar/primitives)
│
└── FilterChipBarAntd6          ← antd6 适配器(filter-chip-bar/antd6)
    Ant Design 6 + @ant-design/icons
```

### 包导出

| 导入路径 | 内容 |
|---------|------|
| `filter-chip-bar` | shadcn 渲染器 + hook + 全部类型 |
| `filter-chip-bar/headless` | 纯 hook(零 UI 依赖) |
| `filter-chip-bar/primitives` | 共享面板、日历与 ViewModel 类型 |
| `filter-chip-bar/antd6` | antd6 渲染器 + hook + 全部类型 |
| `filter-chip-bar/styles` | shadcn CSS 变量与 Tailwind layers |

## 开发

```bash
# 安装依赖
pnpm install

# 启动 Storybook 开发服务器
pnpm run storybook

# 构建产物
pnpm run build

# 构建 Storybook 静态站点
pnpm run build-storybook
```

## 开源协议

[MIT](./LICENSE)
