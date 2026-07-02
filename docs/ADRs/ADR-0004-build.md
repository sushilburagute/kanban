# ADR-0004 — Next.js 15 App Router Baseline

- **Date:** 2025-10-21
- **Status:** Accepted

## Context
- Requirements include a marketing landing page, routed board views, and a stats dashboard.
- Need automatic code-splitting, image/font optimisation, and a well-supported deployment story (Vercel).
- Development speed benefits from Turbopack + React Server Components, even though most features are client-only.

## Decision
- Use Next.js 15 with the App Router directory (`src/app`) and TypeScript.
- Keep configs minimal (default `next.config.ts`, Tailwind, ESLint flat config).
- Leverage `@next/third-parties/google` for Analytics injection instead of manually editing `<head>`.

## Consequences
- ✅ Out-of-the-box routing, metadata, font loading, and hydration primitives.
- ✅ Future server/edge features remain available if backend sync is added later.
- ⚠️ Many components are marked `"use client"` which limits RSC benefits and increases bundle size.
- ⚠️ dev/prod parity depends on Node 20+; no Dockerfile or CI pipeline currently enforces it.
