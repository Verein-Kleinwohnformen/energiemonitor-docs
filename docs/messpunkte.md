# Messpunkte und Sensor-IDs

Dies ist die **einzige Definition** der Messpunkte und Sensor-IDs. Die Repos verlinken hierher. Das Messkonzept (v1.0, Oktober 2025) orientiert sich am Minergie-Modul Monitoring. Jedes Objekt bekommt ein eigenes Messschema, das nur die Punkte enthält, die es braucht.

## Messpunkte

| ID | Bezeichnung | Einheit | Art |
|---|---|---|---|
| E1 | Netzbezug elektrische Energie | kWh | extern |
| E2 | Rückspeisung elektrische Energie | kWh | extern |
| E3 | Eigenproduktion elektrische Energie | kWh | extern |
| M0 | Gemischt | | extern (App) |
| M1 | Gas in Flaschen | kg | extern (App-Formular) |
| M2 | Brennholz oder Pellets | kg, Ster | extern (App-Formular) |
| A1 | Abzug Verbrauch Energiemonitor | kWh | extern |
| I1 | Warmwassererzeugung | kWh / kg Gas | intern |
| I2 | Energiebedarf Heizung | kWh / kg / Ster | intern |
| I3 | Kleinverbraucher (Licht usw.) | kWh | intern |
| K0 | Wohnkomfort kombiniert (K1 bis K4) | °C, % RH, ppm | Komfort |
| K1 | Innentemperatur, Lieblingsort | °C | Komfort |
| K2 | Aussentemperatur Nord, Schatten | °C | Komfort |
| K3 | Luftfeuchtigkeit, Lieblingsort | % RH | Komfort |
| K4 | CO2-Gehalt, Lieblingsort | ppm | Komfort |
| D1 | Gesamtwasserverbrauch | m³ | Wasser |
| NA | Nicht definiert | | |

Warmwasser muss getrennt von der Heizung erfasst werden (Strom des Elektroeinsatzes oder Wärmezähler).

## Sensor-IDs

| Sensor | `sensor_id` | Messgrössen | Typische Messpunkte | Status |
|---|---|---|---|---|
| Shelly Pro 3EM | `shelly-3em-pro` | voltage, current, act_power, aprt_power, pf je Phase | E1, E2, E3, A1, I1, I2, I3 | produktiv |
| Peacefair PZEM-017 (DC) | `pzem-017` | voltage, current, power | E3 und weitere DC-Punkte | produktiv |
| Netatmo Wetterstation | `netatmo` | Innen-/Aussentemperatur, Feuchte, CO2, Druck, Lärm, Batterie, Funksignal | K0 (K1 bis K4) | produktiv |
| Victron GX (Cerbo, Venus) | `victron` | power | E1, E2, E3 | produktiv |
| Sensirion Smart Gadgets (BLE) | über MQTT `energiemonitor/{humi,co2,aqi}/{name}/…` | Temperatur, Feuchte, CO2, VOC, RSSI, Batterie | K1, K3, K4 | produktiv seit Container v2.7.4 |
| Wasserzähler | (prüfen) | Verbrauch in m³ | D1 | im Test, Details (prüfen) |

## Intervalle

Shelly und Victron: Abfrage jede Sekunde, Aggregation über 10 s. Netatmo: Abfrage der Cloud alle 3 Minuten, Messwerte rund alle 10 Minuten. Sensirion: CO2 und Luftqualität 60 s, Feuchte/Temperatur 300 s. Die Studie wertet mit 15 Minuten Auflösung aus.

## Messschema erstellen

Notiere für dein Objekt, welche Energiesysteme es hat (230-V-Netz, 12 bis 48 V DC, Victron, Photovoltaik, Gas, Holz), und streiche aus der Tabelle oben alle Messpunkte, die du nicht brauchst. Ein Beispiel-Messschema für ein Tiny House mit Solaranlage: (prüfen: Beispielfolie als Bild beilegen, Freigabe nötig).
