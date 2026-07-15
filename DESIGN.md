# Design notes

This document records the package's behavior and trade-offs. It is not an API reference; use the README for integration examples.

## Scope

FilterChipBar is intended for data-heavy React pages where users combine structured filters, free text, and frequent actions. It is most useful when a conventional filter form would contain many fields or when keyboard access matters.

It is not a general query language. Boolean groups, nested expressions, and arbitrary parser middleware are intentionally out of scope.

## State model

`searchText` is the source of truth. Chips, free-text terms, syntax highlighting, and suggestions are derived from it. Renderers must update the text instead of mutating parsed chips.

This keeps queries serializable and makes history, presets, controlled usage, and URL synchronization possible.

## Parsing

The scanner preserves quoted values such as `Name:"iPhone 15 Pro"`. The parser supports:

- `key:value`
- `-key:value`
- comma-separated values
- numeric and date ranges
- configured aliases and prefixes
- unmatched free text

The grammar deliberately avoids parentheses and boolean operators. Applications that need those features should use a dedicated query builder.

## Duplicate fields

`ChipConfig.duplicatePolicy` controls normalization:

- `replace` keeps the last occurrence and is the default.
- `preserve` keeps repeated positive and negative conditions.

Choose `preserve` only when the backend can represent repeated expressions without losing meaning.

## Dynamic options

`ChipConfig.options` may be asynchronous:

```ts
options: async (chips, { signal } = {}) => {
  return fetchTeams(chips?.Department, { signal });
}
```

Requests are delayed briefly to combine rapid changes. The previous request is aborted when dependencies change or the component unmounts. Consumers should forward the provided `AbortSignal` when their data client supports it.

## Suggestions and typo handling

Select values use case-insensitive matching. When there is no exact result, the component may suggest a nearby label using Levenshtein distance. Short strings are excluded because edit distance is unreliable for unrelated one- or two-character values.

## Persistence

Presets, recent searches, usage counters, and hint state use `storageNamespace`. Every page must provide a unique namespace. The default backend is `localStorage`; storage failures are ignored so private browsing and quota errors do not break filtering.

## Package boundaries

- `filter-chip-bar`: default renderer and public API
- `filter-chip-bar/headless`: hook, parser, and types without renderer dependencies
- `filter-chip-bar/primitives`: shared panel and calendar primitives
- `filter-chip-bar/antd6`: Ant Design 6 renderer
- `filter-chip-bar/styles`: Tailwind layers and CSS variables

## Build and compatibility

- Node.js 26 in CI
- pnpm workspace
- TypeScript 7
- ESM and CommonJS output
- declarations emitted by TypeScript, independently of tsup

The CI order is lint, test, then build. Publishing also runs the same checks before `pnpm publish`.

## Known limits

- History and presets are local to one browser.
- Dynamic option errors currently produce an empty state rather than a configurable error view.
- The package does not build backend query strings; consumers map `FilterChipBarResult` to their API.
- Hook-level DOM interaction coverage is smaller than parser and persistence coverage.
