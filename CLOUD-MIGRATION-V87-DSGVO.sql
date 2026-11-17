-- V87: DSGVO-Kenntnisnahme und Zeitpunkt der letzten Teilnahme.
-- Im Supabase SQL Editor vollständig ausführen.
alter table public.sellers
  add column if not exists last_participation_at timestamptz;

-- Bereits aktuell teilnehmende Verkäufer erhalten bei der Migration einen Startwert.
-- Bereits vorhandene Zeitstempel werden nicht überschrieben.
update public.sellers
set last_participation_at = now()
where is_participating = true
  and last_participation_at is null;

-- Die DSGVO-Unterschrift wird versioniert im vorhandenen JSON-Feld
-- signature_documents unter dem Schlüssel "dsgvo" gespeichert.
notify pgrst, 'reload schema';

-- Verkäuferdaten und Unterschriften nicht mehr für die anonyme API-Rolle freigeben.
-- Die Anwendung meldet sich vor dem Zugriff mit einem Supabase-Benutzer an.
drop policy if exists "kb sellers select" on public.sellers;
drop policy if exists "kb sellers insert" on public.sellers;
drop policy if exists "kb sellers update" on public.sellers;
drop policy if exists "kb sellers delete" on public.sellers;

create policy "kb sellers select"
  on public.sellers for select to authenticated using (true);
create policy "kb sellers insert"
  on public.sellers for insert to authenticated with check (true);
create policy "kb sellers update"
  on public.sellers for update to authenticated using (true) with check (true);
create policy "kb sellers delete"
  on public.sellers for delete to authenticated using (true);

revoke all on table public.sellers from anon;
grant select, insert, update, delete on table public.sellers to authenticated;
