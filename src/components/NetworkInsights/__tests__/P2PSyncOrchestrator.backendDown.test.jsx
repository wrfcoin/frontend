/** @jest-environment jsdom */
/**
 * frontend#372: when the P2P orchestration API is down, the operator sees
 * why (the real error in the health card and an "API unavailable" badge), and
 * nothing is invented in its place (frontend#329/#332): no failure-cause
 * cards, no peers, no score.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Preflight checks are unrelated to this path; keep them inert.
await jest.unstable_mockModule('../../../hooks/usePreflightChecks', () => ({
  usePreflightChecks: () => [],
}));

const { default: P2PSyncOrchestrator } = await import('../P2PSyncOrchestrator');

describe('P2PSyncOrchestrator when the orchestration backend is down', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows the real error and the unavailable badge, and invents nothing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network offline'));

    render(<P2PSyncOrchestrator />);

    await waitFor(() => {
      expect(screen.getByText('API unavailable')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'P2P orchestration API unavailable (network offline). No telemetry is shown in its place.',
      ),
    ).toBeInTheDocument();
    // No failure-cause card and no fabricated cause.
    expect(screen.queryByText('backend_unavailable')).toBeNull();
    expect(screen.queryByText(/^Remediation:/)).toBeNull();
  });
});
