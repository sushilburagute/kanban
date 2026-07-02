# ADR-0003 — State Management via React Context + Hooks

- **Date:** 2025-10-21
- **Status:** Accepted

## Context
- The app has two primary state domains:
  1. Board metadata (list of boards, reset operations).
  2. Per-board tasks with persistence side effects.
- Requirements emphasise small footprint and avoiding extra dependencies (no Redux/Zustand in package.json).

## Decision
- Encapsulate board metadata inside `BoardsProvider` (React context) backed by internal `useState` + hooks.
- Encapsulate task persistence per board inside the custom hook `usePersistentKanbanTasks`.
- Expose imperative helpers (`addBoard`, `deleteBoard`, `resetBoards`, `replaceTasks`, `updateTasks`) for UI features.

## Consequences
- ✅ Zero additional runtime deps; tree-shakeable and straightforward to test.
- ✅ Hooks hide IndexedDB specifics so UI stays declarative.
- ⚠️ Context rerenders every consumer when board list changes (sidebar + pages).
- ⚠️ Harder to debug than a dedicated store with DevTools; no time-travel/undo semantics.
- 🚧 Scaling to multi-tab sync or cross-window updates would require BroadcastChannel/EventTarget extensions.
