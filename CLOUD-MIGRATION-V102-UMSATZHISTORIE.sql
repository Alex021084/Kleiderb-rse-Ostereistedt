-- V102: Dauerhafte Verkäufer-Umsatzhistorie
-- Diese Tabelle ist absichtlich NICHT mit receipts per Fremdschlüssel verbunden.
-- Das Löschen der aktuellen Kassenbons darf historische Umsätze nicht löschen.
create table if not exists public.turnover_history (
  id bigint generated always as identity primary key,
  source_item_id bigint not null unique,
  receipt_ref text,
  seller_number text not null,
  seller_name text not null default '',
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.turnover_history enable row level security;
drop policy if exists "kb turnover history select" on public.turnover_history;
drop policy if exists "kb turnover history insert" on public.turnover_history;
drop policy if exists "kb turnover history update" on public.turnover_history;
create policy "kb turnover history select" on public.turnover_history for select to authenticated using (true);
create policy "kb turnover history insert" on public.turnover_history for insert to authenticated with check (true);
create policy "kb turnover history update" on public.turnover_history for update to authenticated using (true) with check (true);

create index if not exists turnover_history_seller_date_idx
  on public.turnover_history(seller_number, created_at desc);

-- Explizite Rechte für angemeldete App-Benutzer.
grant select, insert, update on public.turnover_history to authenticated;
grant usage, select on sequence public.turnover_history_id_seq to authenticated;
