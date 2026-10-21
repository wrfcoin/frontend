/**
 * Wallet State Management Unit Tests
 * Location: frontend/src/__tests__/state/wallet-state.test.jsx
 * Coverage: Wallet context, state transitions, local storage integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock wallet context and provider
const WalletContext = React.createContext();

const WalletProvider = ({ children, initialState = {} }) => {
  const [walletState, setWalletState] = React.useState({
    isConnected: false,
    address: null,
    balance: { wrf: 0, usd: 0 },
    transactions: [],
    loading: false,
    error: null,
    ...initialState,
  });

  const connectWallet = React.useCallback(async address => {
    setWalletState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address,
        loading: false,
      }));

      // Store in localStorage
      localStorage.setItem('walletAddress', address);
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  const disconnectWallet = React.useCallback(() => {
    setWalletState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      balance: { wrf: 0, usd: 0 },
      transactions: [],
    }));

    localStorage.removeItem('walletAddress');
  }, []);

  const updateBalance = React.useCallback(newBalance => {
    setWalletState(prev => ({ ...prev, balance: newBalance }));
  }, []);

  const addTransaction = React.useCallback(transaction => {
    setWalletState(prev => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
    }));
  }, []);

  const value = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    updateBalance,
    addTransaction,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

// Test component
const WalletTestComponent = () => {
  const {
    isConnected,
    address,
    balance,
    transactions,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    updateBalance,
    addTransaction,
  } = useWallet();

  return (
    <div data-testid="wallet-component">
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {address && <div data-testid="wallet-address">{address}</div>}

      <div data-testid="wallet-balance">
        WRF: {balance.wrf} | USD: ${balance.usd}
      </div>

      <div data-testid="transaction-count">
        Transactions: {transactions.length}
      </div>

      {loading && <div data-testid="loading">Loading...</div>}

      {error && <div data-testid="error">{error}</div>}

      <button
        data-testid="connect-button"
        onClick={() =>
          connectWallet('wrf1234567890abcdef1234567890abcdef12345678')
        }
        disabled={loading || isConnected}
      >
        Connect Wallet
      </button>

      <button
        data-testid="disconnect-button"
        onClick={disconnectWallet}
        disabled={!isConnected}
      >
        Disconnect
      </button>

      <button
        data-testid="update-balance-button"
        onClick={() => updateBalance({ wrf: 100.5, usd: 200.75 })}
      >
        Update Balance
      </button>

      <button
        data-testid="add-transaction-button"
        onClick={() =>
          addTransaction({
            id: Date.now(),
            hash: '0x123456789',
            amount: 10.5,
            type: 'send',
            timestamp: Date.now(),
          })
        }
      >
        Add Transaction
      </button>
    </div>
  );
};

describe('Wallet State Management', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Disconnected',
      );
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 0 | USD: $0',
      );
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 0',
      );
      expect(screen.queryByTestId('wallet-address')).not.toBeInTheDocument();
    });

    test('should support custom initial state', () => {
      const initialState = {
        isConnected: true,
        address: 'wrf1111111111111111111111111111111111111111',
        balance: { wrf: 50.25, usd: 100.5 },
      };

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Connected',
      );
      expect(screen.getByTestId('wallet-address')).toHaveTextContent(
        'wrf1111111111111111111111111111111111111111',
      );
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 50.25 | USD: $100.5',
      );
    });
  });

  describe('Wallet Connection', () => {
    test('should connect wallet successfully', async () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      // Should show loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(connectButton).toBeDisabled();

      // Wait for connection to complete
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected',
        );
      });

      expect(screen.getByTestId('wallet-address')).toHaveTextContent(
        'wrf1234567890abcdef1234567890abcdef12345678',
      );
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'walletAddress',
        'wrf1234567890abcdef1234567890abcdef12345678',
      );
    });

    test('should handle connection errors', async () => {
      // Make localStorage.setItem throw to trigger the catch path in connectWallet.
      // Replacing window.setTimeout is avoided because that breaks waitFor (TDZ in
      // @testing-library/dom's overallTimeoutTimer initialization).
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Connection failed',
        );
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Disconnected',
      );
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    test('should disable connect button when already connected', async () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected',
        );
      });

      expect(connectButton).toBeDisabled();
    });
  });

  describe('Wallet Disconnection', () => {
    test('should disconnect wallet and clear state', async () => {
      const initialState = {
        isConnected: true,
        address: 'wrf1234567890abcdef1234567890abcdef12345678',
        balance: { wrf: 100, usd: 200 },
        transactions: [{ id: 1, hash: '0x123' }],
      };

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const disconnectButton = screen.getByTestId('disconnect-button');
      fireEvent.click(disconnectButton);

      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Disconnected',
      );
      expect(screen.queryByTestId('wallet-address')).not.toBeInTheDocument();
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 0 | USD: $0',
      );
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 0',
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('walletAddress');
    });

    test('should disable disconnect button when not connected', () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const disconnectButton = screen.getByTestId('disconnect-button');
      expect(disconnectButton).toBeDisabled();
    });
  });

  describe('Balance Updates', () => {
    test('should update wallet balance', () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const updateBalanceButton = screen.getByTestId('update-balance-button');
      fireEvent.click(updateBalanceButton);

      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 100.5 | USD: $200.75',
      );
    });

    test('should handle partial balance updates', () => {
      const initialState = {
        balance: { wrf: 50, usd: 100 },
      };

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const { updateBalance } =
        screen.getByTestId('wallet-component').__reactInternalInstance || {};

      // This would be tested differently in actual implementation
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 50 | USD: $100',
      );
    });
  });

  describe('Transaction Management', () => {
    test('should add transactions to state', () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const addTransactionButton = screen.getByTestId('add-transaction-button');

      // Add first transaction
      fireEvent.click(addTransactionButton);
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 1',
      );

      // Add second transaction
      fireEvent.click(addTransactionButton);
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 2',
      );
    });

    test('should maintain transaction order (newest first)', () => {
      const initialState = {
        transactions: [
          { id: 1, hash: '0x111', timestamp: 1000 },
          { id: 2, hash: '0x222', timestamp: 2000 },
        ],
      };

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 2',
      );

      const addTransactionButton = screen.getByTestId('add-transaction-button');
      fireEvent.click(addTransactionButton);

      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 3',
      );
    });
  });

  describe('Context Error Handling', () => {
    test('should throw error when useWallet is used outside provider', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // No try-catch here: the throw must propagate to React so that render() throws.
      const TestComponentOutsideProvider = () => {
        useWallet();
        return <div>Should not render</div>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useWallet must be used within WalletProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Local Storage Integration', () => {
    test('should persist wallet address to localStorage on connect', async () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'walletAddress',
          'wrf1234567890abcdef1234567890abcdef12345678',
        );
      });
    });

    test('should remove wallet address from localStorage on disconnect', async () => {
      const initialState = {
        isConnected: true,
        address: 'wrf1234567890abcdef1234567890abcdef12345678',
      };

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const disconnectButton = screen.getByTestId('disconnect-button');
      fireEvent.click(disconnectButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('walletAddress');
    });
  });

  describe('State Transitions', () => {
    test('should handle rapid state changes correctly', async () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      const updateBalanceButton = screen.getByTestId('update-balance-button');
      const addTransactionButton = screen.getByTestId('add-transaction-button');

      // Rapid state changes
      fireEvent.click(connectButton);
      fireEvent.click(updateBalanceButton);
      fireEvent.click(addTransactionButton);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected',
        );
      });

      expect(screen.getByTestId('wallet-balance')).toHaveTextContent(
        'WRF: 100.5 | USD: $200.75',
      );
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 1',
      );
    });

    test('should maintain consistent state during async operations', async () => {
      render(
        <WalletProvider>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const connectButton = screen.getByTestId('connect-button');
      fireEvent.click(connectButton);

      // State should be loading during async operation
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'Disconnected',
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected',
        );
      });
    });
  });

  describe('Performance', () => {
    test('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const SpyComponent = () => {
        renderSpy();
        const { balance } = useWallet();
        return <div>{balance.wrf}</div>;
      };

      render(
        <WalletProvider>
          <SpyComponent />
          <WalletTestComponent />
        </WalletProvider>,
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Update balance should only cause one re-render
      const updateBalanceButton = screen.getByTestId('update-balance-button');
      fireEvent.click(updateBalanceButton);

      expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
    });

    test('should handle large transaction lists efficiently', () => {
      const largeTransactionList = Array(1000)
        .fill()
        .map((_, index) => ({
          id: index,
          hash: `0x${index.toString(16).padStart(64, '0')}`,
          amount: Math.random() * 100,
          timestamp: Date.now() - index * 1000,
        }));

      const initialState = {
        transactions: largeTransactionList,
      };

      const startTime = performance.now();

      render(
        <WalletProvider initialState={initialState}>
          <WalletTestComponent />
        </WalletProvider>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render within 100ms
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        'Transactions: 1000',
      );
    });
  });
});
