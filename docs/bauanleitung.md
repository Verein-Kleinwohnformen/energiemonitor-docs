# Bauanleitung: vom Tiny House zur Kurve in der App

Diese Anleitung führt durch den Bau eines Energiemonitors, standardmässig in **Variante A** (Daten gehen ins KWF-System und in die Energiestudie). Für das Selbsthosten siehe [Variante B](variante-b-selbst-hosten.md).

**Aufwand:** Laut Erfahrung 6 bis 8 Stunden pro Monitor für jemanden, der es schon kann. Plane beim ersten Mal mehr ein.

**Wichtig vorab:** Der Energiemonitor ist kein Produkt des Vereins. Der Verein verkauft und liefert keine Geräte und gibt keine Support-Zusagen. Das Team besteht aus Freiwilligen, Antworten können dauern.

> **Sicherheit zuerst:** Das Gerät ist über die Balena Public Device URL aus dem Internet erreichbar. Setze **vor dem ersten Start** eigene Werte für `USERNAME`, `PASSWORD` und `ENCRIPTION_KEY` (Kapitel 7) und ein eigenes Hotspot-Passwort (Kapitel 8). Details in [Sicherheit](sicherheit.md).

## Inhalt

1. [Vorher klären: Messschema](#1-vorher-klären-messschema)
2. [Einkaufsliste](#2-einkaufsliste)
3. [Konten](#3-konten)
4. [Betriebsvariante wählen](#4-betriebsvariante-wählen)
5. [Hardware zusammenbauen](#5-hardware-zusammenbauen)
6. [Flashen und Balena](#6-flashen-und-balena)
7. [Variablen setzen](#7-variablen-setzen)
8. [Netzwerk](#8-netzwerk)
9. [Sensoren einzeln](#9-sensoren-einzeln)
10. [Node-RED-Flows](#10-node-red-flows)
11. [Kontrolle](#11-kontrolle)
12. [Betrieb](#12-betrieb)

## 1. Vorher klären: Messschema

Jede Kleinwohnform hat andere Energiesysteme. Halte fest, was bei dir vorkommt: 230-V-Netz, 12 bis 48 V DC, Victron-System, Photovoltaik, Gas, Holz oder Pellets, Warmwasser, Wasserzähler. Daraus ergibt sich, welche **Messpunkte** du brauchst (E1 bis D1). Die Definition steht im [Glossar](messpunkte.md). Das Messkonzept orientiert sich am Minergie-Modul Monitoring.

Zeichne dein Schema auf, bevor du Sensoren kaufst. Beispiel: Ein Haus mit Netzanschluss und Solaranlage braucht E1 (Netzbezug), E3 (Eigenproduktion), A1 (Eigenverbrauch des Monitors) und K0 (Klima).

## 2. Einkaufsliste

Richtpreise, **Stand 2026**, in CHF. Preise und Bezugsquellen ändern sich, prüfe sie selbst.

**Basis**

| Komponente | Zweck | Richtpreis |
|---|---|---|
| Edgebox RPI-200 (Seeed, Raspberry Pi CM4) | Rechner, DIN-Schiene, 12 bis 36 V DC, RS485, WLAN, BLE | ca. 350 |
| Stromversorgung 12 bis 36 V DC | | ca. 30 |
| Kabel, SMA-WLAN-Antenne, Kleinteile | Die Antenne nicht vergessen | ca. 30 |
| Raspberry Pi CM4 IO-Board (einmalig) | Zum Flashen des CM4 | (prüfen) |

**Optionen je nach Messschema**

| Komponente | Zweck | Richtpreis |
|---|---|---|
| LTE-Modul (Quectel) und SIM | Mobilfunk, z. B. ab ca. 6 CHF pro Monat | ca. 50 |
| Shelly Pro 3EM | 230 V, 3 Phasen | ca. 130 |
| Peacefair PZEM-017 mit Shunt und RS485-USB-Wandler | DC-Messung | ca. 100 |
| Netatmo Wetterstation innen und aussen | Wohnklima | ca. 180 |
| Sensirion Smart Gadgets (BLE), Wasserzähler | nach Bedarf | ca. 130 |

**Total:** rund 800 bis 1000 CHF, je nach Ausbau, plus Einbau und Konfiguration. Für Selbstbauer funktioniert auch ein **Raspberry Pi 4**.

## 3. Konten

- **Balena Cloud** ([balena.io](https://www.balena.io/)), gratis bis 10 Geräte.
- **Netatmo-Developer-App** ([dev.netatmo.com](https://dev.netatmo.com)), wenn du Netatmo verwendest.
- **SIM-Karte**, wenn du Mobilfunk brauchst. Mindestens 1 Mbit/s für die Fernwartung.
- **GitHub-Konto** zum Mitmachen im Projekt (optional).

## 4. Betriebsvariante wählen

- **Variante A (Standard für die Energiestudie):** Kontakt aufnehmen mit [energiemonitor@kleinwohnformen.ch](mailto:energiemonitor@kleinwohnformen.ch). Das Team legt deinen Monitor im KWF-System an und gibt dir einen Device-Key und einen App-Zugang. Ablauf: [Variante A](variante-a-mitmachen.md). Ehrlich gesagt: Das Team besteht aus Freiwilligen. Die Freischaltung kann etwas dauern.
- **Variante B:** Eigene Google-Cloud-/Firebase-Umgebung. Die Daten fliessen **nicht** in die Studie. Siehe [Variante B](variante-b-selbst-hosten.md).

Du kannst den Monitor zuerst bauen und die Freischaltung parallel anfragen.

## 5. Hardware zusammenbauen

1. Edgebox aufschrauben und das Raspberry-Pi-Board (CM4) entnehmen.
2. Die SMA-Antenne anschliessen. Das LTE-Modul einsetzen, falls du es verwendest.
3. Netzteil anschliessen und die Sensoren nach deinem Messschema verkabeln. Beim PZEM-017: **A auf A, B auf B**, über einen RS485-USB-Wandler (siehe Kapitel 9).

(Fotos vom Einbau-Workshop: folgen, Freigabe nötig.)

## 6. Flashen und Balena

1. In [Balena Cloud](https://dashboard.balena-cloud.com/) eine **Flotte** anlegen (Gerätetyp: Raspberry Pi CM4 IO Board) und dein eigenes Fork des Containers deployen oder das Repo [energiemonitor-balena-nodered](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered) mit `balena push` auf die Flotte laden.
2. Zum Flashen das CM4 auf das **CM4-IO-Board** stecken. Dann in der Flotte: *Add device*, Gerätetyp CM4 IO Board wählen und den Anweisungen folgen. Mit Balena Etcher das Image auf das Board flashen.
3. CM4 zurück in die Edgebox einbauen und das Gerät starten. Es erscheint nach kurzer Zeit in der Flotte.

Die Flotten-Konfiguration (Device Tree) für die Edgebox: `"i2c_arm=on","spi=on","audio=on","enable_serial=1","pwr_led_activelow=off","act_led_trigger=none","act_led_activelow=off"`. Für das Modem die GPIOs `"6=op,dh","5=op,dh"` und den VPN-Check aktivieren (prüfen, ob dein Modem das braucht).

## 7. Variablen setzen

Alle Variablen mit Bedeutung stehen in [Variablen](variablen.md). Pflicht pro Gerät:

| Variable | Wert |
|---|---|
| `DEVICEID` | Name deines Monitors im System, z. B. `emon10` (in Variante A mit dem Team abstimmen) |
| `USERNAME` | **eigener** Benutzername für Node-RED |
| `PASSWORD` | **eigenes, starkes** Passwort für Node-RED. Nie ein Passwort aus einer Anleitung übernehmen |
| `ENCRIPTION_KEY` | **eigener**, zufälliger Schlüssel, siehe unten |
| `KWF_URL` | API-URL, in Variante A `https://energiemonitor-api-325255315766.europe-west6.run.app/telemetry` |
| `KWF_KEY` | Device-Key (Variante A: vom Team) |

Je nach Sensoren: `SHELLY_IP`, `NETATMO_*`, `VICTRON_*`, die BLE-Variablen (siehe [Variablen](variablen.md)).

**Eigenen Schlüssel erzeugen:** `openssl rand -base64 32`. Der Variablenname ist mit dem Tippfehler `ENCRIPTION_KEY` geschrieben, weil Node-RED ihn so liest. Bewahre den Schlüssel in einem Passwortmanager auf. Wenn du ihn später ändern willst, musst du die gespeicherten Zugangsdaten umschlüsseln, siehe [Schlüssel migrieren](migration-verschluesselungsschluessel.md).

Setze die drei Werte **vor** dem ersten Start des Containers, damit Node-RED nie mit den Standardwerten läuft.

## 8. Netzwerk

Das Gerät öffnet einen WLAN-Hotspot `energiemonitor`, an dem Shelly und andere Sensoren hängen.

1. Öffne in Balena ein Terminal zum **Host-OS** und wechsle in `/mnt/boot/system-connections`.
2. Hole die Vorlagen aus dem Ordner [system_connections](https://github.com/Verein-Kleinwohnformen/energiemonitor-balena-nodered/tree/main/system_connections) des Container-Repos.
3. In `balena-hotspot` ersetzt du `<DEIN-HOTSPOT-PASSWORT>` durch ein **eigenes**, zufälliges Passwort (mindestens 12 Zeichen, pro Gerät). Am Hotspot hängen der Shelly und der lokale MQTT-Broker.
4. Lege die Datei mit `cat > balena-hotspot`, Inhalt einfügen, Ctrl+D an.
5. Optional LTE: gleich mit `cellular` (nur mit SIM-Karte). Trage den APN deines Anbieters ein.
6. Gerät neu starten. Prüfe, ob es sich über Mobilfunk verbindet und der Hotspot `energiemonitor` erscheint.

## 9. Sensoren einzeln

**Shelly Pro 3EM (230 V).** Verbindet sich mit dem Hotspot `energiemonitor`. Vergib eine feste IP und trage sie als `SHELLY_IP` ein. Node-RED fragt jede Sekunde ab und mittelt über 10 s.

**PZEM-017 (DC).** Vor dem Einbau am PC mit dem Python-Projekt [PZEM017modbus](https://github.com/croutonso/PZEM017modbus) konfigurieren: Adresse auf `0x01`, Shunt-Bereich setzen (`0x0000` = 100 A, `0x0001` = 50 A, `0x0002` = 200 A, `0x0003` = 300 A). Schnittstelle `/dev/ttyUSB0`, 9600 Baud, 8N2. **Über einen RS485-USB-Wandler verkabeln, A auf A und B auf B.** Die direkte Verkabelung an die GPIO-RS485 hat nicht funktioniert. Ob das Modul eine separate 5-V-Versorgung braucht, ist (prüfen). In Node-RED liest die Bitpool-Modbus-Library den Wert.

**Netatmo.** Die Station lädt über das Hotspot-WLAN in die Netatmo-Cloud hoch, Node-RED holt die Werte alle 3 Minuten dort ab. Erstelle auf [dev.netatmo.com](https://dev.netatmo.com) eine App und erzeuge mit dem Token-Generator ein Refresh-Token. Trage es im OAuth2-Block in Node-RED ein (nur das Refresh-Token). `NETATMO_CLIENT` und `NETATMO_SECRET` kommen als Variablen. Setze die MAC-Adresse deiner Station als `NETATMO_ADDRESS`, damit nur deine Station ausgewertet wird. Das Token erneuert sich bei jeder Abfrage und wird unter `/data` gespeichert. Offene Frage: eine eigene Netatmo-App pro Monitor.

**Victron GX.** Ein GX-System ohne „Venus Large“ hat kein Node-RED, deshalb holt der Monitor die Daten per MQTT im LAN. Am GX unter *Settings > Services* MQTT aktivieren, eine feste IP vergeben und sie als `VICTRON_IP` eintragen (zusammen mit `VICTRON_SERIAL`). In Node-RED subscribet ein MQTT-Block auf Topics wie `N/<portal-id>/system/0/Ac/Consumption/L1/Power`. Den Wert aus dem JSON-Feld `value` lesen und über 10 s mitteln.

**Sensirion Smart Gadgets (BLE).** Der BLE-Scanner liest die Advertisements passiv und veröffentlicht sie über MQTT. Konfiguration über `HUMI_*`, `CO2_*` und `AIQ_*` (MAC-Adressen, Namen, Temperatur-Offsets). Die Anzahl muss pro Typ übereinstimmen. Ohne Gadgets lässt du alle leer, der Scanner beendet sich dann sauber. Details in [Variablen](variablen.md).

**Klimasensoren installieren.** Innen am zentralen Lieblingsort, nicht neben Heizung oder oft geöffneten Fenstern. Aussen auf der Schattenseite (Nordwest bis Nordost), weg von Türen, Fenstern, Lüftungsöffnungen und Kamin, 2 bis 3 m über dem Boden.

## 10. Node-RED-Flows

Öffne die **Public Device URL** im Balena-Gerätepanel und melde dich mit **deinen** Zugangsdaten an. Gib die URL nicht weiter.

Pro Sensor brauchst du einen kleinen Flow: Messwerte lesen, die benötigten Werte auswählen und aggregieren, `sensor_id` und `metering_point` gemäss deinem Messschema setzen und an den **KWF Datenbank-Connector** senden. Das Format steht in [Architektur](architektur.md). Der Connector ist als npm-Paket `@vereinkleinwohnformen/node-red-energiemonitor` in der Node-RED-Palette erhältlich. Setze im Connector das Sende-Intervall (zum Testen 1 Minute, im Betrieb 1 Stunde), die API-URL (aus `KWF_URL`) und den Device-Key (aus `KWF_KEY`).

Die alten Beispiel-Flows ([energiemonitor-nodered-flows](https://github.com/Verein-Kleinwohnformen/energiemonitor-nodered-flows)) sind **deprecated**, taugen aber als Vorlage. Die Zugangsdaten zu Diensten wie Netatmo trägst du selbst in Node-RED ein. Sie werden mit deinem `ENCRIPTION_KEY` verschlüsselt und gehören nie in ein Git-Repo.

## 11. Kontrolle

1. Im Node-RED-Debug siehst du eingehende Werte und im Connector „Inserted new record“.
2. Erst nach der Freischaltung (Variante A) erscheinen die Messpunkte in der [App](https://energiemonitor-kwf.web.app/) als online.
3. Mache einen **Testexport** in der App (maximal 31 Tage) und prüfe die Werte.
4. Prüfe im Balena-Dashboard, dass alle Container laufen.

## 12. Betrieb

Siehe [Betrieb](betrieb.md): laufende Kosten, Updates, Fehlersuche und Debug-Befehle.
