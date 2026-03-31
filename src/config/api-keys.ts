/**
 * Registry of all API keys used across the platform.
 * Grouped by service provider.
 */

export type ApiKeyField = {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  helpText?: string;
  /** If true, the key is public and sent to the browser (NEXT_PUBLIC_*) */
  isPublic?: boolean;
};

export type ApiKeyGroup = {
  id: string;
  label: string;
  description: string;
  icon: string;
  fields: ApiKeyField[];
};

export const API_KEY_GROUPS: ApiKeyGroup[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    description: "Primary AI provider for content generation. Required if not using OpenAI",
    icon: "brain",
    fields: [
      {
        key: "ANTHROPIC_API_KEY",
        label: "API Key",
        placeholder: "sk-ant-...",
        required: false,
        helpText: "Get your key at console.anthropic.com. Required if OpenAI key is not set",
      },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    description: "Alternative AI provider + embeddings. Required if not using Anthropic",
    icon: "sparkles",
    fields: [
      {
        key: "OPENAI_API_KEY",
        label: "API Key",
        placeholder: "sk-...",
        required: false,
        helpText: "Get your key at platform.openai.com. Required if Anthropic key is not set",
      },
    ],
  },
  {
    id: "perplexity",
    label: "Perplexity",
    description: "Used for URL parsing and research — extracts content from web pages",
    icon: "globe",
    fields: [
      {
        key: "PERPLEXITY_API_KEY",
        label: "API Key",
        placeholder: "pplx-...",
        required: false,
        helpText: "Optional. Falls back to basic HTML extraction without it",
      },
    ],
  },
  {
    id: "supabase",
    label: "Supabase",
    description: "Database, auth, and file storage",
    icon: "database",
    fields: [
      {
        key: "NEXT_PUBLIC_SUPABASE_URL",
        label: "Project URL",
        placeholder: "https://xxxxx.supabase.co",
        required: true,
        isPublic: true,
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        label: "Anon Key (public)",
        placeholder: "eyJ...",
        required: true,
        isPublic: true,
        helpText: "Safe for browser use — RLS protects data",
      },
      {
        key: "SUPABASE_SERVICE_ROLE_KEY",
        label: "Service Role Key (secret)",
        placeholder: "eyJ...",
        required: true,
        helpText: "Server-only. Bypasses RLS — never expose to client",
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    description: "PostgreSQL connection for Drizzle ORM migrations",
    icon: "hard-drive",
    fields: [
      {
        key: "DATABASE_URL",
        label: "Connection String",
        placeholder: "postgresql://user:pass@host:5432/dbname",
        required: true,
      },
    ],
  },
  {
    id: "inngest",
    label: "Inngest",
    description: "Durable workflow orchestration — manages generation pipelines",
    icon: "workflow",
    fields: [
      {
        key: "INNGEST_EVENT_KEY",
        label: "Event Key",
        placeholder: "...",
        required: false,
        helpText: "Not needed for local dev — only for production",
      },
      {
        key: "INNGEST_SIGNING_KEY",
        label: "Signing Key",
        placeholder: "signkey-...",
        required: false,
        helpText: "Not needed for local dev — only for production",
      },
    ],
  },
];
