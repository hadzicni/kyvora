# Kyvora Agent Instructions

Kyvora is an open-source Homelab Control Plane for managing, monitoring, and operating self-hosted infrastructure from one modern dashboard.

This repository is a production-grade monorepo. Treat all changes as long-term maintainable open-source project work, not prototype code.

## Project Goals

Kyvora should feel modern, professional, reliable, secure, and scalable.

Product inspirations:
- Proxmox
- Portainer
- Rancher
- NetBox
- Grafana
- Coolify
- Vercel
- Linear

Optimize for:
- Maintainability
- Scalability
- Developer experience
- Security
- Type safety
- Testability
- Performance
- Long-term evolution

Avoid:
- Quick hacks
- Prototype architecture
- Tutorial-style shortcuts
- Unnecessary abstractions
- Large rewrites without explicit request

## Repository Structure

```text
apps/
├── web      # Next.js frontend
├── api      # Spring Boot backend
└── agent    # Go agent, future work

packages/
├── ui
├── types
├── config
└── shared

docs/
├── architecture
├── api
├── deployment
└── development

infrastructure/
.github/
````

## Tech Stack

Frontend:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* TanStack Query
* Zustand
* React Hook Form
* Zod

Backend:

* Java 21
* Gradle Groovy
* Spring Boot 4
* Spring Security
* Spring Data JPA
* PostgreSQL
* Flyway
* OpenAPI / Swagger

Agent:

* Go

Infrastructure:

* Docker
* Docker Compose
* GitHub Actions

## Architecture Rules

Kyvora uses a modular monolith architecture.

Do not introduce microservices unless explicitly requested and justified.

Follow:

* Domain Driven Design
* Clean Architecture
* SOLID principles
* Feature-based modularization
* Separation of concerns

Backend rules:

* Controllers must stay thin.
* Business logic belongs in services/domain layer.
* Use constructor injection only.
* Use DTOs for request/response models.
* Never expose JPA entities directly.
* Use repositories only for persistence access.
* Add validation for user input.
* Add error handling for expected failure cases.
* Use Flyway for database schema changes.
* Never edit an already-applied Flyway migration. Add a new versioned migration instead.
* Keep transaction boundaries explicit where needed.

Frontend rules:

* Dark mode first.
* UI should feel close to Vercel, Linear, GitHub, Railway, or Coolify.
* Use existing shadcn/ui primitives where possible.
* Components should be reusable and composable.
* Add loading, empty, and error states for data-driven UI.
* Use TanStack Query for server state.
* Use React Hook Form and Zod for forms.
* Do not expose backend credentials in browser code.
* Browser should call Next.js proxy routes for authenticated backend calls until proper auth exists.

Security rules:

* Security is mandatory, never optional.
* Do not disable security globally.
* Keep `/actuator/health` and `/actuator/info` public for local checks.
* Keep API endpoints authenticated unless explicitly told otherwise.
* Do not commit secrets.
* Do not put passwords in `NEXT_PUBLIC_*` variables.
* Local development may use `user/dev-password`, but production credentials must come from environment variables.
* JWT, refresh tokens, and RBAC are planned but should not be implemented unless explicitly requested.

## Current Functional Areas

Implemented or in progress:

* Server Inventory backend API
* PostgreSQL + Flyway migrations
* Server Inventory pagination/filtering/validation
* Next.js dashboard shell
* Server Inventory list UI
* Next.js API proxy for server inventory
* Create Server dialog
* GitHub Actions CI

Server Inventory fields:

* id
* name
* hostname
* ipAddress
* description
* tags
* operatingSystem
* status
* lastSeenAt
* createdAt
* updatedAt

Allowed statuses:

* ONLINE
* OFFLINE
* UNKNOWN

Primary API:

* GET `/api/v1/servers`
* POST `/api/v1/servers`
* GET `/api/v1/servers/{id}`
* PUT `/api/v1/servers/{id}`
* DELETE `/api/v1/servers/{id}`

Frontend proxy:

* GET `/api/server-inventory`
* POST `/api/server-inventory`

## Local Development

Typical commands from repo root:

```bash
npm install
npm run dev:web
npm run lint -w apps/web
npm run build -w apps/web
gradle -p apps/api test
```

Run backend:

```bash
cd apps/api
gradle bootRun
```

Run frontend:

```bash
npm run dev:web
```

Expected local URLs:

* Web: `http://localhost:3000`
* API health: `http://localhost:8080/actuator/health`
* Swagger/OpenAPI: check README after OpenAPI setup
* PostgreSQL: configured via `apps/api/src/main/resources/application.yml`

Local web proxy env example:

```env
KYVORA_API_URL=http://localhost:8080
API_USERNAME=user
API_PASSWORD=dev-password
```

Backend dev credentials default to:

```env
KYVORA_SECURITY_USERNAME=user
KYVORA_SECURITY_PASSWORD=dev-password
```

## Validation Before Finishing Work

Before reporting a task as complete, run relevant checks.

For frontend changes:

```bash
npm run lint -w apps/web
npm run build -w apps/web
```

For backend changes:

```bash
gradle -p apps/api test
```

For full-stack changes:

```bash
npm run lint -w apps/web
npm run build -w apps/web
gradle -p apps/api test
```

If a command cannot be run, explicitly say why.

## Git / Commit Guidance

Do not commit automatically unless explicitly asked.

Before suggesting a commit:

* Show `git status --short`
* Mention any ignored local files that should not be committed, especially `.env.local`
* Keep commits focused and small
* Show commit message before committing, and ensure it follows the style below

Commit message style:

* `feat(api): ...`
* `feat(web): ...`
* `fix(api): ...`
* `fix(web): ...`
* `chore(dev): ...`
* `ci: ...`
* `docs: ...`

## Important Gotchas

* Do not edit existing Flyway migrations after they were applied. Add `V{next}__description.sql`.
* Do not use `NEXT_PUBLIC_API_PASSWORD` or `NEXT_PUBLIC_API_USERNAME`.
* Do not call the Spring API directly from browser code when credentials are needed. Use a Next.js route handler proxy.
* `apps/web/.env.local` must stay uncommitted.
* `apps/web/next-env.d.ts` should be committed.
* Avoid root-level generated files unless they are intentional.
* Do not add Docker volumes or local build outputs to Git.
* Keep API response DTOs aligned with frontend types.

## Preferred Work Style

When implementing a feature:

1. Inspect existing structure first.
2. Explain the intended architecture briefly.
3. Make the smallest production-quality change.
4. Reuse existing components and patterns.
5. Add or update tests where appropriate.
6. Run lint/build/test.
7. Summarize changed files and verification results.
