#!/usr/bin/env bash
set -euo pipefail

version_file="VERSION"
changelog_file="CHANGELOG.md"
semver_regex='^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'

if [ ! -f "$version_file" ]; then
  echo "ERROR: VERSION file is missing." >&2
  exit 1
fi

version="$(tr -d '[:space:]' < "$version_file")"

if [ -z "$version" ]; then
  echo "ERROR: VERSION is empty." >&2
  exit 1
fi

if [[ ! "$version" =~ $semver_regex ]]; then
  echo "ERROR: VERSION must be SemVer-ish, for example 0.1.0. Found: $version" >&2
  exit 1
fi

if [ ! -f "$changelog_file" ]; then
  echo "ERROR: CHANGELOG.md is missing." >&2
  exit 1
fi

if ! grep -Eq "^## \[?${version//./\\.}\]?([[:space:]]|$)" "$changelog_file"; then
  echo "ERROR: CHANGELOG.md must contain a section for VERSION $version." >&2
  echo "Expected a heading like: ## [$version] - YYYY-MM-DD" >&2
  exit 1
fi

echo "Release metadata is valid for $version."
