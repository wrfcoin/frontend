# Frontend Contributor Conventions

Canonical rules enforced by CI. Follow these when adding or modifying frontend code.

## 1. File Naming & Case-Collision Prevention

**Rule:** All component files use **PascalCase** (`MyComponent.jsx`). No two files may
differ only by casing (e.g. `FooCard.jsx` and `fooCard.jsx` are forbidden).

**Why:** Case-insensitive filesystems (macOS, Windows) silently merge differently-cased
paths, causing import failures that only appear on Linux CI.

**CI enforcement:** The `ci-readiness.yml` workflow runs a case-collision check on every
PR. It lowercases all paths under `frontend/src/` and fails if any duplicates appear.

## 2. Route Deprecation Pattern

**Rule:** When retiring a route, use the `DeprecatedRedirect` component instead of bare
`<Navigate>`.

```jsx
// Good
import DeprecatedRedirect from './components/common/DeprecatedRedirect';
<Route path="/old-path" element={<DeprecatedRedirect to="/new-path" />} />

// Bad
<Route path="/old-path" element={<Navigate to="/new-path" replace />} />
```

**Why:** `DeprecatedRedirect` emits a `wrfcoin:deprecated-route` custom DOM event with
`{ from, to, timestamp }`, enabling analytics without coupling to a specific SDK. It also
logs in dev mode for debugging.

**Canonical redirects** are documented in `frontend/src/ROUTE_OWNERSHIP.md`.

## 3. Design System Imports

**Rule:** Import UI primitives from `@/components/DesignSystem`, not from `common/`,
`ui/`, or direct `@mui/material/*` paths.

```jsx
// Good
import { WrfButton, WrfCard, WrfInput } from '../DesignSystem';

// Bad
import Button from '../common/Button';
import { Button } from '@mui/material/Button';
```

**Available wrappers:** `WrfButton`, `WrfCard`, `WrfInput`, `WrfSelect`, `WrfModal`,
`WrfGrid`, `WrfContainer`. See `frontend/src/components/DesignSystem/index.js` for the
full export list.

**CI enforcement:** The ESLint rule `wrfcoin-design/no-bootstrap-classes` runs as `error`
on all files changed in a PR. Bootstrap compound-class patterns (`btn btn-primary`,
`form-control`, `navbar`, etc.) will block merge.

See `frontend/docs/BOOTSTRAP_MIGRATION.md` for the full migration mapping table.

## 4. Bootstrap Class Policy

**Rule:** No new Bootstrap CSS framework classes in any file touched by a PR.

The ESLint custom plugin detects Bootstrap's characteristic compound-class patterns. Custom
CSS class names (`status-card`, `connect-btn`) are not flagged.

**Tracking:** Run `node frontend/scripts/design-system-report.mjs` to see current
migration metrics. Use `--json` for CI-consumable output or `--fail-threshold N` to gate
on a maximum count.
