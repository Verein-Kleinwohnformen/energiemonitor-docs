# Variante A: Mitmachen im KWF-System

Mit Variante A fliessen die Messdaten deines Monitors in die KWF-Cloud und erscheinen in der [KWF-App](https://energiemonitor-kwf.web.app/). Die Daten werden für die **Energiestudie mit der HSLU** verwendet. Das ist der Weg für alle, die einen Monitor für die Studie bauen.

Der Energiemonitor ist kein Produkt. Der Verein liefert keine Geräte und gibt keine Support-Zusagen. Das Team besteht aus Freiwilligen. Die Freischaltung kann deshalb einige Zeit dauern.

## Ablauf

1. **Kontakt aufnehmen:** E-Mail an [energiemonitor@kleinwohnformen.ch](mailto:energiemonitor@kleinwohnformen.ch) mit
   - deinem Objekt (Art, Energiesysteme, geplante Messpunkte, siehe [Glossar](messpunkte.md)),
   - der gewünschten `DEVICEID` (das Team bestätigt oder ändert sie),
   - der E-Mail-Adresse, mit der du dich in der App anmelden willst.
2. **Monitor bauen** nach der [Bauanleitung](bauanleitung.md). Du kannst parallel zur Anfrage beginnen.
3. **Freischaltung durch das Team:** Das Team vergibt einen eigenen **Device-Key** für dein Gerät, legt den Monitor im System an und gibt dir App-Zugang.
4. **Variablen setzen:** `DEVICEID`, `KWF_KEY` (dein Device-Key) und `KWF_URL` (die KWF-API-URL, in der Bauanleitung). Zusätzlich deine eigenen `USERNAME`, `PASSWORD` und `ENCRIPTION_KEY` ([Sicherheit](sicherheit.md)).
5. **Kontrolle:** Sobald Daten ankommen, erscheinen die Messpunkte in der App als online.

## Was du beachten musst

- Der Device-Key gehört zu **einem** Gerät. Teile ihn nicht.
- Deine Daten fliessen in die Studie. Die Details zur Datennutzung und Einwilligung (prüfen: Text der Teilnahme- und Datenschutzerklärung folgt).
- Geräte, die dem Verein gehören, gehen nach der Studie zurück.
