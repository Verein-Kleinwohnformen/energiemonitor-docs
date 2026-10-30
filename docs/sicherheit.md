# Sicherheit

Dein Energiemonitor ist über die Balena Public Device URL aus dem Internet erreichbar. Jede Person, die ein Standardpasswort kennt, könnte Node-RED übernehmen. Dort laufen deine Flows und liegen deine Zugangsdaten. Deshalb gilt für jedes Gerät:

## Pflicht vor dem ersten Start

1. **Eigenes `USERNAME` und `PASSWORD`** als Device-Variable setzen. Stark, zufällig, pro Gerät. Nie ein Passwort aus einer Anleitung oder einem Beispiel übernehmen.
2. **Eigener `ENCRIPTION_KEY`** als Device-Variable. Mit ihm verschlüsselt Node-RED die gespeicherten Zugangsdaten (`flows_cred.json`). Erzeugen mit `openssl rand -base64 32`. Der Variablenname enthält den Tippfehler, weil Node-RED ihn so liest.
3. **Eigenes Hotspot-Passwort** in der Datei `balena-hotspot` (mindestens 12 Zeichen).
4. Passwörter und Schlüssel in einem **Passwortmanager** aufbewahren, nicht im Chat, nicht im Repo.

Setze die Werte, **bevor** der Container das erste Mal startet. Wenn du den Schlüssel später änderst, kann Node-RED die bereits gespeicherten Zugangsdaten nicht mehr lesen: siehe [Schlüssel migrieren](migration-verschluesselungsschluessel.md).

## Regeln

- Gib die **Public Device URL** nicht weiter.
- Committe nie Passwörter, Schlüssel, `flows_cred.json`, `keys.json` oder Tokens in ein Git-Repo, auch nicht „nur als Beispiel“.
- Der lokale MQTT-Broker hört nur auf `127.0.0.1`. Ändere das nicht. Er hat keine Anmeldung.
- Der Device-Key (`KWF_KEY`) gilt für **ein** Gerät. Teile ihn nicht und verwende ihn nicht auf mehreren Geräten.
- Netatmo-Client-Secret und Tokens gehören in Variablen bzw. in den verschlüsselten Credential-Speicher von Node-RED.
- Rotiere Passwörter und Schlüssel, wenn du vermutest, dass sie bekannt geworden sind (Chat, Screenshot, Repo).

## Sicherheitslücke gefunden?

Bitte nicht als öffentliches Issue melden, sondern gemäss [SECURITY](../SECURITY.md).
