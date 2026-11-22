-- Version 101: gemeinsame Börsenart für alle Kassen
create table if not exists public.event_config (
  id integer primary key check (id = 1),
  mode text not null check (mode in ('clothing','toy')),
  updated_at timestamptz not null default now()
);
alter table public.event_config enable row level security;
drop policy if exists "event_config_read_anon" on public.event_config;
drop policy if exists "event_config_write_anon" on public.event_config;
create policy "event_config_read_anon" on public.event_config for select to anon using (true);
create policy "event_config_write_anon" on public.event_config for all to anon using (true) with check (true);
grant select, insert, update on public.event_config to anon;
insert into public.event_config (id, mode) values (1, 'clothing') on conflict (id) do nothing;
