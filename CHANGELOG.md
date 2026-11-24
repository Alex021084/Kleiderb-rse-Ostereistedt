# Versionshistorie – Kleiderbörse Ostereistedt

Die bisherigen Einzeldateien mit Versionshinweisen wurden hier zusammengeführt.

---

## VERSION-16-HINWEISE.txt

Version 16 – Zahlungsablauf (Zwischenschritt)

Neu:
- Barzahlung öffnet zuerst den Wechselgeldrechner.
- Der Verkauf wird erst bestätigt, wenn der erhaltene Betrag mindestens dem Rechnungsbetrag entspricht.
- EC und PayPal öffnen eine Bestätigungsansicht mit optionaler Notiz.
- Zurück führt zum Zahlungsdialog; die Artikelliste bleibt erhalten.
- Zahlungsnotiz, erhaltenes Bargeld und Rückgeld werden am Kassenbon gespeichert.

Wichtig:
Vor dem Einsatz CLOUD-MIGRATION-V68.sql im Supabase SQL Editor ausführen.
Diese Version enthält noch NICHT die Wechselgeld-Anfangsbestandskachel in der Buchhaltung
und die fortlaufende Wechselgeldbestandsverwaltung je Kasse. Diese Funktion benötigt
eine gesonderte, rollenabgesicherte Cloud-Implementierung.

---

## VERSION-42-HINWEISE.txt

Version 43 - Verbindungsanzeige oben rechts in der blauen Kassenleiste. Offline-Speicherung und automatische Synchronisierung aus Version 42 beibehalten.

---

## V44-HINWEISE.txt

Version 44 – iPad/iPhone Home-Bildschirm-Modus

Diese Version ergänzt die Apple-Web-App-Metadaten und ein Web-App-Manifest, damit die Kleiderbörse beim Start über das Home-Bildschirm-Symbol möglichst ohne Safari-Bedienelemente geöffnet wird.

WICHTIG: Bereits vorhandene Home-Bildschirm-Verknüpfungen übernehmen neue Web-App-Metadaten unter iOS nicht immer. Nach dem Aktualisieren bitte das alte Kleiderbörse-Symbol vom Home-Bildschirm entfernen und die Seite in Safari erneut über Teilen > Zum Home-Bildschirm hinzufügen. Anschließend ausschließlich das neu angelegte Symbol öffnen. iOS kann Statusleiste/Uhrzeit weiterhin anzeigen.

---

## V45-HINWEISE.txt

Version 45 – Buchhaltung-Kopfzeile

- Verbindungsstatus in der Buchhaltung explizit rechts oben im blauen Balken.
- Statusanzeige mit abgerundeten Ecken und WLAN-/Synchronisierungs-Symbol.
- Ueberschrift 'Tagesabschluss' aus dem dunklen oberen Balken entfernt.
- Buchhaltungsbutton links bleibt sichtbar und erhaelt ausreichend Touch-Flaeche.
- Safe-Area-Abstand oben beruecksichtigt, damit iPad/iPhone Statusleiste den Button nicht ueberdeckt.
- Offline-Speicherung und Synchronisierung aus Version 44 beibehalten.

---

## V46-HINWEISE.txt

Version 46 – Korrektur Buchhaltungs-Kopfzeile

Diese Version erzwingt die Kopfzeile im Tagesabschluss: Buchhaltungsbutton links, Cloud-/WLAN-Status rechts mit runden Ecken. Versteckt zusätzliche Titel-Elemente im dunklen Balken. Wichtig: CSS/JS Cache-Buster wurden erhöht, damit iPad Safari nicht die alten Styles der vorherigen Version verwendet.

Bitte alle Dateien der ZIP in GitHub überschreiben und danach die Web-App vollständig schließen und neu über das Home-Bildschirm-Symbol öffnen. Wenn nötig, GitHub Pages kurz Zeit zum Veröffentlichen geben.

---

## V47-HINWEISE.txt

Version 47 – Kassen-Kopfzeile auf kleinen Bildschirmen

Die zusätzliche Beschriftung 'Kasse 1' im dunklen Balken wird ausgeblendet. Die Kassen-/Zurück-Schaltfläche bleibt links, die Online-/Offline-Anzeige wird rechts ausgerichtet und auf schmalen Bildschirmen begrenzt, damit nichts überlappt. Die große Überschrift 'Kasse 1' im Seiteninhalt bleibt bestehen.
Cache-Buster für kasse.css wurde erhöht.

---

## V48-HINWEISE.txt

Version 48 – Kopfzeile Verkäuferseite

Die Verkäuferseite hatte bisher eine eigene Kopfzeile ohne festen Statusplatz. Version 48 ergänzt dort den Cloudstatus ausdrücklich rechts und blendet den redundanten zentrierten Titel im dunklen Balken aus. Der Buchhaltungsbutton bleibt links. Cache-Buster für seller.css wurde erhöht.

---

## V49-HINWEISE.txt

Version 49 – einheitliche Kopfzeilen

Die dunklen Kopfzeilen auf Kasse, Verkäufer und Tagesabschluss verwenden jetzt dieselben Maße: Balkenhöhe 68px, Navigation 44px hoch und Cloud-Status mit einheitlicher Schrift, Innenabstand, Icongröße und abgerundeter Form. Der mittige Seitentitel bleibt im Balken ausgeblendet. Die großen Seitentitel im Inhalt bleiben.
CSS Cache-Buster auf Version 49 erhöht.

---

## V50-HINWEISE.txt

Version 50 – Kopfzeilen mit erzwungenen gemeinsamen Maßen

Die vorherigen Regeln hatten auf der Kassenseite geringere CSS-Spezifität als bestehende .cash-register .top-Regeln. Version 50 setzt deshalb body header.top Regeln mit hoher Spezifität und !important in allen drei Stylesheets ans Ende. Gemeinsame Zielmaße: dunkler Balken 68px, Zurück/Buchhaltung-Schaltfläche 44px, Cloudstatus 44px hoch, identische Innenabstände, Schrift und Icon. Cache-Buster auf 50 erhöht.

---

## V51-HINWEISE.txt

Version 51 – neutrale Bezeichnung der Verkäuferauszahlung

Die Verkäuferabrechnung weist den Betrag jetzt neutral als AUSZAHLUNGSBETRAG aus. Die falsche pauschale Aussage 'in Bar erhalten' sowie die methodenabhängigen Formulierungen (PayPal/EC/Überweisung) wurden aus der Abrechnung entfernt. HTML-Druckansicht und PDF-Zeichnung wurden angepasst. Kein Datenbankeingriff.

---

## V52-HINWEISE.txt

Version 52 – einheitliche Statuskachel in allen Kopfzeilen

Kasse, Verkäufer und Tagesabschluss verwenden jetzt dieselbe Grid-Kopfzeile. Der Buchhaltungs-/Kassenbutton belegt die linke Hälfte, die Online-/Offline-Kachel ist mittig in der rechten Hälfte angeordnet. Gemeinsame Höhe 48px, maximale Breite 260px, gleiche Schrift- und Symbolgröße sowie abgerundete Form. Dunkler Balken einheitlich 68px. CSS Cache-Buster auf 52.

---

## V53-HINWEISE.txt

Version 53 – Zahlenfeld-Tasten vergrößert

Die Tasten des Kassen-Zahlenfelds wurden ungefähr 30 Prozent höher gesetzt: Desktop/Querformat 64px, Hochformat 60px, kleinere Ansichten 73px; das mobile Zahlenfeld-Popup 75px. Schriftgrößen und Tastenanordnung bleiben unverändert. Nur kasse.css wurde angepasst; Cache-Buster auf 53.

---

## V54-HINWEISE.txt

Version 54 – Zahlenfeld insgesamt vergrößert

Zusätzlich zur größeren Tastenhöhe wurden die Ziffern etwas größer, die Abstände zwischen den Tasten erweitert und die Ecken stärker abgerundet. Für normale Querformatansichten 78px Tastenhöhe, für kompaktere Ansichten 86px und für das mobile Zahlenfeld-Popup 82px. Bestätigungs-Taste entsprechend angepasst. Keine Datenbank- oder Verkaufslogik geändert.

---

## V55-HINWEISE.txt

Version 55 – Größen-Auswahl leicht vergrößert

Die Größen-Buttons wurden dezent vergrößert: etwa 47–48px Höhe und 16px Schrift (im Hochformat 44px und 15px). Die Abstände wurden leicht erhöht. Keine Verkaufs-, Synchronisations- oder Datenbanklogik geändert.

---

## V56-HINWEISE.txt

Version 56 – Preisfeld optisch hervorgehoben

Die Preisbeschriftung ist etwas größer und fett. Das Preisfeld ist höher, hat einen kräftigeren blauen Rahmen, einen dezent hellblauen Hintergrund und eine größere/fettere Eingabeschrift. Das Euro-Zeichen ist ebenfalls besser sichtbar. Keine Preisberechnung oder Verkaufslogik geändert.

---

## VERSION-57-HINWEISE.txt

Version 57\n- Zahlenfeld kompakter: ca. 54 px Tastenhöhe statt der zuletzt stark vergrößerten Tasten.\n- Kassenbon kann durch Antippen groß in einem Popup geöffnet werden.\n- Popup zeigt die aktuellen Bonpositionen und den Gesamtbetrag; Bearbeiten/Löschen bleibt im normalen Bon.\n

---

## VERSION-58-HINWEISE.txt

Version 58
- Verkäufernummern werden ausschließlich vollständig und exakt zugeordnet.
- Eine Eingabe „1“ kann nicht mehr versehentlich Verkäufernummer „21“ treffen.
- Unsichtbare Unicode-Zeichen/Leerzeichen werden bei der Prüfung bereinigt.
- Bei doppelten Nummern wird kein Verkäufer automatisch zugeordnet.
- Cache-Version der Kassen-JavaScript-Datei erhöht, damit Geräte den Fix laden.
- Bestehende Verkäufer- und Verkaufsdaten bleiben unverändert.

---

## VERSION-59-HINWEISE.txt

VERSION 59 – KASSENBON-KORREKTUREN ZUVERLÄSSIG SPEICHERN

- Bonkorrekturen werden nun über eine einzige Datenbanktransaktion gespeichert.
- Artikelpositionen, Zahlungsart und Bon-Gesamtbetrag bleiben dadurch konsistent.
- Die Änderungshistorie wird nur bei vollständig erfolgreicher Korrektur angelegt.
- Bei einem Fehler wird die gesamte Änderung zurückgerollt; es bleiben keine halben Korrekturen zurück.
- Die Buchhaltung lädt nach einer erfolgreichen Korrektur neu. Umsatz je Kasse verwendet den gespeicherten Bonbetrag.
- Der dauerhafte ⚠️-Hinweis wird weiterhin aus der Änderungshistorie ermittelt.

WICHTIG: Vor dem Hochladen der App-Dateien zuerst CLOUD-MIGRATION-V70-BONKORREKTUR.sql
im Supabase SQL Editor vollständig ausführen und RUN drücken.
Die bisherige Version 58 als Sicherung behalten.

---

## VERSION-60-HINWEISE.txt

VERSION 60 – zwei gezielte Verbesserungen

1. Barzahlung:
   Das Feld „Erhaltenes Bargeld“ ist jetzt deutlich größer und blau hervorgehoben.
   Die Schriftgröße entspricht dem Betrag „Zu zahlen“.

2. Tagesabschluss:
   Ein beim EC-/PayPal-Zahlungsdialog eingetragener Transaktionshinweis wird
   unter dem jeweiligen Kassenbon angezeigt – zusammen mit dessen Bonnummer.
   Der Hinweis wird aus dem bereits gespeicherten Feld payment_note gelesen.

Es wurden keine Datenbanktabellen oder vorhandenen Verkaufsdaten geändert.
Die vorhandene Supabase-Speicherung des Zahlungs-Hinweises wird weiterverwendet.

---

## VERSION-61-HINWEISE.txt

Version 61 – Hinweis-Markierung bei Kassenbons

- Bons mit einem gespeicherten Transaktionshinweis zeigen in der Bonliste jetzt „⚠️ Hinweis“.
- Bei diesen Bons wird anstelle der Kennzeichnung „⚠️ Änderung“ die passende Hinweis-Kennzeichnung angezeigt.
- Bons ohne Transaktionshinweis behalten ihre bisherige Änderungsmarkierung.
- Keine Datenbankmigration erforderlich.

---

## VERSION-62-HINWEISE.txt

Version 62 – Kompakte Bargeldeingabe

- Das Feld „Erhaltenes Bargeld“ steht jetzt rechts neben der Beschriftung.
- Das blaue Eingabefeld ist kompakt dimensioniert und zeigt Platz für bis zu 999,99 €.
- Das Euro-Zeichen steht direkt rechts neben dem Eingabefeld.
- Die Eingabe über das vorhandene Zahlenfeld ist auf maximal drei Vorkommastellen und zwei Nachkommastellen begrenzt.
- Die übrigen Zahlungs- und Speicherabläufe bleiben unverändert.

---

## VERSION-71-HINWEISE.txt

Version 71 – Verkäufer-Teilnehmerlisten

- Startmenü führt zum Auswahlfenster „Verkäuferlisten“.
- Gespeicherte Verkäufer bleiben vollständig erhalten.
- Teilnahme-Haken werden am Verkäufer gespeichert und in der Cloud zwischen Geräten geteilt.
- Separate Ansicht zeigt nur teilnehmende Verkäufer.
- Beim Archivieren wird die Teilnehmerliste als Bestandteil des Börsen-Snapshots gespeichert.
- Nach erfolgreichem Archivieren werden die Teilnahme-Haken für die nächste Börse zurückgesetzt.
- Supabase-Migration CLOUD-MIGRATION-V71-TEILNEHMER.sql muss einmal im SQL Editor ausgeführt werden.

---

## V72-HINWEISE.txt

Version 72 – Kasse sucht nur teilnehmende Verkäufer

Die Verkäufernummern-Suche an der Kasse berücksichtigt jetzt ausschließlich Verkäufer mit is_participating=true (bzw. lokal gecachtem isParticipating=true). Nicht teilnehmende Verkäufer bleiben in der vollständigen Verkäuferverwaltung erhalten, werden aber an der Kasse nicht gefunden. Der exakte Nummernvergleich bleibt bestehen. Cache-Buster kasse.js auf 72 erhöht.

---

## VERSION-74-HINWEISE.txt

Version 74
- Kopfzeile der beiden Verkäuferlisten korrigiert.
- Buchhaltung und Zurück stehen nebeneinander links.
- Cloudanzeige bleibt rechts und wird nicht vom Zurück-Button überlagert.
- Keine Änderungen an anderen Seiten oder Funktionen.

---

## VERSION-75-HINWEISE.txt

Version 75

Die Ansicht „Teilnehmende Verkäufer“ wurde kompakt gestaltet: Haken, VK-Nummer, Name und Euro-Abrechnungsbutton. Die Ansicht „Alle gespeicherten Verkäufer“ bleibt unverändert. Keine Datenbankänderung erforderlich.

---

## VERSION-76-HINWEISE.txt

Version 76 – PDF-Button auf iPad/Safari korrigiert

- Die PDF-Ansicht wird jetzt direkt beim Button-Klick in einem neuen Fenster vorbereitet.
- Nach der PDF-Erstellung wird dieses Fenster mit der fertigen PDF befüllt.
- Das verhindert, dass Safari/iPadOS das Öffnen wegen eines asynchronen Popup-Aufrufs blockiert.
- Bei blockiertem Fenster gibt es einen Download-Fallback.
- Nur die PDF-Ausgabe der einzelnen Verkäuferabrechnung und der Cache-Buster wurden angepasst.
- Keine Datenbankänderung und keine SQL-Ausführung erforderlich.

---

## V77-HINWEISE.txt

Kleiderbörse Version 77 – Verkäufervereinbarungen

NEU
- In der Teilnehmerliste: Status-Schaltflächen für Abgabe und Abholung.
- Grün = unterschrieben, Orange = noch offen.
- Große Unterschriftenfläche im Dialog, optimiert für Tablet und Touch.
- Bestätigung per Kontrollkästchen erforderlich.
- Unterschrift, Erklärung und Datum werden beim jeweiligen Verkäufer gespeichert.
- PDF-Ansicht mit beiden Erklärungen; über Drucken/Sichern kann als PDF gespeichert werden.

WICHTIG: Vor der ersten Nutzung die Datei CLOUD-MIGRATION-V77-UNTERSCHRIFTEN.sql
im Supabase SQL Editor ausführen. Danach App neu laden.
Bestehende Verkäufer-, Kassen- und Abrechnungsdaten werden nicht gelöscht.

Hinweis: Die Unterschrift ist eine einfache digitale Zeichnung plus Bestätigungs-Checkbox.
Sie ersetzt keine qualifizierte elektronische Signatur.

---

## V78-HINWEISE.txt

Kleiderbörse Version 78 – Layout und Unterschriftenfeld

- Abgabe-, Abholungs- und PDF-Schaltflächen stehen jetzt rechts neben dem Euro-Button.
- Die Schaltflächen haben mehr Abstand zueinander.
- Das Unterschriftenfeld ist gesperrt, bis die Bestätigungs-Checkbox aktiviert wurde.
- Der Hinweis zur gesamten Tabletbreite wurde entfernt.
- Keine zusätzliche Datenbankmigration gegenüber Version 77.

---

## V79-HINWEISE.txt

Kleiderbörse Version 79 – Statusfarben der Unterschriften

- Offene Abgabe-/Abholungsschaltflächen: helleres Orange mit dezenter orangefarbener Umrandung.
- Unterschriebene Schaltflächen: hellgrüner Hintergrund, grüne Umrandung und grüne Schrift mit grünem Haken.
- Keine Datenbankänderung erforderlich.
- Keine Änderung an Kasse, Verkäufern oder Unterschriftenspeicherung.

---

## V80-HINWEISE.txt

Kleiderbörse Version 80

PDF-Einzelansicht:
- Gut sichtbarer Zurück-Button oben links.
- Größerer, gestalteter Button „PDF drucken / speichern“ oben rechts.

Teilnehmerliste:
- Neuer Button „Alle Vereinbarungen als ZIP speichern“ (nur in der Teilnehmerliste sichtbar).
- Das ZIP enthält pro teilnehmendem Verkäufer mit mindestens einer Unterschrift eine HTML-Datei mit den vorhandenen unterschriebenen Erklärungen und Unterschriftsbildern. Die Dateien können geöffnet und bei Bedarf als PDF gedruckt/gespeichert werden.

Börsenarchiv:
- Beim Archivieren wird zuerst der vollständige Verkäufer-Snapshot einschließlich der Unterschriften gespeichert.
- Danach werden bei den teilnehmenden Verkäufern die Teilnahme-Markierung und die aktiven Unterschriften zurückgesetzt.
- Bei lokaler Speicherung werden die aktiven Unterschriften ebenfalls geleert.
- Das Archiv behält die alten Unterschriften; die nächste Börse startet mit leeren Unterschriftsfeldern.

Keine neue SQL-Migration gegenüber V77 erforderlich.
Bitte vor Nutzung V79 als Sicherung behalten und Archivieren zuerst mit einem Testverkäufer prüfen.

---

## V81-HINWEISE.txt

Kleiderbörse Version 81 – ZIP-Fehler behoben

In Version 80 fehlte im ZIP-Dateikopf ein Pflichtfeld. Dadurch meldete iOS beim Öffnen „Ungültige Nachricht“.
Version 81 ergänzt das Feld korrekt. Die ZIP-Datei sollte sich nun in der Dateien-App auf iPad/iPhone öffnen lassen.
An den Inhalten der Vereinbarungen, Unterschriften, Datenbank oder Kassenfunktionen wurde nichts geändert.

---

## V82-HINWEISE.txt

Kleiderbörse Version 82 – ZIP-Button nur bei Teilnehmenden

- Der Button „Alle Vereinbarungen als ZIP speichern“ wird ausschließlich in der Ansicht „Teilnehmende Verkäufer“ angezeigt.
- In „Alle gespeicherten Verkäufer“ wird er explizit ausgeblendet.
- Keine Änderungen an Kasse, Verkäuferdaten, Unterschriften oder Datenbank.
- Kein SQL erforderlich.

---

## V83-HINWEISE.txt

Version 83: Datenschutzhinweis unter dem Abgabetext in Unterschriftsfenster, Einzel-PDF und ZIP-Vereinbarungen. Abholung unveraendert. Keine Datenbankmigration erforderlich.

---

## VERSION-84-HINWEISE.txt

Kleiderbörse – Version 84

Änderungen:
- In der Ansicht „Teilnehmende Verkäufer“ wird „+ Verkäufer hinzufügen“ ausgeblendet.
- Im Unterschriftenfenster heißt die Schaltfläche jetzt „Unterschrift übernehmen“.
- Das Unterschriftenfenster ist etwas kompakter und auf kleinen Bildschirmen scrollbar, damit die unteren Schaltflächen erreichbar bleiben.
- Im Abgabetext zur Abholung wurde „vollständig“ entfernt.

Keine Datenbankänderung erforderlich.

---

## VERSION-86-HINWEISE.txt

Kleiderbörse Version 86

- Vereinbarungs-PDF-Drucklayout auf eine A4-Seite optimiert.
- Abgabe, Datenschutzhinweis und Abholung werden kompakter gesetzt.
- Unterschriften bleiben enthalten und werden platzsparender dargestellt.
- Auch die HTML-Dateien im Vereinbarungs-ZIP nutzen das einseitige A4-Drucklayout.
- Keine Datenbankänderung erforderlich.

Hinweis: Die endgültige Seitenzahl hängt geringfügig von den Druckeinstellungen des Geräts ab. Im Druckdialog bitte A4 und 100 % bzw. „An Seite anpassen“ verwenden.

---

## VERSION-87-HINWEISE.txt

Kleiderbörse Version 87

- Neuer eigener Button „DSGVO“ in der Teilnehmerliste und in der Liste der gespeicherten Verkäufer.
- Verkäufer können die Datenschutzhinweise direkt auf dem Tablet lesen und mit dem Finger unterschreiben.
- DSGVO-Status wird im bestehenden signature_documents-Feld je Verkäufer gespeichert und in beiden Listen synchron angezeigt.
- Unterschrift speichert Datum, Uhrzeit, Version der Datenschutzhinweise und Signaturbild.
- Verkäufer-PDF und Vereinbarungs-ZIP können die separate DSGVO-Kenntnisnahme mit Unterschrift enthalten.
- Letzte Teilnahme wird beim Aktivieren der Teilnahme gespeichert.
- Verkäufer ohne erneute Teilnahme werden nach drei Jahren ab der letzten Teilnahme beim nächsten Laden der Verkäuferliste automatisch gelöscht; aktive Verkäufer bleiben erhalten.
- Neue Supabase-Migration erforderlich: CLOUD-MIGRATION-V87-DSGVO.sql. Sie ergänzt den Teilnahme-Zeitstempel und beschränkt den Zugriff auf die Verkäufertabelle auf angemeldete Supabase-Benutzer.

Wichtig: Vor dem Einsatz die Migration im Supabase SQL Editor ausführen. Die vollständigen Pflichtinformationen nach Art. 13 DSGVO (insbesondere Kontaktdaten des Verantwortlichen und Rechtsgrundlage) müssen den Verkäufern zusätzlich zugänglich gemacht werden. Die automatische Löschung muss zu etwaigen gesetzlichen Aufbewahrungspflichten passen.
- Archivabschluss setzt die aktuelle Teilnahme zurück, behält aber DSGVO-/Abgabe-/Abholungsunterschriften und das Datum der letzten Teilnahme bei.\n

---

## VERSION-88-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 88

Änderungen:
- DSGVO-Unterschriftsfenster: redundanter Bestätigungssatz oberhalb der Datenschutzhinweise entfernt.
- Datenschutzhinweis ergänzt: Bankverbindungen und PayPal-Adressen, soweit für Auszahlungen erfasst, werden lokal auf dem verwendeten Gerät gespeichert und nicht an Supabase/andere Cloud-Dienste übertragen.
- PDF-Ausgabe getrennt: Abgabe und Abholung gemeinsam als Vereinbarungs-PDF; Datenschutzerklärung separat als DSGVO-PDF.
- Datenschutztext-Version auf 1.1 erhöht, damit bestehende Unterschriften für den geänderten Hinweis erneut bestätigt werden können.

Hinweis:
Vor Produktivbetrieb sicherstellen, dass Bank-/PayPal-Daten tatsächlich ausschließlich lokal gespeichert werden und nicht über Sync, Backups oder andere Schnittstellen in die Cloud gelangen. Die Datenschutzhinweise sollten mit den tatsächlich erhobenen Daten und Verarbeitungszwecken abgeglichen werden.

---

## VERSION-89-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 89

Änderungen gegenüber Version 88:
- Datenschutzhinweis präzisiert: Bankverbindungen und PayPal-Adressen werden separat in einer vereinsinternen Excel-Datei lokal gespeichert und verwaltet.
- Klarstellung: Diese Zahlungsdaten werden nicht innerhalb der Kleiderbörsen-App und nicht in der Supabase-Cloud gespeichert.
- Zugriff auf die Excel-Datei ist laut Datenschutzhinweis ausschließlich den zuständigen Vereinsmitgliedern vorbehalten.
- Nutzung nur zur Abwicklung der Auszahlungen; Löschung, sobald die Daten nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
- Datenschutzhinweis-Version auf 1.2 erhöht, damit die geänderte Information erneut zur Kenntnis genommen und unterschrieben werden kann.

Wichtig:
Bitte sicherstellen, dass die Excel-Datei tatsächlich lokal und zugriffsgeschützt gespeichert wird und nicht über Cloud-Synchronisierung, automatische Backups oder Freigaben an andere Dienste übertragen wird. Die tatsächliche Speicher- und Löschpraxis muss dem Hinweis entsprechen.

---

## VERSION-90-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 90

Änderungen:
- DSGVO-Statusbutton in der Teilnehmerliste direkt neben dem Teilnahme-Häkchen.
- Separate Schaltfläche „DSGVO PDF“ entfernt.
- Klick auf DSGVO: Bei bereits unterschriebenen Hinweisen öffnet sich die druck-/speicherbare PDF-Ansicht; bei fehlender oder veralteter Unterschrift öffnet sich das Unterschriftsfenster.
- DSGVO-Statusbutton auch bei gespeicherten Verkäufern mit derselben Funktion.
- Abgabe, Abholung, Vereinbarungs-PDF und Abrechnung bleiben erhalten.

Keine Supabase-SQL-Migration erforderlich.

---

## V91-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 91

Änderung: Der DSGVO-Button befindet sich ausschließlich in „Alle gespeicherten Verkäufer“ direkt neben der Teilnahme-Auswahl. In der Liste „Teilnehmende Verkäufer“ wird kein DSGVO-Button angezeigt.

Verhalten: Bei bereits unterschriebenen und aktuellen Datenschutzhinweisen öffnet der Button die PDF-Ansicht mit Unterschriftsnachweis. Fehlt die Unterschrift oder ist sie veraltet, öffnet sich das Unterschriftsfenster.

Keine neue Supabase-Migration erforderlich.

---

## VERSION-92-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 92

Änderungen:
- Teilnehmerliste: Abgabe und Abholung stehen rechts in einer vertikalen Spalte.
- Daneben stehen Vereinbarung PDF und Euro/Abrechnung ebenfalls vertikal.
- Liste „Alle gespeicherten Verkäufer“: DSGVO-Schaltfläche sitzt rechts oben an der Stelle des bisherigen Euro-Buttons.
- Euro-Button in der Liste der gespeicherten Verkäufer entfernt.
- Bearbeiten und Löschen bleiben darunter mit zusätzlichem Abstand.

Keine Supabase-SQL-Migration erforderlich.

---

## VERSION-93-HINWEISE.txt

KLEIDERBÖRSE OSTEREISTEDT e.V. – VERSION 93

Korrekturen:
- Teilnehmerliste: Abgabe und Abholung stehen in der linken Aktionsspalte übereinander.
- Teilnehmerliste: Vereinbarung-PDF und Abrechnung (€) stehen in der rechten Aktionsspalte übereinander.
- Das Aktionsfeld erhält eine feste, responsive Breite; Buttons werden nicht mehr seitlich abgeschnitten.
- Alle gespeicherten Verkäufer: DSGVO steht rechts im Aktionsbereich anstelle des Euro-Buttons.
- Bei gespeicherten Verkäufern bleiben Bearbeiten und Löschen darunter.
- Teilnahme-Kontrolle bleibt links neben den Verkäuferdaten.

Installation:
Alle Dateien aus diesem Projekt in das GitHub-Repository übernehmen.
Keine neue Supabase-SQL-Migration vorgesehen.

Hinweis:
Nach dem Deployment die Seite im Browser vollständig neu laden. Die CSS- und JavaScript-Referenzen wurden zur Cache-Aktualisierung auf Version 93 gesetzt.

---

## VERSION-94-HINWEISE.txt

KLEIDERBÖRSE OSTEREISTEDT e.V. – VERSION 94

Änderungen:
- Teilnehmerliste: Ein DSGVO-Button erscheint links neben Abgabe/Abholung, mittig über beide Buttons und in gleicher Höhe (40 px).
- Wenn die aktuelle Datenschutzerklärung bereits unterschrieben wurde, wird in der Teilnehmerliste kein DSGVO-Button angezeigt.
- Der Button öffnet bei fehlender aktueller Unterschrift die DSGVO-Unterschrift auf dem Tablet.
- Die vorhandene Unterschrift bleibt dem gespeicherten Verkäuferdatensatz zugeordnet. Bei erneuter Teilnahme innerhalb von drei Jahren ist keine erneute Unterschrift nötig.
- Nach drei Jahren ohne Teilnahme wird der Verkäuferdatensatz durch die bestehende Löschprüfung entfernt (sofern keine Aufbewahrungspflichten entgegenstehen); bei erneuter Registrierung ist daher eine neue DSGVO-Unterschrift erforderlich.
- Abgabe, Abholung, Vereinbarung-PDF und Abrechnung bleiben in ihren bisherigen Spalten.
- Die Liste „Alle gespeicherten Verkäufer“ behält ihren bisherigen DSGVO-Button.

Installation:
Alle Dateien dieses Projekts in das GitHub-Repository übernehmen. Keine neue Supabase-SQL-Migration erforderlich.
Nach dem Deployment die Seite auf dem iPad vollständig neu laden.

---

## VERSION-95-HINWEISE.txt

KLEIDERBÖRSE OSTEREISTEDT e.V. – VERSION 95

Änderung:
- Aktionsbereich der teilnehmenden Verkäufer von 264 px auf 380 px verbreitert.
- DSGVO-Spalte, Abgabe/Abholung und Vereinbarung-PDF/Euro haben mehr Platz.
- Beschriftungen bleiben einzeilig, insbesondere „Vereinbarung PDF“.
- Auf schmalen Displays wandert der Aktionsbereich unter die Verkäuferdaten und passt sich der verfügbaren Breite an.
- Buttonhöhe bleibt bei 40 px.
- Die DSGVO- und Drei-Jahres-Logik wurde nicht verändert.
- Cache-Versionen für seller.css und seller.js in verkaeufer.html auf 95 gesetzt.

Installation:
Alle Dateien aus dem ZIP in das GitHub-Repository übernehmen und den Pages-Deploy abwarten.
Keine neue Supabase-Migration erforderlich.

---

## V96-HINWEISE.txt

VERSION 96 – OFFLINE-BONZEITSTEMPEL

Änderung:
- Beim Erstellen eines Bons wird der Verkaufszeitpunkt auf dem Kassen-Gerät als ISO-Zeitstempel gespeichert.
- Offline-Bons behalten diesen Zeitstempel in der lokalen Warteschlange.
- Bei der späteren Synchronisierung wird derselbe Zeitstempel als receipts.created_at an Supabase übertragen.
- Der Synchronisierungszeitpunkt überschreibt die ursprüngliche Verkaufszeit nicht.
- Bereits vorhandene Offline-Bons ohne Zeitstempel erhalten beim Upload aus Kompatibilitätsgründen einen aktuellen Zeitstempel.

Keine SQL-Migration erforderlich, da die Anwendung die bereits vorhandene Spalte receipts.created_at verwendet.

Bitte nach dem Deployment testen:
1. App online laden.
2. Internetverbindung ausschalten.
3. Zwei Testbons mit etwas Zeitabstand erstellen.
4. Internet wieder einschalten und Synchronisierung abwarten.
5. In der Buchhaltung prüfen, ob beide Bons ihre unterschiedlichen ursprünglichen Uhrzeiten behalten.

---

## VERSION-97-HINWEISE.txt

Kleiderbörse Ostereistedt e.V. – Version 97

Änderungen:
1. Nach „Zahlung bestätigen“ erscheint sofort eine Sperr-/Warteanzeige.
   Die Kasse bleibt blockiert, bis der Verkauf gespeichert ist und
   „Neuer Verkauf“ ausdrücklich gedrückt wird.
2. In der Buchhaltung gibt es unter „Verkaufszahlen zurücksetzen“
   den neuen Button „Bonnummern zurücksetzen“.
3. Der Bonnummernkreis wird global für alle Kassen auf 1 zurückgesetzt.
   Bereits vorhandene Bons und Buchhaltungsdaten werden NICHT gelöscht.

WICHTIG – Supabase:
Vor dem ersten Einsatz muss CLOUD-MIGRATION-V97-BONNUMMERN.sql
einmal vollständig im Supabase SQL Editor ausgeführt werden.

WICHTIG – Bonnummern zurücksetzen:
Vor dem Reset alle Kassen mit dem Internet verbinden und warten, bis
alle Offline-Verkäufe synchronisiert sind. Offline-Verkäufe, die erst
nach dem Reset hochgeladen werden, erhalten eine Nummer aus dem neuen
Nummernkreis. Die App prüft die lokale Warteschlange auf dem Gerät,
kann aber Warteschlangen anderer Geräte nicht selbst prüfen.

Alte Bons bleiben erhalten. Da der Nummernkreis wieder bei 1 beginnt,
können alte und neue Bons dieselbe angezeigte Bonnummer haben.
Die interne Bon-ID bleibt eindeutig.

Installation:
- Alle Anwendungsdateien aus dem ZIP ins GitHub-Repository übernehmen.
- Supabase-Migration einmal ausführen.
- GitHub Pages/Hosting-Deployment abwarten.
- Auf den Kassen-Geräten die Seite vollständig neu laden.

---

## VERSION-101-HINWEISE.txt

Version 101 – getrennte Spielzeugbörsen-Kasse

Ausgangspunkt ist die vom Nutzer hochgeladene ältere Kasse. Die ursprüngliche Kleiderbörsen-Ansicht und ihre Artikelbuttons bleiben erhalten. Ergänzt wurde eine separate Spielzeugbörsen-Ansicht mit direkt sichtbaren Kategoriebuttons, Kleidung mit Größen-Popup, Schuhe mit Schuhgrößen-Popup sowie Großteil/Sonstiges mit Texteingabe. Die Börsenart wird zentral in Supabase gespeichert, damit alle Kassen dieselbe Ansicht verwenden.

Vor dem Einsatz CLOUD-MIGRATION-V101-BÖRSENART.sql in Supabase ausführen.

---

## VERSION-102-HINWEISE.txt

VERSION 102 – Börsenauswahl bei jedem Kassenstart

- Beim Öffnen der Kasse erscheint jetzt immer zuerst die Auswahl „Kleiderbörse“ oder „Spielzeugbörse“.
- Die gewählte Börsenart wird wie bisher zentral gespeichert und an die anderen Kassen weitergegeben.
- Die Kleiderbörsen-Kassenansicht und die Spielzeugbörsen-Buttons wurden in dieser Version nicht verändert.

---

## VERSION-103-HINWEISE.txt

Version 103 – Grüne Auswahlmarkierung

Ausgewählte Größen, Spielzeug- und Schuhbuttons sowie ausgewählte Spielzeugkategorien werden grün markiert. Die Änderung betrifft ausschließlich die optische Auswahlmarkierung und deren Zustandsanzeige in der Kasse.

---

## VERSION-104-HINWEISE.txt

Version 104 – Grüne Auswahl in der Spielzeugkasse

Fehlerkorrektur: Die Buttons „Kleidung“ und „Schuhe“ in der Spielzeugbörsen-Kasse erhalten nach erfolgreicher Größenauswahl zuverlässig den grünen Auswahlzustand. Die jeweils andere Auswahl wird zurückgesetzt. Beim Start eines neuen Artikels und bei Auswahl einer anderen Spielzeugkategorie werden beide Markierungen entfernt.

Die Änderung betrifft ausschließlich die zusätzliche Spielzeugbörsen-Auswahl in kasse.js und kasse.css. Die normale Kleiderbörsen-Ansicht und ihre Größen-/Artikelbuttons wurden nicht geändert. Keine neue SQL-Migration erforderlich.

---

## VERSION-105-HINWEISE.txt

Version 105 – Spielzeugkasse: Button-Farben und Auswahl

- Nicht ausgewählte Buttons in der Spielzeugbörsen-Kasse: hellgrau mit dunkler Umrandung und dunkler Schrift.
- Ausgewählte Spielzeugkategorien, Großteil und Sonstiges: grün mit weißer Schrift.
- Kleidung und Schuhe: behalten die grüne Markierung nach Auswahl einer Größe.
- Änderungen ausschließlich über CSS innerhalb von #toyMarketControls; die normale Kleiderbörsen-Kasse bleibt unverändert.
- Keine neue SQL-Migration erforderlich.

---

## VERSION-106-HINWEISE.txt

Version 106
- Spielzeugkassen-Buttons im nicht ausgewaehlten Zustand an die neutralen Groessenbuttons der Kleiderboerse angeglichen.
- Hintergrund #f8f9fb, Rahmen #cfd5df, Schrift #172033.
- Ausgewaehlte Buttons bleiben gruen mit weisser Schrift.
- Keine Aenderung an der normalen Kleiderboersen-Kasse oder an der Datenbank.

---

## VERSION-109-HINWEISE.txt

Version 109 – Spielzeugauswahl zurücksetzen

- Beim Wechsel zu einer anderen Spielzeugkategorie wird die bisherige Auswahl vollständig aufgehoben.
- Es bleibt immer nur die zuletzt gewählte Kategorie grün.
- Beim Wechsel weg von Großteil oder Sonstiges werden die zugehörige Beschreibung und ein offenes Beschreibungsfenster gelöscht.
- Auch beim Wechsel zu Kleidung oder Schuhen wird die vorherige Kategorie zurückgesetzt.
- Beim Start eines neuen Artikels werden alle Spielzeug-Auswahlmarkierungen zurückgesetzt.
- Die Kleiderbörsen-Kasse wurde nicht gezielt geändert.
- Keine neue SQL-Migration erforderlich.

---

## UMSATZHISTORIE-HINWEISE.txt

Umsatzhistorie
- Neuer Button auf der Seite Verkäuferlisten unter den beiden Listen-Kacheln.
- Eigene Umsatzhistorie mit Rangfolge nach Gesamtumsatz und Gold-/Silber-/Bronzemedaillen.
- Details zeigen Verkäufe nach Verkaufstag mit Umsatz und Artikelanzahl.
- Verkäufe vor dem 24.11.2026, 19:08 Uhr deutscher Zeit werden ausgeschlossen.
- Alte Archive werden nicht gelesen oder importiert.


## Umsatzhistorie V102
- Dauerhafte, von Kassenbons unabhängige Umsatzdatensätze.
- Kassen-Reset löscht nicht mehr die gespeicherten Verkäuferumsätze.
- Separater, optisch abgegrenzter Umsatzhistorie-Bereich auf der Verkäuferlisten-Seite.
- Keine Übernahme alter Archivdaten.
