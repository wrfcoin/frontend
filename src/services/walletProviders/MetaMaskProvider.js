/**
 * MetaMask Wallet Provider
 * Integrates with MetaMask browser extension via window.ethereum
 */

import { BaseWalletProvider } from './BaseWalletProvider.js';
import { ethers } from 'ethers';

export class MetaMaskProvider extends BaseWalletProvider {
  constructor(config = {}) {
    super(config);
    this.provider = null;
    this.ethersProvider = null;
  }

  getType() {
    return 'metamask';
  }

  getName() {
    return 'MetaMask';
  }

  getIcon() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI5LjM2IDEyLjA4TDMwLjcyIDUuMDRMMjcuMzYgMi4yNEwxNi4zMiAxMC40TDE5LjY4IDEzLjc2TDI3LjUyIDEzLjZMMjkuMzYgMTIuMDhaIiBmaWxsPSIjRTI3NjFCIi8+Cjwvc3ZnPgo=';
  }

  isAvailable() {
    return (
      typeof window !== 'undefined' &&
      typeof window.ethereum !== 'undefined' &&
      window.ethereum.isMetaMask
    );
  }

  async connect() {
    try {
      if (!this.isAvailable()) {
        throw new Error('MetaMask is not installed or not available');
      }

      this.provider = window.ethereum;
      this.ethersProvider = new ethers.BrowserProvider(this.provider);

      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get chain ID
      const chainId = await this.provider.request({
        method: 'eth_chainId',
      });

      this.account = accounts[0];
      this.chainId = chainId;
      this.isConnected = true;

      // Set up event listeners
      this._setupEventListeners();

      return {
        address: this.account,
        chainId: this.chainId,
        provider: 'metamask',
      };
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw new Error(`Failed to connect to MetaMask: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      this.account = null;
      this.chainId = null;
      this.isConnected = false;
      this.provider = null;
      this.ethersProvider = null;

      // Remove event listeners
      this._removeEventListeners();

      return true;
    } catch (error) {
      console.error('MetaMask disconnect failed:', error);
      throw error;
    }
  }

  async getBalance(address = null) {
    try {
      if (!this.ethersProvider) {
        throw new Error('MetaMask provider not initialized');
      }

      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('No address provided and no connected account');
      }

      const balance = await this.ethersProvider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance from MetaMask:', error);
      throw error;
    }
  }

  async sendTransaction(transaction) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('MetaMask not connected');
      }

      const signer = await this.ethersProvider.getSigner();

      // Prepare transaction object
      const txParams = {
        from: this.account,
        to: transaction.to,
        value: transaction.value
          ? ethers.parseEther(transaction.value.toString())
          : 0n,
        data: transaction.data || '0x',
      };

      // Add gas limit if provided
      if (transaction.gasLimit) {
        txParams.gasLimit = ethers.toQuantity(transaction.gasLimit);
      }

      // Add gas price if provided
      if (transaction.gasPrice) {
        txParams.gasPrice = ethers.parseUnits(
          transaction.gasPrice.toString(),
          'gwei',
        );
      }

      const txResponse = await signer.sendTransaction(txParams);
      return txResponse.hash;
    } catch (error) {
      console.error('MetaMask transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('MetaMask not connected');
      }

      const signer = await this.ethersProvider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('MetaMask message signing failed:', error);
      throw error;
    }
  }

  async switchChain(chainId) {
    try {
      if (!this.provider) {
        throw new Error('MetaMask provider not initialized');
      }

      const normalizedChainId = ethers.toQuantity(chainId);

      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: normalizedChainId }],
      });

      this.chainId = normalizedChainId;
      return true;
    } catch (error) {
      // If chain doesn't exist, try to add it
      if (error.code === 4902) {
        return await this._addChain(chainId);
      }
      console.error('Failed to switch chain in MetaMask:', error);
      throw error;
    }
  }

  async _addChain(chainId) {
    // This would contain chain configuration for different networks
    // For now, we'll throw an error for unsupported chains
    throw new Error(
      `Chain ${chainId} not supported. Please add it manually in MetaMask.`,
    );
  }

  on(event, callback) {
    if (!this.provider) return;

    const eventMap = {
      accountsChanged: 'accountsChanged',
      chainChanged: 'chainChanged',
      connect: 'connect',
      disconnect: 'disconnect',
    };

    const providerEvent = eventMap[event];
    if (providerEvent) {
      this.provider.on(providerEvent, callback);
    }
  }

  off(event, callback) {
    if (!this.provider) return;

    const eventMap = {
      accountsChanged: 'accountsChanged',
      chainChanged: 'chainChanged',
      connect: 'connect',
      disconnect: 'disconnect',
    };

    const providerEvent = eventMap[event];
    if (providerEvent) {
      this.provider.removeListener(providerEvent, callback);
    }
  }

  _setupEventListeners() {
    if (!this.provider) return;

    this.provider.on('accountsChanged', this._handleAccountsChanged.bind(this));
    this.provider.on('chainChanged', this._handleChainChanged.bind(this));
    this.provider.on('disconnect', this._handleDisconnect.bind(this));
  }

  _removeEventListeners() {
    if (!this.provider) return;

    this.provider.removeListener(
      'accountsChanged',
      this._handleAccountsChanged.bind(this),
    );
    this.provider.removeListener(
      'chainChanged',
      this._handleChainChanged.bind(this),
    );
    this.provider.removeListener(
      'disconnect',
      this._handleDisconnect.bind(this),
    );
  }

  _handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnect();
    } else if (accounts[0] !== this.account) {
      this.account = accounts[0];
      // Emit custom event for account change
      window.dispatchEvent(
        new CustomEvent('walletAccountChanged', {
          detail: { provider: 'metamask', account: this.account },
        }),
      );
    }
  }

  _handleChainChanged(chainId) {
    this.chainId = chainId;
    // Emit custom event for chain change
    window.dispatchEvent(
      new CustomEvent('walletChainChanged', {
        detail: { provider: 'metamask', chainId: this.chainId },
      }),
    );
  }

  _handleDisconnect() {
    this.disconnect();
    // Emit custom event for disconnection
    window.dispatchEvent(
      new CustomEvent('walletDisconnected', {
        detail: { provider: 'metamask' },
      }),
    );
  }

  supportsOperation(operation) {
    const supportedOperations = [
      'connect',
      'disconnect',
      'getBalance',
      'sendTransaction',
      'signMessage',
      'switchChain',
      'addChain',
    ];
    return supportedOperations.includes(operation);
  }
}
