/** @jest-environment jsdom */
// The backend HSM signer is retired (owner ruling 2026-10-03, backend#1445):
// no /api/hsm, /api/audit, /api/compliance or /api/multisig route is mounted.
// The dashboard is a static notice and nothing in the frontend asks for them.
import React from 'react';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

const { default: HSMSecurityDashboard } = await import('../HSMSecurityDashboard');
const originalFetch = global.fetch;
afterEach(() => { cleanup(); global.fetch = originalFetch; });

function production(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (/__tests__|__mocks__|__fixtures__|stories/.test(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? production(path) : /\.[jt]sx?$/.test(path) && !/\.(test|spec)\./.test(path) ? [path] : [];
  });
}

it('renders a retired notice and makes no request, with no invented HSM state', async () => {
  global.fetch = jest.fn(async () => new Response('{}', { status: 200 }));
  render(<HSMSecurityDashboard />);
  expect(await screen.findByTestId('hsm-retired')).toBeInTheDocument();
  expect(screen.getByText(/retired/i)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d+(\.\d+)?\s*%|Connected|Compliant|YubiHSM|Thales/i);
  expect(global.fetch).not.toHaveBeenCalled();
});

it('has no HSM service and no production reference to the retired route families', () => {
  const root = join(process.cwd(), 'src');
  expect(existsSync(join(root, 'services/hsmService.ts'))).toBe(false);
  const offenders = production(root).filter(file =>
    /\/api\/(?:hsm|audit|compliance|multisig)\b|\bhsmService\b|\/(?:hsm|multisig)['"`/]/.test(readFileSync(file, 'utf8')));
  expect(offenders).toEqual([]);
});
