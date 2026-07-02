# Kanban Workspace – Low-Level Design

## 1. Purpose & Assumptions
This LLD explains how the local-first kanban experience is realized in code. It focuses on concrete modules, component contracts, data structures, side effects, and operational considerations. Scope is limited to the Next.js client application; there is no backend. Assumptions: single-user browser sessions, IndexedDB availability, and modern evergreen browsers with ES2022 support.

## 2. Module Inventory
| Module | Description | Key APIs / Props | Implementation Notes |
| --- | --- | --- | --- |
| `BoardsProvider` (`src/components/contexts/BoardsProvider.tsx`) | React context that exposes `boards`, `isLoading`, and mutation functions. | `addBoard(name, { withSeedData })`, `deleteBoard(boardId)`, `refreshBoards()`, `resetBoards()` | Wraps IndexedDB helpers, tracks loading spinner, fires analytics events. Ensures board list stays sorted by `createdAt`. |
| `usePersistentKanbanTasks` (`src/hooks/use-persistent-kanban-tasks.ts`) | Custom hook storing the task list for a single board. | Returns `{ tasks, isLoading, replaceTasks, updateTasks }`. | Bootstraps from IndexedDB, falls back to `seedTasksFactory`, normalizes per-column order, debounces first persist via ref flag. |
| `KanbanBoard` (`src/components/kanban/KanbanBoard.tsx`) | Presentational grid with drag/drop interactions. | Props: `columns`, `tasks`, `onTasksChange`, `onAddTask`, `onTaskOpen`. | Creates column ? tasks map, wires `@dnd-kit` sensors, recalculates task orders during drag end, surfaces accessible counts. |
| `TaskDialog` (`src/components/kanban/TaskDialog.tsx`) | Modal for create/edit operations. | Props: `mode`, `initialValues`, event callbacks. | Uses Radix dialog primitives, Zod validation, and tailors button set depending on mode. |
| `boardsSidebarSection` (`src/components/ui/boardsSidebarSection.tsx`) | Sidebar region with board list, create, delete, and reset flows. | Controlled by parent sidebar layout; integrates `CreateBoardDialog`. | Keeps its own dialog state, resets local forms via imperative ref, triggers router navigation after CRUD.
| `task-storage` (`src/lib/task-storage.ts`) | Thin IndexedDB wrapper. | `readBoards`, `writeBoard`, `deleteStoredBoard`, `readStoredTasks`, `writeStoredTasks`, `clearAllStoredData`, etc. | Implements lazy `indexedDB.open`, handles migrations between object stores, migrates legacy default board data.
| `kanban` helpers (`src/lib/kanban.ts`) | Domain utilities. | `createSeedTasks`, `normalizeTaskOrder`, ID generators, label/date helpers. | Provide deterministic starter content and consistent ordering semantics. |
| `stats` components (`src/app/stats/page.tsx`, `src/components/stats/*`) | Pull boards + tasks, aggregate metrics, render board cards. | `BoardCard` expects `BoardSnapshot` data. | Handles sequential load, transforms data into totals, shows skeleton placeholders while loading.
| `analytics` shim (`src/lib/analytics.ts`) | Wraps GA API. | `trackEvent(name, params)` | No-ops server-side; ensures code can call analytics without guards.

## 3. Data Structures
- **KanbanBoardMeta** (`src/types/Board.ts`)
  ```ts
  type KanbanBoardMeta = {
    id: string;
    name: string;
    createdAt: string; // ISO timestamp
    updatedAt: string;
  };
  ```
- **KanbanTask** (`src/types/Tasks.ts`)
  ```ts
  type KanbanTask = {
    id: string;
    title: string;
    description?: string;
    columnId: TaskStatus; // alias for "Todo" | "InProgress" | "Done"
    status: TaskStatus;   // kept redundant for compatibility
    priority: "low" | "medium" | "high";
    labels: string[];
    order: number;        // relative order inside column
    dueDate?: string;     // ISO date
    createdAt: string;
    updatedAt: string;
  };
  ```
- **BoardSnapshot** (`src/types/BoardSnapshot.ts`): summarises per-board counts for stats view.
- **Constants** (`src/data/kanban.ts`): `KANBAN_COLUMNS`, `DEFAULT_BOARD_ID`, etc., enforce canonical IDs across UI/persistence.

## 4. Control Logic Details
### 4.1 Board Creation
1. `CreateBoardDialog` submits to `BoardsProvider.addBoard()`.
2. Provider trims the name, generates IDs/timestamps, writes to `boards` store.
3. Optional seed: `createSeedTasks()` ? `normalizeTaskOrder()` ? `writeStoredTasks(board.id)`.
4. Context updates `boards` state and fires `trackEvent("board_create")` so analytics capture metadata like `with_seed_data`.
5. Sidebar/router pushes `/boards/{id}` to reveal the board.

### 4.2 Task Bootstrap & Persistence
- During `usePersistentKanbanTasks` effect:
  1. Calls `readStoredTasks(boardId)`.
  2. If tasks exist, normalizes them; if migration required (legacy key), rewrites to the board-specific key.
  3. If missing, uses `seedTasksFactory` (welcome board seeds, otherwise empty) and writes a fresh array.
  4. `skipNextPersistRef` prevents immediately re-writing the same data the effect already wrote.
- Updates via `replaceTasks` or `updateTasks` always pass through `normalizeTaskOrder` before hitting `writeStoredTasks`.

### 4.3 Drag & Drop
- `KanbanBoard` sets up a `DndContext` + `SortableContext` per column.
- On `onDragEnd`:
  - Determine source column from `active.data.current.columnId`.
  - Determine drop target from `over` item (task or column placeholder).
  - Clone column task arrays, move the task via `arrayMove` (same column) or splice/insert (cross-column).
  - Recompute `order` and `updatedAt` fields per affected column.
  - Flatten to a single tasks array and invoke `onTasksChange` (wired to `replaceTasks`), causing the persistence effect to fire downstream.

### 4.4 Task Dialog
- `BoardContent` tracks `taskEditor` state (`closed` | `create` | `edit`).
- Initial form values vary based on mode (pull from `readyTasks` when editing).
- Submit handler normalizes strings, parses comma-delimited labels, converts dates, and either appends a new task or maps existing tasks to updated copies.
- Delete handler filters the task array, closes the modal, and reports analytics.

### 4.5 Stats Aggregation
- `stats/page.tsx` effect loops through `boards` sequentially (no concurrency to keep IDB access simple).
- For each board, `readStoredTasks` + `normalizeTaskOrder` ensures stable ordering.
- Derived metrics: tasks per status, `done/total` completion %, `lastUpdatedAt` (max `updatedAt`), earliest `dueDate`.
- UI shows skeleton placeholders while `loadingSnapshots` is true; updates grid once data arrives.

## 5. Error Handling & Edge Cases
- **IndexedDB unavailability**: `task-storage` rejects early when `window/indexedDB` is missing; consumers treat this as "no data" and fall back to seeds so UI remains functional even during SSR.
- **Concurrency**: There is no optimistic locking; the last write wins. Multi-tab edits can clobber each other. BroadcastChannel sync is a future enhancement.
- **Empty names**: Board creation defaults to "Untitled board" if the user submits whitespace.
- **Task order drift**: All mutations call `normalizeTaskOrder`, producing deterministic indexes per column.
- **Delete workspace**: `resetBoards` clears both stores in a single transaction, resets context state, and logs `workspace_reset` events.
- **Analytics availability**: `trackEvent` checks for `window.gtag`; events silently drop during SSR or if GA is blocked.

## 6. Performance Notes
- Memoization via `useMemo` caches `tasksByColumn` and stats breakdowns.
- Drag sensors use an activation distance of 6px to avoid false positives on tap.
- Grid layout switches between single-column (mobile) and multi-column (desktop) to keep DOM diff minimal.
- Persistence writes the entire `tasks` array; introducing delta writes or throttling can reduce IndexedDB pressure when dragging quickly.

## 7. Extensibility Considerations
- Persistence can be abstracted by wrapping `task-storage` behind an interface; future adapters (cloud sync, REST) would swap implementations while keeping hooks/components stable.
- Additional columns/statuses can be introduced by mutating `KANBAN_COLUMNS`. Task/order logic already respects dynamic sets because columns are iterated rather than hard-coded.
- UI primitives follow shadcn conventions, so adding new dialogs/cards stays consistent.
- Observability: `docs/RUM-WEB-VITALS.md` outlines RUM ingestion; hooking up `/api/rum` would reuse existing analytics scaffolding.

## 8. Testing Strategy Hooks
While not yet implemented, the LLD recommends:
- Unit tests for `normalizeTaskOrder`, label/date helpers, and `task-storage` (with IDB mocks).
- React Testing Library specs exercising `BoardsProvider` (board create/delete/reset) and `usePersistentKanbanTasks` (bootstrap, migrations, persistence skipping logic).
- Playwright smoke tests covering board creation, drag/drop, and stats view to guard against regressions.

This document should be used alongside `docs/ARCHITECTURE.md` for end-to-end context and the ADRs for historical decisions.
