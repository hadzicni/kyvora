<div align="center">

<h1>Kyvora — Open-source Homelab Control Plane</h1>

<img src="./docs/branding/banner.png" alt="Project banner" width="100%" />

<br />

An open-source Homelab Control Plane for managing, monitoring, and operating self-hosted infrastructure from one modern dashboard.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Status](https://img.shields.io/badge/status-development-success.svg)](#overview)
[![Language](https://img.shields.io/badge/language-NextJS/SpringBoot-blue.svg)](#overview)

[![Release](https://img.shields.io/github/v/release/hadzicni/kyvora)](https://github.com/hadzicni/kyvora/releases)
[![Stars](https://img.shields.io/github/stars/hadzicni/kyvora)](https://github.com/hadzicni/kyvora/stargazers)
[![Issues](https://img.shields.io/github/issues/hadzicni/kyvora)](https://github.com/hadzicni/kyvora/issues)
[![Last Commit](https://img.shields.io/github/last-commit/hadzicni/kyvora)](https://github.com/hadzicni/kyvora/commits)

<br />

[Quick Start](#installation) ·
[Features](#features) ·
[Usage](#usage) ·
[Contributing](#contributing)

</div>

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Releases](#releases)
- [Build and Deployment](#build-and-deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [Contact](#contact)
- [License](#license)

## Overview

Kyvora is an open-source Homelab Control Plane for managing self-hosted infrastructure from one dashboard.

It currently provides:

- a Spring Boot backend API with JWT authentication
- a Next.js web dashboard with Auth.js login sessions
- server inventory management with CRUD, search, filters, pagination, and detail pages
- pull-based agent connectivity tracking
- latest host facts retrieved from configured agents
- persistent audit logging for infrastructure changes
- dashboard summary metrics
- OpenAPI/Swagger documentation
- an initial Go-based Kyvora agent

Kyvora is built as a monorepo with a modular backend, a modern web UI, and a lightweight agent foundation.

## Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| Web Auth | Auth.js / NextAuth |
| Backend | Java 21, Spring Boot 4 |
| API Auth | JWT access tokens, refresh tokens |
| Database | PostgreSQL |
| Migrations | Flyway |
| Backend Persistence | Spring Data JPA |
| Agent | Go |
| Testing | JUnit, Spring Boot Test, Go test, ESLint |
| CI/CD | GitHub Actions |
| Local Infrastructure | Docker / Docker Compose |

## Features

- Web dashboard with dark-mode-first UI
- Auth.js login session for the web app
- JWT-secured backend API
- Server Inventory CRUD
- Server search, filtering, pagination, and detail pages
- Pull-based agent connectivity tracking
- Latest host facts snapshot retrieved from configured agents
- Initial Go agent with a secured local HTTP API
- Dashboard summary metrics
- Persistent audit logs with recent activity
- OpenAPI/Swagger API documentation
- GitHub Actions CI for web, API, and agent checks

## Prerequisites

- Git
- Node.js 24+
- npm
- Java 21
- Gradle
- Go 1.26+
- Docker or a reachable PostgreSQL database

## Installation

### Docker Quick Start

Kyvora ships separate Docker Compose files for local development and production
deployment. The Go agent is not containerized.

For local development, build Web and API images from source:

```bash
cp .env.dev.example .env
```

Edit `.env`, change every `change-me` value, then start:

```bash
docker compose -f docker-compose.dev.yml up --build
```

For production, use the published GHCR images:

```bash
curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/install.sh | bash
```

From a cloned repository, you can also run:

```bash
bash scripts/install.sh
```

The installer creates `.env` from `.env.prod.example` if needed, generates
production secrets, and starts the production stack. It leaves an existing
`.env` unchanged. When run through `curl`, it creates `./kyvora` and downloads
the production Compose files from GitHub.

Optional production values can be passed as environment variables:

```bash
curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/install.sh | \
  NEXTAUTH_URL=https://kyvora.example.com \
  KYVORA_VERSION=0.2.1 \
  KYVORA_INSTALL_REF=v0.2.1 \
  bash
```

Open http://localhost:3000.

On the first startup with a fresh database, the API creates
`admin@kyvora.local` automatically and prints a random temporary password once
in the API logs:

```bash
docker compose -f docker-compose.prod.yml logs api
```

Log in with those credentials and change the password when prompted.

Production Compose uses `ghcr.io/hadzicni/kyvora-api:${KYVORA_VERSION}` and
`ghcr.io/hadzicni/kyvora-web:${KYVORA_VERSION}`. The Compose setup derives the
internal JDBC and API URLs from simple `.env` values. The web container talks to
the API at `http://api:8080` inside Docker.
See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for details.

### 1. Clone the repository

```bash
git clone https://github.com/hadzicni/kyvora.git
cd kyvora
```

### 2. Install dependencies


```bash
npm install
```

### 3. Start PostgreSQL

Run PostgreSQL locally or on a reachable host. The backend expects a PostgreSQL database named `kyvora` by default.

Example with Docker:

```bash
docker run --name kyvora-postgres \
  -e POSTGRES_DB=kyvora \
  -e POSTGRES_USER=kyvora \
  -e POSTGRES_PASSWORD=kyvora \
  -p 5432:5432 \
  -d postgres:17-alpine
```

### 4. Start the project

#### Start the web dashboard

```bash
npm run dev:web
```

#### Start the API server

```bash
npm run dev:api
```

#### Start the Go agent

For local development only, start the Linux agent on a private interface, then
configure the agent base URL and shared secret for a server inventory entry in
the web UI:

```bash
KYVORA_AGENT_LISTEN_ADDRESS=127.0.0.1 \
KYVORA_AGENT_LISTEN_PORT=9187 \
KYVORA_AGENT_SHARED_SECRET=<shared-secret> \
npm run dev:agent
```

For service installation on Linux with systemd, use
[`apps/agent/README.md`](./apps/agent/README.md).

### Useful local URLs:

* Web dashboard: http://localhost:3000
* Login: http://localhost:3000/login
* API health: http://localhost:8080/actuator/health
* Swagger UI: http://localhost:8080/swagger-ui.html
* OpenAPI JSON: http://localhost:8080/v3/api-docs

On a fresh local database, the API creates the first admin automatically and
prints the generated temporary password in the API startup logs. The password is
shown only once; delete and recreate the database if you need a new first-admin
bootstrap.

## Configuration

The backend API uses JWT Bearer authentication. Access tokens are short-lived
and refresh tokens are stored server-side as SHA-256 hashes.

Required backend secret:

```env
KYVORA_JWT_SECRET=replace-with-at-least-32-random-characters
```

Optional token lifetime settings:

```env
KYVORA_JWT_ACCESS_TOKEN_TTL_SECONDS=900
KYVORA_REFRESH_TOKEN_TTL_SECONDS=2592000
```

When the users table is empty, the API bootstraps the first admin user with the
email `admin@kyvora.local`, a generated temporary password, and a required
password change on first login. Existing databases are left unchanged.

Local web Auth.js configuration:

```env
NEXTAUTH_SECRET=
# Generate a local secret with: npx auth secret
NEXTAUTH_URL=http://localhost:3000
KYVORA_API_URL=http://localhost:8080
```

The web app uses Auth.js session cookies plus server-side proxy routes to talk
to the backend. Browser code should keep calling local `/api/...` routes and
must not store backend JWTs.

Operational settings such as the instance name, instance description, agent
offline threshold, agent offline check interval, and local UI hints are stored
in the database and can be changed from the Settings page. The offline
threshold applies dynamically; scheduler interval changes are stored but require
an API restart before the scheduler uses the new interval.

Secrets remain environment variables or secure runtime configuration. Do not
store `KYVORA_JWT_SECRET`, database credentials, Auth.js secrets, or agent
shared secrets in system settings. Agent shared secrets are accepted when
configuring the connection and are never returned by API responses.

Local development agent configuration:

```env
KYVORA_AGENT_LISTEN_ADDRESS=127.0.0.1
KYVORA_AGENT_LISTEN_PORT=9187
KYVORA_AGENT_SHARED_SECRET=<shared-secret>
```

Create or register a server from the web dashboard, then configure an agent
connection with the agent base URL and shared secret. Do not commit shared
secrets or store them in `NEXT_PUBLIC_*` variables.

The Kyvora API pulls the latest host inventory snapshot from the agent when
facts are available. This includes basic operating system, architecture, CPU,
memory, disk, uptime, IP address, and agent version information. These facts
are latest snapshots, not metrics history. The agent does not collect secrets,
environment variables, process lists, usernames, or file contents. Collection
is supported on Linux only.

## Usage

Describe the main use cases or commands here.

```bash
# Example
npm run start
```

Example workflow:

1. Start the application
2. Provide data or input
3. Review the result

Login example:

```bash
curl -s http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@kyvora.local","password":"<temporary-password-from-api-logs>"}'
```

Use the returned access token with protected API endpoints:

```bash
curl http://localhost:8080/api/v1/servers \
  -H "Authorization: Bearer <token>"
```

When the access token expires, call `/api/v1/auth/refresh` with the refresh
token from the login response. Refresh tokens are rotated on use; store the
new refresh token returned by the refresh response.

The first admin temporary password is generated per fresh database and is shown
only once in the API startup logs.

## Agent Pull Model

Kyvora uses a pull-based agent architecture. The agent exposes a secured local
HTTP API, and the Kyvora API calls that agent API to retrieve health,
capabilities, system information, metrics, and service information.

Kyvora Agent officially supports Linux with systemd only. Windows, macOS,
launchd, Windows Service, and other service managers are not supported.

Supported initial agent endpoints:

```text
GET /health
GET /capabilities
GET /system
GET /metrics
GET /services
POST /actions/{actionName}
X-Kyvora-Agent-Secret: <shared-secret>
```

The agent does not initiate registration, status, or metrics writes to the
Kyvora API. The backend records `lastPullAt`, `lastSuccessfulPullAt`,
`lastPullError`, capabilities, and agent status from pull attempts.

1. Install the agent as a Linux systemd service, or run it locally for
   development with `KYVORA_AGENT_LISTEN_ADDRESS`,
   `KYVORA_AGENT_LISTEN_PORT`, and `KYVORA_AGENT_SHARED_SECRET`.
2. Log in to the web dashboard.
3. Create or select an existing server inventory entry.
4. Configure the agent connection with its base URL and shared secret.
5. Use Pull now to test the connection and update operational data.

Successful pulls update the assigned agent status and the linked server status
and last-seen timestamp. Failed pulls record the error and mark the agent and
linked server offline or unreachable without breaking unrelated application
functionality.

The agent port is sensitive. Bind it to localhost or a trusted private network
interface by default, and do not expose it publicly without stronger transport
security such as mTLS and network policy.

Connected agents can be decommissioned from the server detail Agent Setup
section or the Agents page. Decommissioning disables pulls and unlinks the
agent from the server without deleting the server inventory record.

Activity tracks lifecycle transitions such as configuration, manual pulls,
pull failures, decommissioning, and offline detection. Shared secrets,
authorization headers, and cookies are never logged or returned in API
responses.

## Development

Useful commands:

```bash
npm run dev:web
npm run dev:agent

npm run release:check

npm run lint -w apps/web
npm run build -w apps/web

gradle -p apps/api test

cd apps/agent
go test ./...
```

## Releases

Kyvora uses a single product version for the full monorepo. The root `VERSION`
file is the source of truth, versions follow SemVer, and release tags use
`v<version>`, for example `v0.1.0`.

Release metadata must stay aligned:

- `VERSION`
- `CHANGELOG.md`
- Git tag

Useful commands:

```bash
npm run release:prepare -- 0.1.0
npm run release:check
```

See [docs/RELEASE.md](./docs/RELEASE.md) for the full release checklist,
hotfix flow, and tag workflow.

## Build and Deployment

Describe the build process and the path to the target environment.

Example:

```bash
npm run build
```

If relevant, include:

- target environment
- release process
- container or cloud deployment
- manual follow-up steps

## Security

If you discover a security vulnerability, please do not open a public issue.

Instead, report it privately:

- Email: nikolahadzic7@icloud.com
- Maintainer: Nikola Hadzic

We will investigate and provide updates as quickly as possible.

### Supported Versions

| Version          | Supported |
| ---------------- | --------- |
| Latest           | Yes       |
| Earlier versions | No        |

## Contributing

Contributions are welcome. A possible workflow:

1. Create a fork
2. Create a feature branch
3. Implement your changes
4. Run tests and linting
5. Open a pull request

If the project has its own rules, link to `CONTRIBUTING.md` here.

## Maintainers

<!-- Duplicate the <td> block for additional maintainers -->
<table>
	<tr>
		<td align="center" width="180">
			<a href="https://github.com/hadzicni">
			    <img src="https://github.com/hadzicni.png?size=160" width="96" height="96" alt="hadzicni" />
			    <br />
			    <strong>Nikola Hadzic</strong>
			</a>
			<br />
			Core maintainer
		</td>
	</tr>
</table>

## Contact

- Contact person: Nikola Hadzic
- Email: nikolahadzic7@icloud.com
- Project page: https://github.com/hadzicni/kyvora

## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for details.
