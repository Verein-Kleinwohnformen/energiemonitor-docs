# Backlog

Offene Aufgaben über alle Repos. Priorität: hoch, mittel, niedrig.

## Mittel

### Logs aufräumen: nur Start, Warnungen und Fehler

- **Ziel:** In `balena device logs` sieht man im Normalbetrieb nur, dass alles korrekt gestartet ist, dazu Warnungen und Fehler. Keine internen Zustände (BLE-Scans, jeder geschriebene Messpunkt).
- **Befund emon01 (9. November 2026):** Die 1000 Zeilen Log-Historie reichen nur rund 7 Minuten zurück.
- **Massnahmen:**
  1. **BLE-Scanner (Sofortmassnahme, ohne Deploy):** Auf emon01 überschreibt die Gerätevariable `DEBUG_MODE=2` (Service `ble-scanner`) den Flottenwert `0`. Das schaltet auch das Debug-Logging von `bleak` (D-Bus-Signale) ein. Gerätevariable entfernen. Danach im Scanner (`energiemonitor-balena-nodered/ble-scanner`) die Zeilen pro Messung ("Temperature ticks", "First 2 bytes…", "Published 4 values") von INFO auf DEBUG senken. Bei INFO nur Start, gefundene Geräte und Fehler.
  2. **KWF-Connector (`kwf-energiemonitor-db`):** "Inserted new record…", "Updated existing record…" und "Processed data from…" für jeden Datenpunkt von `node.log` auf `node.debug` umstellen. Pro Upload eine Zusammenfassung loggen ("N Datensätze gesendet, HTTP 200"). Fehler bleiben `node.error`. Danach npm-Release und Update der Library in Node-RED.
  3. **Node-RED:** `LOGLEVEL` bleibt `info` (settings.js), damit Start und Verbindungen sichtbar bleiben. Prüfen, welche Flows `node.warn` für Zustände nutzen.
  4. **Start-Warnungen prüfen:** `node-red-contrib-noble` (fehlendes `bluetooth-hci-socket`) und `node-red-contrib-balena` (depDevices/depApps nicht gefunden) erscheinen bei jedem Start. Entfernen, falls nicht genutzt.
  5. **Fehler beim Start:** `[function:Decode Netatmo] TypeError: Cannot read properties of undefined (reading 'devices')` direkt nach dem Start, vermutlich die erste Antwort vor gültigem Token. Abfangen statt als Fehler loggen.

### API: Elterndokumente in Firestore anlegen (Geister-Dokumente)

- **Repo:** energiemonitor-api, `src/services/firebase_service.py`
- **Befund (9. November 2026):** In der Firestore-Konsole erscheinen `devices/emon01` und `devices/emon03` kursiv, ebenso die Jahre `telemetry/2025`, `telemetry/2026` und `manual/2025`, `manual/2026`. Diese Dokumente existieren nicht, nur ihre Unterkollektionen. Die Konsole zeigt sie darum schlecht an, und `GET devices` liefert ohne `showMissing` nichts.
- **Ursache:** Die API schreibt nur drei Pfade: `devices/{id}/metering_points/{mp}` (`_update_metering_point_metadata`, `update_data_quality`) und `devices/{id}/telemetry/{jahr}/{monat}/{uuid}` (`_write_documents`). Das Elterndokument `devices/{id}` und das Jahresdokument legt nichts an. Der README-Hinweis "kein separates Device-Dokument" war eine bewusste Sparmassnahme, hat aber diese Nebenwirkung. Die App kann es nicht beheben: `firestore.rules` hat keine Regel für `devices/{id}` und `manual/{jahr}`, also wäre Schreiben dort verboten.
- **Einmalig (ohne Codeänderung):** Platzhalter für die bestehenden 9 Pfade per Skript anlegen (`exists=false`, überschreibt nichts). Siehe Plan vom 9. November 2026.
- **Dauerhaft in der API:**
  1. Beim ersten Schreiben pro Gerät `devices/{id}` und pro Telemetrie-Jahr `devices/{id}/telemetry/{jahr}` mit `create()` anlegen und `AlreadyExists` ignorieren. Neue Geräte und der Jahreswechsel funktionieren dann ohne Handarbeit.
  2. Vorhandensein pro Prozess in einem Set merken (analog `_metering_point_metadata_cache`, aber über Requests hinweg gültig, weil die Dokumente dauerhaft bleiben). Kosten: ein zusätzlicher Schreibvorgang pro Gerät und Jahr, danach keiner mehr.
  3. Inhalt minimal: `device_id`, `created_at`. Kein Spiegel der Messpunkte, die Liste würde veralten.
  4. `manual/{jahr}` schreibt die App. Dafür entweder eine Rule für das Jahresdokument ergänzen (nur `canEditDevice`) oder die Platzhalter beim Onboarding per Skript anlegen.
  5. Test in `tests/test_telemetry.py`: Erster Request legt Eltern- und Jahresdokument an, der zweite schreibt sie nicht noch einmal.
  6. README (Firestore Datenstruktur) und `docs/architektur.md` anpassen.

## Niedrig

### Persistenter Kontextspeicher für Node-RED (D1-Tankfilter)

- **Repo:** energiemonitor-balena-nodered, [PR #3](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered/pull/3) (Branch `feature/file-context-storage`)
- **Was:** `contextStorage` mit Store `file` (localfilesystem) in `node-red/app/settings.js`.
- **Warum:** Der Tankfilter für D1 speichert Fenster, Anker und `water_use_l` im Store `file`. Solange dieser Store fehlt, nutzt Node-RED den Memory-Speicher. Nach jedem Neustart beginnt der Verbrauchszähler wieder bei 0, das Fenster füllt sich nach rund 3 Uplinks selbst wieder.
- **Warum zurückgestellt (9. November 2026):** `settings.js` liegt im Image, die Änderung braucht einen `balena push`. Der Push baut aus dem lokalen Ordner und würde die noch nicht freigegebenen P0-Commits mitliefern, unter anderem den MQTT-Broker nur auf `127.0.0.1` (`bb5dc57`). Das könnte die mioty-Basisstation aussperren, falls sie über das Netz publiziert. Zudem betrifft der Push die ganze Flotte `energiemonitor-test`.
- **Vor dem Umsetzen klären:** Wo publiziert die mioty-Basisstation (auf der Edgebox oder über Hotspot/LAN)? Falls über das Netz: Broker an das Hotspot-Interface binden statt an `127.0.0.1`.
- **Alternative ohne Balena-Push:** Zustand im Flow mit File-Nodes nach `/data/node-red/user/` schreiben und beim Start wieder einlesen.
- Hintergrund: [R&D-Notiz D1](docs/rnd-mioty-apollon.md)
