-- Kleiderbörse – Cloud-Archiv
-- Einmal im Supabase SQL Editor ausführen.

create table if not exists public.archives (
  id uuid primary key,
  name text not null,
  saved_at timestamptz not null default now(),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.archives enable row level security;

drop policy if exists "kb archives select" on public.archives;
drop policy if exists "kb archives insert" on public.archives;
drop policy if exists "kb archives update" on public.archives;
drop policy if exists "kb archives delete" on public.archives;
create policy "kb archives select" on public.archives for select using (true);
create policy "kb archives insert" on public.archives for insert with check (true);
create policy "kb archives update" on public.archives for update using (true) with check (true);
create policy "kb archives delete" on public.archives for delete using (true);

create index if not exists archives_saved_at_idx on public.archives(saved_at desc);
