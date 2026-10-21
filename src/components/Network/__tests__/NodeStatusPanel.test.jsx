/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseValidators = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useValidatorQueries', () => ({
  useValidators: mockUseValidators,
}));

jest.unstable_mockModule('../NodeStatusPanel.css', () => ({}));

const { default: NodeStatusPanel } = await import('../NodeStatusPanel');

function queryResult(overrides = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('NodeStatusPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while validator data is fetching', () => {
    mockUseValidators.mockReturnValue(queryResult({ isLoading: true }));

    render(<NodeStatusPanel />);

    expect(screen.getByText('Loading validator status...')).toBeInTheDocument();
  });

  it('renders real validator-derived metrics instead of generated mock nodes', () => {
    mockUseValidators.mockReturnValue(
      queryResult({
        data: [
          {
            id: 'validator-1',
            name: 'Validator Alpha',
            status: 'online',
            balance: 1000,
            effectiveness: 98.4,
            uptime: 99.2,
            proposals: 12,
            attestations: 1200,
            missedSlots: 10,
            lastAttestation: new Date().toISOString(),
          },
        ],
      }),
    );

    render(<NodeStatusPanel />);

    expect(screen.getByText('Validator Alpha')).toBeInTheDocument();
    expect(screen.getByText('Total Attestations')).toBeInTheDocument();
    expect(screen.getAllByText('1,200')).toHaveLength(2);
    expect(screen.queryByText('Primary Validator')).not.toBeInTheDocument();
  });
});
