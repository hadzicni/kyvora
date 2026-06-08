# Contributing to Kyvora

Kyvora is a production-grade open-source infrastructure project for managing,
monitoring, and operating homelab and self-hosted systems. Contributions should
favor maintainability, security, type safety, testability, and clear operational
behavior over short-term shortcuts.

## Project scope

Kyvora is a centralized homelab control plane. Current and planned areas include
server inventory, agents, monitoring, authentication, RBAC, refresh tokens, audit
logging, and infrastructure operations.

Keep changes aligned with that scope. Avoid broad rewrites, speculative
abstractions, or unrelated feature work in the same pull request.

## Repository structure

```text
apps/
  web       Authenticated Kyvora dashboard app
  website   Public marketing website
  api       Spring Boot backend
  agent     Go agent

packages/
  ui        Shared UI package
  types     Shared TypeScript types
  config    Shared configuration
  shared    Shared utilities

docs/
  architecture
  api
  deployment
  development
```

## Prerequisites

- Node.js and npm
- Java 21
- Gradle
- Go
- Docker and Docker Compose for local infrastructure

## Local development

Install dependencies:

```bash
npm install
```

Run all workspace development scripts that are available:

```bash
npm run dev
```

Run specific services:

```bash
npm run dev:web
npm run dev:website
npm run dev:api
npm run dev:agent
```

Start or stop local database infrastructure:

```bash
npm run db:up
npm run db:down
npm run db:logs
```

## Running checks

Run all available workspace checks:

```bash
npm run lint
npm run build
npm run test
```

For backend tests:

```bash
gradle -p apps/api test
```

Prefer running the smallest relevant checks while developing, then run the full
relevant set before opening a pull request.

## Branching and commits

Use focused branches and keep commits small enough to review. Commit messages
should describe the affected area and outcome, for example:

```text
feat(api): add server inventory filtering
fix(web): handle empty server list
docs: update deployment guide
```

## Pull request expectations

- Describe what changed and why.
- Link related issues when available.
- Include screenshots or recordings for meaningful UI changes.
- Add or update tests for behavior changes.
- Document new configuration, operational behavior, or security implications.
- Keep unrelated formatting and refactors out of the pull request.

## Coding standards

Backend controllers must stay thin. Do not place business logic in controllers.
Use constructor injection, DTOs for request and response models, validation for
user input, service-layer business logic, explicit transaction boundaries where
needed, and repositories only for persistence access.

Frontend code should use TypeScript, reusable components, accessible markup,
responsive design, and shadcn/ui primitives where appropriate. Data-driven UI
should include loading, empty, and error states.

Use existing project patterns before introducing new abstractions.

## Security-sensitive changes

Security is mandatory for authentication, RBAC, agents, tokens, audit logging,
and infrastructure operations. Do not weaken authorization, validation, secret
handling, logging protections, or transport assumptions without a clear review.

Do not commit secrets. Do not expose backend credentials in browser code. Report
suspected vulnerabilities privately using the process in `SECURITY.md`.
