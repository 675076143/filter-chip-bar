# Design Notes — Mathematical Foundations

> Software design is applied mathematics. Every API decision is a trade-off between expressiveness and simplicity, measurable in information-theoretic terms.

---

## 1. Cascading Filters — Graph Theory

### Problem
Traditional filter fields are **independent nodes** — selecting `Department:Engineering` doesn't affect `Team` options. But real-world data forms a **directed dependency graph**:

```
Department ──filters──→ Team ──filters──→ Project
```

### Insight
Model `ChipConfig.options` as a function of the graph state, not just a static set:

```typescript
options: async (chips) => {
  const dept = chips['Department'];
  return fetchTeams(dept);  // Only teams in selected department
}
```

The `chips` parameter is the **current graph traversal state** — what the user has selected so far. When any upstream node changes, downstream nodes re-resolve automatically.

### Implementation
The hook computes `currentChips` from `searchText` via `parseQuery` (using only static labels, not resolved options — this breaks the circular dependency). The async resolution `useEffect` depends on `currentChips`, so when the user commits a new chip (Enter/suggestion/space), dependent fields re-fetch.

### Why not reactive subscriptions?
A full reactive graph (RxJS observables, signal-based reactivity) would add 50+ lines of complexity for marginal benefit. The commit-based re-fetch (only on Enter/space/suggestion) is infrequent enough that synchronous re-resolution is fine. **O(n) re-fetch on commit, not O(1) on every keystroke.**

---

## 2. Label Aliases — Information Theory

### Problem
`Status:Passing` requires 15 characters. But the **information entropy** of this query is only ~8 bits (3 status options ≈ log₂(3) ≈ 1.6 bits, plus field identification). The character overhead is wasted bandwidth.

### Insight
Power users want **shorter channel encodings**. `st:pass` (8 chars) carries the same semantic information. This is the same principle as Unix command aliases (`ls` vs `list`), DNS CNAME records, and URL shorteners.

```typescript
{
  type: 'select',
  label: 'Status',
  aliases: ['st', 'status'],
  options: [...],
}
```

The parser maps any alias to the **canonical label** (`config.label`). The output `chips` always uses canonical keys, so consumers don't need to know about aliases.

### Shannon Entropy Perspective
- Full label: H(Status) = -log₂(1/6) ≈ 2.6 bits per character (6 unique labels)
- Alias `st`: H(st) = -log₂(1/6) ≈ 2.6 bits in 2 characters vs 6 characters
- **Compression ratio**: 3× without information loss

The alias is a **lossless compression** — `st:pass` and `Status:Passing` produce identical `chips` output. The parser is a decompressor.

### Why not arbitrary shortening?
Unrestricted aliases create ambiguity (`s` could be `Status` or `SKU`). The `aliases` array is explicit — the config author decides which aliases are unambiguous in their domain.

---

## 3. Frequency-Weighted History — Bayesian Probability

### Problem
Recent searches are sorted by **recency only** (most recent first). But P(next search = X) depends on both recency AND frequency:

```
P(X | history) ∝ P(X | recency) × P(X | frequency)
```

A query the user runs 10×/day should rank higher than one they ran once yesterday.

### Insight
Apply **exponential moving average** to search frequency:

```typescript
interface RecentSearch {
  text: string;
  total: number;
  timestamp: number;
  frequency: number;  // Cumulative count, incremented on each use
}
```

Sort by `frequency DESC, timestamp DESC` — most-used first, most-recent breaks ties.

### Why not Bayesian decay?
Full Bayesian inference (with exponential time decay, priors, etc.) would model:
```
score = frequency × e^(-Δt/τ)
```
where τ is a time constant (~24h). This is more theoretically sound but:
1. Requires a time-constant tuning parameter (domain-specific)
2. The simple `frequency × recency` sort is a good approximation for N ≤ 10 items
3. With only 10 recent items, the marginal benefit of precise Bayesian ranking is negligible

**Simpler model, same practical outcome.**

---

## What We Did NOT Do (and Why)

### Boolean Algebra (Parenthetical Grouping)
`(Status:Passing OR Status:Failing) AND Orders:>=100`

**Rejected**: The grammar becomes context-free (requires recursive descent parser). Current grammar is **regular** (finite state machine, no recursion). Adding parentheses moves from O(n) to O(n²) parsing complexity for a feature <5% of users need.

### Custom Parsing Middleware (Category Theory)
```typescript
middleware: [(text) => text.replace(/@(\w+)/g, 'Mention:$1')]
```

**Rejected**: The pipeline `text → parseQuery → chips` is a **natural transformation** between categories (strings → structured data). Making it composable adds a functor layer that:
1. Increases API surface area by O(n) where n = number of middleware
2. Creates ordering dependencies (middleware A must run before B)
3. `commands` already provides an escape hatch for custom syntax

### Vector Space Similarity (Linear Algebra)
Suggest "similar" queries based on filter-space distance.

**Rejected**: Requires computing and storing vectors for each historical query. With ≤10 recent items, exact ranking is sufficient. Vector similarity becomes useful at scale (>100 queries), which exceeds the localStorage-backed history capacity.

---

## Summary

| Feature | Math Branch | Key Insight | Complexity Added |
|---------|------------|-------------|-----------------|
| Cascading Filters | Graph Theory | Options as function of graph state | +5 lines (pass `chips` to async) |
| Label Aliases | Information Theory | Lossless compression of query syntax | +3 lines (alias array + matching) |
| Frequency History | Bayesian Probability | P(next) ∝ frequency × recency | +2 lines (increment + sort) |

**Total: +10 lines of logic, 3 new capabilities.** The mathematical framing ensured each feature is minimal, correct, and composable — no more complexity than the problem demands.

---

# Communication Theory Foundations

> FilterChipBar is fundamentally a communication channel: user intent → encoded as text → decoded into structured filters. Communication theory tells us how to make this channel reliable and efficient.

## The Shannon-Weaver Model Applied

```
User Intent → [Encoder: typing] → [Channel: search bar] → [Decoder: parseQuery] → Filter Result
                                        ↑
                                   Noise: typos, syntax errors, invalid options
```

Every design decision maps to a communication engineering concept.

---

## 4. Forward Error Correction (FEC) — "Did you mean?"

### Communication Principle
In digital communications, error-correcting codes (Hamming, Reed-Solomon, Turbo codes) add redundancy so the receiver can not only **detect** errors but **correct** them without retransmission. This is critical in one-way channels (satellite, deep space) where retransmission is expensive.

### Problem
The component has error **detection** (red highlighting = "value invalid") but no error **correction**. A typo like `Status:Pasing` (missing one 's') produces a red error — the user must figure out and fix the problem themselves.

### Insight
Apply FEC at the suggestion layer. When the exact match fails, use **Levenshtein edit distance** to find the closest valid option. If distance ≤ 2, display a "Did you mean **Passing**?" suggestion. The user corrects with one click — no retransmission (re-typing) needed.

```typescript
// Levenshtein distance: minimum single-character edits to transform a → b
function levenshtein(a: string, b: string): number { ... }

// FEC decoder: find closest valid codeword within correction capacity
function findClosest(input: string, options: string[], maxDistance: number): string | null {
  return options
    .map(o => ({ option: o, distance: levenshtein(input.toLowerCase(), o.toLowerCase()) }))
    .filter(o => o.distance > 0 && o.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)[0]?.option ?? null;
}
```

### Why Levenshtein and not Hamming?
Hamming distance only counts **substitutions**. Levenshtein counts insertions + deletions + substitutions — necessary because typing errors include missing letters (`Pasing`) and extra letters (`Passsing`).

### Correction Capacity
t = ⌊(d-1)/2⌋ where d is minimum code distance. With maxDistance=2, we correct 1-character errors with certainty and 2-character errors probabilistically. This matches real-world typo patterns (92% of typos are single-character).

---

## 5. Congestion Control — Debounced Cascading Re-fetch

### Communication Principle
TCP's congestion control algorithm (slow start → congestion avoidance → fast retransmit) prevents **network collapse** by detecting congestion and backing off. Without it, multiple senders flooding a bottleneck router causes throughput to approach zero.

### Problem
Cascading filters (feature #1) trigger async re-fetch when `currentChips` changes. If the user commits multiple chips in rapid succession (`Department:Eng Team:Frontend Project:UI`), each commit triggers a full re-fetch of ALL dependent async options. This creates a **request storm** — N commits × M dependent fields = N×M API calls in quick succession.

### Insight
Apply TCP-style **exponential backoff** via debounce. Instead of firing immediately, wait 200ms after the last chip change. If another change arrives during the wait, reset the timer. Only the **final state** triggers re-fetch:

```
t=0ms:   chips change (Department:Eng) → schedule fetch in 200ms
t=50ms:  chips change (Team:Frontend)  → cancel previous, schedule new in 200ms
t=100ms: chips change (Project:UI)     → cancel previous, schedule new in 200ms
t=300ms: timer fires → ONE fetch with final state {Department:Eng, Team:Frontend, Project:UI}
```

This reduces N×M requests to **1 request**, matching TCP's principle: send less when the network is congested.

### Implementation
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // re-resolve async options
  }, 200);
  return () => clearTimeout(timer);
}, [chipConfigs, currentChips]);
```

### Why 200ms?
- Human reaction time to visual feedback: ~200ms
- Below this threshold, users can't perceive the delay
- Above 500ms, users feel "something is wrong"
- 200ms is the sweet spot: invisible to users, sufficient for coalescing rapid inputs

---

## 6. What We Did NOT Do (Communication Theory Edition)

### Multi-Protocol Multiplexing (FDMA)
`#hashtag`, `@mention`, `>date` syntaxes sharing one channel.

**Rejected**: Adds parser complexity (multiple syntax branches) for a feature most apps don't need. The current `key:value` protocol with `aliases` already covers 95% of use cases. Can be added later via `prefix` field if needed.

### Full-Duplex Result Count
Real-time result count inline as user types.

**Rejected**: Requires the consumer to run queries on every keystroke — expensive and backend-specific. The `searchResultCount` prop already exists for commit-time feedback. Full-duplex is the consumer's responsibility, not the component's.

---

## Summary (Communication Theory)

| Feature | Comm Theory Concept | Key Insight | Complexity Added |
|---------|-------------------|-------------|-----------------|
| Fuzzy Match "Did you mean?" | Forward Error Correction (FEC) | Levenshtein decoder suggests corrections | +30 lines |
| Debounced Re-fetch | TCP Congestion Control | Coalesce rapid chip changes into one request | +5 lines |

**Total: +35 lines, 2 robustness improvements.** The component went from "detects errors" to "corrects errors", and from "request-per-change" to "request-per-batch" — both straight from the communication engineering playbook.
