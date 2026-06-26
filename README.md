# Pokémon SoulLink – Account- und TrueNAS-Version

Diese Version erweitert die lokale SoulLink-Website um ein echtes Backend:

- Accounts mit Benutzername-Adresse, Anzeigename und Passwort
- Passwörter werden mit bcrypt gehasht gespeichert
- Anmeldung über eine signierte, HTTP-only Session-Cookie
- PostgreSQL-Datenbank
- mehrere Challenges pro Account
- Speicherung der vollständigen Challenge einschließlich Teilnehmern, Routen, Pokémon, Teams, Regeln, Arena-/Rivalenfortschritt und Einstellungen
- automatische Server-Speicherung nach Änderungen
- lokaler Modus bleibt ohne Account verfügbar
- bestehende lokale Challenge wird nach der Registrierung oder Anmeldung in den Account übernommen
- Docker-Compose-Konfiguration für einen Server oder TrueNAS SCALE

## Lokal testen

### 1. PostgreSQL und Website gemeinsam starten

Kopiere `.env.docker.example` nach `.env` und ersetze beide Geheimnisse:

```powershell
Copy-Item .env.docker.example .env
```

Danach:

```powershell
docker compose up -d --build
```

Die Website ist anschließend unter `http://localhost:3000` erreichbar.

### 2. Entwicklung mit pnpm

Dafür muss eine PostgreSQL-Datenbank laufen. Kopiere `.env.example` nach `.env.local` und passe `DATABASE_URL` sowie `AUTH_SECRET` an.

```powershell
pnpm install
pnpm db:migrate
pnpm dev
```

## TrueNAS SCALE

TrueNAS SCALE 24.10 oder neuer kann benutzerdefinierte Apps über Docker-Compose-YAML bereitstellen. Lege zuerst ein Dataset für PostgreSQL an, zum Beispiel:

```text
/mnt/tank/apps/pokemon-soullink/postgres
```

Für die TrueNAS-Oberfläche ist `compose.truenas.yml` vorbereitet. Darin müssen vor dem Einfügen ersetzt werden:

- `DEIN_POOL`
- `DEIN_GITHUB_NAME`
- Datenbankpasswort an beiden Stellen
- `AUTH_SECRET`

`compose.truenas.yml` verwendet ein fertiges Container-Image. Baue und veröffentliche das Image vorher beispielsweise in der GitHub Container Registry:

```bash
docker build -t ghcr.io/DEIN_GITHUB_NAME/pokemon-soullink:latest .
docker push ghcr.io/DEIN_GITHUB_NAME/pokemon-soullink:latest
```

Danach in TrueNAS:

1. **Apps** öffnen.
2. **Discover Apps** beziehungsweise **Custom App** öffnen.
3. **Install via YAML** auswählen.
4. Den angepassten Inhalt aus `compose.truenas.yml` einfügen.
5. App installieren.
6. `http://IP-DEINES-TRUENAS:3000` öffnen.

Für Zugriff aus dem Internet sollte die Website ausschließlich über HTTPS hinter einem Reverse Proxy betrieben werden. Setze dann `AUTH_COOKIE_SECURE` auf `"true"`. Im reinen LAN-Betrieb über HTTP bleibt der Wert `"false"`. Port 3000 und PostgreSQL sollten nicht direkt ins Internet freigegeben werden.

## Datenbank

Die Tabellen werden beim Start automatisch über `scripts/migrate.cjs` angelegt:

- `User`: Account, Anzeigename, Benutzername und Passwort-Hash
- `Challenge`: Besitzer, Metadaten und vollständige Challenge als JSONB

JSONB wurde gewählt, damit das vorhandene umfangreiche Challenge-Datenmodell vollständig gespeichert wird und neue Felder später ergänzt werden können, ohne bei jeder UI-Erweiterung sofort die gesamte Datenbankstruktur ändern zu müssen.

## Wichtige Dateien

- `app/api/auth/*`: Registrierung, Anmeldung, Abmeldung und Sitzung
- `app/api/challenges/*`: Laden, Speichern und Löschen eigener Challenges
- `lib/auth/session.ts`: signierte Session-Cookie
- `lib/db.ts`: PostgreSQL-Verbindung
- `database/migrations/001_init.sql`: Datenbankschema
- `docker-compose.yml`: lokaler oder eigener Docker-Server
- `compose.truenas.yml`: Vorlage für TrueNAS SCALE

## Prüfungen

```bash
npm run typecheck
npm run build
```


## Private Anmeldung und Account-Verwaltung

Die Website ist vollständig geschützt. Ohne gültige Sitzung wird nur die Anmeldeseite angezeigt. Eine öffentliche Registrierung ist deaktiviert.

Nach dem ersten Start legst du den ersten Account im Projektordner an:

```powershell
docker compose exec web node scripts/create-user.cjs "admin" "SicheresPasswort123"
```

Weitere Accounts werden mit demselben Befehl erstellt. Verwende bei Passwörtern in PowerShell am besten doppelte Anführungszeichen und vermeide zunächst `$`, weil PowerShell dieses Zeichen auswerten kann.

Passwort eines bestehenden Accounts ändern:

```powershell
docker compose exec web node scripts/reset-password.cjs "admin" "NeuesPasswort123"
```

Danach ist die Anwendung unter `http://localhost:3000` erreichbar.
