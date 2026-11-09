# R&D: mioty-Basisstation und Sentinum Apollon (Wassertank D1)

Arbeitsnotiz für spätere Arbeiten am Wasser-Messpunkt D1. Stand: 9. November 2026, Objekt `emon01` (Weidenbaum). Werte mit "(prüfen)" sind nicht verifiziert.

## Kurzfassung

- Der Sentinum Apollon misst den Füllstand des Wassertanks per Time-of-Flight (Abstand Sensor bis Wasseroberfläche) und sendet **stündlich** über mioty.
- Die Funkstrecke ist sehr gut (RSSI rund −72 dBm, SNR rund 27 dB). Ausfälle kommen nicht vom Funk, sondern von der Auswertung in Node-RED.
- Der alte Flow hat nur Messungen mit `TOF_Status = 0` akzeptiert. Rund 20 % der Messungen und ab dem 8. November 2026 alle Messungen hatten `TOF_Status = 2` und wurden verworfen. Deshalb erschien D1 in der App als **offline**, obwohl Daten ankamen.
- Der alte Verbrauchszähler `water_use_l` hat das Messrauschen als Verbrauch gezählt und lag rund **5-mal zu hoch**.
- Neu: Status 2 wird akzeptiert und als Datenqualität gemeldet, die Auswertung nutzt `Master_value`, ein Median-Filter über 6 Stunden mit Ausreisser-Erkennung glättet den Füllstand, und der Verbrauch wird mit Hysterese gezählt.

## Datenweg

```
Sentinum Apollon ──mioty (eu868, ULP)──▶ mioty-Basisstation
   ──MQTT localhost:1883, Topic mioty/<…>/<Endpunkt-EUI>/uplink──▶ Node-RED (Tab "Weidenbaum")
   ──▶ "Messpunkt D1" ──▶ KWF-Connector (SQLite-Puffer, stündlicher Upload)
   ──▶ energiemonitor-api ──▶ Firestore devices/emon01/… ──▶ App
```

- MQTT-Broker: der lokale Broker der Edgebox (`localhost:1883`, ohne TLS).
- Topics in den Flows: `mioty/00-00-00-00-00-00-00-00/fc-a8-4a-01-00-00-35-9a/uplink` (Node "Apollon Q in") und `mioty/00-00-00-00-00-00-00-00/#` (Node "All mioty in"). `fc-a8-4a-01-00-00-35-9a` ist die EUI des Apollon. Die erste Ebene mit lauter Nullen ist vermutlich die Applikations- oder Mandanten-EUI (prüfen).
- Modell der Basisstation und welche Software den Uplink auf MQTT veröffentlicht: (prüfen).

## Aufbau einer Uplink-Nachricht

Eine Nachricht ist ein JSON-Objekt mit Funk-Metadaten und den bereits dekodierten Messwerten. Beispiel vom 9. November 2026:

| Feld | Beispiel | Bedeutung |
|---|---|---|
| `baseStations[]` | 1 Eintrag | Eine Zeile pro Basisstation, die das Telegramm empfangen hat |
| `baseStations[].bsEui` | 8121069422560414000 | EUI der Basisstation, als Zahl (siehe Stolperfallen) |
| `baseStations[].profile` / `mode` | `eu868` / `ulp` | Regionalprofil und Übertragungsmodus |
| `baseStations[].rssi` / `snr` | −71.9 dBm / 27.0 dB | Empfangsqualität des ganzen Telegramms |
| `baseStations[].eqSnr` | 8.76 | Äquivalentes SNR (prüfen, Definition des Herstellers) |
| `baseStations[].rxTime` | 1794220900948321500 | Empfangszeit in **Nanosekunden** seit 1970 |
| `baseStations[].rxDuration` | 6683402940 | Dauer des Telegramms in ns (hier rund 6.7 s) |
| `baseStations[].subpackets` | je 42 Werte `frequency`, `rssi`, `snr` | Die einzelnen Funk-Teilpakete (Telegram Splitting) |
| `cnt` | 2068 | Paketzähler des Endpunkts auf mioty-Ebene |
| `typeEui` | 18205882861800653000 | Gerätetyp, bestimmt den Dekoder (Blueprint) |
| `data` | 28 Bytes | Rohe Nutzdaten |
| `components` | siehe unten | Von der Basisstation per Blueprint dekodierte Messwerte |
| `meta` | `Sentinum`, `Apollon`, FW 1.0, HW 1.0 | Herstellerangaben |
| `format`, `dlOpen`, `dlAck`, `responseExp` | 0, false, false, false | Payload-Format und Downlink-Flags |

## Erkenntnisse zur Basisstation und zur Funkstrecke

- **Funk ist kein Problem.** Gesamt-RSSI rund −72 dBm, SNR rund 27 dB. Die Qualitätsstufe aus dem Flow ist damit `excellent`.
- **Telegram Splitting sichtbar.** Das Telegramm kam in 42 Teilpaketen zwischen 868.149 und 868.207 MHz an. Einzelne Teilpakete dürfen ausfallen: Im Beispiel liegt das erste Teilpaket bei −129.8 dBm und −11 dB SNR, also faktisch verloren, und das Telegramm wurde trotzdem dekodiert. Für die Diagnose bei schlechtem Empfang lohnt es sich, die Teilpakete anzuschauen, nicht nur den Gesamtwert.
- **Zeitstempel in Nanosekunden.** `rxTime` ist in ns, die KWF-Pipeline erwartet ms. Der Flow verwendet `rxTime` nur intern. Der gespeicherte Zeitstempel kommt aus "Messpunkt D1" (Node-RED-Zeit beim Empfang, in ms). Wer `rxTime` übernehmen will, muss durch 1'000'000 teilen.
- **Ein Empfänger.** Bisher steht immer nur eine Basisstation in `baseStations`. Bei mehreren Stationen wählt der Flow einfach den ersten Eintrag.

### Stolperfalle: 64-Bit-Werte in JSON

`bsEui` und `typeEui` sind 64-Bit-Ganzzahlen und werden als JSON-Zahlen gesendet. JavaScript (auch Node-RED) und viele JSON-Parser rechnen mit Gleitkommazahlen, die nur bis 2^53 exakt sind. Deshalb enden die Werte auf `…000`. Sie sind **beim Parsen gerundet und nicht mehr eindeutig**. Für die Identifikation des Geräts das MQTT-Topic (Endpunkt-EUI als Hex-Text) verwenden, nicht `bsEui` oder `typeEui`. Auch `rxTime` ist dadurch auf rund 256 ns gerundet, für unsere Zwecke unerheblich.

## Sentinum Apollon: Komponenten

Die Basisstation liefert die Messwerte bereits dekodiert unter `components.<Name>.value`.

| Komponente | Beispiel | Bedeutung und Verwendung |
|---|---|---|
| `Master_value` | 525 mm | Vom Sensor als Hauptwert ausgewählte Distanz. **Wird neu für den Füllstand verwendet.** |
| `Tof_Distance` | 525 mm | ToF-Distanz |
| `Tof_NoHist_Distance` | 525 | Distanz ohne Histogramm-Auswertung (bisher verwendet) |
| `Tof_Hist_Distance` | 476 mm | Distanz aus der Histogramm-Auswertung |
| `TOF_Status` | 0 oder 2 | Status der Messung, siehe unten |
| `TOF_Hist_Status` / `TOF_NoHist_Status` | 11 / 2 | Status der beiden Teilverfahren |
| `TOF_Index`, `TOF_Peaks_Idx`, `Tof_Peaks_Num`, `Histo_Type` | 0, 1, 1, 1 | Interna der Histogramm-Auswertung (Anzahl erkannter Echos usw.) |
| `Temperature` | 10 °C | Temperatur am Sensor, im Flow als `tank_temperature` |
| `Battery_Voltage` | 3.357 V | Batteriespannung |
| `ACC_*` | Orientation 2, open_cnt 2 | Beschleunigungssensor: Lage, Stösse, Öffnungen des Gehäuses |
| `Uplink_Counter` | 20 | Zähler der Anwendung im Sensor (unabhängig von `cnt`, prüfen ob er bei Neustart zurückgesetzt wird) |
| `Alarm` | 0 | Alarm-Flag |
| `Major_Version`, `Minor_Version`, `Product_Version`, `Modulecode` | 1, 2, 5, 1 | Firmware- und Produktversion |

### TOF_Status

Beobachtet sind die Werte 0 und 2. Annahme (prüfen anhand Sentinum-Doku): Der Apollon gibt den Range-Status des ST-ToF-Chips durch, dann bedeutet 0 "gültig" und 2 "Signal zu schwach" (schwaches Echo, etwa durch Kondenswasser oder Schmutz am Fenster oder eine unruhige Wasseroberfläche). Die Distanzen bei Status 2 waren in den Daten plausibel. Deshalb gilt neu:

- **Status 0:** gültig.
- **Status 2:** wird verwendet, aber als Datenqualität "degraded" gemeldet.
- **Andere Werte:** werden verworfen, gemeldet wird "no_valid_data".

## Datenanalyse emon01 (30. Oktober bis 8. November 2026)

Quelle: `devices/emon01/telemetry/2026/{10,11}`, Messpunkt D1, 80 Datenpunkte (`level_liter`, `water_use_l`).

- **Intervall:** stündlich (immer Minute :40 bzw. :41).
- **Lücken:** 4 bis 12 Stunden, insgesamt rund 20 % der Stunden, ab dem 8. November 10:41 keine Daten mehr. Das sind die verworfenen Messungen mit Status 2.
- **Rauschen:** ±30 bis 50 L von Stunde zu Stunde. Mit der Kalibrierung (leer 750 mm, voll 260 mm, 2000 L) entspricht 1 mm rund 4.08 L. Das Rauschen liegt also bei etwa ±10 mm.
- **Ausreisser:** einzelne Sprünge bis +290 L, die in der nächsten Stunde wieder verschwinden (z. B. 1045 → 1245 → 1196 L, 763 → 1049 → 763 L).
- **Verbrauchszähler falsch:** Vom 4. bis 8. November sank der Füllstand um rund 160 L, `water_use_l` stieg aber von 711 auf 1552 L. Der alte Flow addiert jede Abnahme zum Verbrauch und ignoriert Zunahmen. Jede Schwankung nach unten wird so als Verbrauch gezählt.

## Auswertung in Node-RED (neu)

Function-Node "Tank filter (6 h)" im Tab "Weidenbaum", ersetzt "Calculate fill level" und "Store fill level". Die Parameter stehen als Konstanten oben im Node.

1. **Annehmen**, wenn `TOF_Status` 0 oder 2 ist und `0 < Master_value < 4000` mm.
2. **Fenster**: alle angenommenen Messungen der letzten 6 Stunden (rund 6 Werte), gespeichert im Flow-Kontext `file`, damit es einen Neustart übersteht.
3. **Ausreisser (Hampel-Filter)**: Referenz ist der Median des Fensters (ab 3 Werten), sonst der letzte gefilterte Wert. Schwelle `max(3 · 1.4826 · MAD, 20 mm)`. Werte ausserhalb werden zurückgehalten. Bestätigen zwei aufeinanderfolgende zurückgehaltene Werte einander, gilt das als echter Sprung (Nachfüllen oder grosse Entnahme), und das Fenster startet neu.
4. **Füllstand** = Median des Fensters, umgerechnet in `level_liter` und `level_percent`.
5. **Verbrauch mit Hysterese**: Ein Ankerwert merkt sich den Füllstand. Sinkt der gefilterte Füllstand mehr als 20 L (rund 5 mm) unter den Anker, wird die Differenz zu `water_use_l` addiert und der Anker nachgeführt. Steigt er mehr als 20 L darüber, gilt das als Nachfüllen: Der Anker wird nachgeführt, es wird nichts gezählt. `water_use_l` läuft vom bisherigen Stand weiter.
6. **Gespeicherte Werte**: `level_liter`, `level_percent`, `water_use_l` sowie zum Vergleich alle Rohdistanzen `distance_master_mm`, `distance_tof_mm`, `distance_nohist_mm`, `distance_hist_mm`.

**Nachrechnung auf den alten Daten:** Vom 6. bis 8. November zählt der neue Filter 95 L Verbrauch (alter Zähler: 385 L, tatsächlicher Rückgang des Füllstands rund 70 L), 5 Ausreisser werden verworfen. Weil die alten Daten bereits gefiltert und lückenhaft sind, müssen die Schwellen mit den neuen Rohdistanzen nach einigen Tagen nachjustiert werden.

## Datenqualität bis in die App

Die Qualität wird **nicht in jedem Datenpunkt** gespeichert, sondern einmal pro Messpunkt.

1. Node-RED hängt reservierte Felder an die Messwerte: `_q_status` (`ok`, `degraded`, `no_valid_data`), `_q_tof_status` (letzter Status) und `_q_ok_ratio` (Anteil Status 0 im 6-h-Fenster). Bei `no_valid_data` gehen nur diese Felder raus, damit der Messpunkt online bleibt.
2. Der KWF-Connector reicht `values` unverändert durch.
3. Die API entfernt alle Felder mit führendem `_` aus den Datenpunkten und schreibt den neuesten Stand nach `devices/{device}/metering_points/D1.data_quality` (`status`, `tof_status`, `ok_ratio`, `sensor_id`, `updated_at`, `since`). `since` bleibt stehen, solange der Status gleich bleibt.
4. Die App zeigt auf der Messpunkt-Karte einen Hinweis "Datenqualität", wenn der Status nicht `ok` ist.

Das Verfahren ist allgemein: Jeder Sensor kann `_q_*`-Felder senden.

## Arbeiten mit den Daten

- **Live in Node-RED:** Debug-Node an "Apollon Q in" für die Rohnachricht, an "Tank filter (6 h)" für das gefilterte Ergebnis.
- **Firestore lesen** (nur lesend, über die REST-API mit dem Konto `energiemonitor@kleinwohnformen.ch`, ohne das aktive gcloud-Konto zu wechseln):
  ```bash
  TOKEN=$(gcloud auth print-access-token --account energiemonitor@kleinwohnformen.ch)
  BASE=https://firestore.googleapis.com/v1/projects/energiemonitor-kwf/databases/(default)/documents
  # Metadaten inkl. last_seen und data_quality
  curl -s -H "Authorization: Bearer $TOKEN" "$BASE/devices/emon01/metering_points/D1"
  # Telemetrie eines Monats, gefiltert auf D1 (runQuery auf der Monats-Collection)
  curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"structuredQuery":{"from":[{"collectionId":"11"}],"where":{"fieldFilter":{"field":{"fieldPath":"metering_point"},"op":"EQUAL","value":{"stringValue":"D1"}}}}}' \
    "$BASE/devices/emon01/telemetry/2026:runQuery"
  ```
  Jedes Dokument enthält `data_points[]` mit `timestamp` (ms) und `values`.
- **Export:** über die App (Datenexport) als XLSX.
- **Kalibrierung:** `EMPTY_DISTANCE` 750 mm, `FULL_DISTANCE` 260 mm, `MAX_LITERS` 2000 im Function-Node. Bei einem anderen Tank anpassen.
- **Zähler zurücksetzen:** Inject-Node "Reset water level" (setzt `water_use_l` und den Anker).
- **Einheit:** Die Datenbank speichert Liter. Die App zeigt D1 in Litern an.

## Offene Punkte

- Bedeutung von `TOF_Status`, `TOF_Hist_Status` und `eqSnr` in der Sentinum-Doku bestätigen.
- Nach 3 bis 5 Tagen die Rohdistanzen vergleichen: Ist `Master_value` stabiler als `Tof_NoHist_Distance` und `Tof_Hist_Distance`? Danach die überflüssigen Rohfelder entfernen.
- Schwellen (20 mm Ausreisser, 20 L Hysterese) mit den Rohdaten nachjustieren.
- Sensorfenster auf Kondenswasser und Schmutz prüfen, falls Status 2 häufig bleibt.
- Modell der Basisstation und Bedeutung der Nullen-EUI im Topic dokumentieren.
