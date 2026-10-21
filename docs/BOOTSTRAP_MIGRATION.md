# Bootstrap-to-MUI/DesignSystem Migration Guide

## Overview

WRFCoin is migrating from Bootstrap-style CSS class patterns to MUI-based
DesignSystem (`Wrf*`) components. This document provides the migration mapping,
contributor workflow, and CI enforcement details.

## Quick Reference: Component Mapping

| Bootstrap Pattern | DesignSystem / MUI Replacement |
|---|---|
| `className="btn btn-primary"` | `<WrfButton variant="primary">` |
| `className="btn btn-secondary"` | `<WrfButton variant="secondary">` |
| `className="btn btn-outline-*"` | `<WrfButton variant="outline">` |
| `className="btn btn-danger"` | `<WrfButton variant="danger">` |
| `className="btn btn-sm"` | `<WrfButton size="sm">` |
| `className="btn btn-lg"` | `<WrfButton size="lg">` |
| `className="card"` | `<WrfCard>` |
| `className="card-header"` | `<WrfCard headerTitle="...">` |
| `className="card-body"` | _(automatic - WrfCard wraps children)_ |
| `className="card-footer"` | `<WrfCard footer={...}>` |
| `className="modal"` | `<WrfModal>` |
| `className="form-control"` (input) | `<WrfInput>` |
| `className="form-control"` (select) | `<WrfSelect options={[...]}>` |
| `className="alert alert-success"` | `<WrfAlert severity="success">` |
| `className="alert alert-danger"` | `<WrfAlert severity="error">` |
| `className="alert alert-warning"` | `<WrfAlert severity="warning">` |
| `className="alert alert-info"` | `<WrfAlert severity="info">` |
| `className="badge"` | `<WrfBadge>` |
| `className="container"` | `<WrfContainer>` or MUI `<Container>` |
| `className="row"` | `<WrfGrid container spacing={2}>` or MUI `<Grid container>` |
| `className="col-md-6"` | `<WrfGrid size={{ xs: 12, md: 6 }}>` |
| `className="col-lg-4"` | `<WrfGrid size={{ xs: 12, lg: 4 }}>` |
| `className="dropdown"` | `<WrfSelect>` or MUI `<Menu>` |
| `className="navbar"` | MUI `<AppBar>` / `<Toolbar>` |
| `className="nav-link"` | MUI `<Tab>` or `<ListItemButton>` |

## Bootstrap Utility Class Mapping

| Bootstrap Utility | MUI `sx` Prop Equivalent |
|---|---|
| `d-flex` | `sx={{ display: 'flex' }}` |
| `d-none` | `sx={{ display: 'none' }}` |
| `justify-content-between` | `sx={{ justifyContent: 'space-between' }}` |
| `align-items-center` | `sx={{ alignItems: 'center' }}` |
| `text-center` | `sx={{ textAlign: 'center' }}` |
| `mb-3` | `sx={{ mb: 3 }}` |
| `mt-2` | `sx={{ mt: 2 }}` |
| `p-3` | `sx={{ p: 3 }}` |
| `bg-dark` | `sx={{ bgcolor: 'background.paper' }}` |
| `rounded` | `sx={{ borderRadius: 1 }}` |

## Import Pattern

Always import from `@/components/DesignSystem` (or relative `../DesignSystem`):

```jsx
import { WrfButton, WrfCard, WrfInput, WrfAlert, WrfBadge } from '../DesignSystem';
```

Do **not** import directly from `@mui/material/*` for components that have
`Wrf*` wrappers. The wrappers apply consistent theming and design tokens.

For layout (Grid, Container, Box, Stack), import directly from MUI:
```jsx
import Grid from '@mui/material/Grid2';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
```

## Contributor Workflow

### When editing an existing file

1. Check if the file uses Bootstrap class patterns (the ESLint rule will warn you)
2. If the file is in your PR's changeset, you **must** migrate Bootstrap usage
   before the PR can merge (CI enforcement is active on changed files)
3. Use the mapping table above to convert patterns
4. Run `npm run report:design-system` to verify progress

### When creating a new file

- Use `Wrf*` DesignSystem components exclusively
- Never introduce Bootstrap class names in new code

### Checking your progress

```bash
# Quick summary
npm run report:design-system

# Detailed per-file breakdown
npm run report:design-system:verbose

# Machine-readable JSON (for scripts/CI)
node scripts/design-system-report.mjs --json

# Fail if Bootstrap count exceeds threshold
node scripts/design-system-report.mjs --fail-threshold 240
```

## CI Gate Behavior

### ESLint Rule: `wrfcoin-design/no-bootstrap-classes`

- **Baseline behavior:** `warn` - existing Bootstrap usage produces warnings
  but does not fail the build
- **Changed-file enforcement:** The `pr-checks.yml` workflow runs a separate
  step that re-lints only files changed in the PR with the rule set to `error`.
  If any changed file contains Bootstrap class patterns, the PR check fails.

This means:
- Existing un-migrated files continue to build and lint successfully
- Any file you touch in a PR must be free of Bootstrap classes before merge
- Net-new files must never introduce Bootstrap patterns

### Design System Report CI

The `design-system-report.mjs` script supports a `--fail-threshold` flag. This
can be added to CI workflows to ensure Bootstrap file count does not regress:

```yaml
- name: Design system regression check
  run: node scripts/design-system-report.mjs --fail-threshold 240
```

## Available DesignSystem Components

| Component | Props | Replaces |
|---|---|---|
| `WrfButton` | variant, size, loading, disabled | Bootstrap `btn` |
| `WrfCard` | variant, headerTitle, headerAction, footer, noPadding | Bootstrap `card` |
| `WrfInput` | label, helperText, error, prefixIcon, suffixIcon | Bootstrap `form-control` |
| `WrfSelect` | label, options, helperText, error | Bootstrap `dropdown` / `form-control` |
| `WrfAlert` | severity (success/error/warning/info) | Bootstrap `alert` |
| `WrfBadge` | color | Bootstrap `badge` |
| `WrfModal` | open, onClose, title | Bootstrap `modal` |
| `WrfTabs` | items, value, onChange | Bootstrap `nav-tabs` |
| `WrfSkeleton` | variant, width, height | Loading placeholders |
| `WrfTooltip` | title, placement | Tooltips |
| `WrfAvatar` | src, alt, size | User avatars |
| `WrfGrid` | container, spacing, size | Bootstrap `row` / `col-*` |
| `WrfContainer` | maxWidth | Bootstrap `container` |
| `WrfStatCard` | title, value, trend | Stat display cards |
| `WrfEmptyState` | icon, title, description, action | Empty state views |
| `WrfDataTable` | columns, rows, pagination | Data tables |

## Common Gotchas

1. **Card structure changes:** Bootstrap cards use `card` > `card-header` > `card-body` nesting.
   WrfCard uses props: `<WrfCard headerTitle="Title">content</WrfCard>`. No nested divs needed.

2. **Button variants differ:** Bootstrap has `btn-success`, `btn-warning`, `btn-info`.
   WrfButton maps these to `primary` (or use `<WrfButton>` with `color` on the underlying MUI).

3. **Grid system:** Bootstrap uses `row` + `col-md-6`. MUI uses `<Grid container>` + `<Grid size={{ md: 6 }}>`.
   The `size` prop replaces the old `xs`/`md`/`lg` individual props.

4. **Utility classes:** Don't use `className="d-flex justify-content-between"`. Instead use
   `<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>` or `<Stack direction="row">`.
