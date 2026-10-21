/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../config/features', () => ({ default: { demoSurfaces: true }, FEATURES: { demoSurfaces: true } }));

const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({ nftId: '1' }));
const mockAxiosGet = jest.fn();
const mockWebsocketConnect = jest.fn();
const mockWebsocketOn = jest.fn();
const mockWebsocketOff = jest.fn();

await jest.unstable_mockModule('axios', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockAxiosGet(...args),
  },
}));

await jest.unstable_mockModule('react-router', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

await jest.unstable_mockModule('../../components/DesignSystem/index.ts', () => ({
  WrfButton: ({ children, onClick, ...rest }) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

await jest.unstable_mockModule(
  '../../components/ComputationalNFT/ExecutionForm.jsx',
  () => ({
    default: () => <div>ExecutionForm</div>,
  }),
);
await jest.unstable_mockModule(
  '../../components/ComputationalNFT/ExecutionMonitor.jsx',
  () => ({
    default: () => <div>ExecutionMonitor</div>,
  }),
);
await jest.unstable_mockModule(
  '../../components/ComputationalNFT/WorkflowIntegration.jsx',
  () => ({
    default: () => <div>WorkflowIntegration</div>,
  }),
);

await jest.unstable_mockModule('../../utils/computationalWebsocket', () => ({
  __esModule: true,
  default: {
    isConnected: false,
    connect: (...args) => mockWebsocketConnect(...args),
    on: (...args) => mockWebsocketOn(...args),
    off: (...args) => mockWebsocketOff(...args),
  },
  NFT_EXECUTION_EVENTS: {
    START: 'start',
    COMPLETE: 'complete',
    ERROR: 'error',
  },
}));

await jest.unstable_mockModule('../ComputationalNFTPage.css', () => ({}));

const { default: ComputationalNFTPage } = await import('../ComputationalNFTPage.jsx');

describe('ComputationalNFTPage loading resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ nftId: '1' });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('exits loading state on timeout and shows retry action', async () => {
    mockAxiosGet.mockImplementation(url => {
      if (url.includes('/executions')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject({ code: 'ECONNABORTED' });
    });

    render(<ComputationalNFTPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Request timed out while loading NFT details. Please try again./i,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Loading NFT\.\.\.$/i)).not.toBeInTheDocument();
  });

  it('retries NFT fetch and renders details after retry success', async () => {
    let failFirstLoad = true;
    mockAxiosGet.mockImplementation(url => {
      if (url.includes('/executions')) {
        return Promise.resolve({ data: [] });
      }

      if (failFirstLoad) {
        failFirstLoad = false;
        return Promise.reject({ code: 'ECONNABORTED' });
      }

      return Promise.resolve({
        data: {
          id: 'nft-1',
          name: 'Test Weather NFT',
          computationType: 'weather_model',
          executionEnvironment: 'Docker',
          status: 'ready',
          description: 'Test description',
        },
      });
    });

    render(<ComputationalNFTPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Test Weather NFT/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
    });
  });

  it('shows generic error message for non-timeout failures', async () => {
    mockAxiosGet.mockImplementation(url => {
      if (url.includes('/executions')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject({ response: { status: 500 } });
    });

    render(<ComputationalNFTPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to load NFT details. Please try again./i),
      ).toBeInTheDocument();
    });
  });

  it('shows not-found state for 404 responses', async () => {
    mockAxiosGet.mockImplementation(url => {
      if (url.includes('/executions')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject({ response: { status: 404 } });
    });

    render(<ComputationalNFTPage />);

    await waitFor(() => {
      expect(screen.getByText(/NFT Not Found/i)).toBeInTheDocument();
    });
  });
});
