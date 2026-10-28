import { describe, expect, it } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

// Regression: body.dashboard-v2 holds the DARK palette for --text-primary / --text-secondary /
// --bg-secondary, and the light override used to match only body.wallet-v2, so every
// dashboard-v2 page in the light theme got light-on-light headers (PageTitle on /pop).
const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/theme.css'), 'utf8');

describe('theme.css light override', () => {
  it('applies the light palette to dashboard-v2 outside dark mode', () => {
    expect(css).toMatch(/body\.wallet-v2:not\(\.dark-mode\),\s*body\.dashboard-v2:not\(\.dark-mode\)\s*\{/);
  });

  it('keeps the dark palette selector unchanged', () => {
    expect(css).toMatch(/body\.dashboard-v2,\s*body\.dark-mode\.dashboard-v2,\s*body\.wallet-v2,\s*body\.dark-mode\.wallet-v2\s*\{/);
  });
});
