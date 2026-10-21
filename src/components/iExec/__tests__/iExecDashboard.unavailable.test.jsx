/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false, integrations: true };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
jest.unstable_mockModule('../../common/PageWrapper', () => ({ default: ({ children }) => <>{children}</> }));
const { MemoryRouter, Routes } = await import('react-router-dom');
const { default: platformRoutes } = await import('../../../routes/platformRoutes');
const { default: Dashboard } = await import('../iExecDashboard');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.restoreAllMocks(); });
it('unsupported iExec status cannot mount capacity readings or controls', () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard />);
  expect(screen.getByText('iExec compute is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Active Workers')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});

it('the enabled preview is labelled before exposing illustrative status', async () => {
  flags.demoSurfaces = true;
  const request = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{"error":"unavailable"}', { status: 404 }));
  render(<Dashboard />);
  expect(screen.getByTestId('iexec-compute-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(request).toHaveBeenCalled());
});

it('the registered iExec route mounts the unavailable component rather than an intrinsic tag', async () => {
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"unavailable"}', { status: 404 }));
  render(<MemoryRouter initialEntries={['/integrations/iexec']}><React.Suspense fallback="Loading"><Routes>{platformRoutes()}</Routes></React.Suspense></MemoryRouter>);
  expect(await screen.findByText('iExec compute is unavailable')).toBeInTheDocument();
  expect(document.querySelector('iexecdashboard')).toBeNull();
  expect(request).not.toHaveBeenCalled();
});
