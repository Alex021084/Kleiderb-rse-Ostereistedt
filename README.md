# Kleiderbörse – Projekt V2

Aktueller Stand:
- Startseite mit Kasse / Verkäufer / Tagesabschluss
- Verkäuferverwaltung
- Verkäufer werden nach Nachnamen sortiert
- Verkäufer hinzufügen, bearbeiten und löschen
- Suchfeld
- Neue **Abrechnung-Schaltfläche (€)** bei jedem Verkäufer, oben über Bearbeiten/Löschen

## Verkäufer-Abrechnung

Beim Tippen auf **€** wird angezeigt:
- Anzahl verkaufter Teile
- Gesamtumsatz dieser Verkäufernummer
- Auszahlung = Gesamtumsatz minus 15 % Provision

Die Abrechnung liest die Verkaufsdaten aus `localStorage` unter dem Schlüssel `kb_sales`.

Ein Verkauf wird später von der Kasse in dieser Form gespeichert:

```js
{
  sellerNumber: "511",
  price: 12.50
}
```

Dadurch kann die Verkäufer-Abrechnung später automatisch mit der Kasse verbunden werden.

**Wichtig:** Aktuell ist die Kasse noch ein Platzhalter. Deshalb stehen in der Abrechnung zunächst 0 Teile und 0,00 €.


Layout der Verkäuferkarte: Abrechnung oben, darunter Bearbeiten und Löschen nebeneinander. Der Abrechnungsbutton ist exakt so breit wie die beiden unteren Buttons zusammen.


## Kasse – V8

Die Kasse enthält jetzt die erste Eingabemaske:
- Verkäufernummer
- Größe
- Spielzeug-Schalter
- Preis
- Verkäufernummer wird automatisch geprüft:
  - grün = Verkäufernummer existiert
  - rot = Verkäufernummer existiert nicht
- Der Weiter-Button wird erst aktiv, wenn Verkäufernummer, Größe/Spielzeug und Preis gültig sind.

Der eigentliche Verkauf und die Zahlungsart werden im nächsten Schritt ergänzt.


## Kasse – V9

Die Kasse unterstützt jetzt mehrere Artikel in einem Verkauf:
- **Weiterer Artikel** übernimmt den aktuellen Artikel und setzt die Eingabefelder für den nächsten Artikel zurück.
- Rechts bzw. unterhalb auf dem Smartphone läuft ein **Kassenbon** mit allen Artikeln und der Gesamtsumme mit.
- **Fertig** zeigt den vollständigen Bon und die Zahlungsarten **Bar / EC / PayPal**.
- Nach Auswahl der Zahlungsart werden die einzelnen Verkäufe unter `kb_sales` gespeichert.
- Jeder gespeicherte Verkauf enthält Verkäufernummer, Größe bzw. Spielzeug, Preis, Zahlungsart und Zeitstempel.
- Die Verkäufer-Abrechnung aus dem Verkäuferbereich kann diese Verkaufsdaten später automatisch verwenden.


## Kasse – V10

Der Kassenbon wird intern während der Eingabe aufgebaut, aber **nicht auf der Kassen-Seite angezeigt**.
- Die normale Kassenansicht zeigt nur die Artikelerfassung.
- **Fertig** öffnet ein Popup mit dem vollständigen Kassenbon.
- Im Popup stehen Gesamtbetrag und die drei Zahlungsarten **Bar / EC / PayPal**.


## Kasse – V11

Das Größenfeld verwendet jetzt `inputmode="numeric"`, sodass auf iPhone/iPad beim Eingeben die Zahlentastatur erscheint.


V12: iPad-Enter-Navigation und sichtbarer, bearbeitbarer Kassenbon unterhalb der Eingabe. Artikel können über ✎ geändert oder × gelöscht werden.


V13: iPad-Touchbedienung verbessert. Kassenbuttons verwenden explizite Button-Typen und robuste Touch-/Click-Behandlung. Artikel werden beim Weiterer Artikel zuverlässig in den sichtbaren Bon übernommen; Fertig öffnet den Popup-Bon.


## Kasse – V14

Die Kasse ist jetzt konsequent für Touch/iPad ausgelegt:
- Keine iPad-Tastatur mehr für Verkäufernummer oder Preis.
- Ein eigenes Zahlenfeld ist dauerhaft sichtbar.
- Verkäufernummer wird über das Zahlenfeld eingegeben und weiterhin grün/rot geprüft.
- Die Kindergrößen 98 bis 176 sind als große Touch-Buttons vorhanden.
- Zusätzlich gibt es den Spielzeug-Button.
- Der sichtbare Kassenbon wird direkt bei der Artikelerfassung aktualisiert.
- Artikel können im Bon über ✎ bearbeitet oder × gelöscht werden.
- Weiterer Artikel und Fertig sind normale Touch-Buttons.


V15: Kassenansicht als starrer iPad-Kassenbildschirm. Kein Seiten-Scrollen. Links Artikelerfassung, rechts dauerhaftes Zahlenfeld und darunter der mitlaufende Kassenbon. Nur die Bon-Liste kann bei vielen Artikeln intern scrollen.


V16: Grüner Bestätigungs-Pfeil im permanenten Zahlenfeld. Nach Eingabe einer gültigen Verkäufernummer und Druck auf den grünen Pfeil wird automatisch das Preisfeld aktiviert. Bei aktivem Preisfeld bestätigt der grüne Pfeil den Artikel und übernimmt ihn in den laufenden Kassenbon.


V17: Tagesabschluss. Zeigt Gesamtumsatz, Bar, EC, PayPal, 15% Provision und Auszahlung an Verkäufer auf Basis der gespeicherten Kassenverkäufe. Aktualisieren-Button lädt die aktuellen Daten neu.


V18: Verkäufer haben jetzt die Einstellung „15 % Provision berechnen“. Die Einstellung wird beim Verkauf mitgespeichert, damit spätere Änderungen am Verkäufer die bereits abgeschlossenen Verkäufe nicht verändern. Der Tagesabschluss berücksichtigt die Provision je Verkäufer und zeigt die jeweilige Auszahlung.


V19: Provisionssatz pro Verkäufer frei einstellbar (0–100 %, in 0,5-%-Schritten), standardmäßig 15 %. Die Einstellung wird zusammen mit jedem Verkauf gespeichert, damit spätere Änderungen die alten Verkäufe nicht verändern.


V20: Provisionsschalter robust gespeichert. Legacy-Verkäufer werden beim ersten Laden auf 15 % Provision gesetzt; „Provision berechnen“ aus bedeutet eindeutig 0 % für neue Verkäufe. Der Schalter wird beim Bearbeiten geladen und gespeichert.


## V22 – Tagesabschluss-Auswahl und Zurücksetzen
- Im Tagesabschluss kann zwischen Alle Kassen und Kasse 1–5 umgeschaltet werden.
- Die Kennzahlen und Kassenbons werden passend zur Auswahl gefiltert.
- Verkaufszahlen können nach Sicherheitsabfrage für alle Kassen oder die aktuell ausgewählte Kasse zurückgesetzt werden.
- Verkäuferdaten bleiben beim Zurücksetzen erhalten.


## V22 – Tagesabschluss-Auswahl und Zurücksetzen
- Im Tagesabschluss kann zwischen Alle Kassen und Kasse 1–5 umgeschaltet werden.
- Kennzahlen und Kassenbons werden passend zur Auswahl gefiltert.
- Verkaufszahlen können nach Sicherheitsabfrage für alle Kassen oder die aktuell ausgewählte Kasse zurückgesetzt werden.
- Verkäuferdaten bleiben beim Zurücksetzen erhalten.


V24: Kasse-Auswahl auf der Startseite wurde ohne Cloud-Abhängigkeit umgesetzt. Der Kasse-Button öffnet ein großes Auswahl-Popup mit Kasse 1–5; die Auswahl wird vor dem Öffnen der Kasse lokal gespeichert.


V25: Kassenwahl auf der Startseite ist jetzt ohne JavaScript für das Öffnen des Popups möglich (CSS :target). Die fünf Auswahlfelder sind echte Links auf kasse.html?kasse=1..5; die Kasse liest die Auswahl direkt aus der URL. Dadurch funktioniert die Auswahl auch bei verzögertem/gesperrtem Startseiten-JavaScript.

V26: Startseiten-Button in Kasse und Tagesabschluss optisch kompakter und sauber im Header ausgerichtet.

V27: Auf der Kasse ist kein Kassen-Wechsel mehr möglich. Die beim Einstieg gewählte Kasse wird im Kopf und als Seitentitel angezeigt. Startseite ist kompakt gestaltet.

V28: Verkäufer-Seite hat jetzt denselben kompakten Startseiten-Button wie Kasse/Tagesabschluss.


V30: Tagesabschluss enthält Verkäufer-PDF-Abrechnungen. 'Speichern aller Verkäufer' erstellt eine ZIP-Datei mit einer einseitigen PDF pro Verkäufer. Dateinamen enthalten Verkäufernummer, Name und Datum. Zusätzlich gibt es pro Verkäufer einen PDF-Button.


V32: Verkäufer-PDF/ZIP-Speichern auf iPad/Safari robuster über den nativen Teilen-Dialog (Dateien speichern) mit Fallback auf Download.
