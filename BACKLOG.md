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

## Niedrig

### Persistenter Kontextspeicher für Node-RED (D1-Tankfilter)

- **Repo:** energiemonitor-balena-nodered, [PR #3](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered/pull/3) (Branch `feature/file-context-storage`)
- **Was:** `contextStorage` mit Store `file` (localfilesystem) in `node-red/app/settings.js`.
- **Warum:** Der Tankfilter für D1 speichert Fenster, Anker und `water_use_l` im Store `file`. Solange dieser Store fehlt, nutzt Node-RED den Memory-Speicher. Nach jedem Neustart beginnt der Verbrauchszähler wieder bei 0, das Fenster füllt sich nach rund 3 Uplinks selbst wieder.
- **Warum zurückgestellt (9. November 2026):** `settings.js` liegt im Image, die Änderung braucht einen `balena push`. Der Push baut aus dem lokalen Ordner und würde die noch nicht freigegebenen P0-Commits mitliefern, unter anderem den MQTT-Broker nur auf `127.0.0.1` (`bb5dc57`). Das könnte die mioty-Basisstation aussperren, falls sie über das Netz publiziert. Zudem betrifft der Push die ganze Flotte `energiemonitor-test`.
- **Vor dem Umsetzen klären:** Wo publiziert die mioty-Basisstation (auf der Edgebox oder über Hotspot/LAN)? Falls über das Netz: Broker an das Hotspot-Interface binden statt an `127.0.0.1`.
- **Alternative ohne Balena-Push:** Zustand im Flow mit File-Nodes nach `/data/node-red/user/` schreiben und beim Start wieder einlesen.
- Hintergrund: [R&D-Notiz D1](docs/rnd-mioty-apollon.md)
