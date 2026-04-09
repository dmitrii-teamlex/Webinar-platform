# Webinar Platform

AI-powered webinar funnel generator. Creates presentation briefs, landing pages, thank-you pages, attendance chains, and gift content from webinar metadata.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — shared remote Postgres (project ref: `utfedujdfgcvoomaemmt`)
- **Inngest** — durable workflow orchestration for AI generation
- **Anthropic Claude Sonnet 4** — primary AI provider via `src/lib/ai/gateway.ts`
- **shadcn/ui** + Tailwind CSS

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (see "Environment Variables" below)

# 3. Start dev server
npx next dev

# 4. Start Inngest dev server (separate terminal — required for artifact generation)
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

App runs at http://localhost:3000, Inngest dashboard at http://localhost:8288.

## Environment Variables

Create `.env.local` in the project root with:

```
# Supabase (shared remote instance)
NEXT_PUBLIC_SUPABASE_URL=https://utfedujdfgcvoomaemmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

# Database
DATABASE_URL=<database-connection-string>

# AI Providers
# IMPORTANT: You must set BOTH keys. Turbopack inlines ANTHROPIC_API_KEY as ""
# because @anthropic-ai/sdk references it at import time. CLAUDE_API_KEY is the workaround.
ANTHROPIC_API_KEY=<your-anthropic-api-key>
CLAUDE_API_KEY=<your-anthropic-api-key>
OPENAI_API_KEY=
PERPLEXITY_API_KEY=

# Inngest (local dev)
INNGEST_DEV=1
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Known Issues

- **Turbopack + ANTHROPIC_API_KEY**: Turbopack replaces `process.env.ANTHROPIC_API_KEY` with `""` at compile time because the `@anthropic-ai/sdk` package references it internally. The gateway (`src/lib/ai/gateway.ts`) falls back to `CLAUDE_API_KEY`. Both must be set.
- **Inngest must be running**: Artifact generation requires the Inngest dev server. Without it, generate/regenerate endpoints return 503. Always start it in a separate terminal.
- **`serverExternalPackages`**: `@anthropic-ai/sdk` and `openai` are listed in `next.config.ts` to prevent Turbopack from bundling them.

## Architecture

- `src/app/api/webinars/[id]/generate/` — triggers generation for all artifact types
- `src/app/api/artifacts/[id]/regenerate/` — regenerates a single artifact
- `src/lib/inngest/functions/generators/` — 5 Inngest functions (presentation, landing-page, thank-you, attendance-chain, gift), all triggered by `ARTIFACT_GENERATION_REQUESTED` event
- `src/lib/ai/gateway.ts` — AI provider abstraction (Anthropic primary)
- `src/lib/ai/prompt-registry.ts` — prompt templates per artifact type
- `src/lib/db/queries/webinar-context.ts` — loads webinar data for generation
