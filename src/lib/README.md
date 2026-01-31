# lib

Shared utilities, types, and integrations for Co-Creator AI. Structured for production scalability.

## Structure

```
lib/
├── ai/
│   ├── prompts.ts        # All prompt templates (single source of truth)
│   └── openai.ts         # OpenAI client + generation (uses prompts)
├── api/
│   └── fetch-api.ts      # JSON fetch wrapper (401/4xx handling)
├── context/
│   └── channel-context.ts # buildChannelContext, ChannelContextParams
├── data/
│   └── hooks-file.ts     # Hook inspiration (data/hooks.txt)
├── db/                    # Database (Drizzle)
│   ├── index.ts          # db client, schema re-exports
│   ├── queries.ts        # Channel, project, content queries
│   └── schema.ts         # Tables and types
├── hooks/
│   └── use-redirect-unauthorized.ts
├── media/
│   └── broll-thumbnail.ts # Video thumbnail extraction (client)
├── query/
│   ├── query-client.ts   # getQueryClient, makeQueryClient
│   └── query-keys.ts     # Centralized query keys
├── supabase/              # Auth (Supabase)
│   ├── client.ts
│   ├── middleware.ts
│   └── server.ts
├── types/
│   └── idea-graph-types.ts # Idea graph (React Flow) types
├── utils.ts               # cn() and general helpers
├── metadata.ts            # SEO / site metadata
└── README.md              # This file
```

## Import conventions

- **Direct file imports** (no barrel/index files): e.g. `@/lib/api/fetch-api`, `@/lib/context/channel-context`, `@/lib/data/hooks-file`, `@/lib/hooks/use-redirect-unauthorized`, `@/lib/media/broll-thumbnail`, `@/lib/query/query-client`, `@/lib/query/query-keys`, `@/lib/types/idea-graph-types`.
- **db**: `@/lib/db`, `@/lib/db/schema`, `@/lib/db/queries` (db has index.ts for client + schema re-exports).
- **AI**: `@/lib/ai/openai` (client + generation), `@/lib/ai/prompts` (prompt templates).
