-- ============================================
-- Webinar Platform — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- ── Enums ──────────────────────────────────

create type webinar_status as enum (
  'draft', 'sources_added', 'ingesting', 'theses_ready',
  'approved', 'generating', 'completed'
);

create type source_type as enum ('url', 'pdf', 'csv', 'xlsx', 'txt');
create type source_status as enum ('pending', 'processing', 'completed', 'failed');
create type artifact_type as enum ('presentation', 'landing_page', 'thank_you', 'attendance_chain', 'gift');
create type artifact_status as enum ('pending', 'generating', 'completed', 'failed');
create type edited_by as enum ('ai', 'user');

-- ── Tables ─────────────────────────────────

create table webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text not null,
  date timestamptz not null,
  target_audience text not null default '',
  speaker_name text not null default '',
  speaker_bio text,
  status webinar_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  type source_type not null,
  url text,
  file_name text,
  storage_path text,
  status source_status not null default 'pending',
  extracted_text text,
  created_at timestamptz not null default now()
);

create table theses (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  title text not null,
  description text not null default '',
  "order" integer not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  type artifact_type not null,
  status artifact_status not null default 'pending',
  content jsonb,
  version integer not null default 1,
  prompt_id uuid,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  version integer not null,
  content jsonb not null,
  edited_by edited_by not null,
  change_description text,
  created_at timestamptz not null default now()
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  artifact_type artifact_type not null,
  name text not null,
  system_prompt text not null,
  user_prompt_template text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  source_id uuid,
  chunk_text text not null,
  chunk_index integer not null default 0,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table knowledge_base_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────

create index idx_sources_webinar on sources(webinar_id);
create index idx_theses_webinar on theses(webinar_id);
create index idx_artifacts_webinar on artifacts(webinar_id);
create index idx_artifact_versions_artifact on artifact_versions(artifact_id);
create index idx_embeddings_webinar on embeddings(webinar_id);

-- ── RLS Policies (disabled for now, enable when auth is added) ──
-- alter table webinars enable row level security;
-- alter table sources enable row level security;
-- alter table theses enable row level security;
-- alter table artifacts enable row level security;

select 'Schema created successfully!' as result;
