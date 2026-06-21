# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-22

### Breaking Changes
- `statusOptions` → `tabs: TabOption[]` (new `TabOption` type with `value`, `label`, `count?`)
- `statusCounts` removed — count folded into `TabOption.count`
- `statusBarExtra` → `footerExtra`
- `stat`/`setStat`/`initialStat` → `tab`/`setTab`/`initialTab` (now `string | number`)
- `FilterChipBarResult.stat` → `.tab`
- `SearchPreset.stat` → `.tab`
- `dynamicOptions` + `dynamicOptionsLoading` props removed — `ChipConfig.options` now accepts `() => Promise<FilterOption[]>` and hook auto-resolves
- `ChipConfig.dynamic` field removed
- `operation: '区间'` → `operation: 'range'` in numberRange parser output

### Added
- shadcn renderer as default export (Radix + Tailwind + lucide-react)
- `TabOption` type
- `AsyncOptions` type
- `/headless` subpath export (pure hook, zero UI deps)
- `/antd6` subpath export (Ant Design 6 adapter)
- Skeleton loading for async options
- Command Palette (`commands` prop with `ActionCommand[]`)
- `/` keyboard shortcut to focus search bar
- Dark mode support (CSS variables)
- a11y: ARIA combobox + listbox + option roles
- Official website (Google-style landing page with interactive demo)
- Storybook i18n (EN/CN) + dark mode toolbar + shadcn-styled docs
- 35 unit tests (parser + tokenizer)

### Fixed
- Radix Popover `onOpenAutoFocus` stealing focus (dropdown flash)
- `tokenizeSearchText` not handling comma-separated select values
- Performance: `onFiltersChange` only fires on commit, not per keystroke
- `localStorage` save operations in try-catch (Safari private mode safe)

## [0.1.0] - 2026-06-20

### Added
- Headless `useFilterChipBar()` hook — zero UI dependency, all state/logic
- shadcn renderer (default export) — Radix Popover + Tailwind CSS + lucide-react
- antd6 adapter — `filter-chip-bar/antd6` subpath export
- Headless-only subpath — `filter-chip-bar/headless` (pure hook, no UI)
- `key:value` structured filter syntax with real-time syntax highlighting
- Command Palette — `commands` prop for route navigation / modal triggers
- Presets — save/recall/share search configurations via URL
- Recent searches — auto-tracked, localStorage-persisted, namespaced
- Full keyboard navigation — ↑↓ Enter Tab Esc Backspace
- `/` shortcut to focus search bar (GitHub/Linear style)
- Multi-value select — comma continuation for select/multiSelect types
- Negation — `-key:value` to exclude matches
- Smart paste — multi-line paste auto-converts to comma-separated values
- Auto-quoting — input field values auto-wrapped in quotes on space
- Dynamic options loading with skeleton placeholders
- Dark mode support via `.dark` class (shadcn CSS variables)
- Status bar with counts + `statusBarExtra` slot
- `rightExtra` slot for custom action buttons
- ARIA attributes for accessibility (combobox + listbox + option roles)
- Storybook with bilingual docs (EN/CN) and 🌐 locale toolbar
- 35 unit tests for parser + tokenizer
- GitHub Actions: CI (lint + test + build) + npm publish on tag
- Vercel Storybook deployment config

### Fixed
- Radix Popover `onOpenAutoFocus` stealing focus from input (dropdown flash)
- `tokenizeSearchText` not handling comma-separated select values (red highlight)
- Performance: `onFiltersChange` only fires on commit (Enter/suggestion/space), not per keystroke
- `localStorage` save operations wrapped in try-catch (Safari private mode safe)
