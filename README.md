# Co-Creator AI

AI co-pilot for content creators. Generate ideas, scripts, hooks, titles, and descriptions that stay on-brand by learning from your channel, buckets, and past content.

## Tech stack

- **Next.js 15** (App Router), **React 19**
- **Supabase** — Auth (Google OAuth) + Postgres
- **Drizzle ORM** — schema, migrations (Drizzle Kit only)
- **Tailwind CSS**, **ShadCN**-style UI, **Inter** + **Instrument Serif**, orange primary
- **OpenAI** — ideas, brainstorm, content generation

All app source lives under `/src`.

## Quick start

```bash
bun install
cp .env.example .env.local   # then fill in Supabase, DATABASE_URL (pooler), OpenAI
bun run db:up                # run migrations
bun run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, set up your channel, and start generating ideas.

**Important:** Use Supabase’s **Connection pooler** URI (port 6543) for `DATABASE_URL`, not the direct connection (port 5432), to avoid “max clients reached”.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `bun run dev`  | Start dev server               |
| `bun run build`| Production build               |
| `bun run lint` | ESLint                         |
| `bun run typecheck` | TypeScript check          |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run migrations             |
| `bun run db:up`     | Generate + migrate          |

## Docs

- **[documentation/SETUP.md](documentation/SETUP.md)** — Full setup (env, Supabase Auth, migrations).
- **[documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md)** — Architecture and data model.
- **[PRD.md](PRD.md)** — Product requirements.
