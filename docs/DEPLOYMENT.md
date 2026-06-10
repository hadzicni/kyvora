# Docker Deployment

This is the first simple Docker setup for Kyvora. It runs only:

- PostgreSQL
- Spring Boot API
- Next.js web dashboard

The Go agent is not containerized in this setup. Enroll an agent in the UI and
run it on the host separately.

## Quick Start

From the repository root:

```bash
cp .env.docker.example .env
```

Edit `.env` and change every `change-me` value. Generate secrets with:

```bash
openssl rand -base64 48
```

Start Kyvora:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000
```

## Configuration

Users only edit simple values in `.env`. The Compose file derives internal
runtime configuration from those values.

PostgreSQL settings:

- `POSTGRES_PASSWORD` is required.
- `POSTGRES_DB` is optional and defaults to `kyvora`.
- `POSTGRES_USER` is optional and defaults to `kyvora`.

Backend secrets and bootstrap admin settings:

- `KYVORA_JWT_SECRET`
- `KYVORA_BOOTSTRAP_ADMIN_EMAIL`
- `KYVORA_BOOTSTRAP_ADMIN_PASSWORD`
- `KYVORA_BOOTSTRAP_ADMIN_DISPLAY_NAME`

Web settings:

- `AUTH_SECRET`
- `NEXTAUTH_URL`

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

The root `docker-compose.yml` derives:

- `KYVORA_DATASOURCE_URL` from `POSTGRES_DB`
- `KYVORA_DATASOURCE_USERNAME` from `POSTGRES_USER`
- `KYVORA_DATASOURCE_PASSWORD` from `POSTGRES_PASSWORD`
- `KYVORA_API_URL=http://api:8080` for server-side web calls

Users should not need to edit JDBC URLs or internal service hostnames.

## Data

PostgreSQL data is stored in the named Docker volume `kyvora_postgres-data`.

Stop the stack and keep data:

```bash
docker compose down
```

Stop the stack and delete database data:

```bash
docker compose down -v
```

Back up the database:

```bash
docker compose exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > kyvora-backup.sql
```

## Useful Commands

Validate Compose configuration:

```bash
docker compose config
```

Start in the background:

```bash
docker compose up -d --build
```

Follow logs:

```bash
docker compose logs -f
```

## Discovered Environment Variables

These were discovered from the current code and configuration.

Backend API:

- `SPRING_PROFILES_ACTIVE`
- `KYVORA_DATASOURCE_URL`
- `KYVORA_DATASOURCE_USERNAME`
- `KYVORA_DATASOURCE_PASSWORD`
- `KYVORA_API_PORT`
- `KYVORA_JWT_SECRET`
- `KYVORA_JWT_ACCESS_TOKEN_TTL_SECONDS`
- `KYVORA_REFRESH_TOKEN_TTL_SECONDS`
- `KYVORA_BOOTSTRAP_ADMIN_EMAIL`
- `KYVORA_BOOTSTRAP_ADMIN_PASSWORD`
- `KYVORA_BOOTSTRAP_ADMIN_DISPLAY_NAME`

Web dashboard:

- `KYVORA_API_URL`
- `API_BASE_URL`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

Docker users normally edit only:

- `POSTGRES_PASSWORD`
- `KYVORA_JWT_SECRET`
- `AUTH_SECRET`
- `KYVORA_BOOTSTRAP_ADMIN_EMAIL`
- `KYVORA_BOOTSTRAP_ADMIN_PASSWORD`
- `KYVORA_BOOTSTRAP_ADMIN_DISPLAY_NAME`
- `NEXTAUTH_URL`

`API_BASE_URL`, `AUTH_URL`, and `NEXTAUTH_SECRET` remain supported for local
compatibility, but the Docker example uses `KYVORA_API_URL`, `NEXTAUTH_URL`,
and `AUTH_SECRET`.
