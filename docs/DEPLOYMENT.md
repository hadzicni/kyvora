# Docker Deployment

Kyvora provides separate Docker Compose files for development and production:

- `docker-compose.dev.yml` builds local Web and API images from source.
- `docker-compose.prod.yml` runs published GHCR images.

Both stacks run:

- PostgreSQL
- Spring Boot API
- Next.js web dashboard

The Go agent is not containerized in this setup. Open **Agents → Set up agent**
and follow the Linux/systemd Agent Setup Wizard to install it on the host and
test the pull-based connection from the Kyvora API. Windows, macOS, and legacy
push-based setup are not supported.

## Development

From the repository root:

```bash
cp .env.dev.example .env
```

Edit `.env` and change every `change-me` value. Generate secrets with:

```bash
openssl rand -base64 48
```

Build local images from source and start the stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open:

```text
http://localhost:3000
```

## Production

For the fastest production install:

```bash
curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/install.sh | bash
```

From a cloned repository, you can also run:

```bash
bash scripts/install.sh
```

The installer creates `.env` from `.env.prod.example` if needed, generates
production secrets for every `change-me` value, and starts the production stack.
If `.env` already exists, the installer leaves it unchanged and continues. When
run through `curl`, it creates `./kyvora` and downloads missing production files
from GitHub.

Optional values can be passed when creating `.env`:

```bash
curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/install.sh | \
  NEXTAUTH_URL=https://kyvora.example.com \
  KYVORA_VERSION=0.2.1 \
  KYVORA_INSTALL_REF=v0.2.1 \
  bash
```

You can also set `KYVORA_WEB_PORT` to expose the web dashboard on a different
host port, and `KYVORA_INSTALL_DIR` to choose a directory other than `./kyvora`.
The installer keeps `KYVORA_VERSION` and `NEXTAUTH_URL` from `.env.prod.example`
unless you pass environment variables.

Manual setup remains supported:

```bash
cp .env.prod.example .env
```

Edit `.env` and change every `change-me` value. Set `KYVORA_VERSION` to the
release tag you want to deploy, or keep `latest` if that is intentional.

Production Compose uses these published images:

```text
ghcr.io/hadzicni/kyvora-api:${KYVORA_VERSION}
ghcr.io/hadzicni/kyvora-web:${KYVORA_VERSION}
```

Start the production stack:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Open:

```text
http://localhost:3000
```

Change `KYVORA_WEB_PORT` in `.env` if the host should expose the web dashboard
on a different port.

## Configuration

Users edit simple values in `.env`. The Compose files derive internal runtime
configuration from those values.

PostgreSQL settings:

- `POSTGRES_PASSWORD` is required.
- `POSTGRES_DB` is optional in production and defaults to `kyvora`.
- `POSTGRES_USER` is optional in production and defaults to `kyvora`.

Backend secrets:

- `KYVORA_JWT_SECRET`

Web settings:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Production image version:

- `KYVORA_VERSION`

Do not put secrets in `NEXT_PUBLIC_*` variables.

## Internal Networking

Inside Docker, service names are DNS names. The web container reaches the API at:

```text
http://api:8080
```

The API reaches PostgreSQL at:

```text
postgres:5432
```

Do not use `localhost` for container-to-container traffic. In a container,
`localhost` means that same container, not another service.

The Compose files derive:

- `KYVORA_DATASOURCE_URL` from the PostgreSQL service name and database name.
- `KYVORA_DATASOURCE_USERNAME` from `POSTGRES_USER`.
- `KYVORA_DATASOURCE_PASSWORD` from `POSTGRES_PASSWORD`.
- `KYVORA_API_URL=http://api:8080` for server-side web calls.

Users should not need to edit JDBC URLs or internal service hostnames.

## First Admin

On the first startup with a fresh database, the API automatically creates one
enabled admin user:

```text
Email: admin@kyvora.local
Display name: Kyvora Admin
```

The temporary password is generated randomly, stored only as a password hash,
and printed once in the API startup logs:

```bash
docker compose -f docker-compose.prod.yml logs api
```

Look for:

```text
============================================================
Kyvora first admin created
Email: admin@kyvora.local
Temporary password: <generated-password>
This password is shown only once. Log in and change it immediately.
============================================================
```

Log in at `http://localhost:3000/login` with those credentials. Kyvora will
require a password change immediately. Later startups skip bootstrap when any
user already exists, so the temporary password is not printed again.

Deleting the database volume and starting from a fresh production database
generates a new first admin and a new temporary password:

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs api
```

## Updates

Pull the configured production image versions and restart services:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Data

PostgreSQL data is stored in the named Docker volume `kyvora_postgres-data`.

Stop the production stack and keep data:

```bash
docker compose -f docker-compose.prod.yml down
```

Stop the production stack and delete database data:

```bash
docker compose -f docker-compose.prod.yml down -v
```

Back up the production database:

```bash
docker compose -f docker-compose.prod.yml exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > kyvora-backup.sql
```

## Useful Commands

Validate development Compose configuration:

```bash
docker compose -f docker-compose.dev.yml config
```

Validate production Compose configuration:

```bash
docker compose -f docker-compose.prod.yml config
```

Follow production logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

## Discovered Environment Variables

These were discovered from the current code and configuration.

Backend API:

- `SPRING_PROFILES_ACTIVE`
- `KYVORA_DATASOURCE_URL`
- `KYVORA_DATASOURCE_USERNAME`
- `KYVORA_DATASOURCE_PASSWORD`
- `KYVORA_JWT_SECRET`
- `KYVORA_JWT_ACCESS_TOKEN_TTL_SECONDS`
- `KYVORA_REFRESH_TOKEN_TTL_SECONDS`

Web dashboard:

- `KYVORA_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Docker users normally edit only:

- `POSTGRES_PASSWORD`
- `KYVORA_JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `KYVORA_VERSION`
- `KYVORA_WEB_PORT`

The web dashboard uses `KYVORA_API_URL`, `NEXTAUTH_URL`, and
`NEXTAUTH_SECRET`. The backend uses `KYVORA_DATASOURCE_*` and
`KYVORA_JWT_SECRET`.
