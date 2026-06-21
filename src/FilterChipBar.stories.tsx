import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FilterChipBar, type ChipConfig, type TabOption, type RecentSearch, type ActionCommand, saveRecent } from './index';

const defaultChipConfigs: ChipConfig[] = [
  {
    type: 'select',
    label: '审核状态',
    aliases: ['st', 'status'],
    options: [
      { value: 0, label: '未审核' },
      { value: 1, label: '通过' },
      { value: 2, label: '失败' },
      { value: 3, label: '异常' },
    ],
  },
  {
    type: 'select',
    label: '是否出单',
    aliases: ['order'],
    options: [
      { value: -1, label: '未出单' },
      { value: 1, label: '出单' },
    ],
  },
  { type: 'input', label: '虚拟SKU', aliases: ['sku'] },
  { type: 'input', label: '产品名称', aliases: ['name'] },
  { type: 'select', label: '部门', aliases: ['dept'], options: async () => { await new Promise(r => setTimeout(r, 500)); return [{ value: 1, label: '运营一部' }, { value: 2, label: '运营二部' }]; } },
  { type: 'select', label: '运营人员', aliases: ['op'], options: async () => { await new Promise(r => setTimeout(r, 500)); return [{ value: '张三', label: '张三' }, { value: '李四', label: '李四' }]; } },
  { type: 'numberRange', label: '订单量', aliases: ['orders'], precision: 0, min: 0 },
  { type: 'numberRange', label: '审核次数', aliases: ['count'], precision: 0 },
  {
    type: 'select',
    label: '供货模式',
    options: [
      { value: 0, label: '现货' },
      { value: 1, label: '预售' },
      { value: 2, label: '定制' },
    ],
  },
  {
    type: 'multiSelect',
    label: '违规情况',
    prefix: '!',
    options: [
      { value: 0, label: '未确认' },
      { value: 3, label: '未侵权' },
      { value: 2, label: '产品侵权' },
    ],
  },
];

const defaultTabs: TabOption[] = [
  { value: -1, label: '全部' },
  { value: 0, label: '未审核' },
  { value: 1, label: '通过' },
  { value: 2, label: '失败' },
  { value: 3, label: '异常' },
];

const demoCounts: Record<number, number> = { [-1]: 67, [0]: 10, [1]: 38, [2]: 14, [3]: 5 };
const tabsWithCounts = defaultTabs.map((t) => ({ ...t, count: demoCounts[t.value as number] }));

const meta: Meta<typeof FilterChipBar> = {
  title: 'FilterChipBar',
  component: FilterChipBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# FilterChipBar — Search as the Entry Point

> Search is the first entry point for human-computer interaction. Simple, yet powerful.

---

## Design Vision

In traditional backend systems, users face a row of dropdowns, date pickers, and checkboxes.
Every additional control adds cognitive overhead.

**FilterChipBar condenses all filtering into one search box.** Users don't learn a UI layout — they just type what they want.

Inspired by Linear, Raycast, and VS Code Command Palette —
**the search box is not a "filter tool", it's the primary interaction entry point of the entire system.**

### Three Layers of Capability

| Layer | User Input | System Response |
|-------|-----------|----------------|
| **Filter** | \`status:passing orders:>=100\` | Filter data by structured conditions |
| **Navigate** | \`create ticket\` | Jump to a page or open a modal |
| **Free text** | \`kxccaqvx12\` | Full-text search across fields |

### Why "Simple Yet Powerful"

**Simple**: Users face a single input box. No dropdowns, no collapsible panels, no "advanced search" button.
Learning cost: zero — if you can type, you can use it.

**Powerful**: One search box handles filtering, navigation, and command execution.
Power users can do everything via keyboard without touching the mouse.

---

## Architecture

FilterChipBar uses a **headless + renderer** separation:

\`\`\`
useFilterChipBar()          ← Headless Hook (pure logic, zero UI deps)
  ├── State: searchText / tab / dropdown / presets
  ├── Parser: parseCurrentToken / parseQuery
  ├── Keyboard: ↑↓ Enter Tab Esc Backspace
  ├── Suggestions: autocomplete + fuzzy match + selected exclusion
  └── Persistence: namespaced localStorage (presets + recent)

FilterChipBar (shadcn)      ← Default renderer: Radix + Tailwind + lucide
FilterChipBarAntd6          ← Adapter: Ant Design 6
\`\`\`

Any UI framework can adapt by consuming the \`useFilterChipBar()\` hook and rendering its own components.

---

## Search Syntax

| Syntax | Meaning | Example |
|--------|---------|---------|
| \`key:value\` | Filter by field | \`Status:Passing\` |
| \`-key:value\` | Exclude (negation) | \`-Status:Failing\` |
| \`key:val1,val2\` | Multi-value | \`Status:Passing,Failing\` |
| \`key:"two words"\` | Quote spaces | \`Name:"iPhone 15"\` |
| \`key:>=100\` | Numeric compare | \`Orders:>=100\` |
| \`key:100~200\` | Numeric range | \`Orders:100~200\` |
| \`key:2024-01-01~2024-12-31\` | Date range | dateRange type |
| free text | Non-key:value text | \`kxccaqvx12\` |
| **space** | Separate conditions | \`Status:Passing Orders:>=100\` |

---

## 🌐 Language / 语言

Use the **🌐 globe** toolbar button (top right) to switch documentation language.
使用右上角 **🌐** 按钮切换文档语言。

---

<hr style="border: 2px solid #ddd; margin: 40px 0;" />

# FilterChipBar — 搜索即入口

> 搜索是人机交互的第一个入口。简单,而伟大。

---

## 设计愿景

在传统的后台系统中,用户面对的是:一排下拉框、几个日期选择器、若干复选框、一个搜索按钮。
每多一个筛选控件,用户就多一次"理解 UI 结构"的认知负担。

**FilterChipBar 把所有筛选浓缩进一个搜索框。** 用户不需要学习 UI 布局,只需要知道:
**"想找什么,就输入什么。"**

这是受 Linear、Raycast、VS Code Command Palette 启发的设计哲学——
**搜索框不是"筛选工具",而是整个系统的人机交互入口。**

### 三个层次的能力

| 层次 | 用户输入 | 系统响应 |
|------|---------|---------|
| **筛选** | \`审核状态:通过 订单量:>=100\` | 按条件过滤数据列表 |
| **导航** | \`创建工单\` | 跳转到对应页面或打开弹窗 |
| **自由文本** | \`kxccaqvx12\` | 全文搜索 SKU、产品名等 |

用户不需要关心"这个操作应该点哪个按钮"——输入任何内容,系统都能理解意图。

### 为什么是"简单而伟大"

**简单**: 用户只需面对一个输入框。没有下拉框、没有折叠面板、没有"高级搜索"按钮。
学习成本为零——会打字就会用。

**伟大**: 一个搜索框承载了筛选、导航、命令执行三种能力。
power user 可以用键盘完成所有操作,不需要碰鼠标。

---

## 架构

FilterChipBar 采用 **headless + renderer** 分离架构:

\`\`\`
useFilterChipBar()          ← Headless Hook(纯逻辑,零 UI 依赖)
  ├── 状态管理: searchText / tab / dropdown / presets
  ├── 解析引擎: parseCurrentToken / parseQuery
  ├── 键盘导航: ↑↓ Enter Tab Esc Backspace
  ├── 智能建议: 自动补全 + 模糊匹配 + 已选排除
  └── 持久化: 命名空间化 localStorage(预设 + 历史)

FilterChipBar (antd6)       ← Renderer(当前实现)
FilterChipBar (antd4)       ← v1 项目待实现
FilterChipBar (shadcn)      ← 未来可选
\`\`\`

任何 UI 框架只需消费 \`useFilterChipBar()\` hook 并渲染对应组件即可适配。

---

## 搜索语法

| 语法 | 含义 | 示例 |
|------|------|------|
| \`key:value\` | 筛选指定字段 | \`审核状态:通过\` |
| \`-key:value\` | 排除匹配项(反选) | \`-审核状态:失败\` |
| \`key:val1,val2\` | 多值选择(select/multiSelect 通用) | \`审核状态:通过,异常\` |
| \`key:"含空格的值"\` | 引号包裹含空格的值 | \`产品名称:"iPhone 15 Pro"\` |
| \`key:>=100\` | 数值比较(≥ ≤ =) | \`订单量:>=100\` |
| \`key:100~200\` | 数值区间 | \`订单量:100~200\` |
| \`key:2024-01-01~2024-12-31\` | 日期区间 | dateRange 类型 |
| 自由文本 | 非 key:value 格式的文本,作为全文搜索 | \`kxccaqvx12\` |
| **空格** | 分隔多个条件 | \`审核状态:通过 订单量:>=100\` |

### 交互细节

- **选择建议后不自动结束**: select 和 multiSelect 类型点击建议后,输入逗号继续多选或输入空格结束
- **反选模式**: 在 value 阶段可通过建议列表切换"排除"模式
- **预设保存**: 当前搜索条件可保存为预设,支持快捷加载和分享链接
- **搜索历史**: 自动记录搜索历史,按使用频率排序
- **快捷操作(Command Palette)**: 输入关键词匹配快捷操作,支持路由跳转/打开弹窗/执行动作

### 自动感知输入

搜索框会**智能感知用户意图**,自动转换输入格式,降低使用门槛:

| 场景 | 用户操作 | 自动处理 |
|------|---------|---------|
| **多行粘贴** | 从 Excel/CSV 复制多行值粘贴进来 | 换行符自动转为逗号,变成多值选择 |
| **引号保护** | 粘贴的文本本身已被双引号包裹 | 保持原样,不转换换行 |
| **input 自动加引号** | 输入 \`产品名称:iPhone 15\` 后按空格 | 自动变成 \`产品名称:"iPhone 15"\`,防止空格被误认为分隔符 |
| **IME 换行处理** | 输入法候选词产生的换行 | 同样自动转为逗号 |

**多行粘贴示例**: 用户从 Excel 复制了一列 SKU:
\`\`\`
kxccaqvx12
kxccaqvx13
kxccaqvx14
\`\`\`
粘贴到搜索框后自动变成 \`虚拟SKU:kxccaqvx12,kxccaqvx13,kxccaqvx14\`,无需手动处理。

---

## Props

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| \`chipConfigs\` | \`ChipConfig[]\` | ✅ | 筛选项配置 |
| \`storageNamespace\` | \`string\` | ✅ | localStorage 命名空间(不同页面必须不同) |
| \`onFiltersChange\` | \`(result) => void\` | ✅ | 筛选结果回调 |
| \`tabs\` | \`TabOption[]\` | | Tab 栏选项,含可选 count(空数组则不渲染) |
| \`commands\` | \`ActionCommand[]\` | | 快捷操作配置 |
| \`initialSearchText\` | \`string\` | | 预填搜索文本(如从 URL 恢复) |
| \`initialTab\` | \`string \\| number\` | | 预选 tab(默认 -1 = 全部) |
| \`recentSearches\` | \`RecentSearch[]\` | | 搜索历史 |
| \`placeholder\` | \`string\` | | 输入框占位文本 |
| \`onImageSearch\` | \`() => void\` | | 以图搜图回调(不传则不渲染按钮) |
| \`rightExtra\` | \`ReactNode\` | | 右侧自定义操作区 |
| \`footerExtra\` | \`ReactNode\` | | Tab 栏右侧自定义内容(靠右对齐) |
| \`searchResultCount\` | \`number\` | | 搜索结果总数(用于记录搜索历史) |
| \`searchLoading\` | \`boolean\` | | 加载状态(加载结束自动保存搜索历史) |
        `,
      },
    },
  },
  args: {
    chipConfigs: defaultChipConfigs,
    storageNamespace: 'storybook-filter-chip-bar',
    tabs: defaultTabs,
    onFiltersChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof FilterChipBar>;

const recentSearches: RecentSearch[] = [
  { text: '审核状态:通过', total: 128, timestamp: Date.now() - 3600_000, frequency: 1 },
  { text: '是否出单:出单 -是否带电:否', total: 56, timestamp: Date.now() - 86_400_000, frequency: 1 },
  { text: '违规情况:未侵权', total: 1024, timestamp: Date.now() - 604_800_000, frequency: 1 },
];

export const Default: Story = {
  name: 'Default / 默认状态',
  parameters: {
    docs: {
      description: {
        story:
          '最基础的形态。点击输入框聚焦后,输入任意筛选项名称(如"审核")即可看到匹配建议。' +
          '底部状态栏可快速切换审核状态。',
      },
    },
  },
};

export const WithInitialText: Story = {
  name: 'Single Filter / 单个筛选条件',
  parameters: {
    docs: {
      description: {
        story:
          '预填了一个筛选条件 `审核状态:通过`。注意输入框中的高亮:label 正常色,' +
          '冒号弱化色,value 带主色背景表示已匹配。用户可以直接在此基础上追加更多条件。',
      },
    },
  },
  args: {
    initialSearchText: '审核状态:通过',
  },
};

export const WithMultipleFilters: Story = {
  name: 'Multiple Filters / 多条件组合筛选',
  parameters: {
    docs: {
      description: {
        story:
          '多个条件用空格分隔:`审核状态:通过 是否出单:出单 订单量:>=100`。' +
          '每个条件独立高亮,支持 select、numberRange 等混合类型。' +
          '右上角显示当前已激活的条件数量。',
      },
    },
  },
  args: {
    initialSearchText: '审核状态:通过 是否出单:出单 订单量:>=100',
  },
};

export const FreeTextVskuSearch: Story = {
  name: 'Free Text Search / 自由文本搜索',
  parameters: {
    docs: {
      description: {
        story:
          '输入不是 `key:value` 格式的纯文本时,作为自由文本处理(如虚拟 SKU 编号)。' +
          '自由文本会被收集到 `result.freeText[]` 中,消费方可用于全文检索。' +
          '多个自由文本可用空格分隔。',
      },
    },
  },
  args: {
    initialSearchText: 'kxccaqvx12',
  },
};

export const WithStatusCounts: Story = {
  name: 'Status Bar + Counts / 状态栏 + 数量统计',
  parameters: {
    docs: {
      description: {
        story:
          '底部 Tab 栏各选项后面显示了对应的记录数量。这让用户在切换前就能预判结果集大小,' +
          '减少无效操作。数量通过 `TabOption.count` 传入。',
      },
    },
  },
  args: {
    initialSearchText: '审核状态:通过',
    tabs: tabsWithCounts,
  },
};

export const WithRecentHistory: Story = {
  name: 'Recent History / 搜索历史',
  parameters: {
    docs: {
      description: {
        story:
          '下拉框左侧显示搜索历史,包含搜索文本和命中的结果数量。' +
          '历史由组件内部自动管理:搜索提交后(Enter/选建议)自动保存到 localStorage,' +
          '加载页面时自动恢复。点击历史项直接恢复之前的搜索条件。底部可一键清除全部历史。',
      },
    },
  },
  render: () => {
    const ns = 'storybook-fcb-recent-demo';
    saveRecent(ns, recentSearches);
    return (
      <FilterChipBar
        chipConfigs={defaultChipConfigs}
        storageNamespace={ns}
        tabs={defaultTabs}
        onFiltersChange={fn()}
      />
    );
  },
};

export const FullWithCountsAndHistory: Story = {
  name: 'Full Demo / 完整形态',
  parameters: {
    docs: {
      description: {
        story:
          '生产环境的完整形态:预填筛选条件 + 状态栏数量 + 搜索历史。' +
          '这是用户日常使用时看到的最真实界面。',
      },
    },
  },
  render: () => {
    const ns = 'storybook-fcb-full-demo';
    saveRecent(ns, recentSearches);
    return (
      <FilterChipBar
        chipConfigs={defaultChipConfigs}
        storageNamespace={ns}
        tabs={tabsWithCounts}
        onFiltersChange={fn()}
        initialSearchText="审核状态:通过 是否出单:出单"
      />
    );
  },
};

export const DynamicOptionsLoading: Story = {
  name: 'Dynamic Options Loading / 动态选项加载中',
  parameters: {
    docs: {
      description: {
        story:
          '部门、运营人员等选项需要从后端动态加载。在数据未返回时,下拉框显示 skeleton 占位动画。' +
          '将 `ChipConfig.options` 设为 `async () => Promise<FilterOption[]>` 即可,hook 自动管理加载状态。',
      },
    },
  },
  args: {
    initialSearchText: '部门:',

  },
};

export const WithDynamicOptions: Story = {
  name: 'Dynamic Options Loaded / 动态选项已加载',
  parameters: {
    docs: {
      description: {
        story:
          '动态选项加载完成后,用户可以像静态选项一样选择。' +
          '将 `ChipConfig.options` 设为 `async () => fetchOptions()` 即可。',
      },
    },
  },
  args: {
    initialSearchText: '部门:',
  },
};

export const NegatedFilter: Story = {
  name: 'Negation / 反选(排除)模式',
  parameters: {
    docs: {
      description: {
        story:
          '在条件前加 `-` 表示排除:`审核状态:通过 -是否出单:出单` 表示"审核通过 **且** 未出单"。' +
          '反选条件的 value 以红色背景标识。' +
          '在 value 阶段,建议列表中可一键切换排除/恢复正常。',
      },
    },
  },
  args: {
    initialSearchText: '审核状态:通过 -是否出单:出单',
  },
};

export const AutoSensingPaste: Story = {
  name: 'Auto-Sensing: Paste / 自动感知:多行粘贴',
  parameters: {
    docs: {
      description: {
        story:
          '从 Excel 或 CSV 复制多行数据,直接粘贴到搜索框。' +
          '换行符自动转为逗号,变成多值选择条件。\n\n' +
          '示例展示了粘贴 3 行 SKU 后的结果:`虚拟SKU:kxccaqvx12,kxccaqvx13,kxccaqvx14`。' +
          '用户无需手动处理换行,直接粘贴即可。\n\n' +
          '如果粘贴的文本本身被双引号包裹(如 `"line1\\nline2"`),' +
          '则保持原样不转换——尊重用户明确的引号意图。',
      },
    },
  },
  args: {
    initialSearchText: '虚拟SKU:kxccaqvx12,kxccaqvx13,kxccaqvx14',
  },
};

export const AutoQuotingInput: Story = {
  name: 'Auto-Quoting Input / 自动感知:input 加引号',
  parameters: {
    docs: {
      description: {
        story:
          'input 类型的字段(如产品名称)可能包含空格。' +
          '当用户输入 `产品名称:iPhone 15 Pro` 然后按空格结束时,' +
          '搜索框自动给 value 加上双引号:`产品名称:"iPhone 15 Pro"`。\n\n' +
          '这样空格在 value 内部不会被误认为条件分隔符。' +
          '用户不需要手动输入引号——系统自动处理。\n\n' +
          '注意:只有在 value 不以引号开头时才会自动加引号。' +
          '如果用户手动输入了引号,系统尊重用户的选择。',
      },
    },
  },
  args: {
    initialSearchText: '产品名称:"iPhone 15 Pro"',
  },
};

export const WithRightExtra: Story = {
  name: 'Right Extra / 右侧自定义操作区',
  parameters: {
    docs: {
      description: {
        story:
          '通过 `rightExtra` 可以在搜索框右侧插入自定义内容(如"提交审核"按钮)。' +
          '搜索框 + 操作按钮一行排布,节省垂直空间。',
      },
    },
  },
  args: {
    initialSearchText: '审核状态:通过',
    tabs: tabsWithCounts,
    rightExtra: <span style={{ color: '#999' }}>自定义操作区</span>,
  },
};

export const CustomStatusOptions: Story = {
  name: 'Custom Status Options / 自定义状态栏选项',
  parameters: {
    docs: {
      description: {
        story:
          '状态栏完全由 `tabs` prop 驱动。不同业务页面可以传入不同的状态选项。' +
          '示例使用了"待处理/处理中/已完成"替代默认的审核状态。',
      },
    },
  },
  args: {
    tabs: [
      { value: -1, label: '全部', count: 10 },
      { value: 1, label: '待处理', count: 45 },
      { value: 2, label: '处理中', count: 23 },
      { value: 3, label: '已完成', count: 1280 },
    ],
  },
};

export const WithoutStatusBar: Story = {
  name: 'No Status Bar / 无状态栏模式',
  parameters: {
    docs: {
      description: {
        story:
          '不传 `tabs` 或传空数组,底部状态栏不渲染。' +
          '适用于不需要状态切换的纯搜索场景。',
      },
    },
  },
  args: {
    tabs: [],
  },
};

export const CustomPlaceholder: Story = {
  name: 'Custom Placeholder / 自定义占位文本',
  parameters: {
    docs: {
      description: {
        story:
          '通过 `placeholder` 自定义输入框占位文本。默认为"搜索或输入筛选条件"。' +
          '建议保持简洁,不要在这里写完整语法说明——语法帮助已通过问号图标提供。',
      },
    },
  },
  args: {
    placeholder: '输入订单号或 SKU...',
  },
};

export const WithImageSearch: Story = {
  name: 'Image Search / 以图搜图',
  parameters: {
    docs: {
      description: {
        story:
          '传入 `onImageSearch` 回调后,输入框右侧渲染相机图标。' +
          '不传则不渲染。点击触发回调,由消费方实现具体的图片上传和搜索逻辑。',
      },
    },
  },
  args: {
    onImageSearch: () => alert('以图搜图(示例)'),
  },
};

const demoCommands: ActionCommand[] = [
  {
    keywords: ['创建工单', '新建工单', '提交审核'],
    label: '创建工单',
    hint: '跳转到消息页',
    action: () => alert('跳转到 /message?action=create'),
  },
  {
    keywords: ['导出数据', '导出', '下载'],
    label: '导出数据',
    hint: '打开导出弹窗',
    action: () => alert('打开导出弹窗'),
  },
  {
    keywords: ['批量审核', '批量操作'],
    label: '批量审核',
    hint: '打开批量审核面板',
    action: () => alert('打开批量审核面板'),
  },
];

export const WithCommands: Story = {
  name: 'Command Palette / 快捷操作',
  parameters: {
    docs: {
      description: {
        story:
          '**搜索框不只是筛选工具,更是系统的操作入口。** 输入"创建""导出""下载"等关键词时,' +
          '下拉框会在筛选项之后展示匹配的快捷操作(带 → 箭头标识)。' +
          '点击或按 Enter 即可执行对应动作——跳转路由、打开弹窗、触发操作。\n\n' +
          '这就是 Command Palette 模式:用户在任何时候输入任何内容,系统都能理解意图并给出响应。' +
          '不需要记快捷键,不需要找菜单栏——**搜索即操作**。',
      },
    },
  },
  args: {
    commands: demoCommands,
    initialSearchText: '创建',
  },
};

export const DarkMode: Story = {
  name: 'Dark Mode / 暗色模式',
  parameters: {
    docs: {
      description: {
        story:
          'shadcn renderer uses CSS variables that automatically adapt to `.dark` class. ' +
          'shadcn 渲染器使用 CSS 变量,自动适配 `.dark` 类名。',
      },
    },
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark" style={{ background: 'hsl(240 10% 3.9%)', minHeight: 200, padding: 16, borderRadius: 8 }}>
      <FilterChipBar
        chipConfigs={defaultChipConfigs}
        storageNamespace="storybook-dark-demo"
        tabs={defaultTabs}
        onFiltersChange={fn()}
        initialSearchText="审核状态:通过"
      />
    </div>
  ),
};
