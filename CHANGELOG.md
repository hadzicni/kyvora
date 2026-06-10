## [0.1.0] - 2026-06-08

### Added

* Initial release of the project with basic features and functionalities.

## [0.1.1] - 2026-06-08

### Added

* Added Help page with release information, agent setup guidance, server status explanations, and activity/audit notes.

## [0.1.2] - 2026-06-09

### Added

* Added user management for creating, managing, and resetting users.
* Added automatic generation of temporary passwords for new or reset users.
* Added password-change requirement after password resets.
* Added database-backed system settings.
* Added agent detail page in the web interface.
* Added backend availability gate to improve handling when the API is unavailable.
* Added agent host facts reporting.
* Added support for fetching the agent version from the backend.

### Changed

* Improved the web sidebar with collapsible behavior.
* Improved agent decommissioning by supporting connected agents.
* Removed the development hint from the backend health gate.

## [0.1.3] - 2026-06-09

### Added

* Added interface translations to the web application.
* Added role-based permission enforcement for authenticated users.
* Added local font support for the web application.
* Added local font support for the marketing website.

### Changed

* Improved the dashboard layout.
* Improved sidebar behavior so the collapsed state is preserved after navigation.
* Updated global font handling to use local font files.

## [0.2.0] - 2026-06-10

### Added
* Added Docker Compose setup for PostgreSQL, API, and web.
* Added Dockerfiles for the Spring Boot API and Next.js web app.
* Added production API configuration for Docker deployments.
* Added deployment documentation and Docker helper scripts.
* Added automatic first-admin creation with a generated one-time password.

### Changed
* Simplified the Docker `.env` setup by deriving internal service configuration in Compose.
* Updated web server-side API configuration to support Docker-internal API URLs.

### Fixed
* Fixed Docker web build issues for the Next.js monorepo setup.
* Fixed the Docker web runtime error caused by importing full Auth.js config into middleware.
