# AGENTS.md — filter-chip-bar

## Quick Start

```bash
npm install          # install deps
npm run storybook    # dev with Storybook on :6006
npm run dev          # tsup --watch (build-only)
npm test             # vitest run (single suite: parser.test.ts)
npm run lint         # oxlint src/
npm run build        # tsup (CJS + ESM + DTS)
```

CI order (strict): `lint` → `test` → `build`

## Architecture

```
src/
├── hook.ts              ← Core: useFilterChipBar() — all state + keyboard logic (~600 lines)
├── parser.ts            ← Search text → chips, freeText; parseQuery / parseCurrentToken
├── tokenize.ts          ← Search text → syntax-highlighted TextToken[]
├── fuzzy.ts             ← Levenshtein + findClosest (for "Did you mean?")
├── progressive.ts       ← Usage-based hint system (localStorage)
├── types.ts             ← All public types + localStorage helpers
├── index.ts             ← Full package export (shadcn renderer + hook + utils)
├── headless.ts          ← Hook-only export (zero UI deps)
├── FilterChipBar.tsx    ← shadcn/Tailwind renderer (Radix Popover + lucide icons)
├── ui/popover.tsx       ← Wrapped Radix Popover (shadcn style)
├── lib/utils.ts         ← cn() = clsx + tailwind-merge
├── styles/globals.css   ← shadcn CSS variables (light + .dark)
├── __tests__/parser.test.ts  ← Only test file
examples/
├── antd6-renderer.tsx   ← Ant Design 6 adapter (separate import path)
```

### Three export paths

| Import | What |
|--------|------|
| `filter-chip-bar` | Shadcn renderer + hook + all types/utils |
| `filter-chip-bar/headless` | Hook only (zero UI deps) |
| `filter-chip-bar/antd6` | Antd6 renderer (from `examples/`) |

Both `index.ts` and `headless.ts` re-export from the same source files. Changing a type in `types.ts` affects all three paths.

### searchText is the single source of truth

`searchText` (raw string) drives everything. `chips`, `freeText`, `textTokens` are all derived via `parseQuery()` / `tokenizeSearchText()`. Never mutate chip state directly — always set `searchText` and let derivation cascade.

### localStorage namespaces

Every page/component MUST use a unique `storageNamespace`. Presets (`ns:presets`), recent searches (`ns:recent`), usage counters (`ns:usage`), and hint flags (`ns:hint:N`) all use this prefix. Collisions cause stale presets/history leaking between pages.

## Commands That Matter

```bash
npm run lint         # oxlint src/ — NOT eslint
npm test             # vitest run — single suite in src/__tests__/parser.test.ts
npm run build        # tsup → dist/ (CJS + ESM + DTS)
npm run storybook    # storybook dev -p 6006 (vite builder)
```

**How to run a single test**: There's only one test file, but if tests grow:
```bash
npx vitest run src/__tests__/parser.test.ts
```

## Build System (tsup)

- **Entry points**: `src/index.ts` → `dist/index.js|cjs`, `src/headless.ts` → `dist/headless.js|cjs`
- **Formats**: CJS + ESM (dual)
- **Externals**: `react`, `react-dom`, `dayjs` are NOT bundled (peer deps). All other deps ARE bundled.
- **DTS**: Generated, no splitting (`splitting: false`)

The `main`/`module`/`types` in `publishConfig` point to `dist/` — `src/` imports only work in dev.

## Tech Stack & Conventions

- **TypeScript**: strict mode, ES2020 target, JSX `react-jsx`
- **Linter**: oxlint (NOT eslint — `npm run lint` runs oxlint)
- **Testing**: vitest, no vitest.config.ts needed (defaults work)
- **Styling**: Tailwind CSS 3 with shadcn HSL variables, `darkMode: ['class']`
- **UI primitives**: Radix Popover + Separator, lucide-react icons
- **Class merging**: custom `cn()` via `clsx` + `tailwind-merge`
- **Path alias**: `@/*` → `./src/*` only in tsconfig — NOT available in runtime/tsup. Storybook adds it manually in viteFinal.
- **React**: peer dep `>=17`, dev uses React 18.3
- **Node**: CI uses Node 20

## Testing Quirks

- **Single test file**: `src/__tests__/parser.test.ts` covers parser, tokenizer, and fuzzy matching
- No component/hook tests yet — parser tests are the only automated verification
- Tests use vitest + plain TypeScript (no DOM needed for parser/tokenize/fuzzy)
- No test setup file or vitest config needed

## Design Philosophy (from DESIGN.md)

- `ChipConfig.options` can be `async (chips) => Promise<FilterOption[]>` — accepts current chip state for cascading filters (dependency graph model)
- Label aliases (`aliases: ['st']`) are lossless compression — parser maps alias → canonical label, output always uses canonical keys
- Commit-based re-fetch (on Enter/space/suggestion), not reactive on every keystroke
- Negated chips use `not_` prefix in output keys: `-Status:Failing` → `chips['not_Status']`

## CI / Publishing

- **CI**: on push to `main` and PRs — lint → test → build
- **Publish**: triggered by `v*` git tags, runs `npm run build` then `npm publish --provenance --access public` to npmjs.org
- No changesets, no versioning automation — manual tags to publish
- Storybook deployed to Vercel via `vercel.json` (`npm run build-storybook` → `storybook-static/`)
