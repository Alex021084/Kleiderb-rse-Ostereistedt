-- Kleiderbörse Offline-Synchronisierung – einmalig im Supabase SQL Editor ausführen.
-- Erstellt eine eindeutige Kennung pro Bon, damit erneutes Senden keine Dublette erzeugt.
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS client_uuid text;
CREATE UNIQUE INDEX IF NOT EXISTS receipts_client_uuid_unique
  ON public.receipts (client_uuid)
  WHERE client_uuid IS NOT NULL;
