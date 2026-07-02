# ADR-0001 — Local-First Persistence with IndexedDB

- **Date:** 2025-10-21
- **Status:** Accepted

## Context
- The product promise (README) emphasises “no backend, everything stays on your device”.
- Users expect boards/tasks to survive refreshes and browser restarts, even offline.
- Data model is simple (boards metadata + tasks array) yet may grow beyond `localStorage` limits.

## Decision
- Store boards and tasks inside the browser’s IndexedDB using two object stores (`boards`, `tasks`) behind `src/lib/task-storage.ts`.
- Interact through thin async helpers to keep `BoardsProvider` and `usePersistentKanbanTasks` framework-agnostic.
- Seed or migrate data lazily on the client (default board + starter tasks).

## Consequences
- ✅ Scales well for tens of thousands of tasks versus `localStorage`.
- ✅ Works offline automatically and keeps PII on-device.
- ⚠️ Requires defensive coding for non-browser environments (helpers early-return on SSR).
- ⚠️ IndexedDB APIs are verbose; error handling is manual and currently swallows failures.
- 🚧 Lacks cross-device sync; future requirements would need replication or export/import tooling.
