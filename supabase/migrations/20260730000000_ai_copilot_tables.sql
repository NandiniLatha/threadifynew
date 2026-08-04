-- ============================================================
-- Threadify AI Copilot — Conversation & Message Persistence
-- Migration: 20260730000000_ai_copilot_tables.sql
-- ============================================================

-- ── Conversations ────────────────────────────────────────────────────────────
create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.ai_conversations enable row level security;

create policy "Users can view own ai conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own ai conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- ── Messages ─────────────────────────────────────────────────────────────────
create table if not exists public.ai_messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references public.ai_conversations(id) on delete cascade not null,
  role              text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content           text,
  image_url         text,
  tool_calls        jsonb,
  tool_call_id      text,
  feedback          text check (feedback in ('up', 'down') or feedback is null),
  created_at        timestamptz default now() not null
);

alter table public.ai_messages enable row level security;

-- Messages inherit access from their parent conversation
create policy "Users can view own ai messages"
  on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can insert ai messages into own conversations"
  on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can update feedback on own ai messages"
  on public.ai_messages for update
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists ai_conversations_user_id_idx
  on public.ai_conversations (user_id, created_at desc);

create index if not exists ai_messages_conversation_id_idx
  on public.ai_messages (conversation_id, created_at asc);

-- ── Supabase Storage — AI Attachments bucket ─────────────────────────────────
-- Run this only if the bucket does not yet exist.
-- insert into storage.buckets (id, name, public)
--   values ('ai-attachments', 'ai-attachments', true)
--   on conflict (id) do nothing;
