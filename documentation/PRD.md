# Co-Creator AI — Product Requirements Document (PRD)

---

## 1. Overview

**Co-Creator AI** is a web app that acts as an AI co-pilot for content creators who post short-form video across TikTok, Instagram, and YouTube. Unlike generic chatbots, it **remembers** the creator's channel (name, audience, goals, content buckets), style preferences, previous scripts and ideas, and—over time—what performed well, so every generation (ideas, scripts, hooks, titles, descriptions, hashtags) is consistent and context-aware.

**Value proposition:** One place to load channel context once, then generate ideas and copy that stay on-brand and improve over time, with a reusable B-roll library and performance tracking to inform what to create next.

**Tech stack (required):** Next.js, Supabase (auth + database), Tailwind CSS, Drizzle ORM, ShadCN as component base with custom design on top.

---

## 2. Goals and Objectives

- **Primary:** Reduce daily friction for creators who post daily by providing context-aware AI generation (ideas, scripts, hooks, titles, descriptions, hashtags) without re-pasting channel info every time.
- **Secondary:** Build a persistent "content brain"—channel config, B-roll library, and performance-linked content—so the system learns from style, preferences, and outcomes.
- **Quality:** Ship a professional, polished MVP with proper error handling, consistent branding, and a clean, unique UI (not default ShadCN-only).

---

## 3. Scope

### In scope (MVP / Phase 1)

- **Authentication:** Login page with **Google OAuth** only; **multi-user from day one** (each user has their own data).
- **Channel profile:** Single channel per user (or one "active" channel) with: channel name, core audience, goals, content buckets/series (with AI help to brainstorm and refine). Buckets = series = content categories/themes.
- **Ideas:** Generate new ideas with AI; each idea is stored and used for learning.
- **From an idea:** Generate (with AI): title, description, hashtags, script, hooks. All outputs stored and used for style/preference learning.
- **Learning/memory:** AI context includes: channel profile, buckets, previous scripts/ideas, style preferences, and (when available) which content performed well. No separate "preference form" required for v1—learning from usage is enough for MVP.
- **Performance:** User can **link published content** (URL per platform). **Manual entry** of key metrics (e.g. views, likes, engagement) for now; **data model and UI ready for future API integrations** (TikTok, Meta, YouTube).
- **B-roll library:** User selects a video file; **thumbnail extracted in the browser only** (no video sent to server). Store: compressed thumbnail, filename, optional description. Library searchable/filterable; optionally suggest or reference B-roll when generating scripts/ideas.
- **Hook inspiration library:** Support a **large list of proven hooks** (e.g. hundreds or thousands) that Co-Creator uses as inspiration when generating hooks. User can **load/import** this list (e.g. upload a file via the app) **or** add a static file somewhere in the platform (e.g. a file in the repo or a designated data folder that the app reads at runtime). When generating hooks for an idea, the AI uses this library as inspiration alongside channel context and style.
- **Dashboard:** Shows **recent ideas and scripts** plus a prominent **"Generate idea"** CTA.
- **UI/UX:** Clean, professional, unique branding on top of ShadCN; consistent layout and components; **proper error handling** and loading states.

### Out of scope (MVP)

- Premium / subscription / payments.
- Automated platform API integrations for performance (manual only in MVP).
- **Phase 2 (post-MVP):** AI follow-up on performance (analyze data after upload, draw conclusions, get tips, "what to produce more").

---

## 4. User Personas / Target Audience

- **Primary (v1):** Solo content creator (e.g. founder/PM) posting daily to TikTok, Instagram, and/or YouTube Shorts, who already uses generic AI but is frustrated by lack of memory and consistency.
- **Secondary:** Same persona with potential for multiple users/accounts later (e.g. small team or second creator); product is **multi-tenant from v1**.

---

## 5. Functional Requirements

**P0 (Must-have for MVP)**

1. **Auth:** Google OAuth sign-in; sign-out; protected routes; multi-user (tenant-scoped data by user/id).
2. **Channel profile:** CRUD for one channel per user: name, core audience, goals, buckets (names + short descriptions). AI-assisted brainstorm/refine for goals and buckets.
3. **Ideas:** Create and store "ideas"; generate new ideas with AI using channel + buckets + previous ideas/scripts.
4. **Content from idea:** From an idea, generate (and store): title, description, hashtags, script, hooks. All use same context (channel, style, history).
5. **Performance:** Add "published content" entry: platform (TikTok/Instagram/YouTube), URL, optional manual metrics (e.g. views, likes). List/link to previous content; data model supports future API fields.
6. **B-roll library:** Add item via local file: browser extracts one frame as thumbnail (client-side only), store compressed thumbnail + filename + optional description; list/search; optional use when generating scripts/ideas.
7. **Hook inspiration library:** Support loading a large list of proven hooks (e.g. ~1000) so the AI uses them as inspiration when generating hooks. **Option A:** User uploads/imports a file (e.g. TXT, CSV—one hook per line or column) through the app; we store it per user and inject a sample into AI context when generating hooks. **Option B:** A static file in the platform (e.g. `data/hooks.txt` in the repo or a configurable path) that the app reads at runtime; same injection into hook generation. MVP can ship with one approach (e.g. static file) and add the other later if needed.
8. **Dashboard:** Recent ideas and scripts; primary CTA = "Generate idea".
9. **Error handling:** Graceful failures for API/DB errors; user-facing messages; loading states for async actions.

**P1 (Should-have for MVP)**

10. Edit/delete ideas and scripts.
11. Associate an idea/script with a bucket/series.
12. When linking performance, associate with the source idea/script if possible.

**P2 (Nice-to-have for MVP)**

13. Simple "what performed well" summary (e.g. top 5 by views) from manually entered data.
14. Export script or copy blocks (e.g. copy to clipboard).
15. Search or filter the hook inspiration list in the UI (if stored in DB).

---

## 6. Non-Functional Requirements

- **Performance:** Dashboard and list views load in < 2s under normal conditions; AI generation streams or shows progress where possible.
- **Security:** Supabase RLS (or equivalent) so users only access their own channel, ideas, scripts, B-roll, performance data; secrets (e.g. OpenAI key) server-side only.
- **Scalability:** Data model and API design support multiple users and future growth; no hardcoded single-user assumptions.
- **UI:** Responsive (desktop-first acceptable for MVP); consistent design system; unique branding on top of ShadCN; accessible basics (focus, contrast, labels).

---

## 6.1 Design System / Branding

**Typography (Next.js fonts)**

- **Body / UI text:** **Inter** (loaded via `next/font/google`). Apply **-3% letter-spacing** (`letter-spacing: -0.03em`) so body text is slightly tighter than default.
- **Headings:** **Instrument Serif** (Google font, loaded via Next.js fonts). Use for all heading levels to give headings more presence and distinct branding.

**Primary brand color**

- **Primary:** **Orange.** Recommended default: a warm, accessible orange (e.g. **#EA580C** or Tailwind `orange-600`) that works for buttons, links, and accents while staying readable. If you prefer a softer or bolder variant, alternatives: a deep amber (e.g. `amber-600`) for a warmer feel, or a coral-orange for a more playful look—otherwise stick with the suggested orange.

**Implementation notes**

- Configure Inter and Instrument Serif in the root layout; apply letter-spacing via Tailwind (e.g. custom utility or `tracking-tighter` plus a small negative value if needed to hit -3%).
- Use Instrument Serif for `h1`–`h6` (or a shared heading class); Inter for all other text.
- Primary color should be wired into ShadCN/theming (CSS variables) so buttons, links, focus rings, and accents use the brand orange consistently.

**Templates and design inspiration**

- **Login and dashboard templates:** Use [ShadCN Blocks](https://ui.shadcn.com/blocks) as the structural and component inspiration for the **login** and **dashboard** layouts. For example: **Login** — consider blocks such as `login-03` (muted background, centered form) or `login-04` (form + image split) and adapt with Co-Creator branding (Instrument Serif for headings, Inter for body, orange primary). **Dashboard** — use blocks such as `dashboard-01` (sidebar + main content + cards/data table), `sidebar-03` (sidebar with submenus), or `sidebar-07` (collapsible icon sidebar) as the base layout; then customize with the design system above and content-specific sections (e.g. recent ideas, "Generate idea" CTA, channel summary).
- **Stylistic reference:** Use the assets in the **`inspiration/`** folder in this repo as design inspiration for look and feel. They illustrate a clean, minimal, professional aesthetic: light backgrounds, clear hierarchy, subtle use of orange as an accent, sidebar + main content with cards, and gallery-style content areas (relevant for B-roll library and content buckets). Apply this style on top of ShadCN blocks so the UI feels cohesive and uniquely branded rather than default ShadCN-only.

---

## 7. User Journeys

**A. First-time setup**

1. Sign in with Google.
2. Land on dashboard; prompted to set up channel (name, audience, goals, buckets).
3. Optionally use AI to brainstorm goals and buckets, then save.

**B. Generate and use an idea (core loop)**

1. From dashboard, click "Generate idea" (or open Ideas).
2. AI suggests one or more ideas based on channel + buckets + history; user picks/saves one.
3. From the idea, user generates: title, description, hashtags, script, hooks (in any order). When generating hooks, the AI uses the **hook inspiration library** (loaded/imported list of proven hooks) as inspiration alongside channel context.
4. User copies outputs and produces the video in external tools, then publishes.

**C. Track performance and close the loop**

1. User adds a "published content" entry: platform, URL, and manual metrics (views, likes, etc.).
2. Optionally links this entry to the source idea/script.
3. (Phase 2: AI analyzes performance and suggests what to produce more.)

**D. B-roll library**

1. User adds B-roll: selects local video file; app extracts thumbnail in browser and saves thumbnail + filename + description.
2. When generating a script (or idea), user can optionally "use B-roll from library"; AI can reference or suggest clips by description.

**E. Hook inspiration library (one-time or occasional setup)**

1. User loads a large list of proven hooks: either uploads/imports a file (e.g. TXT, CSV) via the app, or adds a static file somewhere in the platform (e.g. `data/hooks.txt` in the repo) that the app reads at runtime.
2. When the user generates hooks for an idea, the AI uses this list as inspiration (e.g. injects a sample into context) so generated hooks align with proven patterns.

---

## 8. Success Metrics

- **Usage:** At least 1 idea generated and 1 script (or equivalent output) generated per week per active user.
- **Consistency:** Generated copy is used with minimal manual re-prompting (qualitative; creator reports "no need to re-paste channel info").
- **Quality:** No critical bugs in auth or data isolation; errors handled without raw stack traces to user.
- **Phase 2:** After MVP, success = creator uses AI performance analysis at least once (e.g. "what to produce more").

---

## 9. Timeline

- **MVP:** Aggressive / ASAP; no fixed end date but prioritize shipping a usable first version.
- **Milestones:** (1) Auth + channel profile + dashboard; (2) Ideas + generation (title, description, hashtags, script, hooks); (3) B-roll library (browser-only thumbnail); (4) Performance linking + manual metrics; (5) Polish (errors, branding, UX).
- **Phase 2:** After MVP stable: performance analytics with AI (conclusions, tips, "produce more" suggestions).

---

## 10. Open Questions / Assumptions

- **Assumptions:** One active channel per user for MVP; "bucket" and "series" are the same (content categories). OpenAI is the LLM; API key is env-based server-side.
- **Open:** Exact list of manual metrics per platform (views, likes, comments, shares, etc.) to support in UI. Whether "draft" vs "final" script versions are needed in MVP.
- **Phase 2:** Which platform APIs (TikTok, Meta, YouTube) to integrate first for automated performance data.

---

## 11. Technical Standards & Conventions

**Database migrations (Drizzle)**

- Use **Drizzle Kit only** for generating and running database migrations.
- Scripts: **`db:generate`** (generate migrations), **`db:migrate`** (run migrations), **`db:up`** (run both generate and migrate). No other migration tooling.

**Pre-commit checks (Husky)**

- Use the **latest version of Husky** for Git hooks. No legacy bash script boilerplate at the top (use current Husky setup).
- **Pre-commit hook:** Run **linting** and **TypeScript** checks (e.g. `eslint`, `tsc --noEmit`). Commits that fail these checks must be blocked until fixed.

**Documentation**

- Put all relevant project documentation in a **`/documentation`** folder (e.g. architecture, API notes, setup, runbooks). Keep it updated as the product evolves.

**Supabase keys**

- Use **publishable key** and **secret key** for Supabase. Do **not** use the legacy **anon key** or **service role key** naming; use the current Supabase key types (publishable/secret) in env and code.

**Lint and type discipline**

- **Do not** use `eslint-disable` or `@ts-ignore` / `@ts-expect-error` to "fix" lint or type errors unless it is **absolutely necessary**. If such an exception is required, **document the reasoning** and **ask for confirmation** before adding it.

**Source layout**

- Keep **all application source code** under a **`/src`** folder (e.g. `src/app`, `src/components`, `src/lib`). Config files (e.g. `next.config`, `tailwind.config`, `drizzle.config`) may remain at the project root as usual.
