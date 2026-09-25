Verkäufer – neue Angaben v1

Enthalten:
- Adresse
- E-Mail-Adresse
- Auszahlungsart (Bar / Überweisung / PayPal)

Wichtig:
Diese Version ändert noch NICHT das Supabase-Schema.
Die drei neuen Angaben werden zunächst lokal auf dem jeweiligen Gerät unter
kb_seller_extras gespeichert. Wenn die Cloud verbunden ist, werden die neuen
Felder absichtlich noch nicht an Supabase übertragen.

Zum Einspielen:
1. Backup der bisherigen Dateien machen.
2. verkaeufer.html und seller.js ersetzen.
3. seller.css und die übrigen Dateien unverändert lassen.
4. Verkäufer hinzufügen/bearbeiten und die neuen Angaben testen.

Erst danach kann die Cloud-Erweiterung (Supabase-Spalten + gemeinsame Speicherung)
separat umgesetzt werden.


v2 Änderung:
Auf iPhone/iPad ist das Verkäufer-Popup jetzt selbst scrollbar. Der Hintergrund wird beim geöffneten Popup gesperrt. Die übrige Oberfläche bleibt unverändert.
