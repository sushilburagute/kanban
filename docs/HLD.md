# Kanban Workspace – High-Level Design

## 1. Vision & Scope
Kanban Workspace is a local-first task planning experience delivered as a Next.js 15 single-page style application. The product targets individuals or small pods who need a frictionless kanban board that runs entirely in the browser, works offline, and never ships data to a proprietary backend. Scope covers the client experience (layout shell, kanban route, stats route, providers, IndexedDB persistence) plus instrumentation via Google Analytics. Out of scope: multi-user sync, cloud services, authentication, or any server-rendered domain data.

## 2. Goals and Non-Goals
- **Primary goals**: instant drag-and-drop UX, resilient offline persistence, approachable onboarding (starter board + stats), low dependency footprint, analytics hooks for product learnings.
- **Secondary goals**: responsive layout that feels natural on tablets/desktop, light/dark theming, reset flows for privacy, extensible architecture for future adapters.
- **Explicit non-goals**: server APIs, real-time collaboration, user accounts, enterprise security controls, workspace-level role management.

## 3. Architecture Overview
- **Delivery platform**: Next.js 15 App Router with React 19. Every feature route is a client component (`"use client"`) rendered inside `app/layout.tsx`.
- **Composition shell**: `RootLayout` loads `ThemeProvider`, `BoardsProvider`, and `SidebarProvider`, renders a responsive sidebar, and injects Google Analytics. This ensures board state + navigation chrome wrap each route.
- **Feature routes**:
  1. `/` (hero/marketing) – minimal copy and CTA to open a board.
  2. `/boards/[boardId]` – primary kanban canvas using `KanbanBoard`, `TaskDialog`, and `usePersistentKanbanTasks`.
  3. `/stats` – analytics dashboard summarising every board via `BoardCard` + `MetricCard`.
- **State layers**:
  - `BoardsProvider` (context) holds board metadata and workspace lifecycle actions.
  - `usePersistentKanbanTasks` (hook) owns per-board task arrays + persistence loop.
  - UI components keep ephemeral dialog and drag state locally.
- **Persistence**: IndexedDB via `src/lib/task-storage.ts` with two object stores (`boards`, `tasks`). All reads/writes happen client-side; there is no API tier.
- **3rd party boundaries**: `@dnd-kit` for gesture handling, Radix/shadcn UI primitives, `next-themes` for theming, GA via `@next/third-parties/google`.

## 4. System Context
```
User ? Next.js SPA (Routes + Providers) ? IndexedDB (boards/tasks)
                                   ?
                                    ?? Google Analytics (events, Web Vitals planned)
```
- Browser is both runtime and database host. The only network egress is analytics events.
- Workspace reset wipes IndexedDB and returns the shell to the welcome state.

## 5. Logical Component View
| Layer | Responsibilities | Key Files |
| --- | --- | --- |
| Presentation | Layout shell, sidebar, dialogs, kanban grid, stats cards, hero copy. | `src/app/*.tsx`, `src/components/ui/*`, `src/components/kanban/*`, `src/components/stats/*` |
| State/Domain | Board CRUD, task persistence hook, drag/drop transformations, analytics helpers. | `src/components/contexts/BoardsProvider.tsx`, `src/hooks/use-persistent-kanban-tasks.ts`, `src/lib/kanban.ts`, `src/lib/analytics.ts` |
| Persistence | IndexedDB gateway (open, migrations, CRUD, workspace reset). | `src/lib/task-storage.ts` |
| Data | Canonical constants and types. | `src/data/kanban.ts`, `src/types/**/*.ts` |

## 6. Data & Control Flow
1. **Board lifecycle**
   - Sidebar create dialog triggers `BoardsProvider.addBoard()`, which writes the board metadata, optionally seeds tasks, updates context state, and routes to the new board.
   - Delete/reset flows call `deleteStoredBoard` or `clearAllStoredData`, ensuring both board metadata and tasks are removed in a single IndexedDB transaction.
2. **Task lifecycle**
   - `usePersistentKanbanTasks` bootstraps from IndexedDB, falls back to seed tasks for the welcome board, caches normalized order, and persists updates after local state settles.
   - `KanbanBoard` receives tasks + columns and emits `onTasksChange` after drag/drop to keep order and column metadata consistent.
   - `TaskDialog` writes updates via `updateTasks` callbacks and fires analytics events for CRUD operations.
3. **Stats aggregation**
   - `/stats` loops every board, loads tasks sequentially, normalizes them, computes totals + derived metrics, and renders cards. Legacy data migrates transparently.
4. **Analytics**
   - `trackEvent` ensures GA calls are no-ops outside the browser. Events cover board CRUD, task CRUD, theme toggles, and reset flows. Web-Vitals/RUM ingestion is defined in `docs/RUM-WEB-VITALS.md` for future implementation.

## 7. Deployment View
- Runs via `next dev --turbopack` locally and `next build/next start` in production.
- Any platform that supports Next.js 15 (Vercel, Netlify, Render, Fly.io) works because no server env vars or backend services exist.
- Static assets (fonts, styles, icons) ship with the app bundle. Browser cache + IndexedDB persist user data per origin.

## 8. Quality Attributes
- **Responsiveness**: Drag interactions rely on `@dnd-kit` pointer sensors tuned for small activation distance, minimal reflow (grid templates), and memoized task buckets.
- **Resilience**: Persistence helpers guard against SSR and IDB failures, migrations pull legacy data, reset flows clear both stores. However, errors currently fail silently—surfacing toast/retry queues is a roadmap item.
- **Security/Privacy**: No user data leaves the browser aside from anonymized GA telemetry. Workspace reset allows quick sanitization.
- **Maintainability**: Clear layering (providers ? hooks ? libs) and typed models simplify refactors. ADRs in `docs/ADRs` capture irreversible decisions.

## 9. Capacity & Scaling Considerations
- Task rendering is O(n) per column and unvirtualized. Comfortable up to a few hundred cards; beyond that expect input latency.
- IndexedDB operations are per-board (no batching). Drag/drop updates write entire task arrays; introducing delta writes or debounced persistence would improve throughput.
- Multi-tab scenarios can diverge because there is no BroadcastChannel invalidation.

## 10. Security, Compliance, and Privacy
- No authentication ? rely on browser sandbox. If future sync/cloud export is added, persistence needs abstraction + encryption.
- GA is the only tracker; ensure cookie consent if used in regulated regions.
- Content Security Policy is not yet configured—Next.js defaults apply.

## 11. Risks & Mitigations
1. **Silent persistence failures** – Add error toasts and queued retries; expose storage health indicator.
2. **Performance degradation with large boards** – Introduce virtualization/windowing, split board route into server/client islands, debounce writes.
3. **Multi-tab inconsistencies** – Adopt `BroadcastChannel` to refresh providers upon external mutations.
4. **Lack of automated tests** – Add Jest/Vitest + Playwright coverage and CI gating.
5. **Destructive reset UX** – Offer JSON export + typed confirmation before wiping data.

## 12. Roadmap Touchpoints
- 30 days: CI, storage error surfacing, Web Vitals plumbing.
- 60 days: server components for static chrome, BroadcastChannel sync, import/export.
- 90 days: virtualization, stats caching, optional cloud adapter abstraction.

This high-level design should provide any engineer or stakeholder with the architectural context required to plan features, mitigate risk, and communicate system boundaries.
