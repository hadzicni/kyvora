# Kyvora Releases

Kyvora uses one product version for the full monorepo. The same version covers
the web dashboard, Spring Boot API, Go agent, documentation, and future release
artifacts such as Docker images.

## Philosophy

Releases should be boring, repeatable, and easy to verify. The repository keeps
the release source of truth in plain files and uses GitHub Actions to validate
and publish GitHub Releases from tags.

Kyvora does not use per-app versions yet. A single Kyvora version should answer
which web, API, and agent code shipped together.

## Versioning Rules

- `VERSION` is the source of truth for the Kyvora product version.
- Versions follow SemVer: `MAJOR.MINOR.PATCH`, for example `0.1.0`.
- Git release tags must be `v<version>`, for example `v0.1.0`.
- `VERSION`, `CHANGELOG.md`, and the Git tag must match.
- Future Docker images should use the same version tag.

## Pre-Release Checks

Run these from the repository root:

```bash
npm run release:check
gradle -p apps/api test
npm run lint -w apps/web
npm run build -w apps/web
(cd apps/agent && go test ./...)
```

## Release Checklist

1. Review merged changes and decide the next SemVer version.
2. Move relevant `CHANGELOG.md` entries from `Unreleased` into a versioned
   section such as `## [0.1.0] - 2026-06-08`.
3. Prepare the release metadata:

   ```bash
   npm run release:prepare -- 0.1.0
   ```

4. Run the pre-release checks.
5. Commit the release prep:

   ```bash
   git add VERSION CHANGELOG.md
   git commit -m "chore(release): prepare v0.1.0"
   ```

6. Create and push the tag:

   ```bash
   git tag v0.1.0
   git push origin main v0.1.0
   ```

7. Confirm the GitHub Actions release workflow passes and creates the GitHub
   Release.

## Creating a Release

Example release flow:

```bash
npm run release:prepare -- 0.1.0
npm run release:check
gradle -p apps/api test
npm run lint -w apps/web
npm run build -w apps/web
(cd apps/agent && go test ./...)
git add VERSION CHANGELOG.md
git commit -m "chore(release): prepare v0.1.0"
git tag v0.1.0
git push origin main v0.1.0
```

Do not create the tag until the release prep commit is ready. The release
workflow fails if the pushed tag does not match `VERSION` or if the changelog
does not contain the matching version section.

## Hotfixes

Hotfixes use the same process with a patch version bump.

1. Create a hotfix branch from the release branch or tag that needs the fix.
2. Apply the smallest safe fix.
3. Update `CHANGELOG.md` with a new patch section.
4. Run:

   ```bash
   npm run release:prepare -- 0.1.1
   npm run release:check
   gradle -p apps/api test
   npm run lint -w apps/web
   npm run build -w apps/web
   (cd apps/agent && go test ./...)
   ```

5. Commit, tag, and push:

   ```bash
   git add VERSION CHANGELOG.md
   git commit -m "chore(release): prepare v0.1.1"
   git tag v0.1.1
   git push origin <hotfix-branch> v0.1.1
   ```

## Notes

- Do not publish Docker images in the release workflow yet.
- The Go agent version is part of the Kyvora release version. Its runtime
  environment variables remain unchanged.
- Keep release commits focused on `VERSION`, `CHANGELOG.md`, and any required
  release metadata.
