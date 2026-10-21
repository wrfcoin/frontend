/**
 * WalletConnect Provider
 * Integrates with WalletConnect for mobile and other wallet connections
 */

import { BaseWalletProvider } from './BaseWalletProvider.js';
// WalletConnect provider not installed - using stub
// import WalletConnectProvider from '@walletconnect/web3-provider';
const WalletConnectProvider = null; // Stub for missing package
import { ethers } from 'ethers';

export class WalletConnectProviderClass extends BaseWalletProvider {
  constructor(config = {}) {
    super(config);
    this.walletConnectProvider = null;
    this.ethersProvider = null;
    const infuraId = (config.infuraId || '').trim();
    const rpc = config.rpc || {};
    this.configError = !infuraId && Object.keys(rpc).length === 0
      ? new Error('VITE_INFURA_PROJECT_ID is required for WalletConnect. Configure it or disable WalletConnect.')
      : null;
    this.defaultConfig = {
      ...(infuraId ? { infuraId } : {}),
      rpc: {
        ...rpc,
      },
      chainId: config.chainId || 1,
      qrcode: config.qrcode !== false,
      qrcodeModalOptions: {
        mobileLinks: [
          'rainbow',
          'metamask',
          'argent',
          'trust',
          'imtoken',
          'pillar',
        ],
        ...config.qrcodeModalOptions,
      },
    };
  }

  getType() {
    return 'walletconnect';
  }

  getName() {
    return 'WalletConnect';
  }

  getIcon() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkuMTI1IDEyLjVDMTIuNSA5LjEyNSAxOS41IDkuMTI1IDIyLjg3NSAxMi41TDI0LjUgMTQuMTI1QzI0LjY4NzUgMTQuMzEyNSAyNC42ODc1IDE0LjY4NzUgMjQuNSAxNC44NzVMMjMgMTYuMzc1QzIyLjkwNjMgMTYuNDY4NyAyMi43NTk0IDE2LjQ2ODcgMjIuNjU2MyAxNi4zNzVMMjEuNSAxNS4yMTg3QzE5LjIxODcgMTIuOTM3NSAxNS4yODEzIDEyLjkzNzUgMTMgMTUuMjE4N0wxMS43NSAxNi40Njg3QzExLjY1NjMgMTYuNTYyNSAxMS41MDk0IDE2LjU2MjUgMTEuNDA2MyAxNi40Njg3TDkuOTA2MjUgMTQuOTY4N0M5LjcxODc1IDE0Ljc4MTMgOS43MTg3NSAxNC40MDYzIDkuOTA2MjUgMTQuMjE4N0w5LjEyNSAxMi41WiIgZmlsbD0iIzM5ODlEQSIvPgo8L3N2Zz4K';
  }

  isAvailable() {
    return typeof window !== 'undefined' && !!WalletConnectProvider && !this.configError;
  }

  async connect() {
    try {
      if (this.configError) {
        throw this.configError;
      }

      if (!WalletConnectProvider) {
        throw new Error(
          'WalletConnect provider package is not installed. Install @walletconnect/web3-provider or disable WalletConnect.',
        );
      }

      // Create WalletConnect provider instance
      this.walletConnectProvider = new WalletConnectProvider({
        ...this.defaultConfig,
        ...this.config,
      });

      // Enable session (triggers QR Code modal)
      await this.walletConnectProvider.enable();

      // Create ethers provider
      this.ethersProvider = new ethers.BrowserProvider(
        this.walletConnectProvider,
      );

      // Get accounts and chain ID
      const accounts = this.walletConnectProvider.accounts;
      const chainId = this.walletConnectProvider.chainId;

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from WalletConnect');
      }

      this.account = accounts[0];
      this.chainId = chainId.toString();
      this.isConnected = true;

      // Set up event listeners
      this._setupEventListeners();

      return {
        address: this.account,
        chainId: this.chainId,
        provider: 'walletconnect',
      };
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw new Error(`Failed to connect to WalletConnect: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.walletConnectProvider) {
        await this.walletConnectProvider.disconnect();
      }

      this.account = null;
      this.chainId = null;
      this.isConnected = false;
      this.walletConnectProvider = null;
      this.ethersProvider = null;

      return true;
    } catch (error) {
      console.error('WalletConnect disconnect failed:', error);
      throw error;
    }
  }

  async getBalance(address = null) {
    try {
      if (!this.ethersProvider) {
        throw new Error('WalletConnect provider not initialized');
      }

      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('No address provided and no connected account');
      }

      const balance = await this.ethersProvider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance from WalletConnect:', error);
      throw error;
    }
  }

  async sendTransaction(transaction) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('WalletConnect not connected');
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
      console.error('WalletConnect transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message) {
    try {
      if (!this.ethersProvider || !this.account) {
        throw new Error('WalletConnect not connected');
      }

      const signer = await this.ethersProvider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('WalletConnect message signing failed:', error);
      throw error;
    }
  }

  async switchChain(chainId) {
    try {
      if (!this.walletConnectProvider) {
        throw new Error('WalletConnect provider not initialized');
      }

      // WalletConnect v1 doesn't support chain switching directly
      // The user needs to switch chain in their connected wallet
      throw new Error(
        'Chain switching not supported in WalletConnect v1. Please switch chain in your wallet app.',
      );
    } catch (error) {
      console.error('Failed to switch chain in WalletConnect:', error);
      throw error;
    }
  }

  on(event, callback) {
    if (!this.walletConnectProvider) return;

    const eventMap = {
      accountsChanged: 'accountsChanged',
      chainChanged: 'chainChanged',
      connect: 'connect',
      disconnect: 'disconnect',
    };

    const providerEvent = eventMap[event];
    if (providerEvent) {
      this.walletConnectProvider.on(providerEvent, callback);
    }
  }

  off(event, callback) {
    if (!this.walletConnectProvider) return;

    const eventMap = {
      accountsChanged: 'accountsChanged',
      chainChanged: 'chainChanged',
      connect: 'connect',
      disconnect: 'disconnect',
    };

    const providerEvent = eventMap[event];
    if (providerEvent) {
      this.walletConnectProvider.removeListener(providerEvent, callback);
    }
  }

  _setupEventListeners() {
    if (!this.walletConnectProvider) return;

    this.walletConnectProvider.on(
      'accountsChanged',
      this._handleAccountsChanged.bind(this),
    );
    this.walletConnectProvider.on(
      'chainChanged',
      this._handleChainChanged.bind(this),
    );
    this.walletConnectProvider.on(
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
          detail: { provider: 'walletconnect', account: this.account },
        }),
      );
    }
  }

  _handleChainChanged(chainId) {
    this.chainId = chainId.toString();
    // Emit custom event for chain change
    window.dispatchEvent(
      new CustomEvent('walletChainChanged', {
        detail: { provider: 'walletconnect', chainId: this.chainId },
      }),
    );
  }

  _handleDisconnect() {
    this.disconnect();
    // Emit custom event for disconnection
    window.dispatchEvent(
      new CustomEvent('walletDisconnected', {
        detail: { provider: 'walletconnect' },
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
    ];
    return supportedOperations.includes(operation);
  }
}
