/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn();

await jest.unstable_mockModule('axios', () => ({
  default: { get: (...args) => mockGet(...args) },
}));

await jest.unstable_mockModule('../../services/SearchService', () => ({
  indexOracleNetwork: jest.fn(),
}));

await jest.unstable_mockModule('../../hooks/usePageNavigation', () => ({
  default: () => ({
    prevPage: null,
    nextPage: null,
    goToPrev: jest.fn(),
    goToNext: jest.fn(),
  }),
}));

await jest.unstable_mockModule('../common/PageTitle', () => ({
  default: ({ stats }) =>
    React.createElement('div', { 'data-testid': 'page-stats' }, JSON.stringify(stats)),
}));

await jest.unstable_mockModule('../DesignSystem', () => ({
  WrfAlert: ({ children, title }) =>
    React.createElement('div', { role: 'alert' }, title, children),
  WrfCard: ({ children }) => React.createElement('div', null, children),
  WrfStatCard: ({ label, value }) =>
    React.createElement('div', null, `${label}: ${value}`),
  WrfDataTable: () => React.createElement('div'),
  WrfButton: ({ children }) => React.createElement('button', null, children),
  WrfTooltip: ({ children }) => React.createElement('span', null, children),
}));

await jest.unstable_mockModule('../oracle/SlashingEventLog', () => ({
  SlashingEventLog: () => React.createElement('div'),
}));

await jest.unstable_mockModule('../../utils/logger', () => ({
  devLog: jest.fn(),
}));

const { default: OracleDashboard } = await import('./OracleDashboard');

describe('OracleDashboard error envelopes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet
      .mockResolvedValueOnce({
        data: { success: false, data: {}, error: 'oracle unavailable' },
      })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: [] } });
  });

  it('renders an unavailable state instead of healthy-looking zero stats', async () => {
    const { unmount } = render(<OracleDashboard />);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to load Oracle Network data',
      ),
    );

    expect(mockGet).toHaveBeenCalledTimes(4);
    expect(screen.queryByTestId('page-stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Validators: 0')).not.toBeInTheDocument();
    expect(screen.queryByText('Cross-Chain Bridges: 0')).not.toBeInTheDocument();

    unmount();
  });
});
