# Kanban Workspace — Architecture Brief

## 1. Executive Summary
- Local-first Kanban built with Next.js 15 App Router + React 19; all boards/tasks live in browser IndexedDB (`src/lib/task-storage.ts`) so users stay offline-ready.
- Core journeys: create boards with optional starter tasks, drag/drop cards across Todo/In Progress/Done, inspect stats, and wipe the workspace.
- Hard requirements: zero backend, instant persistence, PWA-lite UX on desktop + tablet, GA instrumentation for product telemetry.
- Non-goals: multi-user sync, server of record, collaborative presence, or enterprise auth—everything is intentionally single-user.
- Quality attributes (top 3): **Responsiveness** (drag/drop fluidity, Snappy rendering), **Resilience** (IndexedDB migrations, reset flow), **Approachability** (clean UI, theme toggle, stats storytelling).
- Constraints: Node 20+, Yarn + Next CLI, App Router `use client` components therefore no server data sources, no CI configured.
- Third parties kept lean: `@dnd-kit/*` for DnD, Radix + shadcn primitives, `next-themes`, `@next/third-parties/google` for GA.
- Analytics events fire on board/task CRUD + theme toggles; RUM/Web-Vitals plan captured in `docs/RUM-WEB-VITALS.md`.
- Risks today: zero automated tests, no error boundaries, IDB failures silently drop data, and perf can degrade with many cards because virtualization is absent.
- Roadmap must focus on instrumentation + guardrails before adding new features.

## 2. Architecture at a Glance
- **Stack**: Next.js 15 App Router, React 19, TypeScript 5, TailwindCSS 3 with shadcn components, Turbopack dev server, `next build`/`next start` for prod. No dedicated test runner configured.
- **Runtime**: All feature routes (`/`, `/boards/[id]`, `/stats`) are client components. Layout injects providers (`ThemeProvider`, `BoardsProvider`, custom `SidebarProvider`) and GA via `@next/third-parties`.
- **Bundler/build**: Next’s SWC compiler; no custom webpack/vite config. Tree-shaking relies on ES modules.
- **Storage boundary**: IndexedDB (boards + tasks object stores, version 2). No other persistence layers.
- **External services**: Only Google Analytics (gtag). Everything else is local browser APIs.
- **C4 views**:  
  - [C2 Container diagram](./diagrams/c2.md) — user, Next app, IndexedDB, GA, browser APIs.  
  - [C3 Component diagram](./diagrams/c3.md) — layout stack, contexts/hooks, lib/task-storage, analytics shim.

## 3. Building Blocks & Data Model
- **Module slices**
  - `src/app/layout.tsx`: wraps every route with Theme/Boards/Sidebar providers, renders sidebar shell + GA.
  - `src/components/contexts/BoardsProvider.tsx`: React context that owns board metadata + reset/delete flows.
  - `src/hooks/use-persistent-kanban-tasks.ts`: per-board tasks hook that bootstraps from IndexedDB, normalises order, and persists on state changes.
  - `src/lib/task-storage.ts`: low-level IndexedDB helpers (`readStoredTasks`, `writeStoredTasks`, `clearAllStoredData`, etc.).
  - `src/lib/kanban.ts`: domain helpers (seed tasks, order normalisation, label parsing, ID generation).
  - UI primitives under `src/components/ui/**` (sidebar system, dialogs, shadcn buttons, tooltip, etc.).
- **State topology**
  - *Global stable state*: board list + loading flag via `BoardsProvider`; consumed by sidebar, hero, stats page, and board route.
  - *Per-board volatile state*: `usePersistentKanbanTasks` holds tasks array + loading flag; DnD writes update React state first, persistence second.
  - *Ephemeral UI state*: dialogs (board create/delete, task modal), theme toggle (via `next-themes`), responsive sidebar.
- **Persistence boundary**
  - Boards store: `{ id, name, createdAt, updatedAt }`.
  - Task store: keyed by `boardId`, each value is an array of `KanbanTask` objects.
  - Legacy migration: default board falls back to localStorage-style key `tasks` if needed.
  - Transactions exist only for delete/reset flows.
- **Data contracts**
  - `KanbanTask` (status, labels, priority, dueDate, order, timestamps) — see `src/types/Tasks.ts`.
  - `BoardSnapshot` for stats aggregation — see `src/types/BoardSnapshot.ts`.
  - `SidebarLink`, `KanbanColumnType` for UI wiring.
- **Data flow highlights**
  - `BoardsSidebarSection` and board route both call `addBoard`/`deleteBoard`, which synchronise in-memory state + IndexedDB, then route via `next/navigation`.
  - Stats page loops through `boards[]`, loads tasks sequentially, normalises them, calculates metrics, and seeds the welcome board if empty.
  - Analytics events (`trackEvent`) only fire client-side; absence of `window.gtag` is tolerated.

## 4. Runtime View
- Sequence diagrams for each journey live under `docs/diagrams`:
  - [Create board](./diagrams/seq-create-board.md) — dialog → `BoardsProvider.addBoard` → IndexedDB → router push.
  - [Drag & drop move](./diagrams/seq-dnd-move.md) — DnD context reorders tasks → hook normalises → IndexedDB persists.
  - [Bulk operation (delete board)](./diagrams/seq-bulk-ops.md) — Assumption: “bulk” refers to multi-store delete; transaction removes board + tasks.
  - [Reset workspace](./diagrams/seq-reset-workspace.md) — sidebar dialog → `resetBoards` → `clearAllStoredData` → redirect home.
  - [Stats view](./diagrams/seq-stats-view.md) — stats page loops boards, pulls tasks, calculates aggregates, renders cards.
- User journeys stay entirely on the client; SSR only delivers chrome. Every async IO hop is IndexedDB-bound, so perceived latency is dominated by device storage speed.

## 5. Performance & Footprint
- **Bundle entrypoints**: `app/page.tsx` (~hero only), `app/boards/[boardId]/page.tsx` (largest chunk: DnD kit + task dialog + sidebar), `app/stats/page.tsx` (metrics + BoardCard components). Turbopack dev server matches Next’s production splitting but hydration still loads all client code at once.
- **Hydration strategy**: Layout and every route are marked `"use client"`, so React Server Components are effectively bypassed. Consider isolating static chrome/hero/stats summary into server components to cut JS cost.
- **Code-splitting**: Next.js automatically splits per route, but shared providers (sidebar, context, GA) land in every chunk. Additional splitting (e.g., lazy-load stats cards) is not implemented.
- **Render hotspots**
  - `KanbanBoard` re-renders the entire grid whenever `tasks` changes; drag/drop operations trigger reconciles for every card.
  - `BoardsSidebarSection` re-renders on every board mutation, reflowing the entire menu.
- **Memoization strategy**: 
  - `KanbanBoard` caches `tasksByColumn` via `useMemo`.
  - `usePersistentKanbanTasks` caches seed tasks in a ref to avoid regenerating arrays and normalises order before writes.
  - Board stats use `useMemo` to aggregate totals.
- **Virtualization**: none. Long columns will render every card, and DnD math is O(n) per column. Introduce windowing (e.g., `react-virtual`) if tasks per column exceed ~200.
- **DnD critical path**: pointer sensor (activation distance 6px) → `closestCorners` target resolution → `arrayMove` / splice manipulations → per-column `order` recomputation → persisted write (async). Latency mostly CPU-bound; persistence is awaited in effect but errors are swallowed.
- **Web Vitals plan**: implement snippet + `/api/rum` sink from [docs/RUM-WEB-VITALS.md](./RUM-WEB-VITALS.md). Targets: LCP <2.5s P75, INP <200ms, CLS <0.1; remediation playbook captured there.

## 6. Reliability & Failure Modes
- **Error handling**: there are no error boundaries. IndexedDB helpers wrap open failures but simply return empty data; callers fall back to seed tasks without notifying users.
- **Offline/rehydration**: Works offline because everything is local; however, there is no “sync pending” indicator and refresh will nuke unsaved UI state (dialogs).
- **Transactions**: delete + reset use multi-store transactions; other operations are single puts. There is no retry/rollback strategy.
- **Undo/Redo**: absent. Reset and delete actions are irreversible beyond a confirmation dialog.
- **Corruption recovery**: tasks normalization fixes order drift but not structural corruption. Consider versioned migrations (+ `Dexie` or `idb` wrappers) for resilience.
- **Feature flags**: none. Shipping risky features requires manual gating (e.g., env-specific sidebar buttons).
- **Concurrency**: multi-tab scenarios can diverge because there is no BroadcastChannel to refresh contexts when another tab mutates IndexedDB.

## 7. Security & Privacy
- **Data-at-rest**: IndexedDB plaintext inside the browser profile; no encryption. Rely on OS account security.
- **Data-in-transit**: Only GA events leave the device. No backend/network calls for product data.
- **XSS/CSP posture**: React sanitises strings, but no CSP headers or `next.config` hardening is defined; consider enabling `contentSecurityPolicy` + strict `referrerPolicy`.
- **Dependency risk**: minimal dependency graph (see `package.json`); keep `@dnd-kit`, `lucide-react`, and Radix patched. Use `npm audit` in CI once added.
- **Sandboxing/permissions**: No service worker, notifications, or clipboard permissions. IndexedDB access silently fails during SSR (handled).
- **PII stance**: Everything user-entered remains local. If future sync is added, ensure consent and encryption for potentially sensitive task names.

## 8. Accessibility & i18n
- **Landmarks & navigation**: Each route wraps content in `<main>` and the sidebar acts as primary nav, but there’s no explicit `<nav>` landmark or skip link.
- **Keyboard flows**: Dialogs and buttons use shadcn components with focus states. `KanbanTaskCard` is focusable and handles Enter/Space to open modal, but drag/drop requires a pointer device (`@dnd-kit` keyboard sensors are not enabled).
- **ARIA patterns**: Drag handles expose `aria-label="Drag task"` but columns lack `aria-dropeffect` hints. Dialogs rely on Radix for accessibility.
- **Color/contrast**: Tailwind tokens maintain light/dark palettes; verify with tooling because custom HSL variables may fall below WCAG AA for muted text.
- **RTL/i18n**: English copy is hard-coded; no translation infra, pluralisation, or RTL flipping. Add `next-intl` or messages JSON if localisation becomes a requirement.

## 9. Testing Strategy
- **Current state**: No automated tests (`tests/**` empty, no jest/vitest/playwright deps). Manual verification only.
- **Proposed pyramid**
  - *Unit*: `lib/kanban.ts` (seed generation, date conversions), `lib/task-storage.ts` (mocked IDB, migrations), `lib/utils.ts`.
  - *Integration*: React Testing Library for `BoardsProvider` + `usePersistentKanbanTasks` to ensure persistence loops/migrations behave, `KanbanBoard` drag callbacks (use `@dnd-kit` testing utilities).
  - *E2E*: Playwright covering golden journeys—create board, add/edit task, drag card, reset workspace, stats view. Include smoke for first paint + offline persistence.
- **Fixtures/factories**: Build task/board factories mirroring `KanbanTask` to avoid repeating boilerplate.
- **CI**: Add GitHub Actions pipeline (`lint`, `type-check`, `unit`, `e2e smoke`) to block regressions.

## 10. Observability
- **Current**: `trackEvent` sends fire-and-forget GA events for board/task/theme actions if `window.gtag` is present. No error logging, no structured logs.
- **Planned**:
  - Implement RUM + Web Vitals sink per `docs/RUM-WEB-VITALS.md`.
  - Add runtime error reporting (e.g., Sentry) via Next.js instrumentation, capturing board/task IDs (hashed) for context.
  - Define minimal log schema for custom `/api/rum` endpoint: `{ metric, value, boardCount, taskCount, path, userAgentHash }`.
  - Dashboards to ship first: Web Vitals P75, Task CRUD counts, Reset frequency, DnD completion time (calc from `task_update` vs `task_create`).
  - Debug toggles: add `?debugSidebar` query string to enable verbose console logging for persistence events.

## 11. Risks, Trade-offs, ADRs
- **Top risks**
  1. *Silent persistence failures*: `writeStoredTasks` catches and ignores errors → user may think work saved when it did not. **Mitigation**: surface toast + retry queue; add health check UI.
  2. *Scaling drag/drop*: Without virtualization, large boards cause expensive re-renders and pointer lag. **Mitigation**: window columns, debounce persistence, lazy-load column bodies.
  3. *Multi-tab divergence*: Context state does not update when another tab edits boards/tasks. **Mitigation**: BroadcastChannel to trigger `refreshBoards` + `replaceTasks`.
  4. *Lack of automated tests*: Regression risk on every refactor. **Mitigation**: implement pyramid from §9, enforce CI gating.
  5. *Reset workspace UX*: Destructive action lacks export/undo; accidental clicks wipe everything. **Mitigation**: add typed confirmation, optional backup export.
- **ADRs**
  - [ADR-0001](./ADRs/ADR-0001-storage.md) — IndexedDB for local-first persistence.
  - [ADR-0002](./ADRs/ADR-0002-dnd-kit.md) — `@dnd-kit` for drag/drop interactions.
  - [ADR-0003](./ADRs/ADR-0003-state.md) — React context + hooks instead of external state libs.
  - [ADR-0004](./ADRs/ADR-0004-build.md) — Next.js 15 App Router as the delivery platform.

## 12. Roadmap (30/60/90)
- **Next 30 days (stability wins)**
  - Add automated lint/type/test CI workflow; seed unit tests for `lib/kanban` + `BoardsProvider`.
  - Implement error toasts + retry logic for IndexedDB writes; expose “storage healthy” badge in sidebar.
  - Ship RUM snippet + `/api/rum` endpoint, wire metrics to GA.
- **Next 60 days (structural refactors)**
  - Split `app/boards/[id]` into server (static) + client islands to shave bundle size; lazy-load TaskDialog.
  - Introduce BroadcastChannel-based cache busting so multi-tab edits stay in sync.
  - Add export/import JSON and soft-delete board flow (mitigation for destructive actions).
- **Next 90 days (performance + UX)**
  - Virtualize long columns and batch `writeStoredTasks` to reduce INP.
  - Expand stats page with cached snapshots + background recalculation worker.
  - Lay groundwork for optional cloud sync (feature-flagged) by abstracting persistence adapter behind interfaces.
