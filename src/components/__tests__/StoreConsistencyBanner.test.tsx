/**
 * @jest-environment jsdom
 */
/**
 * Tests for StoreConsistencyBanner (Issue #239)
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StoreConsistencyBanner } from '../StoreConsistencyBanner';

describe('StoreConsistencyBanner', () => {
  it('renders nothing when health is healthy', () => {
    const { container } = render(
      <StoreConsistencyBanner health="healthy" readMode="normalized" issues={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows warning alert when degraded', () => {
    render(
      <StoreConsistencyBanner
        health="degraded"
        readMode="legacy-only"
        issues={['bridge_state read failed: db unavailable']}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/route store degraded/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy-only/i)).toBeInTheDocument();
    expect(screen.getByText(/bridge_state read failed/i)).toBeInTheDocument();
  });

  it('shows error alert when failed', () => {
    render(
      <StoreConsistencyBanner health="failed" readMode="legacy-only" issues={['fatal error']} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/route store unavailable/i)).toBeInTheDocument();
  });

  it('limits issues display to 3 items', () => {
    render(
      <StoreConsistencyBanner
        health="degraded"
        readMode="dual-read"
        issues={['issue 1', 'issue 2', 'issue 3', 'issue 4']}
      />,
    );
    expect(screen.getByText('issue 1')).toBeInTheDocument();
    expect(screen.getByText('issue 3')).toBeInTheDocument();
    expect(screen.queryByText('issue 4')).not.toBeInTheDocument();
  });

  it('shows no issues list when issues array is empty', () => {
    const { container } = render(
      <StoreConsistencyBanner health="degraded" readMode="legacy-only" issues={[]} />,
    );
    const ul = container.querySelector('ul');
    expect(ul).toBeNull();
  });
});
