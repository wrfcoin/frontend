# Contributing

Read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
For vulnerabilities, use the private [security reporting policy](SECURITY.md).

## Build and checks

Use Node.js 20+ and npm 10+, as in the README and CI. From the repository root:

```sh
npm ci
npx tsc --noEmit
npx tsc -p tsconfig.test.json
npm test -- --maxWorkers=2
npm run build
```

Use `npm run dev` for a local preview. Follow the existing design system for UI changes and include screenshots when behavior or layout changes.

## Branch and pull request flow

1. Search existing issues and PRs before starting work.
2. Create a focused branch from current `main` (use a fork when available).
3. Add or update relevant tests for behavior changes and run the checks above.
4. Open a PR describing what changed, why, and the checks you ran. Include `Refs #N` for the relevant issue.
5. Address review feedback before a maintainer merges the PR.

Documentation-only changes require a rendered preview and link checks. State any checks you could not run; do not label skipped checks as passing. Keep secrets and personal information out of commits, logs, and screenshots.
