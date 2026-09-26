
-- Kleiderbörse Cloud-Datenbank (Supabase / PostgreSQL)
create table if not exists public.sellers (
  id uuid primary key,
  number text not null unique,
  name text not null,
  phone text default '',
  commission_enabled boolean not null default true,
  commission_rate numeric(5,2) not null default 15,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id bigint generated always as identity primary key,
  receipt_no bigint generated always as identity unique,
  register_id text not null,
  payment text not null check (payment in ('Bar','EC','PayPal')),
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.receipt_items (
  id bigint generated always as identity primary key,
  receipt_id bigint not null references public.receipts(id) on delete cascade,
  seller_number text,
  unassigned_note text not null default '',
  size text not null,
  price numeric(10,2) not null,
  commission_enabled boolean not null default true,
  commission_rate numeric(5,4) not null default 0.15
);

alter table public.sellers enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

-- Für die erste Veranstaltung bewusst einfach:
-- Die Kassen-App nutzt den öffentlichen anon-Key. Schreib-/Leserechte
-- werden deshalb per RLS geöffnet. Später kann das mit Login/PIN abgesichert werden.
drop policy if exists "kb sellers select" on public.sellers;
drop policy if exists "kb sellers insert" on public.sellers;
drop policy if exists "kb sellers update" on public.sellers;
drop policy if exists "kb sellers delete" on public.sellers;
create policy "kb sellers select" on public.sellers for select using (true);
create policy "kb sellers insert" on public.sellers for insert with check (true);
create policy "kb sellers update" on public.sellers for update using (true) with check (true);
create policy "kb sellers delete" on public.sellers for delete using (true);

drop policy if exists "kb receipts select" on public.receipts;
drop policy if exists "kb receipts insert" on public.receipts;
drop policy if exists "kb receipts delete" on public.receipts;
create policy "kb receipts select" on public.receipts for select using (true);
create policy "kb receipts insert" on public.receipts for insert with check (true);
create policy "kb receipts delete" on public.receipts for delete using (true);

drop policy if exists "kb items select" on public.receipt_items;
drop policy if exists "kb items insert" on public.receipt_items;
create policy "kb items select" on public.receipt_items for select using (true);
create policy "kb items insert" on public.receipt_items for insert with check (true);

create index if not exists receipt_items_receipt_id_idx on public.receipt_items(receipt_id);
create index if not exists receipts_created_at_idx on public.receipts(created_at desc);
create index if not exists receipts_register_idx on public.receipts(register_id);
create index if not exists receipt_items_seller_idx on public.receipt_items(seller_number);

-- V54: Artikel ohne Verkäufernummer zulassen und mit Notiz speichern.
alter table public.receipt_items alter column seller_number drop not null;
alter table public.receipt_items add column if not exists unassigned_note text not null default '';
alter table public.receipt_items add column if not exists unassigned_photo text not null default '';


-- V65: Cloud-Archiv für komplette Börsen-Sicherungen.
-- Eine archivierte Börse wird als vollständiger JSON-Snapshot gespeichert.
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
