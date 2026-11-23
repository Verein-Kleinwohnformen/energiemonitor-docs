# Variante B: Komplett selbst hosten

Mit Variante B betreibst du Cloud und App selbst. Deine Daten bleiben bei dir und fliessen **nicht** in die Energiestudie. Du brauchst ein Google-Cloud-Projekt mit Firebase und etwas Erfahrung mit `gcloud` und `firebase`. Rechne mit einigen Stunden zusätzlich zur [Bauanleitung](bauanleitung.md).

## Überblick

1. Google-Cloud-Projekt anlegen, Firebase aktivieren.
2. Firestore anlegen und die Security-Rules deployen.
3. API auf Cloud Run deployen und die Tageswerte einplanen (Cloud Scheduler).
4. App auf Firebase Hosting deployen.
5. Faktoren, ersten Monitor und ersten User anlegen.
6. Im Monitor `KWF_URL` und `KWF_KEY` auf deine Werte setzen.

## 1. Projekt

Lege in der [Google Cloud Console](https://console.cloud.google.com/) ein Projekt an, aktiviere Abrechnung und die APIs Cloud Run, Cloud Build, Secret Manager und Firestore. Füge das Projekt in der [Firebase Console](https://console.firebase.google.com/) hinzu und aktiviere **Authentication** (E-Mail/Passwort). Installiere die [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) und die Firebase CLI, melde dich an (`gcloud auth login`, `firebase login`).

## 2. Firestore und Rules

1. Firestore im Native Mode anlegen. Wähle die Region bewusst, sie lässt sich nicht ändern (das KWF-System verwendet `europe-west6`, Zürich).
2. Rules aus dem App-Repo verwenden: [`firestore.rules`](https://github.com/Verein-Kleinwohnformen/energiemonitor-app/blob/main/firestore.rules). Deployment: `firebase deploy --only firestore:rules`.
3. Datenstruktur: `/monitors/{monitorId}`, `/users/{uid}` mit den Listen `monitor_read` und `monitor_edit`, Telemetrie unter `/devices/{device_id}/…` (wird von der API geschrieben, siehe [Architektur](architektur.md)).

Die Rules erlauben Usern **nicht**, ihre eigenen Zugriffslisten zu ändern. Neue Monitore und Rechte vergibst du in der Firebase Console oder per Admin SDK.

## 3. API deployen

Repo: [energiemonitor-api](https://github.com/Verein-Kleinwohnformen/energiemonitor-api).

1. **Device-Keys:** Erzeuge pro Gerät einen zufälligen Key (mindestens 32 Zeichen) und lege `keys.json` an, die nie ins Repo kommt:
   ```json
   { "<DEVICE_ID>": "<ZUFÄLLIGER-KEY>" }
   ```
2. Secret anlegen und Cloud Run den Zugriff geben:
   ```bash
   gcloud secrets create energiemonitor-device-keys --data-file=keys.json --replication-policy=automatic
   gcloud secrets add-iam-policy-binding energiemonitor-device-keys \
     --member="serviceAccount:<PROJEKTNUMMER>-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```
3. Deployen: `./deploy.sh <PROJEKT-ID>` (oder `deploy.ps1`). Das Skript setzt Region `europe-west6` und **2 GiB** Arbeitsspeicher (wegen des XLSX-Exports).
4. Notiere die Service-URL. `KWF_URL` im Monitor ist `<SERVICE-URL>/telemetry`.
5. Die API erlaubt per CORS nur die Domain der App. Passe die Liste in `src/main.py` an deine App-Domain an.
6. **Tageswerte einplanen:** Übersicht und Auswertung der App lesen nur Tageswerte, die die API über `POST /aggregate` rechnet. Ohne diesen Schritt bleiben sie leer. Lege ein Dienstkonto für Cloud Scheduler an, setze in Cloud Run die Umgebungsvariablen `AGGREGATE_AUDIENCE` (Service-URL) und `AGGREGATE_INVOKERS` (E-Mail des Dienstkontos) und erstelle zwei Scheduler-Jobs (stündlich und nachts). Die Befehle stehen im [API-README](https://github.com/Verein-Kleinwohnformen/energiemonitor-api#post-aggregate-tageswerte). Für vergangene Tage gibt es `tools/backfill_daily.py`.

Bekannte Grenzen: Export maximal 31 Tage, Schnitt nach UTC-Tagen, grosse XLSX-Dateien.

## 4. App deployen

Repo: [energiemonitor-app](https://github.com/Verein-Kleinwohnformen/energiemonitor-app) (Flutter).

1. Flutter installieren (Version laut `pubspec.yaml`).
2. Eigene Firebase-Konfiguration erzeugen: `flutterfire configure` (ersetzt `lib/firebase_options.dart`). Passe die API-Basis-URL im App-Code an deine API an.
3. `flutter build web`, dann `firebase deploy --only hosting`.
4. Schränke den Browser-API-Key in der Google Cloud Console auf deine Domain und die benötigten APIs ein.

## 5. Faktoren, ersten Monitor und User anlegen

1. **Faktoren:** Lege in Firestore das Dokument `/config/factors` an (Heizwerte, Primärenergie- und Gewichtungsfaktoren, Vergleichswerte). Sie stehen absichtlich nicht im Code. Eine Vorlage mit Quellenangaben steht im App-Repo in [`tool/seed_emulator.mjs`](https://github.com/Verein-Kleinwohnformen/energiemonitor-app/blob/main/tool/seed_emulator.mjs) (Abschnitt `config/factors`), das Format in [`docs/konzept/04_datenmodell.md`](https://github.com/Verein-Kleinwohnformen/energiemonitor-app/blob/main/docs/konzept/04_datenmodell.md). Ohne Heizwerte fehlen die Brennstoffe in der Auswertung.
2. In der App ein Konto registrieren. Es erhält zunächst nur einen Sandbox-Monitor.
3. In der Firestore Console unter `/monitors` ein Dokument mit der ID deiner `DEVICEID` anlegen (Felder `monitor_id`, `tinyhouse_name`, `tinyhouse_location`).
4. Dir selbst die Rolle Superadmin geben: `node tool/admin/set_superadmin.mjs --project <PROJEKT-ID> <uid> --apply` im App-Repo. Danach vergibst du Lese- und Bearbeitungsrechte in der App unter *Mehr > Zugänge verwalten*, jede Änderung wird protokolliert. Ohne Superadmin: im Dokument `/users/<uid>` die Listen `monitor_read` und `monitor_edit` in der Console ergänzen.
5. Auf dem Gerät `DEVICEID`, `KWF_URL` und `KWF_KEY` setzen. Sobald Daten ankommen, erscheint der Monitor online.

## Sicherheit

Lies [Sicherheit](sicherheit.md). Zusätzlich für die Cloud: Device-Keys nie ins Repo, Rules nicht lockern, Kosten und Zugriffe regelmässig prüfen.
