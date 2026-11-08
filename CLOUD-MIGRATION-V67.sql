-- V67: Änderungshistorie für nachträglich bearbeitete Kassenbons.
create table if not exists public.receipt_edit_history (
  id bigint generated always as identity primary key,
  receipt_id bigint not null references public.receipts(id) on delete cascade,
  edited_at timestamptz not null default now(),
  reason text not null default '',
  old_snapshot jsonb not null,
  new_snapshot jsonb not null
);
alter table public.receipt_edit_history enable row level security;
drop policy if exists "kb receipt history select" on public.receipt_edit_history;
drop policy if exists "kb receipt history insert" on public.receipt_edit_history;
create policy "kb receipt history select" on public.receipt_edit_history for select using (true);
create policy "kb receipt history insert" on public.receipt_edit_history for insert with check (true);
create index if not exists receipt_edit_history_receipt_idx
  on public.receipt_edit_history(receipt_id, edited_at desc);
