# Kleiderbörse – Kassen-App (Testversion)

Eine einfache, GitHub-Pages-fähige Kassen-App als reines HTML/CSS/JavaScript.

## Schnelltest

1. Diese Dateien in ein GitHub-Repository hochladen.
2. In GitHub unter **Settings → Pages** als Quelle den Branch `main` und `/ (root)` auswählen.
3. Die veröffentlichte GitHub-Pages-Adresse öffnen.

### Test-Barcodes

Die Demo enthält drei Testartikel:

- `1001` → Verkäufer 1001 · T-Shirt · Größe 128 · 5,00 €
- `1002` → Verkäufer 1002 · Jeans · Größe 140 · 8,00 €
- `2001` → Verkäufer 2001 · Pullover · Größe M · 12,00 €

Alternativ können Artikel manuell mit Verkäufernummer, Größe und Preis in den Warenkorb gelegt werden.

## Was die Testversion kann

- Warenkorb
- automatische Verkäuferzuordnung
- 15 % Provision
- Zahlungsarten Bar / EC-Karte / PayPal als Verkaufsart
- abgeschlossene Verkäufe
- Verkäuferübersicht und Auszahlung
- CSV-Export
- lokale Speicherung im Browser
- Kamera-Barcode-Scan, sofern der Browser `BarcodeDetector` unterstützt

## Wichtig

Dies ist bewusst ein Prototyp. Die Daten werden nur im jeweiligen Browser (`localStorage`) gespeichert. Für den echten Börsenbetrieb brauchen wir anschließend eine gemeinsame Datenbank, Benutzerverwaltung, eindeutige Artikel-IDs/Barcodes, Druckerunterstützung und eine saubere Zahlungs-/Kassenlösung.

Die Zahlungsart wird in diesem Prototyp nur erfasst. Es findet keine echte EC- oder PayPal-Zahlung statt.
