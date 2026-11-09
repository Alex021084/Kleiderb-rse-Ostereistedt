-- Kleiderbörse Migration V68: Zahlungsdetails
-- Ergänzt optionale Zahlungsnotizen sowie Bargeld erhalten/Rückgeld.
-- Bestehende Verkäufe bleiben unverändert.
alter table public.receipts
  add column if not exists payment_note text not null default '',
  add column if not exists cash_received numeric(10,2),
  add column if not exists change_given numeric(10,2);

