# Betrieb

## Laufende Kosten

| Posten | Kosten |
|---|---|
| Balena Cloud | gratis bis 10 Geräte |
| SIM-Karte | ca. 6 CHF pro Monat und Gerät, mindestens 1 Mbit/s für die Fernwartung |
| Google Cloud (Run, Firestore), nur Variante B | gering, bei kleinen Datenmengen im Bereich weniger CHF pro Monat |

Richtwerte, Stand 2026. Der Monitor selbst verbraucht rund 5 W (Messpunkt A1).

## Updates

Der Container wird über Balena aktualisiert: Repo klonen, Änderungen vornehmen, `balena push <flotte>`. Das Gerät lädt das neue Image selbst. Plane Updates so, dass kurze Neustarts von Node-RED keine wichtige Messung stören. Der Connector puffert Daten lokal und sendet sie nach, aber während eines Neustarts werden keine neuen Werte gelesen.

Bevor du den `ENCRIPTION_KEY` änderst, lies [Schlüssel migrieren](migration-verschluesselungsschluessel.md).

## Fehlersuche

| Symptom | Prüfen |
|---|---|
| Gerät offline in Balena | SIM/APN, Antenne, Netzwerkkabel. Host-OS-Konsole: `journalctl -u NetworkManager`, `journalctl -u ModemManager`, `mmcli -m 0` |
| Keine Messpunkte in der App | Node-RED-Log: erscheint „Inserted new record“? Stimmen `KWF_URL`, `KWF_KEY`, `DEVICEID`? Ist das Gerät im KWF-System angelegt? |
| Node-RED startet ohne Flows | Log: „Failed to decrypt credentials“: der `ENCRIPTION_KEY` passt nicht zu den gespeicherten Zugangsdaten, siehe [Schlüssel migrieren](migration-verschluesselungsschluessel.md) |
| Node-RED startet gar nicht | `PASSWORD` fehlt oder ist leer (`settings.js` beendet sich dann) |
| Netatmo liefert keine Werte | Refresh-Token neu erzeugen (dev.netatmo.com), `NETATMO_CLIENT`, `NETATMO_SECRET`, `NETATMO_ADDRESS` prüfen |
| Shelly fehlt | Hängt er am Hotspot `energiemonitor`? Stimmt `SHELLY_IP`? |
| PZEM liefert nichts | Adresse `0x01`, Shunt-Bereich, A/B nicht vertauscht, `/dev/ttyUSB0` vorhanden? |
| BLE-Scanner läuft nicht | Ohne konfigurierte Gadgets beendet er sich absichtlich. Mit Gadgets: MAC-Adressen, Anzahl Namen/Offsets, `DEBUG_LEVEL=1` |
| Datenbank-Fehler im Connector | Dateiname der lokalen Datenbank im Connector ändern (z. B. nach einem Update des Formats) |

Container im Host-OS: `balena-engine ps`, Logs im Balena-Dashboard oder `balena device logs <uuid> --service node-red`.

## Daten exportieren

In der App: XLSX-Download für maximal 31 Tage. Der Export schneidet nach UTC-Tagen und die Dateien können über 30 MB pro Monat gross werden.

## Klimasensoren

Innen am zentralen Lieblingsort, nicht neben Heizung oder häufig geöffneten Fenstern. Aussen auf der Schattenseite (Nordwest bis Nordost), weg von Türen, Fenstern, Lüftungsöffnungen und Kamin, 2 bis 3 m über Boden.

## Sicherheitspflege

Rotiere Passwörter und Schlüssel, wenn sie bekannt geworden sein könnten, und halte den Container aktuell. Siehe [Sicherheit](sicherheit.md).
