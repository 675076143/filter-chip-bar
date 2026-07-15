# 设计说明

本文记录组件行为、边界和取舍。接入方式以 README 为准。

## 适用范围

FilterChipBar 面向数据密集型 React 页面，用一个输入框承载结构化筛选、自由文本和常用操作。它适合筛选字段多、组合查询频繁、需要键盘操作的中后台页面。

它不是通用查询语言。布尔分组、嵌套表达式和任意解析中间件不在当前范围内；这类需求更适合专用查询构造器。

## 状态模型

`searchText` 是唯一真相源。chips、自由文本、语法高亮和建议都从文本派生。渲染器只能更新文本，不能直接修改解析后的 chips。

这样可以稳定支持序列化、历史、预设、受控模式和 URL 同步。

## 解析

扫描器会保留 `Name:"iPhone 15 Pro"` 这样的引号值。当前支持：

- `key:value`
- `-key:value`
- 逗号分隔多值
- 数值和日期区间
- 配置的别名与前缀
- 未匹配的自由文本

语法不支持括号和布尔运算符，避免把轻量筛选框扩展成复杂查询语言。

## 重复字段

`ChipConfig.duplicatePolicy` 控制归一化：

- `replace`：保留最后一次，默认行为。
- `preserve`：保留重复的正向和反向条件。

只有后端能准确表达重复条件时才应使用 `preserve`。

## 动态选项

`ChipConfig.options` 可以异步加载：

```ts
options: async (chips, { signal } = {}) => {
  return fetchTeams(chips?.Department, { signal });
}
```

组件会短暂延迟请求以合并连续变化。依赖变化或组件卸载时会中止旧请求。数据客户端支持时，应继续传递 `AbortSignal`。

## 建议与拼写纠正

选项匹配不区分大小写。没有精确结果时，可根据 Levenshtein 编辑距离提示相近值。长度不足三个字符的输入不参与模糊匹配，避免短值之间产生无关建议。

## 持久化

预设、历史、使用次数和提示状态都使用 `storageNamespace`。每个页面必须提供唯一命名空间。默认存储是 `localStorage`；隐私模式、容量不足等异常不会阻断筛选。

## 包边界

- `filter-chip-bar`：默认渲染器和完整公共 API
- `filter-chip-bar/headless`：不含渲染器依赖的 hook、parser 和类型
- `filter-chip-bar/primitives`：共享面板和日历组件
- `filter-chip-bar/antd6`：Ant Design 6 渲染器
- `filter-chip-bar/styles`：Tailwind layers 和 CSS 变量

## 构建与兼容性

- CI 使用 Node.js 26
- pnpm workspace
- TypeScript 7
- 同时输出 ESM 和 CommonJS
- TypeScript 独立生成声明文件，避免依赖构建工具的 TS 内部 API

CI 顺序固定为 lint、test、build。发布前也执行相同检查。

## 已知限制

- 历史和预设只保存在当前浏览器。
- 动态选项失败时暂时只展示空状态，没有可配置错误视图。
- 组件不负责生成后端查询字符串，业务需要自行转换 `FilterChipBarResult`。
- Hook 的 DOM 交互测试覆盖仍少于 parser 和持久化测试。
