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
