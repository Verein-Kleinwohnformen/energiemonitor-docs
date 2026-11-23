# Backlog

Offene Aufgaben über alle Repos. Priorität: hoch, mittel, niedrig.

## Hoch

Zurzeit nichts.

## Mittel

### emon02: Umstellung auf Heim-WLAN bei der Installation

- **Ziel:** emon02, der Shelly Pro 3EM und die Netatmo-Station hängen im Heim-WLAN statt am Hotspot `energiemonitor`.
- **Ablauf:** Die Installation läuft zuerst mit LAN-Kabel. Danach im Host-OS `balena-hotspot` nach `/mnt/data/balena-hotspot.bak` verschieben und `/mnt/boot/system-connections/home-wifi` (Client-Profil, `mode=infrastructure`) anlegen, dann neu starten. Shelly und Edgebox bekommen eine feste IP per DHCP-Reservierung im Router.
- **Nachher:** `SHELLY_IP`, `NETATMO_*` und gegebenenfalls `VICTRON_*` als Gerätevariablen setzen. Flows auf fest eingetragene `10.42.0.x`-Adressen prüfen.
- Seit dem 20. November nutzt emon02 die Flottenwerte mit `ant2`, also die externe Antenne.

### emon01: balenaOS ab 7.x bootet nicht

- **Befund (20. November 2026):** Host-OS-Update auf 7.4.0+rev10 (zweimal) und 9.0.5+rev1 (einmal). emon01 hängt jedes Mal nach dem Neustart und kommt erst nach einem Stromunterbruch vor Ort auf 6.1.21 zurück (`rollback-altboot-triggered`). emon02 und emon03 laufen auf 7.4 ohne Probleme. Datenlücke emon01 am 20. November rund 16:30 bis 21:16 mit Unterbrüchen.
- **Hauptverdacht:** Quectel-LTE-Modem (`2c7c:0125`). Es ist der einzige Hardware-Unterschied zu emon03 (gleiche Overlays, gleicher USB-Hub).
- **Vorgehen:** Testgerät mit Modem am Arbeitsplatz mit HDMI oder serieller Konsole auf 9.x aktualisieren und den Boot beobachten. emon01 erst danach und nur mit Person vor Ort wieder aktualisieren. Siehe [balenaOS-Versionen](docs/balena-os-versionen.md).

### Flottenvariable dtoverlay korrigieren

- **Befund:** `RESIN_HOST_CONFIG_dtoverlay` in `energiemonitor-test` ist `"dwc2","dr_mode=host","w1-gpio"`. Das ergibt die ungültige Zeile `dtoverlay=dr_mode=host`. Richtig: `"dwc2,dr_mode=host","w1-gpio"`.
- **Achtung:** Die Änderung schreibt `config.txt` neu und startet **alle** Geräte der Flotte neu. Zuerst auf einem Testgerät als Gerätevariable prüfen. Klären, ob `w1-gpio` gebraucht wird.

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

### Importierbare Beispiel-Flows pro Sensor

- **Befund (23. November 2026, Nutzer-Analyse):** Die [Bauanleitung](docs/bauanleitung.md) sagt „pro Sensor brauchst du einen kleinen Flow“, liefert aber keine aktuellen Flows. Selbstbauende ohne Node-RED-Erfahrung bleiben hier stecken.
- **Massnahme:** Pro Sensor (Shelly Pro 3EM, PZEM-017, Netatmo, Victron GX, BLE-Gadgets) einen kleinen Flow als JSON im Connector-Repo unter `examples/`, ohne IPs und Schlüssel, nur mit `${…}`-Variablen. Node-RED zeigt sie dann unter *Import > Examples*. Dazu Fotos vom Einbau (Bauanleitung Kapitel 5, Freigabe nötig).

## Niedrig

### Persistenter Kontextspeicher für Node-RED (D1-Tankfilter)

- **Repo:** energiemonitor-balena-nodered, [PR #3](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered/pull/3) (Branch `feature/file-context-storage`)
- **Was:** `contextStorage` mit Store `file` (localfilesystem) in `node-red/app/settings.js`.
- **Warum:** Der Tankfilter für D1 speichert Fenster, Anker und `water_use_l` im Store `file`. Solange dieser Store fehlt, nutzt Node-RED den Memory-Speicher. Nach jedem Neustart beginnt der Verbrauchszähler wieder bei 0, das Fenster füllt sich nach rund 3 Uplinks selbst wieder.
- **Warum zurückgestellt (9. November 2026):** `settings.js` liegt im Image, die Änderung braucht einen `balena push`. Der Push baut aus dem lokalen Ordner und würde die noch nicht freigegebenen P0-Commits mitliefern, unter anderem den MQTT-Broker nur auf `127.0.0.1` (`bb5dc57`). Das könnte die mioty-Basisstation aussperren, falls sie über das Netz publiziert. Zudem betrifft der Push die ganze Flotte `energiemonitor-test`.
- **Vor dem Umsetzen klären:** Wo publiziert die mioty-Basisstation (auf der Edgebox oder über Hotspot/LAN)? Falls über das Netz: Broker an das Hotspot-Interface binden statt an `127.0.0.1`.
- **Alternative ohne Balena-Push:** Zustand im Flow mit File-Nodes nach `/data/node-red/user/` schreiben und beim Start wieder einlesen.
- Hintergrund: [R&D-Notiz D1](docs/rnd-mioty-apollon.md)

### BLE-Scanner: kein Neustart-Loop ohne Gadgets

- **Repo:** energiemonitor-balena-nodered, `ble-scanner` und `docker-compose.yml`
- **Befund (20. November 2026):** Ohne konfigurierte Gadgets beendet sich der Scanner mit Exit-Code 1 („No devices configured!“). Wegen `restart: always` startet er sofort neu: auf emon03 283-mal, auf emon02 laufend. Das füllt die Logs, und der neue Supervisor meldet das Gerät zeitweise als „reduced-functionality“.
- **Massnahme:** Ohne Gadgets nach einer Info-Zeile im Leerlauf bleiben (zum Beispiel `sleep infinity`), statt sich zu beenden. Alternative: Exit-Code 0 und `restart: on-failure`. Danach `bauanleitung.md` und `betrieb.md` anpassen („beendet sich absichtlich“).

### emon03: Hotspot-Datei ist leer

- **Befund (20. November 2026):** `/mnt/boot/system-connections/balena-hotspot` auf emon03 ist 1 Byte gross, `wlan0` ist nicht verbunden. Victron und KNX laufen über LAN, darum fehlt im Moment nichts.
- **Klären:** War das bei der Installation so gewollt? Falls später ein Sensor über WLAN dazukommt, das Profil nach [Bauanleitung](docs/bauanleitung.md) Kapitel 8 neu anlegen.
