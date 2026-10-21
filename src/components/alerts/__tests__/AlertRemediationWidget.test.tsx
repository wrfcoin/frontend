/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { RemediationAlert } from '../../../hooks/useActiveAlerts';

const mockUseActiveAlerts = jest.fn();

await jest.unstable_mockModule('../../../hooks/useActiveAlerts', () => ({
  useActiveAlerts: mockUseActiveAlerts,
}));

const { default: AlertRemediationWidget } = await import('../AlertRemediationWidget');

const firingAlerts: RemediationAlert[] = [
  {
    id: 'alert-1',
    alertName: 'Bridge Latency Critical',
    severity: 'SEV1',
    status: 'firing',
    summary: 'Latency exceeds threshold',
    startedAt: new Date().toISOString(),
  },
  {
    id: 'alert-2',
    alertName: 'Cache Miss Rate',
    severity: 'SEV3',
    status: 'firing',
    summary: 'Cache miss rate elevated',
    startedAt: new Date().toISOString(),
  },
];

describe('AlertRemediationWidget', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows alert count and "Alerts" text when alerts exist', () => {
    mockUseActiveAlerts.mockReturnValue({
      alerts: firingAlerts,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <AlertRemediationWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByTestId('alert-remediation-widget')).toBeInTheDocument();
  });

  it('renders a "View All" link', () => {
    mockUseActiveAlerts.mockReturnValue({
      alerts: firingAlerts,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <AlertRemediationWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('shows "Remediation API unavailable" text when error is set', () => {
    mockUseActiveAlerts.mockReturnValue({
      alerts: [],
      loading: false,
      error: 'Remediation API unavailable',
      refetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <AlertRemediationWidget />
      </MemoryRouter>,
    );

    expect(screen.getByText('Remediation API unavailable')).toBeInTheDocument();
  });
});
