# Co-Creator AI — Setup

## Prerequisites

- **Bun** (package manager)
- **Node.js** 18+ (for Next.js)
- **Supabase** account
- **OpenAI** API key

## 1. Clone and install

```bash
bun install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- **Supabase:** Create a project at [supabase.com](https://supabase.com). In Project Settings → API, use:
  - **Publishable key** (client-safe) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - **Secret key** (server-only) → `SUPABASE_SECRET_KEY`
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- **Database:** In Supabase → Project Settings → Database, copy the connection string (URI) → `DATABASE_URL`
- **OpenAI:** [platform.openai.com](https://platform.openai.com) → API key → `OPENAI_API_KEY`

## 3. Supabase Auth (Google OAuth)

In Supabase Dashboard → Authentication → Providers, enable **Google**. Add your OAuth client ID and secret from Google Cloud Console. Set the redirect URL to:

`https://<your-project-ref>.supabase.co/auth/v1/callback`

For local dev, add `http://localhost:3000/auth/callback` to your app’s authorized redirect URIs in Google Cloud Console.

## 4. Database migrations

Run migrations with Drizzle Kit (see PRD — use these scripts only):

```bash
bun run db:generate   # Generate migration files from schema
bun run db:migrate     # Run migrations against DATABASE_URL
bun run db:up           # Generate + migrate
```

Ensure `DATABASE_URL` is set before running `db:migrate` or `db:up`.

## 5. Run the app

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then set up your channel and start generating ideas.

## Hook inspiration file

Optional: add a list of proven hooks (one per line) in `data/hooks.txt`. Lines starting with `#` are ignored. The AI uses a sample of this file when generating hooks.
