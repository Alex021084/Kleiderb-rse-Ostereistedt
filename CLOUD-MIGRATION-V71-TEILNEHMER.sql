-- V71: Teilnahme an der aktuellen Börse je Verkäufer speichern.
-- Einmal im Supabase SQL Editor ausführen.
alter table public.sellers
  add column if not exists is_participating boolean not null default false;
