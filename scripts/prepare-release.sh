#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.1.0" >&2
  exit 1
fi

version="$1"
semver_regex='^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'

if [[ ! "$version" =~ $semver_regex ]]; then
  echo "ERROR: version must be SemVer-ish, for example 0.1.0. Found: $version" >&2
  exit 1
fi

if [ ! -f CHANGELOG.md ]; then
  echo "ERROR: CHANGELOG.md is missing." >&2
  exit 1
fi

if ! grep -Eq "^## \[?${version//./\\.}\]?([[:space:]]|$)" CHANGELOG.md; then
  echo "ERROR: CHANGELOG.md does not contain a section for $version." >&2
  echo "Add a heading like: ## [$version] - YYYY-MM-DD" >&2
  exit 1
fi

printf '%s\n' "$version" > VERSION

echo "Prepared VERSION for Kyvora $version."
echo
echo "Next manual steps:"
echo "  npm run release:check"
echo "  gradle -p apps/api test"
echo "  npm run lint -w apps/web"
echo "  npm run build -w apps/web"
echo "  (cd apps/agent && go test ./...)"
echo "  git add VERSION CHANGELOG.md"
echo "  git commit -m \"chore(release): prepare v$version\""
echo "  git tag v$version"
echo "  git push origin main v$version"
