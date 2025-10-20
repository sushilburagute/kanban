# Kanban Workspace

Kanban Workspace is a minimalist board for planning projects and keeping teams aligned. It runs entirely in the browser, stores everything locally in IndexedDB, and keeps momentum high with drag-and-drop, quick dialogs, and concise stats.

## Features

- 🗂️ Multiple boards with optional “starter pack” sample tasks when you create a board.
- ↕️ Column-based drag-and-drop powered by [`@dnd-kit`](https://github.com/clauderic/dnd-kit).
- 💾 Local-first persistence—no accounts, no backend, everything stays on your device.
- 🌗 Light/dark theme toggle and responsive sidebar navigation.
- 📊 Stats dashboard summarising board totals, completion rate, and last activity.
- 🧹 Workspace reset flow to clear every board and task in one click.

## Tech Stack

- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [React 19](https://react.dev/)
- [`@dnd-kit` sortable](https://github.com/clauderic/dnd-kit)
- [Lucide](https://lucide.dev/) icon set
- Tailwind CSS with shadcn-inspired primitives

## Requirements

- Node.js 20 or newer (matching the Next.js 15 support matrix)
- npm 9+ (feel free to swap in pnpm/yarn/bun and adjust commands)

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the workspace.

### Useful scripts

- `npm run dev` – start the Turbopack dev server.
- `npm run build` – create the production build.
- `npm run start` – serve the production build.
- `npm run lint` – run ESLint with Next.js defaults.

## Usage Tips

- **Create boards:** Use the sidebar “Add board” button or the empty-state CTA. Toggle **Include starter tasks** to seed the board with curated sample cards.
- **Organise tasks:** Drag cards between columns to change status and click any card to edit or delete.
- **Reset workspace:** The sidebar footer includes **Reset workspace**, which wipes all boards and tasks from IndexedDB.
- **Review stats:** Visit `/stats` for per-board totals, completion rate, and upcoming due dates.

## Project Layout

```
src/
├─ app/                # Routes for home, boards, stats
├─ components/         # UI primitives and kanban-specific components
├─ data/               # Static configuration (default columns, labels)
├─ hooks/              # Shared hooks (persistent tasks, etc.)
├─ lib/                # Domain helpers and IndexedDB access
└─ types/              # TypeScript domain models
```

## Deployment

Any platform that supports Next.js 15 works out of the box. Deploying to [Vercel](https://vercel.com/) is as easy as connecting the repository—no environment variables are required because storage is browser-side.

## Contributing

Issues and pull requests are welcome. If you notice a UX papercut or want to expand the analytics, open a discussion. Before submitting changes, run `npm run lint` to keep the codebase consistent.
