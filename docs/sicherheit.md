# Sicherheit

Der ganze Code des Energiemonitors ist öffentlich. Wer will, kann nachlesen, welche Dienste auf dem Gerät laufen, welche Ports offen sind und wie die Cloud die Geräte erkennt. Das ist gewollt und kein Problem, **solange jedes Gerät eigene Passwörter und Schlüssel hat**. Die Sicherheit hängt nicht davon ab, dass der Aufbau geheim bleibt, sondern nur von diesen Geheimnissen.

Der Monitor steht in deinem Haus. Er hängt im WLAN oder Mobilfunk, sieht deinen Shelly, vielleicht deine Victron-Anlage und dein Heimnetz. Wer Node-RED übernimmt, kann mit allem sprechen, was das Gerät erreicht, und Geräte mit Relais (Shelly Plug, Dimmer, Victron) auch schalten. Darum gilt für jedes Gerät:

## Pflicht vor dem ersten Start

1. **Eigenes `USERNAME` und `PASSWORD`** als **Device-Variable** setzen, nie als Flottenvariable. Stark, zufällig, für jedes Gerät ein anderes. Nie ein Passwort aus einer Anleitung, einem Beispiel oder von einem anderen Gerät übernehmen.
2. **Eigener `ENCRIPTION_KEY`** als Device-Variable, für jedes Gerät ein anderer. Mit ihm verschlüsselt Node-RED die gespeicherten Zugangsdaten (`flows_cred.json`). Erzeugen mit `openssl rand -base64 32`. Der Variablenname enthält den Tippfehler, weil Node-RED ihn so liest.
3. **Eigenes Hotspot-Passwort** in der Datei `balena-hotspot` (mindestens 12 Zeichen, zufällig).
4. **Produktiv-Image statt Dev-Modus:** Lade in Balena das Image in der Variante *Production* herunter, oder schalte den Dev-Modus des Geräts aus. Im Dev-Modus ist im lokalen Netz SSH als root **ohne Passwort** offen (Port 22222). Jedes Gerät im Hotspot oder Heim-WLAN käme so auf den Monitor.
5. Passwörter und Schlüssel in einem **Passwortmanager** aufbewahren, nicht im Chat, nicht im Repo.

Setze die Werte, **bevor** der Container das erste Mal startet. Wenn du den Schlüssel später änderst, kann Node-RED die bereits gespeicherten Zugangsdaten nicht mehr lesen: siehe [Schlüssel migrieren](migration-verschluesselungsschluessel.md).

## Wege auf das Gerät und wie du sie schliesst

| Weg | Wer kommt so an das Gerät? | Schutz |
|---|---|---|
| **Public Device URL** (Balena) | Alle im Internet, die die Adresse kennen oder erraten. Node-RED zeigt dort seine Anmeldung, das Passwort ist der einzige Schutz | **Standard: aus.** Schalte sie nur ein, solange du an den Flows arbeitest, und danach sofort wieder aus (`balena device public-url <UUID> --disable`). Besser: gar nicht einschalten und Node-RED über einen Tunnel öffnen: `balena device tunnel <UUID> -p 80:8080`, dann `http://localhost:8080` |
| **Hotspot `energiemonitor`** | Alle, die das Hotspot-Passwort kennen und in Funkreichweite sind. Im Hotspot ist Node-RED auf Port 80 erreichbar, dazu die Weboberflächen von Shelly und Co. | Eigenes Hotspot-Passwort, Dev-Modus aus |
| **Heim-WLAN oder LAN** | Alle Geräte in deinem Netz, auch Gäste und ein gehacktes Smart-TV | Gleich wie Hotspot. Wenn möglich ein eigenes Gast- oder IoT-Netz für Monitor und Sensoren |
| **Balena-Konto** | Wer dein Balena-Konto übernimmt, hat volle Kontrolle über alle Geräte | Zwei-Faktor-Anmeldung in Balena einschalten, Konto nicht teilen, Zugänge für Helfende als eigene Mitglieder anlegen und danach entfernen |
| **Sensoren mit eigener Weboberfläche** | Shelly und Victron GX haben ohne Passwort keinen Schutz. Über MQTT lässt sich ein Victron-System auch steuern | Shelly: in der Weboberfläche ein Passwort setzen (Gen1: *Restrict Login*, Gen2: *Authentication*) und es im Shelly-Node in Node-RED eintragen. Victron GX: Sicherheitsprofil mit Passwort wählen |

Der lokale MQTT-Broker hört nur auf `127.0.0.1`. Ändere das nicht. Er hat keine Anmeldung.

## Regeln

- **Node-RED-Zugang nur bei Bedarf:** Public Device URL aus, wenn niemand an den Flows arbeitet. Die Messung läuft ohne sie weiter.
- Gib die **Public Device URL** nicht weiter.
- Committe nie Passwörter, Schlüssel, `flows_cred.json`, `keys.json` oder Tokens in ein Git-Repo, auch nicht „nur als Beispiel“.
- **Eigene Flows nicht in ein öffentliches Repo pushen.** Ein Flow verrät die IP-Adressen deiner Geräte, welche Relais und Dimmer es gibt und oft den Namen des Orts. Wenn du die Node-RED-Projektfunktion nutzt, nimm ein privates Repo.
- Trag im Connector als Device-Key `${KWF_KEY}` ein (ab Version 0.5.0 genügt ein leeres Feld), dann gilt die Variable `KWF_KEY`. Ab Connector 0.5.0 speichert Node-RED einen dort eingetragenen Key verschlüsselt, ältere Versionen schreiben ihn im Klartext in `flows.json`.
- Der Device-Key (`KWF_KEY`) gilt für **ein** Gerät. Teile ihn nicht und verwende ihn nicht auf mehreren Geräten.
- Netatmo-Client-Secret und Tokens gehören in Variablen bzw. in den verschlüsselten Credential-Speicher von Node-RED.
- Rotiere Passwörter und Schlüssel, wenn du vermutest, dass sie bekannt geworden sind (Chat, Screenshot, Repo).

## Deine Daten verraten, wann du zu Hause bist

Aus dem CO2-Verlauf rechnet die Cloud, an welchen Tagen und zu welchen Stunden das Haus bewohnt war, und die App zeigt das an. Für Einbrecher wäre genau das interessant. Behandle deshalb:

- **App-Zugänge** wie einen Hausschlüssel. Gib Lesezugriff nur Personen, denen du auch sagen würdest, wann du in den Ferien bist.
- **XLSX-Exporte** wie persönliche Daten. Nicht per Mail herumschicken, nicht in öffentliche Ordner legen.

## Sicherheitslücke gefunden?

Bitte nicht als öffentliches Issue melden, sondern gemäss [SECURITY](../SECURITY.md).
