-- V77: Abgabe-/Abholungsbestätigungen und Unterschriften je Verkäufer speichern.
-- Im Supabase SQL Editor vollständig ausführen.
alter table public.sellers
  add column if not exists signature_documents jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
