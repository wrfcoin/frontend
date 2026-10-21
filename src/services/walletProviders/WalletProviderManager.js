/**
 * Wallet Provider Manager
 * Manages multiple wallet providers and provides a unified interface
 */

import { MetaMaskProvider } from './MetaMaskProvider.js';
import { CustomWalletProvider } from './CustomWalletProvider.js';
import {
  setActiveProvider,
  getActiveProvider,
  clearActiveProvider,
} from '../secureWalletStorage.ts';
import { createLogger } from '../../utils/logger';

const log = createLogger('WalletProviderManager');

export class WalletProviderManager {
  constructor(config = {}) {
    this.config = config;
    this.providers = new Map();
    this.activeProvider = null;
    this.eventListeners = new Map();

    this._initializeProviders();
  }

  /**
   * Initialize all available wallet providers
   * @private
   */
  _initializeProviders() {
    // Initialize MetaMask provider
    this.providers.set('metamask', new MetaMaskProvider(this.config.metamask));

    // Initialize Custom wallet provider
    this.providers.set('custom', new CustomWalletProvider(this.config.custom));
  }

  /**
   * Get all available providers
   * @returns {Array} Array of provider objects with metadata
   */
  getAvailableProviders() {
    const providers = [];

    for (const [type, provider] of this.providers) {
      providers.push({
        type: provider.getType(),
        name: provider.getName(),
        icon: provider.getIcon(),
        available: provider.isAvailable(),
        connected: provider.isConnected,
        provider: provider,
      });
    }

    return providers;
  }

  /**
   * Get provider by type
   * @param {string} type Provider type
   * @returns {BaseWalletProvider|null} Provider instance
   */
  getProvider(type) {
    return this.providers.get(type) || null;
  }

  /**
   * Get currently active provider
   * @returns {BaseWalletProvider|null} Active provider instance
   */
  getActiveProvider() {
    return this.activeProvider;
  }

  /**
   * Connect to a specific wallet provider
   * @param {string} providerType Provider type to connect to
   * @param {Object} options Connection options
   * @returns {Promise<Object>} Connection result
   */
  async connect(providerType, options = {}) {
    try {
      const provider = this.getProvider(providerType);
      if (!provider) {
        throw new Error(`Provider ${providerType} not found`);
      }

      if (!provider.isAvailable()) {
        throw new Error(`Provider ${providerType} is not available`);
      }

      // Disconnect current provider if any
      if (this.activeProvider && this.activeProvider !== provider) {
        await this.disconnect();
      }

      // Connect to the new provider
      const result = await provider.connect(options.walletData);

      if (result) {
        this.activeProvider = provider;
        this._setupProviderEventListeners(provider);

        // Emit connection event
        this._emitEvent('walletConnected', {
          provider: providerType,
          account: result.address,
          chainId: result.chainId,
          receiveOnly: result.receiveOnly,
          notice: result.notice,
        });

        // Store active provider type
        setActiveProvider(providerType);
      }

      return result;
    } catch (error) {
      log.error(`Failed to connect to ${providerType}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Disconnect from current provider
   * @returns {Promise<boolean>} Disconnect success status
   */
  async disconnect() {
    try {
      if (!this.activeProvider) {
        return true;
      }

      const providerType = this.activeProvider.getType();
      await this.activeProvider.disconnect();

      this._removeProviderEventListeners(this.activeProvider);
      this.activeProvider = null;

      // Emit disconnection event
      this._emitEvent('walletDisconnected', { provider: providerType });

      // Clear stored provider
      clearActiveProvider();

      return true;
    } catch (error) {
      log.error('Failed to disconnect wallet:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Auto-connect to previously connected provider
   * @returns {Promise<Object|null>} Connection result or null
   */
  async autoConnect() {
    try {
      const storedProvider = getActiveProvider();
      if (!storedProvider) {
        return null;
      }

      const provider = this.getProvider(storedProvider);
      if (!provider || !provider.isAvailable()) {
        clearActiveProvider();
        return null;
      }

      // Try to reconnect
      return await this.connect(storedProvider);
    } catch (error) {
      log.error('Auto-connect failed:', error instanceof Error ? error.message : String(error));
      clearActiveProvider();
      return null;
    }
  }

  /**
   * Get account balance using active provider
   * @param {string} address Account address
   * @returns {Promise<string>} Account balance
   */
  async getBalance(address) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    return await this.activeProvider.getBalance(address);
  }

  /**
   * Send transaction using active provider
   * @param {Object} transaction Transaction object
   * @returns {Promise<string>} Transaction hash
   */
  async sendTransaction(transaction) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    return await this.activeProvider.sendTransaction(transaction);
  }

  /**
   * Sign message using active provider
   * @param {string} message Message to sign
   * @returns {Promise<string>} Signature
   */
  async signMessage(message) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    // The first-party ed25519 key authorizes core4 protocol actions: it is never offered a caller-supplied
    // generic message (frontend#374). Use a purpose-specific signer (signLoginChallenge, signNftCreate).
    if (this.activeProvider.getType?.() === 'custom') {
      throw new Error('Generic message signing is not available with the first-party wallet key.');
    }
    return await this.activeProvider.signMessage(message);
  }

  /**
   * Sign a CreateNft authorization. The first-party wallet uses its tagged signer; injected EVM wallets sign
   * with their own (non-protocol) personal_sign key.
   * @param {string} signingPayload JSON string of the wrfcoin.nft.create action
   * @returns {Promise<string>} Signature
   */
  async signNftCreate(signingPayload) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    if (typeof this.activeProvider.signNftCreate === 'function') {
      return await this.activeProvider.signNftCreate(signingPayload);
    }
    return await this.activeProvider.signMessage(signingPayload);
  }

  /**
   * Login identity of the active provider, when it has a first-party key
   * scheme (the custom ed25519 wallet). Injected EVM wallets return null and
   * keep the personal_sign login.
   * @returns {{scheme: string, address: string, publicKeyHex: string} | null}
   */
  getLoginIdentity() {
    if (!this.activeProvider || typeof this.activeProvider.getLoginIdentity !== 'function') {
      return null;
    }
    return this.activeProvider.getLoginIdentity() ?? null;
  }

  /**
   * Sign a wallet-login challenge with the active provider's dedicated,
   * validating login signer. Providers without one (injected EVM wallets)
   * cannot be used for ed25519 login; this never falls back to signMessage.
   * @param {string} message Server-issued login challenge
   * @returns {Promise<string>} Signature
   */
  async signLoginChallenge(message) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    if (typeof this.activeProvider.signLoginChallenge !== 'function') {
      throw new Error('Active wallet cannot sign an ed25519 login challenge');
    }
    return await this.activeProvider.signLoginChallenge(message);
  }

  /**
   * Switch chain using active provider
   * @param {string} chainId Target chain ID
   * @returns {Promise<boolean>} Switch success status
   */
  async switchChain(chainId) {
    if (!this.activeProvider) {
      throw new Error('No wallet connected');
    }
    return await this.activeProvider.switchChain(chainId);
  }

  /**
   * Check if active provider supports operation
   * @param {string} operation Operation name
   * @returns {boolean} Support status
   */
  supportsOperation(operation) {
    if (!this.activeProvider) {
      return false;
    }
    return this.activeProvider.supportsOperation(operation);
  }

  /**
   * Add event listener for wallet events
   * @param {string} event Event name
   * @param {Function} callback Event handler
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event Event name
   * @param {Function} callback Event handler
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Get current wallet info
   * @returns {Object|null} Current wallet information
   */
  getCurrentWallet() {
    if (!this.activeProvider) {
      return null;
    }

    return {
      type: this.activeProvider.getType(),
      name: this.activeProvider.getName(),
      account: this.activeProvider.getAccount(),
      chainId: this.activeProvider.getChainId(),
      connected: this.activeProvider.isConnected,
    };
  }

  /**
   * Custom wallet specific methods
   */

  /**
   * Create new custom wallet
   * @param {Object} options Creation options
   * @returns {Promise<Object>} Created wallet data
   */
  async createCustomWallet(options = {}) {
    const customProvider = this.getProvider('custom');
    if (!customProvider) {
      throw new Error('Custom wallet provider not available');
    }

    const walletData = await customProvider.createWallet(options);

    // Auto-connect to the new wallet
    await this.connect('custom', { walletData });

    return walletData;
  }

  /**
   * Import custom wallet from mnemonic
   * @param {string} mnemonic Mnemonic phrase
   * @param {string} passphrase Optional passphrase
   * @returns {Promise<Object>} Imported wallet data
   */
  async importCustomWallet(mnemonic, passphrase = '') {
    const customProvider = this.getProvider('custom');
    if (!customProvider) {
      throw new Error('Custom wallet provider not available');
    }

    const walletData = await customProvider.importWallet(mnemonic, passphrase);

    // Auto-connect to the imported wallet
    await this.connect('custom', { walletData });

    return walletData;
  }

  /**
   * Set up event listeners for a provider
   * @param {BaseWalletProvider} provider Provider instance
   * @private
   */
  _setupProviderEventListeners(provider) {
    provider.on('accountsChanged', this._handleAccountsChanged.bind(this));
    provider.on('chainChanged', this._handleChainChanged.bind(this));
    provider.on('disconnect', this._handleProviderDisconnect.bind(this));
  }

  /**
   * Remove event listeners from a provider
   * @param {BaseWalletProvider} provider Provider instance
   * @private
   */
  _removeProviderEventListeners(provider) {
    provider.off('accountsChanged', this._handleAccountsChanged.bind(this));
    provider.off('chainChanged', this._handleChainChanged.bind(this));
    provider.off('disconnect', this._handleProviderDisconnect.bind(this));
  }

  /**
   * Handle account change events
   * @param {Array} accounts New accounts
   * @private
   */
  _handleAccountsChanged(accounts) {
    this._emitEvent('accountsChanged', accounts);
  }

  /**
   * Handle chain change events
   * @param {string} chainId New chain ID
   * @private
   */
  _handleChainChanged(chainId) {
    this._emitEvent('chainChanged', chainId);
  }

  /**
   * Handle provider disconnect events
   * @private
   */
  _handleProviderDisconnect() {
    this.activeProvider = null;
    clearActiveProvider();
    this._emitEvent('walletDisconnected', {});
  }

  /**
   * Emit event to all listeners
   * @param {string} event Event name
   * @param {*} data Event data
   * @private
   */
  _emitEvent(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          log.error(`Error in wallet event listener for ${event}:`, error instanceof Error ? error.message : String(error));
        }
      });
    }
  }
}

// Create singleton instance
export const walletProviderManager = new WalletProviderManager();
