-- ============================================================
-- KLEIDERBÖRSE OSTEREISTEDT e.V. – VERSION 97
-- Globalen Bonnummernkreis zurücksetzen, ohne alte Bons zu löschen
-- ============================================================

-- Die Bonnummer bleibt eine reine Anzeigenummer. Die interne
-- receipt.id (Primary Key) bleibt weiterhin eindeutig.
-- Deshalb wird nur die UNIQUE-Beschränkung auf receipt_no entfernt.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.receipts'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (receipt_no)'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.receipts DROP CONSTRAINT %I',
      c.conname
    );
  END LOOP;
END
$$;

-- RPC-Funktion: setzt die globale Identity-Sequenz von receipt_no
-- atomar zurück. Alle Kassen verwenden denselben Nummernkreis.
-- Die Tabelle wird während des Zurücksetzens gesperrt, damit kein
-- paralleler Bon genau im Moment des Resets eine Nummer erhält.
CREATE OR REPLACE FUNCTION public.kb_reset_receipt_numbers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  seq_name text;
BEGIN
  LOCK TABLE public.receipts IN ACCESS EXCLUSIVE MODE;

  seq_name := pg_get_serial_sequence('public.receipts', 'receipt_no');

  IF seq_name IS NULL THEN
    RAISE EXCEPTION 'Keine Identity-Sequenz für public.receipts.receipt_no gefunden';
  END IF;

  PERFORM pg_catalog.setval(seq_name::regclass, 1, false);

  RETURN jsonb_build_object(
    'next_receipt_no', 1,
    'reset_at', pg_catalog.now()
  );
END;
$function$;

-- Die App verwendet den Supabase-Client wie die vorhandenen
-- Kassenfunktionen. Berechtigung entspricht dem bestehenden
-- Zugriff auf die Kassenbons.
REVOKE ALL ON FUNCTION public.kb_reset_receipt_numbers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kb_reset_receipt_numbers() TO anon;
GRANT EXECUTE ON FUNCTION public.kb_reset_receipt_numbers() TO authenticated;

NOTIFY pgrst, 'reload schema';
