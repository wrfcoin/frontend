/**
 * Cryptographic Utilities - TypeScript Implementation
 * Secure cryptographic functions for frontend operations
 *
 * Migrated from crypto-js to @noble/hashes for smaller bundle size
 * and better security auditing (tree-shakeable, audited library)
 */

import { sha256 as nobleSha256, sha512 as nobleSha512 } from '@noble/hashes/sha2.js';
import { pbkdf2 as noblePbkdf2 } from '@noble/hashes/pbkdf2.js';
import { hmac as nobleHmac } from '@noble/hashes/hmac.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Types
interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface SignatureResult {
  signature: string;
  message: string;
  publicKey: string;
}

interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
}

interface HashResult {
  hash: string;
  algorithm: string;
}

// Text encoding utilities
import { wrapError } from '../utils/errorUtils';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class CryptoUtils {
  /**
   * Generate cryptographically secure random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate random hex string
   */
  static generateRandomHex(length: number): string {
    const bytes = this.generateRandomBytes(Math.ceil(length / 2));
    return bytesToHex(bytes).slice(0, length);
  }

  /**
   * Hash data using SHA-256
   */
  static sha256(data: string): HashResult {
    const hash = bytesToHex(nobleSha256(textEncoder.encode(data)));
    return {
      hash,
      algorithm: 'SHA-256',
    };
  }

  /**
   * Hash data using SHA-512
   */
  static sha512(data: string): HashResult {
    const hash = bytesToHex(nobleSha512(textEncoder.encode(data)));
    return {
      hash,
      algorithm: 'SHA-512',
    };
  }

  /**
   * Generate PBKDF2 hash with salt
   */
  static pbkdf2(
    password: string,
    salt: string,
    iterations: number = 100000,
    keyLength: number = 32,
  ): string {
    const passwordBytes = textEncoder.encode(password);
    const saltBytes = hexToBytes(salt);
    const key = noblePbkdf2(nobleSha256, passwordBytes, saltBytes, {
      c: iterations,
      dkLen: keyLength,
    });
    return bytesToHex(key);
  }

  /**
   * Generate HMAC signature
   */
  static hmac(
    message: string,
    key: string,
    algorithm: 'SHA256' | 'SHA512' = 'SHA256',
  ): string {
    const messageBytes = textEncoder.encode(message);
    const keyBytes = textEncoder.encode(key);
    const hashFn = algorithm === 'SHA256' ? nobleSha256 : nobleSha512;
    const result = nobleHmac(hashFn, keyBytes, messageBytes);
    return bytesToHex(result);
  }

  /**
   * Encrypt data using AES-256-CBC via Web Crypto API
   * Note: This is async due to Web Crypto API requirements
   */
  static async encryptAESAsync(data: string, password: string): Promise<EncryptionResult> {
    const salt = this.generateRandomHex(32);
    const iv = this.generateRandomBytes(16); // AES-CBC uses 16-byte IV

    // Derive key from password using PBKDF2
    const keyHex = this.pbkdf2(password, salt, 100000, 32);
    const keyBytes = hexToBytes(keyHex);

    // Import key for Web Crypto (convert to ArrayBuffer for compatibility)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      (keyBytes.buffer as ArrayBuffer).slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength),
      { name: 'AES-CBC' },
      false,
      ['encrypt'],
    );

    // Encrypt data
    const dataBytes = textEncoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv as BufferSource },
      cryptoKey,
      dataBytes,
    );

    return {
      encrypted: this.base64Encode(new Uint8Array(encryptedBuffer)),
      iv: bytesToHex(iv),
      salt,
    };
  }

  /**
   * Decrypt data using AES-256-CBC via Web Crypto API
   * Note: This is async due to Web Crypto API requirements
   */
  static async decryptAESAsync(encryptedData: EncryptionResult, password: string): Promise<string> {
    const { encrypted, iv, salt } = encryptedData;

    // Derive key from password using PBKDF2
    const keyHex = this.pbkdf2(password, salt, 100000, 32);
    const keyBytes = hexToBytes(keyHex);

    // Import key for Web Crypto (convert to ArrayBuffer for compatibility)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      (keyBytes.buffer as ArrayBuffer).slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength),
      { name: 'AES-CBC' },
      false,
      ['decrypt'],
    );

    // Decrypt data
    const encryptedBytes = this.base64DecodeToBytes(encrypted);
    const ivBytes = new Uint8Array(hexToBytes(iv));

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ivBytes as BufferSource },
        cryptoKey,
        encryptedBytes as BufferSource,
      );

      return textDecoder.decode(decryptedBuffer);
    } catch (error) {
      throw wrapError('Decryption failed - invalid password or corrupted data', error);
    }
  }

  /**
   * Synchronous encrypt for backward compatibility
   * Uses a simple XOR cipher with derived key - for non-critical data only
   * For sensitive data, use encryptAESAsync
   */
  static encryptAES(data: string, password: string): EncryptionResult {
    const salt = this.generateRandomHex(32);
    const iv = this.generateRandomHex(32);

    // Derive key from password
    const keyHex = this.pbkdf2(password, salt, 100000, 32);
    const keyBytes = hexToBytes(keyHex);
    const dataBytes = textEncoder.encode(data);

    // XOR-based encryption (simple but deterministic with key)
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      encrypted: this.base64Encode(encrypted),
      iv,
      salt,
    };
  }

  /**
   * Synchronous decrypt for backward compatibility
   */
  static decryptAES(encryptedData: EncryptionResult, password: string): string {
    try {
      const { encrypted, salt } = encryptedData;

      // Derive key from password
      const keyHex = this.pbkdf2(password, salt, 100000, 32);
      const keyBytes = hexToBytes(keyHex);
      const encryptedBytes = this.base64DecodeToBytes(encrypted);

      // XOR-based decryption
      const decrypted = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      const result = textDecoder.decode(decrypted);
      if (!result) {
        throw wrapError('Decryption failed - invalid password or corrupted data', new Error('Empty result'));
      }

      return result;
    } catch (error) {
      throw wrapError('Decryption failed - invalid password or corrupted data', error);
    }
  }

  /**
   * Generate a secure random salt
   */
  static generateSalt(length: number = 32): string {
    return this.generateRandomHex(length);
  }

  /**
   * Verify data integrity using checksum
   */
  static verifyChecksum(
    data: string,
    expectedHash: string,
    algorithm: 'SHA256' | 'SHA512' = 'SHA256',
  ): boolean {
    const computed =
      algorithm === 'SHA256' ? this.sha256(data) : this.sha512(data);
    return computed.hash === expectedHash;
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(
    length: number = 16,
    includeSymbols: boolean = true,
  ): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }

    const bytes = this.generateRandomBytes(length);
    return Array.from(bytes, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate a UUID v4
   */
  static generateUUID(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const bytes = this.generateRandomBytes(1);
      const r = bytes[0] & 0x0f;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Encode string to Base64
   */
  static base64Encode(data: string | Uint8Array): string {
    if (typeof data === 'string') {
      // Use btoa with proper Unicode handling
      return btoa(unescape(encodeURIComponent(data)));
    }
    // Handle Uint8Array
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  /**
   * Decode string from Base64
   */
  static base64Decode(encoded: string): string {
    return decodeURIComponent(escape(atob(encoded)));
  }

  /**
   * Decode Base64 to Uint8Array
   */
  static base64DecodeToBytes(encoded: string): Uint8Array {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Encode data to Base64URL (URL-safe)
   */
  static base64UrlEncode(data: string): string {
    return this.base64Encode(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decode data from Base64URL
   */
  static base64UrlDecode(encoded: string): string {
    // Add padding if needed
    let paddedEncoded = encoded;
    while (paddedEncoded.length % 4) {
      paddedEncoded += '=';
    }

    const base64 = paddedEncoded.replace(/-/g, '+').replace(/_/g, '/');

    return this.base64Decode(base64);
  }

  /**
   * Generate a secure token for sessions
   */
  static generateSecureToken(length: number = 32): string {
    return this.generateRandomHex(length);
  }

  /**
   * Derive key using PBKDF2
   */
  static deriveKey(
    password: string,
    salt: string,
    keyLength: number = 32,
    iterations: number = 100000,
  ): string {
    return this.pbkdf2(password, salt, iterations, keyLength);
  }
}

export default CryptoUtils;
export type { KeyPair, SignatureResult, EncryptionResult, HashResult };
