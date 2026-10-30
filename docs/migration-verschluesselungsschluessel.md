# ENCRIPTION_KEY wechseln: gespeicherte Zugangsdaten umschlüsseln

Node-RED speichert Zugangsdaten (zum Beispiel das Netatmo-Refresh-Token) verschlüsselt in `flows_<geräte-id>_cred.json`. Der Schlüssel dafür ist die Variable `ENCRIPTION_KEY` (der Name enthält den Tippfehler, weil Node-RED ihn so liest).

**Problem:** Änderst du den Schlüssel, nachdem Zugangsdaten gespeichert wurden, kann Node-RED die Datei nicht mehr entschlüsseln. Im Log steht dann:

```
Error loading credentials: SyntaxError: Unexpected token ... is not valid JSON
Error loading flows: Error: Failed to decrypt credentials
```

Node-RED läuft dann ohne Flows und es werden **keine Messwerte** mehr erfasst. Die Daten bleiben bis zur Reparatur aus.

**Lösung:** Die Datei vor dem Wechsel (oder danach, solange sie noch unverändert ist) mit dem alten Schlüssel entschlüsseln und mit dem neuen Schlüssel wieder verschlüsseln. Das Skript [`scripts/migrate-node-red-credentials.js`](../scripts/migrate-node-red-credentials.js) macht das direkt auf dem Gerät. Die Geheimnisse verlassen das Gerät nie und werden nicht ausgegeben.

## Der alte Schlüssel

Alle Geräte, die mit dem Container-Repo [energiemonitor-balena-nodered](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered) ohne eigene Variable gestartet wurden, verwenden den **öffentlichen Standardwert `balena`** (so steht er in `docker-compose.yml` und `balena.yml`). Er ist kein Geheimnis. Wenn dein Gerät damit lief, ist `balena` der alte Schlüssel. Meldet das Skript `cannot-decrypt-with-old-key`, wurde ein anderer Schlüssel verwendet: nimm den damaligen Wert, oder trage die Zugangsdaten in Node-RED neu ein (Schritt „Alternative“).

## Ablauf pro Gerät

Voraussetzungen: Balena-CLI (`balena login`), das Gerät ist online, der **neue** Schlüssel ist bereits als `ENCRIPTION_KEY` gesetzt (der Node-RED-Container kennt ihn dann über die Umgebung).

1. **Prüfen, ob etwas verschlüsselt ist.** Im Log des Geräts (`balena device logs <uuid> --service node-red`):
   - `Using unencrypted credentials`: nichts zu migrieren.
   - `Failed to decrypt credentials`: migrieren (weiter mit 2).
2. **Verbinden:** Host-OS-Shell öffnen (`balena device ssh <uuid>`). Den Container-Namen holen: `balena-engine ps --format "{{.Names}}" | grep ^node-red`.
3. **Skript auf das Gerät bringen** (der Inhalt von `scripts/migrate-node-red-credentials.js`, per Zwischenablage in `/tmp/mig.js` schreiben), dann in den Container kopieren: `balena-engine cp /tmp/mig.js <container>:/tmp/mig.js`.
4. **Datei finden:** `balena-engine exec <container> ls /data/node-red/user` und die Datei `flows_<id>_cred.json` merken (nicht `.flows_..._cred.json.backup`).
5. **Migrieren:**
   ```
   balena-engine exec <container> node /tmp/mig.js /data/node-red/user/flows_<id>_cred.json balena
   ```
   Das Skript legt eine Sicherung `flows_<id>_cred.json.pre-migration` an, entschlüsselt mit dem alten Schlüssel (letztes Argument), prüft das Ergebnis, verschlüsselt mit dem neuen Schlüssel aus der Umgebung und ersetzt die Datei erst nach erfolgreicher Prüfung. Ausgabe: `RESULT migrated; nodes with credentials: <n>`.
6. **Node-RED neu starten:** `balena device restart <uuid> --service node-red`.
7. **Kontrollieren:** Im Log erscheint `Started flows` und kein `Error loading credentials`. Prüfe auch, ob Netatmo wieder Werte liefert.
8. **Aufräumen:** Die Sicherung `.pre-migration` enthält die Zugangsdaten, verschlüsselt mit dem alten, **bekannten** Schlüssel. Lösche sie, sobald alles läuft.

### Alternative: Zugangsdaten neu eintragen

Wenn das Skript nicht entschlüsseln kann: Datei `flows_<id>_cred.json` beiseiteschieben (umbenennen), Node-RED neu starten und die Zugangsdaten (z. B. das Netatmo-Refresh-Token über dev.netatmo.com neu erzeugen) im Node-RED-Editor erneut eintragen und deployen.

## Offline-Geräte

Ein Gerät, das längere Zeit offline war, übernimmt den neuen Flottenwert von `ENCRIPTION_KEY`, sobald es wieder verbunden ist. Node-RED startet dann **ohne Flows**, solange die Datei nicht migriert ist. Migriere deshalb Geräte unmittelbar, wenn sie wieder online kommen.
