# ADR-0002 — Drag & Drop via @dnd-kit

- **Date:** 2025-10-21
- **Status:** Accepted

## Context
- Kanban UX depends on smooth drag-and-drop reordering across columns.
- Solution must work with React 19, support keyboard activation, and stay bundle-friendly.
-
- Alternatives considered: HTML5 `dragstart/drop`, React Beautiful DnD (deprecated), custom pointer listeners.

## Decision
- Adopt [`@dnd-kit`](https://docs.dndkit.com/) core + sortable modules.
- Use `PointerSensor` with a small activation distance and `closestCorners` collision detection for column swapping.
- Model cards as sortable items; columns as droppable zones that show hover affordances.

## Consequences
- ✅ Modern, actively maintained library compatible with App Router and concurrent React.
- ✅ Fine-grained sensors allow consistent desktop/mobile gesture behaviour.
- ✅ Sortable context emits accessible attributes; cards add keyboard handlers to stay operable.
- ⚠️ Adds ~15 kB gzipped and requires memoised handlers to avoid rerenders.
- ⚠️ No built-in multi-select; future bulk move support demands extra state.
