# Building a Local-First Kanban That Actually Respects Your Flow

When I set out to build Kanban Workspace, I wanted something that felt as immediate as the sticky notes on my desk but lived comfortably inside a browser tab. No accounts, no syncing delays, and no SaaS anxiety—just a fast board that remembers everything locally, even when your Wi-Fi blinks out mid-sprint. This post walks through the product story, the technical stack behind it, and how the little details (drag physics, stats, instrumentation) add up to a trustworthy planning tool.

## Why Another Kanban?
Most kanban tools optimised for teams at scale bring along heavy concepts: permissions, workflows, cloud sync, and an entire admin layer. Solo builders or tight-knit pods rarely need that overhead—they need velocity. Kanban Workspace focuses on:
- **Local-first persistence**: every board and card lives in IndexedDB on your device.
- **Zero-signup onboarding**: a welcome board with curated starter tasks shows you the ropes in seconds.
- **Speed**: drag and drop powered by `@dnd-kit`, memoized rendering, and instant stats.
- **Privacy**: the only network call is Google Analytics for anonymous usage insights (and even that is gated by your browser).

## Architecture in Plain English
Under the hood, the app is a pure Next.js 15 + React 19 client. The layout shell wires up a `ThemeProvider`, `BoardsProvider`, and responsive sidebar before handing control to one of three routes:
1. `/` — a lightweight hero page.
2. `/boards/[id]` — the kanban canvas everyone lives in.
3. `/stats` — a dashboard that aggregates totals, completion rate, and upcoming due dates.

Tasks persist via a tiny IndexedDB wrapper (`src/lib/task-storage.ts`). When you open a board, `usePersistentKanbanTasks` reads that board’s tasks, normalizes their order, and writes updates whenever you drag, edit, or complete cards. Everything happens client-side, so refreshing the page or going offline keeps the exact same state.

### Drag & Drop That Stays Out of Your Way
`KanbanBoard.tsx` wraps each column in a `DndContext` + `SortableContext`. Pointer sensors wait for a 6px move before activating so clicks don’t accidentally pick up cards. When a drag ends, the component recalculates the `order` field for every affected column and persists through the hook. Because there’s no server round-trip, the UI feels instant.

### Tiny Analytics, Big Insight
I still wanted to know which features people leaned on, so the app emits GA events for board/task CRUD, theme toggles, and workspace resets. RUM + Web Vitals plumbing is documented in `docs/RUM-WEB-VITALS.md`, ready to wire into a `/api/rum` endpoint when deeper telemetry is needed. Until then, everything stays anonymous and local.

## UX Details That Matter
- **Starter tasks**: the welcome board seeds six cards that guide you through drag/drop, editing, and persistence. You can toggle seeds off for new boards if you prefer a blank canvas.
- **Dialog ergonomics**: board and task dialogs use shadcn components with crisp focus states, so keyboard users aren’t stuck.
- **Light/dark themes**: powered by `next-themes`, respecting system preferences but letting you toggle manually.
- **Stats view**: a `/stats` route loops through every board and surfaces metrics. It’s the quickest way to prove progress to stakeholders without exporting spreadsheets.
- **Reset flow**: one click wipes IndexedDB if you want a clean slate before handing your laptop to someone else.

## What’s Next
The roadmap focuses on resilience and scale without surrendering the local-first philosophy:
1. Ship Web Vitals reporting + error toasts so persistence issues never go unnoticed.
2. Break the monolithic board route into server/client islands and add list virtualization.
3. Add import/export plus BroadcastChannel sync so multiple tabs stay truthful.

If you want to kick the tires, clone the repo, run `npm install && npm run dev`, and open `http://localhost:3000`. Every change you make stays in your browser, so feel free to experiment wildly.

I hope Kanban Workspace inspires you to revisit what “productivity” apps can look like when you value speed and privacy over feature sprawl. Let me know what you ship with it.
