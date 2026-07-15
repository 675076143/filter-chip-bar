# AGENTS.md — filter-chip-bar

## Commands

```bash
pnpm install
pnpm run lint
pnpm test
pnpm run build
pnpm run storybook
pnpm --dir website run build
```

CI order is strict: `lint` → `test` → `build`. CI uses Node.js 26, pnpm 10.17.1, and TypeScript 7.

Run one test file with:

```bash
pnpm exec vitest run src/__tests__/parser.test.ts
```

## Architecture

```text
src/
├── hook.ts                   Core state, async options, keyboard handling
├── parser.ts                 Query scanner and parser
├── tokenize.ts               Syntax highlighting tokens
├── navigation.ts             Selectable suggestion navigation
├── fuzzy.ts                  Levenshtein matching
├── progressive.ts            Usage-based hints
├── types.ts                  Public types and persistence helpers
├── index.ts                  Default public entry
├── headless.ts               Logic-only entry
├── primitives.ts             Shared renderer primitives
├── FilterChipBar.tsx         Radix/Tailwind renderer
├── FilterChipBarPanel.tsx    Shared dropdown panel
├── CalendarRangePanel.tsx    Date range UI
└── __tests__/                Parser, navigation, and persistence tests
examples/
└── antd6-renderer.tsx        Ant Design 6 renderer
website/
└── src/                      Public demo site
```

## Export paths

| Import | Contents |
|---|---|
| `filter-chip-bar` | Default renderer, hook, types, utilities |
| `filter-chip-bar/headless` | Hook, parser, persistence, types |
| `filter-chip-bar/primitives` | Shared panel and calendar |
| `filter-chip-bar/antd6` | Ant Design 6 renderer |
| `filter-chip-bar/styles` | Tailwind layers and CSS variables |

## Invariants

- `searchText` is the source of truth. Do not mutate chip state directly.
- Every page must use a unique `storageNamespace`.
- `ChipConfig.options` may depend on current chips and receives an optional `AbortSignal` context.
- Parser, tokenizer, and deduplication must share `scanQueryParts`; do not add a separate whitespace parser.
- Keep default, headless, primitives, and antd6 exports compatible when changing public types.

## Build

- tsup emits ESM and CommonJS JavaScript.
- TypeScript 7 emits declarations using `tsconfig.build.json`.
- React, React DOM, dayjs, antd, and Ant Design icons are externalized as configured in `tsup.config.ts`.
- Package exports point to `dist`; `prepack` runs the build.

## GitHub and publishing

- CI runs on pushes to `main` and pull requests.
- Tags matching `v*` run lint, test, build, and `pnpm publish --provenance`.
- Root and website Vercel builds install from `pnpm-lock.yaml`.
