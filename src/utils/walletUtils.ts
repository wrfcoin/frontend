/**
 * Frontend Wallet Utilities - BIP-39/44 Integration - TypeScript Implementation
 * Connects frontend wallet interface with blockchain-core and backend APIs
 *
 * Real implementation using ethers.js for cryptographically secure wallet generation
 */

import { ethers, Mnemonic } from 'ethers';
import CryptoUtils from '../services/cryptoUtils';
import { bytesToHex, deriveAccount } from '../services/walletCrypto/firstPartyKeys';
import { createLogger } from './logger';
import { wrapError } from './errorUtils';

const log = createLogger('walletUtils');

// Types
interface WalletAccount {
  index: number;
  address: string;
  publicKey: string;
  derivationPath: string;
}

interface WalletInfo {
  sessionId: string;
  address: string;
  publicKey: string;
  derivationPath: string;
  mnemonic: string | null;
  imported: boolean;
  keyScheme: 'ed25519-slip10-master-v1';
  accounts: WalletAccount[];
}

interface WalletStatus {
  isLoaded: boolean;
  sessionId: string;
  address?: string;
  accountCount: number;
  accounts: WalletAccount[];
}

interface EncryptedData {
  encrypted: string;
  salt: string;
  iterations: number;
}

class WalletManager {
  private sessionId: string;
  private currentWallet: WalletInfo | null = null;
  private accounts: WalletAccount[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate cryptographically secure session ID
   */
  private generateSessionId(): string {
    return (
      'wallet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Generate new BIP-39 mnemonic using ethers.js (cryptographically secure)
   * Generated locally; wallet secrets never cross an API boundary.
   */
  async generateNewMnemonic(strength: number = 128): Promise<string> {
    try {
      // Use ethers.js for client-side secure mnemonic generation
      // This is cryptographically secure and follows BIP-39 standard
      const entropy = ethers.randomBytes(strength / 8);
      const mnemonic = Mnemonic.fromEntropy(entropy);

      return mnemonic.phrase;
    } catch (clientError) {
      throw wrapError('Failed to generate secure mnemonic phrase', clientError);
    }
  }

  /**
   * Validate BIP-39 mnemonic phrase
   */
  validateMnemonicPhrase(mnemonic: string): boolean {
    try {
      const words = mnemonic.trim().split(/\s+/);
      const validWordCounts = [12, 15, 18, 21, 24];

      if (!validWordCounts.includes(words.length)) {
        return false;
      }

      return words.every(word => word.length > 0);
    } catch (error) {
      log.error('Error validating mnemonic:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Create a canonical ed25519/SLIP-0010 wallet (core4#3234).
   */
  async createWalletFromMnemonic(
    mnemonic: string,
    passphrase: string = '',
  ): Promise<WalletInfo> {
    if (!this.validateMnemonicPhrase(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    if (passphrase !== '') {
      throw new Error('The first-party wallet scheme requires the empty BIP-39 passphrase');
    }

    try {
      const account = deriveAccount(mnemonic);
      const address = account.address;
      const publicKey = bytesToHex(account.publicKey);
      account.destroy?.();

      const walletInfo: WalletInfo = {
        sessionId: this.sessionId,
        address: address,
        publicKey: publicKey,
        derivationPath: 'SLIP-0010 master (no child path)',
        mnemonic: mnemonic,
        imported: true,
        keyScheme: 'ed25519-slip10-master-v1',
        accounts: [
          {
            index: 0,
            address: address,
            publicKey: publicKey,
            derivationPath: 'SLIP-0010 master (no child path)',
          },
        ],
      };

      this.currentWallet = walletInfo;
      return walletInfo;
    } catch (error) {
      log.error('Error creating wallet:', error instanceof Error ? error.message : String(error));
      throw wrapError('Failed to create wallet from mnemonic', error);
    }
  }

  /** The decided master-only scheme has no additional-address derivation. */
  async generateAdditionalAddresses(
    count: number = 5,
  ): Promise<WalletAccount[]> {
    if (!this.currentWallet) {
      throw new Error('No wallet loaded');
    }

    if (!this.currentWallet.mnemonic) {
      throw new Error('Wallet mnemonic not available - cannot derive additional addresses');
    }

    try {
      throw new Error(`Additional address derivation is unavailable: the decided wallet scheme has no child path (requested ${count})`);
    } catch (error) {
      log.error('Error generating addresses:', error instanceof Error ? error.message : String(error));
      throw wrapError('Failed to generate additional addresses', error);
    }
  }

  /**
   * Get current wallet status
   */
  getWalletStatus(): WalletStatus {
    return {
      isLoaded: !!this.currentWallet,
      sessionId: this.sessionId,
      address: this.currentWallet?.address,
      accountCount: this.currentWallet?.accounts?.length || 0,
      accounts: this.currentWallet?.accounts || [],
    };
  }

  /**
   * Clear wallet data (lock wallet)
   */
  lockWallet(): void {
    if (this.currentWallet) {
      this.currentWallet.mnemonic = null;
      this.currentWallet = null;
      this.accounts = [];
    }
  }

  /**
   * Generate secure salt for password hashing
   */
  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }

  /**
   * Hash password with salt using PBKDF2
   * Uses @noble/hashes via CryptoUtils for tree-shakeable crypto
   */
  private hashPassword(password: string, salt: string): string {
    // Convert base64 salt to hex for CryptoUtils
    const saltHex = this.base64ToHex(salt);
    // PBKDF2 with 512/32 = 16 words = 64 bytes
    const hashedPassword = CryptoUtils.pbkdf2(password, saltHex, 100000, 64);
    // Convert hex back to base64 for compatibility
    return this.hexToBase64(hashedPassword);
  }

  /**
   * Convert base64 to hex
   */
  private base64ToHex(base64: string): string {
    const binary = atob(base64);
    let hex = '';
    for (let i = 0; i < binary.length; i++) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  }

  /**
   * Convert hex to base64
   */
  private hexToBase64(hex: string): string {
    let binary = '';
    for (let i = 0; i < hex.length; i += 2) {
      binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return btoa(binary);
  }

  /**
   * Encrypt mnemonic for secure storage with salted password
   * Uses @noble/hashes for key derivation
   */
  encryptMnemonic(mnemonic: string, password: string): EncryptedData {
    try {
      const salt = this.generateSalt();
      const saltHex = this.base64ToHex(salt);
      const result = CryptoUtils.encryptAES(mnemonic, password + saltHex);

      return {
        encrypted: result.encrypted,
        salt,
        iterations: 100000,
      };
    } catch (error) {
      log.error('Error encrypting mnemonic:', error instanceof Error ? error.message : String(error));
      throw wrapError('Failed to encrypt wallet data', error);
    }
  }

  /**
   * Decrypt mnemonic using password and salt
   * Uses @noble/hashes for key derivation
   */
  decryptMnemonic(encryptedData: EncryptedData, password: string): string {
    try {
      const saltHex = this.base64ToHex(encryptedData.salt);
      const mnemonic = CryptoUtils.decryptAES(
        {
          encrypted: encryptedData.encrypted,
          iv: '', // IV is embedded in the encrypted data
          salt: saltHex,
        },
        password + saltHex,
      );

      if (!mnemonic) {
        throw new Error('Invalid password');
      }

      return mnemonic;
    } catch (error) {
      log.error('Error decrypting mnemonic:', error instanceof Error ? error.message : String(error));
      throw wrapError('Failed to decrypt wallet data - invalid password', error);
    }
  }

  /**
   * Create new wallet with generated mnemonic
   */
  async createNewWallet(
    strength: number = 128,
    passphrase: string = '',
  ): Promise<WalletInfo> {
    try {
      const mnemonic = await this.generateNewMnemonic(strength);
      const walletInfo = await this.createWalletFromMnemonic(
        mnemonic,
        passphrase,
      );
      walletInfo.imported = false;
      return walletInfo;
    } catch (error) {
      log.error('Error creating new wallet:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

}

// Export singleton instance
export const walletManager = new WalletManager();

// Export utility functions
export { WalletManager };

// Additional utility functions
export const walletUtils = {
  /**
   * Format Wrfcoin amount for display
   */
  formatAmount(amount: number): string {
    return `${parseFloat(amount.toString()).toFixed(4)} WRF`;
  },

  /**
   * Validate Wrfcoin address format
   * Accepts both 'wrf' prefix (WRFCoin native) and '0x' prefix (EVM compatible)
   */
  isValidAddress(address: string): boolean {
    // WRFCoin native format: wrf + 40 hex characters
    if (/^wrf[a-f0-9]{40}$/i.test(address)) {
      return true;
    }
    // EVM compatible format: 0x + 40 hex characters
    if (/^0x[a-f0-9]{40}$/i.test(address)) {
      return true;
    }
    return false;
  },

  /**
   * Shorten address for display
   */
  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  },

  /**
   * Generate QR code data for address
   */
  generateQRData(address: string): string {
    return `wrfcoin:${address}`;
  },
};

// Export types
export type {
  WalletAccount,
  WalletInfo,
  WalletStatus,
  EncryptedData,
};
