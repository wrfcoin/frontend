/**
 * @jest-environment jsdom
 */
/**
 * Tests for AlertCard component (Issue #256)
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertCard from '../AlertCard';
import type { RemediationAlert } from '../../../hooks/useActiveAlerts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeSev1Alert: () => RemediationAlert = () => ({
  id: 'alert-sev1',
  alertName: 'Bridge Latency Critical',
  severity: 'SEV1',
  status: 'firing',
  summary: 'Cross-chain bridge latency exceeds 30s threshold',
  startedAt: new Date(Date.now() - 120_000).toISOString(), // 2 minutes ago
});

const makeSev4Alert: () => RemediationAlert = () => ({
  id: 'alert-sev4',
  alertName: 'Cache Miss Rate Elevated',
  severity: 'SEV4',
  status: 'firing',
  summary: 'Redis cache miss rate above 15% for 10 minutes',
  startedAt: new Date(Date.now() - 600_000).toISOString(), // 10 minutes ago
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AlertCard', () => {
  it('renders alert name, severity chip text, and summary text', () => {
    const alert = makeSev1Alert();
    render(<AlertCard alert={alert} selected={false} onSelect={jest.fn()} />);

    expect(screen.getByText('Bridge Latency Critical')).toBeInTheDocument();
    expect(screen.getByText('SEV1')).toBeInTheDocument();
    expect(screen.getByText('Cross-chain bridge latency exceeds 30s threshold')).toBeInTheDocument();
  });

  it('calls onSelect with the alert id when clicked', () => {
    const alert = makeSev1Alert();
    const onSelect = jest.fn();
    render(<AlertCard alert={alert} selected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('alert-card'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('alert-sev1');
  });

  it('shows correct severity chip text for SEV1 vs SEV4', () => {
    const { unmount } = render(
      <AlertCard alert={makeSev1Alert()} selected={false} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('SEV1')).toBeInTheDocument();
    unmount();

    render(
      <AlertCard alert={makeSev4Alert()} selected={false} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('SEV4')).toBeInTheDocument();
  });
});
