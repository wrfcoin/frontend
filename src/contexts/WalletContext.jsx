/**
 * Wallet Context - React context for managing wallet state across the application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { walletProviderManager } from '../services/walletProviders/WalletProviderManager.js';
import { FEATURES } from '../config/features';
import { maskAddress } from '../utils/walletPrivacy.ts';
import { applyPendingReferralForWallet } from '../services/referralAttribution';
import {
  clearWalletAuthSession,
  loginWalletWithEd25519,
  loginWalletWithSigner,
} from '../services/walletAuthService.ts';

// Initial state
const initialState = {
  // Connection state
  isConnected: false,
  isConnecting: false,

  // Provider information
  activeProvider: null,
  availableProviders: [],

  // Account information
  account: null,
  chainId: null,
  balance: '0',
  receiveOnly: false,
  walletNotice: null,

  // UI state
  showWalletSelector: false,

  // Error state
  error: null,

  // Loading states
  isLoadingBalance: false,
  isLoadingTransaction: false,
};

// Action types
const ActionTypes = {
  SET_CONNECTING: 'SET_CONNECTING',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_DISCONNECTED: 'SET_DISCONNECTED',
  SET_ACCOUNT: 'SET_ACCOUNT',
  SET_CHAIN_ID: 'SET_CHAIN_ID',
  SET_BALANCE: 'SET_BALANCE',
  SET_PROVIDERS: 'SET_PROVIDERS',
  SET_ACTIVE_PROVIDER: 'SET_ACTIVE_PROVIDER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_WALLET_NOTICE: 'SET_WALLET_NOTICE',
  SET_WALLET_SELECTOR_OPEN: 'SET_WALLET_SELECTOR_OPEN',
  SET_LOADING_BALANCE: 'SET_LOADING_BALANCE',
  SET_LOADING_TRANSACTION: 'SET_LOADING_TRANSACTION',
};

// Reducer function
const walletReducer = (state, action) => {
  switch (action.type) {
  case ActionTypes.SET_CONNECTING:
    return {
      ...state,
      isConnecting: action.payload,
      error: action.payload ? null : state.error,
    };

  case ActionTypes.SET_CONNECTED:
    return {
      ...state,
      isConnected: true,
      isConnecting: false,
      account: action.payload.account,
      chainId: action.payload.chainId,
      activeProvider: action.payload.provider,
      receiveOnly: action.payload.receiveOnly === true,
      walletNotice: action.payload.notice || null,
      error: null,
    };

  case ActionTypes.SET_DISCONNECTED:
    return {
      ...state,
      isConnected: false,
      isConnecting: false,
      account: null,
      chainId: null,
      balance: '0',
      activeProvider: null,
      receiveOnly: false,
      walletNotice: null,
      error: null,
    };

  case ActionTypes.SET_ACCOUNT:
    return {
      ...state,
      account: action.payload,
    };

  case ActionTypes.SET_CHAIN_ID:
    return {
      ...state,
      chainId: action.payload,
    };

  case ActionTypes.SET_BALANCE:
    return {
      ...state,
      balance: action.payload,
    };

  case ActionTypes.SET_PROVIDERS:
    return {
      ...state,
      availableProviders: action.payload,
    };

  case ActionTypes.SET_ACTIVE_PROVIDER:
    return {
      ...state,
      activeProvider: action.payload,
    };

  // A refused login keeps the provider's exact recovery notice after the disconnect (frontend#438 review).
  case ActionTypes.SET_WALLET_NOTICE:
    return {
      ...state,
      walletNotice: action.payload || null,
    };

  case ActionTypes.SET_ERROR:
    return {
      ...state,
      error: action.payload,
      isConnecting: false,
      isLoadingTransaction: false,
    };

  case ActionTypes.CLEAR_ERROR:
    return {
      ...state,
      error: null,
    };

  case ActionTypes.SET_WALLET_SELECTOR_OPEN:
    return {
      ...state,
      showWalletSelector: action.payload,
    };

  case ActionTypes.SET_LOADING_BALANCE:
    return {
      ...state,
      isLoadingBalance: action.payload,
    };

  case ActionTypes.SET_LOADING_TRANSACTION:
    return {
      ...state,
      isLoadingTransaction: action.payload,
    };

  default:
    return state;
  }
};

// Create context
const WalletContext = createContext();

/**
 * frontend#437 review (owner ruling 2026-10-01: no wallet keys on the public
 * web): in the public build the provider is PASSIVE. It never restores a
 * retained wallet (no auto-connect, so no key derivation and no secret
 * migration), never starts a wallet login, listens to no provider events, and
 * refuses every action that would connect, create, import, sign or send.
 * Operator and full-studio builds keep the full behaviour.
 */
export const PASSIVE_WALLET_MESSAGE =
  'Wallets live in the WRFCoin app; the public web does not connect or create wallets.';
function isPassiveWalletBuild() {
  return Boolean(FEATURES.publicReadonly) && !FEATURES.fullStudio;
}

// Provider component
export const WalletProvider = ({ children, passive }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const isPassive = typeof passive === 'boolean' ? passive : isPassiveWalletBuild();

  // Initialize providers and check for existing connection
  useEffect(() => {
    if (isPassive) {
      return undefined;
    }
    initializeWallet();
    setupEventListeners();

    return () => {
      cleanup();
    };
  }, [isPassive]);

  // Auto-refresh balance when account or chain changes
  useEffect(() => {
    if (state.isConnected && state.account) {
      refreshBalance();
    }
  }, [state.account, state.chainId]);

  const initializeWallet = async () => {
    try {
      // Load available providers
      const providers = walletProviderManager.getAvailableProviders();
      dispatch({ type: ActionTypes.SET_PROVIDERS, payload: providers });

      // Try to auto-connect to previously connected wallet
      const result = await walletProviderManager.autoConnect();
      if (result) {
        try {
          // Same-process public vault identity has already completed login.
          // Reloaded storage cannot set this provider-only resume marker.
          if (!result.resumedVaultSession) await authenticateWallet(result.address);
        } catch (authError) {
          await refuseLogin(result, authError);
        }

        dispatch({
          type: ActionTypes.SET_CONNECTED,
          payload: {
            account: result.address,
            chainId: result.chainId,
            provider: result.provider,
            receiveOnly: result.receiveOnly,
            notice: result.notice,
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  };

  const setupEventListeners = () => {
    // Listen for wallet events
    walletProviderManager.on('walletConnected', handleWalletConnected);
    walletProviderManager.on('walletDisconnected', handleWalletDisconnected);
    walletProviderManager.on('accountsChanged', handleAccountsChanged);
    walletProviderManager.on('chainChanged', handleChainChanged);
  };

  const cleanup = () => {
    walletProviderManager.off('walletConnected', handleWalletConnected);
    walletProviderManager.off('walletDisconnected', handleWalletDisconnected);
    walletProviderManager.off('accountsChanged', handleAccountsChanged);
    walletProviderManager.off('chainChanged', handleChainChanged);
  };

  // Event handlers
  const handleWalletConnected = data => {
    dispatch({
      type: ActionTypes.SET_CONNECTED,
      payload: {
        account: data.account,
        chainId: data.chainId,
        provider: data.provider,
        receiveOnly: data.receiveOnly,
        notice: data.notice,
      },
    });
  };

  const handleWalletDisconnected = () => {
    clearWalletAuthSession();
    dispatch({ type: ActionTypes.SET_DISCONNECTED });
  };

  const handleAccountsChanged = accounts => {
    clearWalletAuthSession();
    if (accounts && accounts.length > 0) {
      dispatch({ type: ActionTypes.SET_ACCOUNT, payload: accounts[0] });
    } else {
      dispatch({ type: ActionTypes.SET_DISCONNECTED });
    }
  };

  const handleChainChanged = chainId => {
    dispatch({ type: ActionTypes.SET_CHAIN_ID, payload: chainId });
  };

  // Action methods
  const authenticateWallet = async address => {
    // First-party wallet with a matching ed25519 key: ed25519 login, whose JWT
    // sub is the chain address the signed-transfer routes check. It signs only
    // through the provider's validating signLoginChallenge, never the generic
    // signMessage (backend#1208 review, finding 2). MetaMask / WalletConnect
    // (and custom accounts without an ed25519 identity) keep the EVM
    // personal_sign path; a custom account without an identity is refused.
    const activeType = walletProviderManager.getActiveProvider()?.getType?.();
    const identity =
      activeType === 'custom' ? walletProviderManager.getLoginIdentity() : null;
    if (identity && identity.scheme === 'ed25519') {
      try {
        const session = await loginWalletWithEd25519(
          identity.address,
          identity.publicKeyHex,
          message => walletProviderManager.signLoginChallenge(message),
        );
        await applyPendingReferralForWallet(identity.address).catch(() => {});
        return session;
      } finally {
        walletProviderManager.getActiveProvider()?.releaseVaultSigner?.();
      }
    }
    if (activeType === 'custom') {
      // A first-party account without an ed25519 login identity (legacy,
      // private-key import, locked) can never pass the EVM login, and taking
      // that path would hand a server-chosen message to the generic
      // signMessage, which signs with the ed25519 transfer key. Refuse instead.
      throw new Error(
        'This wallet cannot sign in: legacy and imported wallets are receive-only. Migrate to the ed25519 wallet scheme to sign in.',
      );
    }
    const session = await loginWalletWithSigner(address, message =>
      walletProviderManager.signMessage(message),
    );
    // Attribution failure must preserve a successful wallet login. Pending
    // codes remain available for a later explicit login; no retry loop.
    await applyPendingReferralForWallet(address).catch(() => {});
    return session;
  };

  // A login that fails is never kept: the session is cleared and the wallet disconnected. When the
  // provider explained why (a legacy password-salted wallet, frontend#438), that exact notice survives the
  // disconnect and becomes the error, so the recovery instructions stay on screen.
  const refuseLogin = async (result, authError) => {
    clearWalletAuthSession();
    await walletProviderManager.disconnect().catch(() => {});
    if (result.notice) {
      dispatch({ type: ActionTypes.SET_WALLET_NOTICE, payload: result.notice });
      throw new Error(result.notice);
    }
    throw authError;
  };

  const connectWallet = async (providerType, options = {}) => {
    try {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const result = await walletProviderManager.connect(providerType, options);

      if (result) {
        try {
          await authenticateWallet(result.address);
        } catch (authError) {
          await refuseLogin(result, authError);
        }

        dispatch({
          type: ActionTypes.SET_CONNECTED,
          payload: {
            account: result.address,
            chainId: result.chainId,
            provider: result.provider,
            receiveOnly: result.receiveOnly,
            notice: result.notice,
          },
        });
        return result;
      }
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: false });
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletProviderManager.disconnect();
      clearWalletAuthSession();
      dispatch({ type: ActionTypes.SET_DISCONNECTED });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const refreshBalance = async (address = null) => {
    if (!state.isConnected) return;

    try {
      dispatch({ type: ActionTypes.SET_LOADING_BALANCE, payload: true });
      const balance = await walletProviderManager.getBalance(
        address || state.account,
      );
      dispatch({ type: ActionTypes.SET_BALANCE, payload: balance });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Don't set error for balance refresh failures as they're not critical
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING_BALANCE, payload: false });
    }
  };

  const sendTransaction = async transaction => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      dispatch({ type: ActionTypes.SET_LOADING_TRANSACTION, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const txHash = await walletProviderManager.sendTransaction(transaction);

      // Refresh balance after successful transaction
      setTimeout(() => refreshBalance(), 2000);

      return txHash;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING_TRANSACTION, payload: false });
    }
  };

  const switchChain = async chainId => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const success = await walletProviderManager.switchChain(chainId);
      if (success) {
        dispatch({ type: ActionTypes.SET_CHAIN_ID, payload: chainId });
      }
      return success;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const openWalletSelector = () => {
    dispatch({ type: ActionTypes.SET_WALLET_SELECTOR_OPEN, payload: true });
  };

  const closeWalletSelector = () => {
    dispatch({ type: ActionTypes.SET_WALLET_SELECTOR_OPEN, payload: false });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const supportsOperation = operation => {
    return walletProviderManager.supportsOperation(operation);
  };

  // Custom wallet methods
  const createCustomWallet = async (options = {}) => {
    try {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const walletData =
        await walletProviderManager.createCustomWallet(options);
      return walletData;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: false });
    }
  };

  const importCustomWallet = async (mnemonic, passphrase = '') => {
    try {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const walletData = await walletProviderManager.importCustomWallet(
        mnemonic,
        passphrase,
      );
      return walletData;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_CONNECTING, payload: false });
    }
  };

  // Context value
  const refusePassive = async () => {
    throw new Error(PASSIVE_WALLET_MESSAGE);
  };
  const passiveGuard = (action) => (isPassive ? refusePassive : action);

  const value = {
    // State
    ...state,
    isPassive,

    // Actions (refused in the passive public build)
    connectWallet: passiveGuard(connectWallet),
    disconnectWallet,
    refreshBalance,
    sendTransaction: passiveGuard(sendTransaction),
    switchChain: passiveGuard(switchChain),
    openWalletSelector: isPassive ? () => {} : openWalletSelector,
    closeWalletSelector,
    clearError,
    supportsOperation,
    authenticateWallet: passiveGuard(authenticateWallet),
    createCustomWallet: passiveGuard(createCustomWallet),
    importCustomWallet: passiveGuard(importCustomWallet),

    // Computed values
    isWalletConnected: state.isConnected,
    currentAccount: state.account,
    formattedBalance: parseFloat(state.balance).toFixed(4),
    shortAccount: state.account ? maskAddress(state.account) : null,
    maskedAccount: state.account ? maskAddress(state.account) : null,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// frontend#302: for views that only decorate with wallet state (the
// leaderboard highlighting the viewer's own row) and are routed without a
// WalletProvider. Returns null outside the provider instead of throwing, so a
// public visitor gets the page, not the ErrorBoundary.
export const useOptionalWallet = () => useContext(WalletContext) ?? null;

export default WalletContext;
