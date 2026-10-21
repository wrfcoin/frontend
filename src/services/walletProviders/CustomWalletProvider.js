/**
 * Custom Wallet Provider
 * Wraps the existing WalletManager to provide a unified interface
 */

import { BaseWalletProvider } from './BaseWalletProvider.js';
import { walletManager } from '../../utils/walletUtils.ts';
import { getSecureWallet } from '../secureWalletStorage.ts';
import { readVault, isPasswordSaltedLegacyRecord, LEGACY_PASSWORD_WALLET_NOTICE } from '../walletVault.ts';
import { walletService } from '../apiClient/index.ts';
import { deriveAccount, bytesToHex } from '../walletCrypto/firstPartyKeys.ts';
import { buildSignedTransfer, wrfToBaseUnits } from '../walletCrypto/transferPayload.ts';
import { genericMessageSigningBytes } from '../walletCrypto/genericMessage.ts';
import { assertOrdinarySendRecipient } from '../walletCrypto/recipientStatus.ts';
import {
  assertEd25519LoginChallenge,
  resolveEd25519LoginExpectations,
} from '../walletCrypto/loginChallenge.ts';

// Receive-only notice for a wallet this provider cannot sign for. A record from the old onboarding flow
// (password used as the BIP-39 passphrase, frontend#438) gets the exact explanation; never re-derived.
function legacyNotice(walletData, signingAccount, account) {
  if (signingAccount && signingAccount.address.toLowerCase() === String(account).toLowerCase()) return undefined;
  if (isPasswordSaltedLegacyRecord(walletData)) return LEGACY_PASSWORD_WALLET_NOTICE;
  return 'Legacy wallets are receive-only. Back up and explicitly migrate to the ed25519 wallet scheme to send.';
}

export const NFT_CREATE_DOMAIN = 'wrfcoin_nft_create_v1';

export class CustomWalletProvider extends BaseWalletProvider {
  constructor(config = {}) {
    super(config);
    this.walletManager = walletManager;
    this.signingAccount = null;
    this.vaultIdentity = null;
  }

  getType() {
    return 'custom';
  }

  getName() {
    return 'Wrfcoin Wallet';
  }

  getIcon() {
    return 'account_balance_wallet';
  }

  isAvailable() {
    return true; // Custom wallet is always available
  }

  configuredChainId() {
    // Match the configuration precedence used to authorize transfers.
    return String(
      this.config?.chainId ?? import.meta.env?.VITE_WRFCOIN_CHAIN_ID ?? '',
    ).trim() || null;
  }

  async connect(walletData = null) {
    try {
      if (walletData) {
        // Connect to existing wallet
        this.account = walletData.address;
        this.chainId = this.configuredChainId();
        this.isConnected = true;

        // Set current wallet in manager
        this.walletManager.currentWallet = walletData;
        this.signingAccount = walletData.mnemonic
          ? deriveAccount(walletData.mnemonic, walletData.passphrase || '')
          : null;
        this.vaultIdentity = null;
        if (this.signingAccount && this.signingAccount.address === readVault()?.address?.toLowerCase()
            && this.signingAccount.address === this.account.toLowerCase()) {
          this.vaultIdentity = { scheme: 'ed25519', address: this.signingAccount.address,
            publicKeyHex: bytesToHex(this.signingAccount.publicKey) };
          // Only public metadata survives connection; password-backed Send
          // derives its own one-call signer from the encrypted vault.
          delete walletData.mnemonic;
          delete walletData.passphrase;
          delete walletData.privateKey;
          this.walletManager.currentWallet = { address: this.account };
        }

        return {
          address: this.account,
          chainId: this.chainId,
          provider: 'custom',
          walletData: walletData,
          receiveOnly: !this.signingAccount || this.signingAccount.address.toLowerCase() !== this.account.toLowerCase(),
          notice: legacyNotice(walletData, this.signingAccount, this.account),
        };
      } else {
        // Return existing connection if available
        const wallet = getSecureWallet();
        if (wallet) {
          if (this.isConnected && this.vaultIdentity
              && this.account?.toLowerCase() === wallet.address?.toLowerCase()
              && this.walletManager.currentWallet?.address?.toLowerCase() === this.account?.toLowerCase()) {
            return { address: this.account, chainId: this.chainId, provider: 'custom',
              walletData: { address: this.account }, receiveOnly: false, resumedVaultSession: true };
          }
          // A route remount can reuse a wallet explicitly unlocked in this
          // process. Public session metadata alone never recreates a signer.
          const liveWallet = this.walletManager.currentWallet;
          const sameAddress = value => typeof value === 'string'
            && value.toLowerCase() === String(wallet.address).toLowerCase();
          if (this.isConnected && sameAddress(this.account)
              && sameAddress(this.signingAccount?.address) && sameAddress(liveWallet?.address)) {
            return {
              address: this.account, chainId: this.chainId, provider: 'custom',
              walletData: liveWallet, receiveOnly: false,
            };
          }
          this.releaseVaultSigner();
          this.vaultIdentity = null;
          this.account = wallet.address;
          this.chainId = this.configuredChainId();
          this.isConnected = true;
          this.signingAccount = wallet.mnemonic
            ? deriveAccount(wallet.mnemonic, wallet.passphrase || '')
            : null;

          return {
            address: this.account,
            chainId: this.chainId,
            provider: 'custom',
            walletData: wallet,
            receiveOnly: !this.signingAccount || this.signingAccount.address.toLowerCase() !== this.account.toLowerCase(),
            notice: legacyNotice(wallet, this.signingAccount, this.account),
          };
        } else {
          throw new Error(
            'No wallet found. Please create or import a wallet first.',
          );
        }
      }
    } catch (error) {
      console.error('Custom wallet connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      this.account = null;
      this.chainId = null;
      this.isConnected = false;
      this.walletManager.currentWallet = null;
      this.signingAccount?.destroy?.();
      this.signingAccount = null;
      this.vaultIdentity = null;

      return true;
    } catch (error) {
      console.error('Custom wallet disconnect failed:', error);
      throw error;
    }
  }

  async getBalance(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress) {
        throw new Error('No address provided and no connected account');
      }

      const balance = await walletService.getBalance(targetAddress);
      return balance.balance;
    } catch (error) {
      console.error('Failed to get balance from custom wallet:', error);
      throw error;
    }
  }

  async sendTransaction(transaction) {
    assertOrdinarySendRecipient(transaction.to);
    if (this.vaultIdentity) throw new Error('Use the password-confirmed wallet Send flow');
    try {
      if (!this.account) {
        throw new Error('Custom wallet not connected');
      }
      if (!this.signingAccount || this.signingAccount.address.toLowerCase() !== this.account.toLowerCase()) {
        throw new Error('Legacy or locked wallet is receive-only');
      }
      const amount = String(transaction.value || transaction.amount);
      const nonce = BigInt(await walletService.getNonce(this.account));
      const chainId = String(
        this.config?.chainId ?? import.meta.env?.VITE_WRFCOIN_CHAIN_ID ?? '',
      ).trim();
      const networkId = String(
        this.config?.networkId ?? import.meta.env?.VITE_WRFCOIN_NETWORK_ID ?? '',
      ).trim();
      if (!chainId || !networkId) {
        throw new Error(
          'WRFCoin signing identity is not configured; refusing to sign',
        );
      }
      const payload = buildSignedTransfer({
        from: this.account,
        to: transaction.to,
        amountBaseUnits: wrfToBaseUnits(amount),
        nonce,
        chainId,
        networkId,
      }, this.signingAccount);
      const result = await walletService.sendSignedTransaction(payload);

      return result.txHash;
    } catch (error) {
      console.error('Custom wallet transaction failed:', error);
      throw error;
    }
  }

  /**
   * Sign a generic text message. The signature is over
   * "wrfcoin_generic_message_v1\n" + message (see walletCrypto/genericMessage),
   * NOT over the raw message; raw bytes and protocol-looking text are refused.
   * Login uses signLoginChallenge, transfers use buildSignedTransfer.
   * @param {string} message
   * @returns {Promise<string>} 128-hex ed25519 signature
   */
  async signMessage(message) {
    if (this.vaultIdentity) throw new Error('Vault wallets do not sign arbitrary messages');
    try {
      if (!this.account) {
        throw new Error('Custom wallet not connected');
      }

      if (!this.signingAccount) throw new Error('Wallet is locked');
      // Never a raw oracle over the transfer key: text only, protocol-looking
      // text refused, and always signed under the generic-message envelope
      // (wrfcoin_generic_message_v1), so the result can never be valid as a
      // transfer or any other core4/login signature.
      return bytesToHex(this.signingAccount.sign(genericMessageSigningBytes(message)));
    } catch (error) {
      console.error('Custom wallet message signing failed:', error);
      throw error;
    }
  }

  /**
   * Sign a CreateNft authorization with the first-party key under its own purpose tag
   * (frontend#374). The input must be the JSON string of a `wrfcoin.nft.create` action; the signature is over
   * "wrfcoin_nft_create_v1\n" + that exact string, so it can never be valid as a transfer, login, generic or
   * any other core4 signature.
   * @param {string} signingPayload
   * @returns {Promise<string>} 128-hex ed25519 signature
   */
  async signNftCreate(signingPayload) {
    if (this.vaultIdentity) throw new Error('Vault wallets do not sign NFT messages');
    if (!this.account) throw new Error('Custom wallet not connected');
    if (!this.signingAccount) throw new Error('Wallet is locked');
    let parsed = null;
    try {
      parsed = typeof signingPayload === 'string' ? JSON.parse(signingPayload) : null;
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed !== 'object' || parsed.action !== 'wrfcoin.nft.create') {
      throw new Error('Refusing to sign with the wallet key: not a CreateNft authorization.');
    }
    return bytesToHex(this.signingAccount.sign(new TextEncoder().encode(`${NFT_CREATE_DOMAIN}\n${signingPayload}`)));
  }

  /**
   * ed25519 login identity of the connected first-party wallet, or null when
   * this account cannot log in with ed25519 (a legacy or private-key import is
   * receive-only, a locked wallet has no signing key). The address is the
   * lowercase core4 chain address the backend binds the JWT sub to.
   * @returns {{scheme: 'ed25519', address: string, publicKeyHex: string} | null}
   */
  getLoginIdentity() {
    if (this.isConnected && this.vaultIdentity
        && this.walletManager.currentWallet?.address?.toLowerCase() === this.account?.toLowerCase()) return { ...this.vaultIdentity };
    if (!this.account || !this.signingAccount) {
      return null;
    }
    const address = this.account.toLowerCase();
    if (this.signingAccount.address.toLowerCase() !== address) {
      return null;
    }
    return {
      scheme: 'ed25519',
      address,
      publicKeyHex: bytesToHex(this.signingAccount.publicKey),
    };
  }

  /**
   * Sign an ed25519 wallet-login challenge, and nothing else (backend#1208
   * review, finding 2). The key that signs here also authorizes transfers, so
   * the message must be a text challenge that starts with
   * wrfcoin_wallet_login_ed25519_v1 and names this account's lowercase
   * address, the expected origin and the expected chain/network. Anything else
   * (a transfer preimage, bytes, another account's challenge) is refused
   * before the key is touched. Login must use this, never signMessage.
   * @param {string} message Server-issued challenge
   * @returns {Promise<string>} 128-hex ed25519 signature
   */
  async signLoginChallenge(message) {
    const identity = this.getLoginIdentity();
    if (!identity) {
      throw new Error('This wallet has no ed25519 login identity');
    }
    const expected = resolveEd25519LoginExpectations(identity.address, {
      walletAuthOrigin: this.config?.walletAuthOrigin,
      walletAuthChainId: this.config?.walletAuthChainId,
      networkId: this.config?.walletAuthNetwork,
    });
    const challenge = assertEd25519LoginChallenge(message, expected);
    try {
      return bytesToHex(this.signingAccount.sign(new TextEncoder().encode(challenge)));
    } finally {
      if (this.vaultIdentity) {
        this.signingAccount?.destroy?.();
        this.signingAccount = null;
      }
    }
  }

  releaseVaultSigner() {
    if (this.vaultIdentity) {
      this.signingAccount?.destroy?.();
      this.signingAccount = null;
    }
  }

  async switchChain(chainId) {
    try {
      // For custom wallet, chain switching is straightforward
      this.chainId = chainId;

      // Emit custom event for chain change
      window.dispatchEvent(
        new CustomEvent('walletChainChanged', {
          detail: { provider: 'custom', chainId: this.chainId },
        }),
      );

      return true;
    } catch (error) {
      console.error('Failed to switch chain in custom wallet:', error);
      throw error;
    }
  }

  on(event, callback) {
    // Use window event listeners for custom wallet events
    const eventMap = {
      accountsChanged: 'customWalletAccountsChanged',
      chainChanged: 'customWalletChainChanged',
      connect: 'customWalletConnect',
      disconnect: 'customWalletDisconnect',
    };

    const mappedEvent = eventMap[event];
    if (mappedEvent) {
      window.addEventListener(mappedEvent, callback);
    }
  }

  off(event, callback) {
    // Remove window event listeners
    const eventMap = {
      accountsChanged: 'customWalletAccountsChanged',
      chainChanged: 'customWalletChainChanged',
      connect: 'customWalletConnect',
      disconnect: 'customWalletDisconnect',
    };

    const mappedEvent = eventMap[event];
    if (mappedEvent) {
      window.removeEventListener(mappedEvent, callback);
    }
  }

  // Custom wallet specific methods

  /**
   * Create new wallet using existing wallet manager
   * @param {Object} options Wallet creation options
   * @returns {Promise<Object>} Created wallet data
   */
  async createWallet(options = {}) {
    try {
      const walletData = await this.walletManager.createNewWallet(
        options.strength || 128,
      );

      // Auto-connect to newly created wallet
      await this.connect(walletData);

      return walletData;
    } catch (error) {
      console.error('Failed to create custom wallet:', error);
      throw error;
    }
  }

  /**
   * Import wallet from mnemonic using existing wallet manager
   * @param {string} mnemonic Mnemonic phrase
   * @param {string} passphrase Optional passphrase
   * @returns {Promise<Object>} Imported wallet data
   */
  async importWallet(mnemonic, passphrase = '') {
    try {
      const walletData = await this.walletManager.createWalletFromMnemonic(
        mnemonic,
        passphrase,
      );

      // Auto-connect to imported wallet
      await this.connect(walletData);

      return walletData;
    } catch (error) {
      console.error('Failed to import custom wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet info including mnemonic if available
   * @returns {Object} Current wallet information
   */
  getWalletInfo() {
    return this.walletManager.currentWallet;
  }

  /**
   * Generate additional addresses for HD wallet
   * @param {number} count Number of addresses to generate
   * @returns {Promise<Array>} Generated addresses
   */
  async generateAddresses(count = 1) {
    try {
      return await this.walletManager.generateAdditionalAddresses(count);
    } catch (error) {
      console.error('Failed to generate addresses:', error);
      throw error;
    }
  }

  supportsOperation(operation) {
    const supportedOperations = [
      'connect',
      'disconnect',
      'getBalance',
      'sendTransaction',
      'signMessage',
      'signLoginChallenge',
      'switchChain',
      'createWallet',
      'importWallet',
      'generateAddresses',
    ];
    return supportedOperations.includes(operation);
  }
}
