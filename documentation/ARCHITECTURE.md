# Co-Creator AI — Architecture

## Overview

Co-Creator AI is a Next.js 15 (App Router) application that helps content creators generate and manage ideas, scripts, hooks, and performance data. All source code lives under `/src`.

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Supabase Auth (Google OAuth); publishable + secret keys
- **Database:** Supabase Postgres, accessed via **Drizzle ORM**
- **Migrations:** Drizzle Kit only (`db:generate`, `db:migrate`, `db:up`)
- **Styling:** Tailwind CSS, ShadCN-style components, Inter + Instrument Serif, orange primary
- **AI:** OpenAI (GPT-4o-mini) for ideas, goals/buckets brainstorm, and content outputs (title, description, hashtags, script, hooks)

## Data model (high level)

- **channels** — One per user: name, core audience, goals
- **buckets** — Content themes/series per channel
- **ideas** — AI-generated or user-entered ideas; belong to channel, optional bucket
- **content_outputs** — Title, description, hashtags, script, hooks per idea
- **published_content** — Linked posts (platform, URL, manual metrics, optional idea link)
- **broll** — B-roll library: filename, thumbnail (data URL), description; thumbnails extracted client-side
- **hook_inspiration** — Optional per-user hook list; MVP also supports static `data/hooks.txt`

## Security

- Supabase RLS can be used for Postgres; currently all DB access is server-side with tenant filtering by `user_id` (Supabase Auth) / `channel_id` (Drizzle).
- OpenAI API key and Supabase secret key are server-only.
- Publishable key is used in browser and middleware for session refresh.

## Key flows

1. **Auth:** Google OAuth → Supabase → callback → redirect to dashboard.
2. **Channel:** User creates/updates channel and buckets; AI can brainstorm goals/buckets.
3. **Ideas:** Generate ideas (AI) or add manually → from an idea, generate title, description, hashtags, script, hooks (each stored).
4. **Hooks:** Hook generation uses a sample from `data/hooks.txt` (or user hook list) as inspiration.
5. **B-roll:** User selects video file → thumbnail extracted in browser → only thumbnail + filename + description stored.
6. **Performance:** User adds published content (platform, URL, optional metrics, optional idea link).

## Folder structure

- `src/app` — Routes (login, dashboard, ideas, channel, broll, performance)
- `src/components` — UI and feature components
- `src/lib` — DB (Drizzle schema, queries), Supabase client/server, OpenAI, hooks file reader, B-roll thumbnail util
- `src/middleware.ts` — Supabase session refresh
- `documentation/` — Setup and architecture docs
