# balenaOS-Versionen und Host-OS-Updates

Stand: 20. November 2026. Gerätetyp aller Monitore: `raspberrypicm4-ioboard` (Edgebox RPI-200).

## Stand der Geräte

| Gerät | balenaOS | Supervisor | Besonderheit | Ergebnis Update |
|---|---|---|---|---|
| emon01 | 6.1.21 | 18.2.2 | Quectel-LTE-Modem (`2c7c:0125`) am USB-Hub | 7.4.0+rev10 zweimal, 9.0.5+rev1 einmal: **bootet nicht**, Rückfall auf 6.1.21 erst nach Stromunterbruch vor Ort |
| emon02 | 7.4.0+rev10 | 17.8.2 | ohne Modem | ok |
| emon03 | 7.4.0+rev10 | 17.8.2 | ohne Modem, gleiche Overlays und USB-Hub wie emon01 | ok |
| emon04 | 6.5.50+rev2 | 17.0.3 | offline seit Januar 2026 | nicht versucht |

Alle Geräte laufen mit demselben App-Release (2.7.4). Unterschiedliche OS-Versionen in einer Flotte sind bei Balena normal. Wichtig ist das gleiche App-Release.

## Was wir gelernt haben

1. **Host-OS-Updates gehen nur vorwärts.** `balena device os-update` bietet keine ältere Version an („not in the Host OS update targets“). Zurück geht es nur über Neu-Flashen vor Ort. Dabei gehen die Daten auf dem Gerät verloren, und es muss neu provisioniert werden.
2. **Ein Rückfall braucht oft einen Stromunterbruch.** Bootet das neue OS nicht fertig, hängt das Gerät. Erst nach einem Stromunterbruch startet es wieder ins alte OS. Die Datei `/mnt/state/rollback-altboot-triggered` belegt das. Ohne Person vor Ort bleibt das Gerät offline, und es fehlen Messdaten.
3. **Gleicher Gerätetyp heisst nicht gleiche Hardware.** emon01 und emon03 haben dieselben Overlays und denselben USB-Hub. Nur emon01 hat das LTE-Modem, und nur emon01 bootet ab 7.x nicht. Hauptverdacht ist deshalb das Modem (nicht bewiesen).
4. **Das Dashboard zeigt einen Hänger spät an.** Nach dem Neustart steht noch lange „online / configuring 100 %“. Verlässlich sind `is_connected_to_vpn` und neue Logs. Kommen 15 Minuten nach dem Neustart keine Logs, hängt das Gerät.
5. **Ein OS-Update ersetzt auch den Supervisor.** Das gilt auch dann, wenn das neue OS danach nicht bootet: emon01 läuft seither auf 6.1.21 mit Supervisor 18.2.2.

## Änderungen ab balenaOS 7

| Version | Änderung | Relevanz für uns |
|---|---|---|
| 7.0 | Root-Dateisystem nur lesbar | keine, wir schreiben nur in `/mnt/boot`, `/mnt/data` und in Volumes |
| 7.2 | aufs-Storage-Driver entfernt | keine, die Geräte nutzen overlay2 |
| 7.5 | Supervisor v18 | Compose-Labels unverändert |
| 8.0 | grössere Partitionen | nur bei neu provisionierten Geräten |
| 9.0 | keine Breaking Changes dokumentiert | – |

Für den CM4 gibt es keine 7.5.x. Die neueste 7.x ist 7.4.0+rev10. Sie enthält meta-balena 7.5.

## Konfigurationsvariablen: Syntax von dtoverlay

Jeder Wert in Anführungszeichen wird eine eigene Zeile in `config.txt`. Die Flottenvariable `"dwc2","dr_mode=host","w1-gpio"` ergibt:

```
dtoverlay=dwc2
dtoverlay=dr_mode=host    ← ein Overlay dieses Namens gibt es nicht, die Zeile wird ignoriert
dtoverlay=w1-gpio
```

Richtig wäre `"dwc2,dr_mode=host","w1-gpio"`. Es funktioniert trotzdem, weil `dwc2` im Standardmodus „otg“ den Hub erkennt. `dwc2` braucht es, damit der USB-2.0-Anschluss des CM4 als Host läuft (RS485/RS232 der Edgebox, LTE-Modem). Gerätevariablen überschreiben die Flottenvariable vollständig, nicht nur einzelne Werte. Auf emon02 hatte ein Override `vc4-kms-v3d` das USB-Overlay und mit `dtparam` ohne `ant2` auch die externe Antenne abgeschaltet (am 20. November 2026 entfernt).

## Vorgehen für künftige OS-Updates

1. Pro Gerät die Hardware prüfen (`lsusb`, Gerätevariablen, `config.txt`). Geräte nach Hardware-Klasse gruppieren, zum Beispiel mit und ohne Modem.
2. Pro Klasse zuerst **ein** Gerät aktualisieren, das am Arbeitsplatz steht oder bei dem jemand vor Ort ist. Erst wenn es mit dem neuen OS läuft, die anderen Geräte dieser Klasse aktualisieren.
3. Geräte mit Modem erst wieder aktualisieren, wenn ein Testgerät mit Modem das neue OS bootet. Dabei Boot-Log über HDMI oder die serielle Konsole beobachten.
4. Nie alle Geräte gleichzeitig aktualisieren. Nie ein Gerät, das bei einer Bewohnerin oder einem Bewohner steht, ohne Absprache für einen möglichen Stromunterbruch.
5. Vorher `developmentMode` prüfen. Geräte bei Bewohnenden sollen nicht im Dev-Modus laufen.
