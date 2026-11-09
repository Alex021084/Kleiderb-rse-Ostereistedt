-- V69: Wechselgeld-Startbestand dauerhaft je Barkasse speichern.
-- Im Supabase SQL Editor vollständig ausführen.

create table if not exists public.register_float_balances (
  register_id text primary key,
  amount numeric(10,2) not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now()
);

alter table public.register_float_balances enable row level security;

drop policy if exists "kb register float select" on public.register_float_balances;
drop policy if exists "kb register float insert" on public.register_float_balances;
drop policy if exists "kb register float update" on public.register_float_balances;

create policy "kb register float select"
  on public.register_float_balances for select using (true);
create policy "kb register float insert"
  on public.register_float_balances for insert with check (true);
create policy "kb register float update"
  on public.register_float_balances for update using (true) with check (true);

grant select, insert, update on public.register_float_balances to anon, authenticated;

notify pgrst, 'reload schema';
