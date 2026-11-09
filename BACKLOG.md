# Backlog

Offene Aufgaben über alle Repos. Priorität: hoch, mittel, niedrig.

## Niedrig

### Persistenter Kontextspeicher für Node-RED (D1-Tankfilter)

- **Repo:** energiemonitor-balena-nodered, [PR #3](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered/pull/3) (Branch `feature/file-context-storage`)
- **Was:** `contextStorage` mit Store `file` (localfilesystem) in `node-red/app/settings.js`.
- **Warum:** Der Tankfilter für D1 speichert Fenster, Anker und `water_use_l` im Store `file`. Solange dieser Store fehlt, nutzt Node-RED den Memory-Speicher. Nach jedem Neustart beginnt der Verbrauchszähler wieder bei 0, das Fenster füllt sich nach rund 3 Uplinks selbst wieder.
- **Warum zurückgestellt (9. November 2026):** `settings.js` liegt im Image, die Änderung braucht einen `balena push`. Der Push baut aus dem lokalen Ordner und würde die noch nicht freigegebenen P0-Commits mitliefern, unter anderem den MQTT-Broker nur auf `127.0.0.1` (`bb5dc57`). Das könnte die mioty-Basisstation aussperren, falls sie über das Netz publiziert. Zudem betrifft der Push die ganze Flotte `energiemonitor-test`.
- **Vor dem Umsetzen klären:** Wo publiziert die mioty-Basisstation (auf der Edgebox oder über Hotspot/LAN)? Falls über das Netz: Broker an das Hotspot-Interface binden statt an `127.0.0.1`.
- **Alternative ohne Balena-Push:** Zustand im Flow mit File-Nodes nach `/data/node-red/user/` schreiben und beim Start wieder einlesen.
- Hintergrund: [R&D-Notiz D1](docs/rnd-mioty-apollon.md)
