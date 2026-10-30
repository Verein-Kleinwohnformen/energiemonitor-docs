# Balena-Variablen

Variablen setzt du in Balena Cloud auf Flotten- oder Gerätebene. Gerätevariablen überschreiben Flottenvariablen. Die Namen sind so geschrieben, wie sie im produktiven System verwendet werden. **Pflicht** bedeutet: ohne Wert funktioniert die Funktion nicht oder das Gerät ist unsicher.

Die Spalte „Beispiel“ enthält nur **Platzhalter**. Echte Werte (Passwörter, Schlüssel, Secrets) gehören nie in Doku oder Repo.

## Allgemein und Sicherheit

| Variable | Dienst | Pflicht? | Beispiel (Platzhalter) | Zweck |
|---|---|---|---|---|
| `DEVICEID` | alle | Pflicht | `emonXX` | Name des Geräts im System |
| `USERNAME` | alle | **Pflicht, eigener Wert** | `<EIGENER-BENUTZER>` | Node-RED-Login |
| `PASSWORD` | alle | **Pflicht, eigener Wert** | `<EIGENES-PASSWORT>` | Node-RED-Login. Ohne Wert startet Node-RED nicht |
| `ENCRIPTION_KEY` | node-red | **Pflicht, eigener Wert** | `<ZUFÄLLIGER-SCHLÜSSEL>` | Verschlüsselt die gespeicherten Node-RED-Zugangsdaten. Name mit Tippfehler: so liest ihn Node-RED |
| `PORT` | alle | optional | `80` | Port der Node-RED-Oberfläche |

## Cloud-Anbindung

| Variable | Dienst | Pflicht? | Beispiel | Zweck |
|---|---|---|---|---|
| `KWF_URL` | node-red | Pflicht | `https://energiemonitor-api-325255315766.europe-west6.run.app/telemetry` | API-URL. In Variante A der KWF-Wert (Flottenvariable), in Variante B deine eigene URL |
| `KWF_KEY` | node-red | Pflicht, pro Gerät | `<DEVICE-KEY>` | Device-Key für die API. Variante A: vom Team |

## Sensoren

| Variable | Dienst | Pflicht? | Beispiel | Zweck |
|---|---|---|---|---|
| `SHELLY_IP` | node-red | mit Shelly | `192.168.x.x` | Feste IP des Shelly im Hotspot |
| `NETATMO_CLIENT` | node-red | mit Netatmo | `<CLIENT-ID>` | Client-ID deiner Netatmo-App |
| `NETATMO_SECRET` | node-red | mit Netatmo | `<CLIENT-SECRET>` | Client-Secret. Geheim halten |
| `NETATMO_ADDRESS` | node-red | mit Netatmo, pro Gerät | `00:00:00:00:00:00` | MAC der Station, damit nur sie ausgewertet wird |
| `VICTRON_IP` | node-red | mit Victron | `0.0.0.0` | IP des GX-Geräts im LAN |
| `VICTRON_SERIAL` | node-red | mit Victron | `000000000000` | Portal-ID des GX für die MQTT-Topics |

## BLE-Scanner (Sensirion Smart Gadgets)

Alle Variablen gehören zum Dienst `ble-scanner`. Pro Gadget-Typ müssen Anzahl der MAC-Adressen, Namen und Offsets übereinstimmen. Komma-getrennt, `:` als Trennzeichen in den MAC-Adressen, Gross-/Kleinschreibung egal. **Ohne Gadgets** lässt du `*_GADGETS`, `*_NAMES` und `*_TEMP_OFFSET` leer, der Scanner beendet sich dann sauber.

| Variable | Beispiel | Zweck |
|---|---|---|
| `HUMI_GADGETS` / `HUMI_NAMES` / `HUMI_TEMP_OFFSET` | `aa:bb:cc:dd:ee:01` / `bad` / `0` | Temperatur-/Feuchte-Gadgets, die Namen bilden die MQTT-Topics |
| `CO2_GADGETS` / `CO2_NAMES` / `CO2_TEMP_OFFSET` | `aa:bb:cc:dd:ee:02` / `oben` / `-1.2` | CO2-Gadgets |
| `AIQ_GADGETS` / `AIQ_NAMES` / `AIQ_TEMP_OFFSET` | `aa:bb:cc:dd:ee:03` / `oben` / `-1.2` | Luftqualität (VOC) |
| `HUMI_SCAN_INTERVAL`, `CO2_SCAN_INTERVAL`, `AIQ_SCAN_INTERVAL` | `300` / `60` / `60` | Scan-Intervall in Sekunden (optional) |
| `DEBUG_MODE` | `0` | Debug-Schalter des Scanners |
| `DEBUG_LEVEL` | `0` | `0` Info, `1` Debug, `2` Verbose |

MQTT-Topics: `energiemonitor/humi/{name}/temperature|humidity|battery|rssi`, `energiemonitor/co2/{name}/co2|temperature|rssi`, `energiemonitor/aqi/{name}/voc|temperature|humidity|rssi`.

## Flotten-Konfiguration (Device Tree, Edgebox RPI-200)

`"i2c_arm=on","spi=on","audio=on","enable_serial=1","pwr_led_activelow=off","act_led_trigger=none","act_led_activelow=off"`. Für das Modem: GPIO `"6=op,dh","5=op,dh"`, VPN-Check aktivieren.
