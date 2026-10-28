/** @jest-environment jsdom */
/**
 * frontend#354, codex round 20 on #390: weatherRoutes mounts
 * EnhancedEnvironmentalDataForm at /pop/submit, and its Submit Data handler
 * POSTed to /api/pop/submit, which the deployed API does not serve. Through the
 * real route: the control is disabled with the served-route explanation, and a
 * forced submission sends no POST and claims no outcome.
 */
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';

import weatherRoutes from '../weatherRoutes';
import { POP_ROUTES_SERVED, POP_SUBMISSION_UNAVAILABLE } from '../../services/popRoutes';

// Timing budget, not a behavior limit: measured 0.9-1.0 s for the slowest test (3.0-3.3 s on the issue's slower sample) in isolation on origin/main (2026-10-28),
// but 5 s+ (timed out) and 9.4 s for the suite in a full-suite run (frontend-archive#553), over Jest's 5000 ms default.
jest.setTimeout(30000);

beforeEach(() => {
  global.fetch = jest.fn(async () => new Response('Not found', { status: 404 }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

async function renderPopSubmit() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/pop/submit']}>
        <Suspense fallback={<div data-testid="route-loading" />}>
          <Routes>{weatherRoutes()}</Routes>
        </Suspense>
      </MemoryRouter>,
    );
  });
  return screen.findByRole('button', { name: /Submit Data/ }, { timeout: 10_000 });
}

describe('/pop/submit route', () => {
  it('the PoP routes are still unserved (this test guards the unserved state)', () => {
    expect(POP_ROUTES_SERVED).toBe(false);
  });

  it('Submit Data is disabled with the served-route explanation', async () => {
    const submit = await renderPopSubmit();
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('title')).toBe(POP_SUBMISSION_UNAVAILABLE);
    expect(screen.getByTestId('enhanced-pop-submission-unavailable').textContent).toBe(
      POP_SUBMISSION_UNAVAILABLE,
    );
  });

  it('a forced submission sends zero POSTs and claims no outcome', async () => {
    const submit = await renderPopSubmit();
    await act(async () => {
      fireEvent.submit(submit.closest('form'));
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    const posts = global.fetch.mock.calls.filter(
      ([input, init]) => init?.method === 'POST' || String(input).includes('/api/pop'),
    );
    expect(posts).toHaveLength(0);
    await waitFor(() =>
      expect(screen.getAllByText(POP_SUBMISSION_UNAVAILABLE).length).toBeGreaterThan(1),
    );
    expect(document.body.textContent).not.toMatch(/submitted successfully|Submission failed|Failed to submit/i);
  });
});
