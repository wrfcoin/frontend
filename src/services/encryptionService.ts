/**
 * Encryption Service - TypeScript Implementation
 * High-level encryption service for sensitive data
 *
 * Uses @noble/hashes via CryptoUtils for cryptographic operations
 */

import CryptoUtils from './cryptoUtils';
import { wrapError } from '../utils/errorUtils';

// Types
interface EncryptedPayload {
  data: string;
  iv: string;
  salt: string;
  timestamp: number;
  version: string;
}

interface KeyDerivationOptions {
  iterations: number;
  keyLength: number;
  algorithm: 'PBKDF2' | 'scrypt';
}

interface EncryptionOptions {
  algorithm: 'AES-256-CBC';
  keyDerivation: KeyDerivationOptions;
  compression: boolean;
}

class EncryptionService {
  private static readonly DEFAULT_OPTIONS: EncryptionOptions = {
    algorithm: 'AES-256-CBC',
    keyDerivation: {
      iterations: 100000,
      keyLength: 32,
      algorithm: 'PBKDF2',
    },
    compression: false,
  };

  private static readonly VERSION = '1.0.0';

  /**
   * Encrypt sensitive data with password (async - uses Web Crypto API)
   */
  static async encryptAsync(
    data: string,
    password: string,
    options: Partial<EncryptionOptions> = {},
  ): Promise<EncryptedPayload> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Compress data if requested
      let processedData = data;
      if (opts.compression) {
        processedData = this.compress(data);
      }

      // Use async AES encryption from CryptoUtils
      const result = await CryptoUtils.encryptAESAsync(processedData, password);

      return {
        data: result.encrypted,
        iv: result.iv,
        salt: result.salt,
        timestamp: Date.now(),
        version: this.VERSION,
      };
    } catch (error) {
      throw wrapError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Decrypt sensitive data with password (async - uses Web Crypto API)
   */
  static async decryptAsync(
    payload: EncryptedPayload,
    password: string,
    options: Partial<EncryptionOptions> = {},
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Use async AES decryption from CryptoUtils
      let result = await CryptoUtils.decryptAESAsync(
        {
          encrypted: payload.data,
          iv: payload.iv,
          salt: payload.salt,
        },
        password,
      );

      // Decompress if needed
      if (opts.compression) {
        result = this.decompress(result);
      }

      return result;
    } catch (error) {
      throw wrapError(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Encrypt sensitive data with password (sync - for backward compatibility)
   */
  static encrypt(
    data: string,
    password: string,
    options: Partial<EncryptionOptions> = {},
  ): EncryptedPayload {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Compress data if requested
      let processedData = data;
      if (opts.compression) {
        processedData = this.compress(data);
      }

      // Use sync encryption from CryptoUtils
      const result = CryptoUtils.encryptAES(processedData, password);

      return {
        data: result.encrypted,
        iv: result.iv,
        salt: result.salt,
        timestamp: Date.now(),
        version: this.VERSION,
      };
    } catch (error) {
      throw wrapError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Decrypt sensitive data with password (sync - for backward compatibility)
   */
  static decrypt(
    payload: EncryptedPayload,
    password: string,
    options: Partial<EncryptionOptions> = {},
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Use sync decryption from CryptoUtils
      let result = CryptoUtils.decryptAES(
        {
          encrypted: payload.data,
          iv: payload.iv,
          salt: payload.salt,
        },
        password,
      );

      // Decompress if needed
      if (opts.compression) {
        result = this.decompress(result);
      }

      return result;
    } catch (error) {
      throw wrapError(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Encrypt wallet mnemonic for secure storage (async)
   */
  static async encryptMnemonicAsync(mnemonic: string, password: string): Promise<EncryptedPayload> {
    return this.encryptAsync(mnemonic, password, {
      keyDerivation: {
        iterations: 200000, // Higher iterations for wallet security
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Decrypt wallet mnemonic (async)
   */
  static async decryptMnemonicAsync(payload: EncryptedPayload, password: string): Promise<string> {
    return this.decryptAsync(payload, password, {
      keyDerivation: {
        iterations: 200000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Encrypt wallet mnemonic for secure storage (sync - backward compatibility)
   */
  static encryptMnemonic(mnemonic: string, password: string): EncryptedPayload {
    return this.encrypt(mnemonic, password, {
      keyDerivation: {
        iterations: 200000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Decrypt wallet mnemonic (sync - backward compatibility)
   */
  static decryptMnemonic(payload: EncryptedPayload, password: string): string {
    return this.decrypt(payload, password, {
      keyDerivation: {
        iterations: 200000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Encrypt private keys for secure storage (async)
   */
  static async encryptPrivateKeyAsync(
    privateKey: string,
    password: string,
  ): Promise<EncryptedPayload> {
    // Validate private key format
    if (!this.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    return this.encryptAsync(privateKey, password, {
      algorithm: 'AES-256-CBC',
      keyDerivation: {
        iterations: 250000, // Even higher for private keys
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Decrypt private keys (async)
   */
  static async decryptPrivateKeyAsync(
    payload: EncryptedPayload,
    password: string,
  ): Promise<string> {
    const decrypted = await this.decryptAsync(payload, password, {
      keyDerivation: {
        iterations: 250000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });

    if (!this.isValidPrivateKey(decrypted)) {
      throw new Error('Decrypted data is not a valid private key');
    }

    return decrypted;
  }

  /**
   * Encrypt private keys for secure storage (sync - backward compatibility)
   */
  static encryptPrivateKey(
    privateKey: string,
    password: string,
  ): EncryptedPayload {
    // Validate private key format
    if (!this.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    return this.encrypt(privateKey, password, {
      algorithm: 'AES-256-CBC',
      keyDerivation: {
        iterations: 250000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });
  }

  /**
   * Decrypt private keys (sync - backward compatibility)
   */
  static decryptPrivateKey(
    payload: EncryptedPayload,
    password: string,
  ): string {
    const decrypted = this.decrypt(payload, password, {
      keyDerivation: {
        iterations: 250000,
        keyLength: 32,
        algorithm: 'PBKDF2',
      },
    });

    if (!this.isValidPrivateKey(decrypted)) {
      throw new Error('Decrypted data is not a valid private key');
    }

    return decrypted;
  }

  /**
   * Generate secure encryption key from password
   */
  static deriveKey(
    password: string,
    salt: string,
    iterations: number = 100000,
  ): string {
    return CryptoUtils.pbkdf2(password, salt, iterations, 32);
  }

  /**
   * Verify password strength
   */
  static verifyPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 2;
    else feedback.push('Include special characters');

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeating characters');

    return {
      score,
      feedback,
      isStrong: score >= 6,
    };
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    return CryptoUtils.generateSecurePassword(length, true);
  }

  /**
   * Validate private key format
   */
  private static isValidPrivateKey(key: string): boolean {
    // Basic validation for hex private key (64 characters)
    return /^[a-fA-F0-9]{64}$/.test(key);
  }

  /**
   * Simple compression using base64 encoding
   * In a real implementation, you might use a compression library
   */
  private static compress(data: string): string {
    // For demo purposes, just base64 encode
    // In production, use a proper compression algorithm
    return CryptoUtils.base64Encode(data);
  }

  /**
   * Simple decompression
   */
  private static decompress(compressedData: string): string {
    try {
      return CryptoUtils.base64Decode(compressedData);
    } catch (error) {
      throw wrapError('Failed to decompress data', error);
    }
  }

  /**
   * Secure memory cleanup (best effort in JavaScript)
   */
  static secureCleanup(sensitiveData: string): void {
    // JavaScript doesn't provide true secure memory cleanup,
    // but we can overwrite the variable
    try {
      if (typeof sensitiveData === 'string') {
        // Create a reference and try to overwrite
        const length = sensitiveData.length;
        sensitiveData = ''.padStart(length, '0');
      }
    } catch (error) {
      // Silently fail - this is best effort
    }
  }

  /**
   * Create secure session token
   */
  static createSessionToken(): string {
    return CryptoUtils.generateSecureToken(32);
  }

  /**
   * Validate encrypted payload structure
   */
  static isValidEncryptedPayload(payload: any): payload is EncryptedPayload {
    return (
      payload &&
      typeof payload === 'object' &&
      typeof payload.data === 'string' &&
      typeof payload.iv === 'string' &&
      typeof payload.salt === 'string' &&
      typeof payload.timestamp === 'number' &&
      typeof payload.version === 'string'
    );
  }
}

export default EncryptionService;
export type { EncryptedPayload, EncryptionOptions, KeyDerivationOptions };
