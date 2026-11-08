
# Kleiderbörse V21 – Cloud einrichten

Die Version ist für **5 Kassen mit gemeinsamer Cloud-Datenbank** vorbereitet.

## 1. Supabase-Projekt anlegen
In Supabase ein neues Projekt anlegen. Das kostenlose Einstiegsangebot reicht für die hier erwartete Menge (ca. 500 Bons pro Veranstaltung) in der Regel aus.

## 2. Datenbank anlegen
Im Supabase SQL Editor den kompletten Inhalt von `cloud-schema.sql` einfügen und ausführen.

## 3. Zugangsdaten eintragen
Im Supabase-Projekt unter den API-Einstellungen die **Project URL** und den **anon/public key** kopieren.

Diese beiden Werte in `cloud-config.js` eintragen:
- `supabaseUrl`
- `supabaseAnonKey`

Nicht den `service_role`-Key eintragen.

## 4. App auf allen 5 iPads bereitstellen
Den kompletten Projektordner auf einen Webserver/Hosting legen. Alle fünf iPads öffnen dieselbe Webadresse.

In der Kasse kann oben zwischen **Kasse 1 bis Kasse 5** gewählt werden. Die Auswahl wird auf dem jeweiligen iPad gespeichert.

## Was zentral gespeichert wird
- Verkäufer
- Verkäufernummer, Name, Telefonnummer
- Provisionseinstellung
- Kassenbon
- Bonnummer
- Kasse
- Datum/Uhrzeit
- Zahlungsart
- alle einzelnen Artikel
- beim Verkauf gespeicherter Provisionssatz

Der Tagesabschluss liest die Daten zentral und zeigt:
- Gesamtumsatz
- Bar / EC / PayPal
- Provision und Auszahlung
- Verkäuferübersicht
- Umsatz je Kasse
- gespeicherte einzelne Kassenbons

### Wichtig
V21 fällt zurück auf LocalStorage, solange `cloud-config.js` noch leer ist. So kann die Oberfläche weiter getestet werden. Für den echten gemeinsamen Betrieb müssen URL und anon/public key eingetragen sein.


## Cloud-Archiv (V65)

Damit Börsen-Archive geräteübergreifend in Supabase gespeichert werden, muss der Abschnitt **V65: Cloud-Archiv** aus `cloud-schema.sql` einmal im Supabase SQL Editor ausgeführt werden. Danach speichert die Archiv-Seite neue Archive in `public.archives`. Jedes Archiv kann zusätzlich über **⬇️ Export** als JSON-Datei extern gesichert und über **⬆️ Sicherung importieren** wieder in die Cloud eingespielt werden.


## Update V66 – vollständige Verkäuferdaten

Bei einer bestehenden Supabase-Cloud bitte `CLOUD-MIGRATION-V66.sql` einmal vollständig im Supabase SQL Editor ausführen. Dadurch werden Anrede, Anschrift, E-Mail und Auszahlungsart als Cloud-Felder ergänzt.


## Update V67 – Kassenbons nachträglich bearbeiten

Vor der Nutzung der Bon-Korrektur bitte `CLOUD-MIGRATION-V67.sql` einmal vollständig im Supabase SQL Editor ausführen. Die Migration legt eine Änderungshistorie an. Jede Korrektur speichert den vorherigen und den neuen Bonstand samt Begründung.
\n\nHinweis: Wenn beim Speichern „Could not find table public.receipt_edit_history in the schema cache“ erscheint, wurde V67 noch nicht angelegt oder PostgREST hat sein Schema noch nicht neu geladen. V67 im Supabase SQL Editor ausführen; danach ggf. einige Sekunden warten und App neu laden.\n
## V67 Schema-Cache-Fehler beheben
Die Datei `CLOUD-MIGRATION-V67.sql` im Supabase SQL Editor vollständig ausführen. Sie legt `receipt_edit_history` an, setzt REST-Rechte und sendet `NOTIFY pgrst, 'reload schema'`. Nach erfolgreicher Ausführung kurz warten und die App auf den Geräten vollständig neu laden. Wenn Supabase beim SQL-Lauf einen Fehler zeigt, muss dieser zuerst behoben werden; nur die ZIP zu veröffentlichen erstellt keine Datenbanktabelle.
