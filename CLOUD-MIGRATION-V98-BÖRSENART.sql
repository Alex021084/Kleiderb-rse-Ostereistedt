-- KLEIDERBÖRSE OSTEREISTEDT e.V. – V98
-- Gemeinsame Veranstaltungsart für alle Kassen
create table if not exists public.event_config (
  id integer primary key check (id = 1),
  mode text not null check (mode in ('clothing','toy')),
  updated_at timestamptz not null default now()
);
alter table public.event_config enable row level security;
drop policy if exists "kb event config select" on public.event_config;
drop policy if exists "kb event config write" on public.event_config;
create policy "kb event config select" on public.event_config
  for select using (true);
create policy "kb event config write" on public.event_config
  for all using (true) with check (true);
grant select, insert, update on public.event_config to anon, authenticated;
insert into public.event_config (id, mode)
values (1, 'clothing')
on conflict (id) do nothing;
notify pgrst, 'reload schema';
