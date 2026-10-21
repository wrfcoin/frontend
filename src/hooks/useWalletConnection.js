/**
 * Wallet Connection Hook
 * Provides easy-to-use wallet connection utilities
 */

import { useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext.jsx';

export const useWalletConnection = () => {
  const {
    isConnected,
    isConnecting,
    account,
    chainId,
    balance,
    receiveOnly,
    walletNotice,
    activeProvider,
    availableProviders,
    error,
    isLoadingBalance,
    isLoadingTransaction,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    switchChain,
    openWalletSelector,
    closeWalletSelector,
    clearError,
    supportsOperation,
    authenticateWallet,
    createCustomWallet,
    importCustomWallet,
    formattedBalance,
    shortAccount,
  } = useWallet();

  // Connect to a specific wallet provider
  const connect = useCallback(
    async (providerType, options = {}) => {
      try {
        return await connectWallet(providerType, options);
      } catch (error) {
        console.error('Connection failed:', error);
        throw error;
      }
    },
    [connectWallet],
  );

  // Disconnect current wallet
  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Disconnection failed:', error);
      throw error;
    }
  }, [disconnectWallet]);

  // Quick connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    return await connect('metamask');
  }, [connect]);

  // Quick connect to WalletConnect
  const connectWalletConnect = useCallback(async () => {
    return await connect('walletconnect');
  }, [connect]);

  // Quick connect to custom wallet
  const connectCustomWallet = useCallback(
    async (walletData = null) => {
      return await connect('custom', { walletData });
    },
    [connect],
  );

  // Send ETH or tokens
  const send = useCallback(
    async (to, amount, data = null) => {
      return await sendTransaction({
        to,
        value: amount,
        data,
      });
    },
    [sendTransaction],
  );

  // Switch to a different chain
  const changeChain = useCallback(
    async newChainId => {
      return await switchChain(newChainId);
    },
    [switchChain],
  );

  // Check if wallet supports a specific operation
  const supports = useCallback(
    operation => {
      return supportsOperation(operation);
    },
    [supportsOperation],
  );

  const loginWallet = useCallback(
    async (address = account) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      return await authenticateWallet(address);
    },
    [account, authenticateWallet],
  );

  // Create a new custom wallet
  const createWallet = useCallback(
    async (options = {}) => {
      return await createCustomWallet(options);
    },
    [createCustomWallet],
  );

  // Import a wallet from mnemonic
  const importWallet = useCallback(
    async (mnemonic, passphrase = '') => {
      return await importCustomWallet(mnemonic, passphrase);
    },
    [importCustomWallet],
  );

  // Refresh account balance
  const refreshAccountBalance = useCallback(
    async (address = null) => {
      return await refreshBalance(address);
    },
    [refreshBalance],
  );

  // Get wallet status information
  const getWalletStatus = useCallback(() => {
    return {
      isConnected,
      isConnecting,
      account,
      chainId,
      balance,
      formattedBalance,
      shortAccount,
      activeProvider,
      error,
      isLoading: isConnecting || isLoadingBalance || isLoadingTransaction,
    };
  }, [
    isConnected,
    isConnecting,
    account,
    chainId,
    balance,
    formattedBalance,
    receiveOnly,
    walletNotice,
    shortAccount,
    activeProvider,
    error,
    isLoadingBalance,
    isLoadingTransaction,
  ]);

  // Get available providers with their status
  const getProviders = useCallback(() => {
    return availableProviders;
  }, [availableProviders]);

  // Check if a specific provider is available
  const isProviderAvailable = useCallback(
    providerType => {
      const provider = availableProviders.find(p => p.type === providerType);
      return provider ? provider.available : false;
    },
    [availableProviders],
  );

  // Check if a specific provider is connected
  const isProviderConnected = useCallback(
    providerType => {
      return isConnected && activeProvider === providerType;
    },
    [isConnected, activeProvider],
  );

  // Get formatted address for display
  const formatAddress = useCallback((address, startChars = 6, endChars = 4) => {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }, []);

  // Format balance for display
  const formatBalance = useCallback((balanceValue, decimals = 4) => {
    if (!balanceValue) return '0';
    return parseFloat(balanceValue).toFixed(decimals);
  }, []);

  // Check if wallet is ready for transactions
  const isReadyForTransaction = useCallback(() => {
    return isConnected && !isConnecting && !isLoadingTransaction && !error;
  }, [isConnected, isConnecting, isLoadingTransaction, error]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    isLoading: isConnecting || isLoadingBalance || isLoadingTransaction,
    isLoadingBalance,
    isLoadingTransaction,

    // Account information
    account,
    shortAccount,
    chainId,
    balance,
    formattedBalance,

    // Provider information
    activeProvider,
    availableProviders,
    receiveOnly,
    walletNotice,

    // Error state
    error,
    clearError,

    // Connection methods
    connect,
    disconnect,
    connectMetaMask,
    connectWalletConnect,
    connectCustomWallet,

    // Transaction methods
    send,
    sendTransaction,

    // Chain methods
    changeChain,
    switchChain,

    // Wallet management
    createWallet,
    importWallet,
    refreshAccountBalance,

    // UI methods
    openWalletSelector,
    closeWalletSelector,

    // Utility methods
    supports,
    loginWallet,
    getWalletStatus,
    getProviders,
    isProviderAvailable,
    isProviderConnected,
    formatAddress,
    formatBalance,
    isReadyForTransaction,
  };
};

export default useWalletConnection;
