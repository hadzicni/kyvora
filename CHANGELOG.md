## [0.1.0] - 2026-06-08

### Added

- Initial release of the project with basic features and functionalities.

## [0.1.1] - 2026-06-08

### Added

- Added Help page with release information, agent setup guidance, server status explanations, and activity/audit notes.

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
