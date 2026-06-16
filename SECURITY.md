# Security Policy

Kyvora includes security-sensitive functionality such as authentication, RBAC,
refresh tokens, agents, monitoring, and infrastructure operations. Please report
vulnerabilities responsibly so they can be handled without exposing users or
deployments to unnecessary risk.

## Supported versions

Kyvora is under active development. Security fixes are expected to target the
main development line unless a maintained release branch is documented in the
future.

## Reporting a vulnerability

Do not open public GitHub issues for security vulnerabilities.

Report suspected vulnerabilities privately:

- Email:
  - nikolahadzic7@icloud.com

If no private contact is available yet, avoid publishing exploit details. Open a
minimal public issue asking maintainers to add a private security contact, but
do not include vulnerability details in that issue.

## What to include in a report

Please include:

- A clear description of the vulnerability.
- Affected component or area, such as API, web dashboard, agent, auth,
  RBAC, token handling, audit logging, monitoring, or deployment configuration.
- Steps to reproduce, proof of concept, or relevant logs where safe to share.
- Expected impact and any known prerequisites.
- Suggested remediation, if known.

Do not include secrets, production credentials, private keys, or personal data in
the report.

## Coordinated disclosure

Please allow maintainers reasonable time to investigate, patch, test, and
release a fix before public disclosure. Maintainers should acknowledge reports,
keep reporters informed when practical, and credit reporters if requested and
appropriate.

## Security expectations

- Treat authentication, authorization, agents, tokens, audit logs, and
  infrastructure operations as high-risk areas.
- Do not weaken security controls for convenience.
- Do not commit secrets or credentials.
- Do not expose server-side credentials to browser code.
- Validate input and handle expected failure cases explicitly.
- Prefer secure defaults and clear operational documentation.
