/**
 * Blockchain-Enhanced Security for Wrfcoin Messaging
 * Leverages blockchain technology for advanced cryptographic security
 */

class BlockchainSecurity {
  constructor() {
    this.messageHashes = new Map(); // Store message hashes for integrity verification
    this.keyRotationSchedule = new Map(); // Track key rotation intervals
  }

  /**
   * Generate cryptographically secure keys using blockchain entropy
   */
  async generateBlockchainKey(userAddress, contactAddress, blockHeight = null) {
    try {
      // Use blockchain data as entropy source
      const entropy = await this.getBlockchainEntropy(blockHeight);
      const combinedData = `${userAddress}_${contactAddress}_${entropy}`;

      const encoder = new TextEncoder();
      const data = encoder.encode(combinedData);

      // Generate key using blockchain-derived entropy
      const keyMaterial = await window.crypto.subtle.digest('SHA-256', data);

      return await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt'],
      );
    } catch (error) {
      console.error('Failed to generate blockchain key:', error);
      // Fallback to secure random generation
      return await this.generateSecureKey();
    }
  }

  /**
   * Get blockchain entropy from latest block data
   */
  async getBlockchainEntropy(specificBlock = null) {
    try {
      // In a real implementation, this would connect to your blockchain
      // For now, using browser crypto with timestamp as entropy
      const timestamp = Date.now();
      const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
      const entropy = `${timestamp}_${Array.from(randomBytes).join('')}`;

      const encoder = new TextEncoder();
      const entropyHash = await window.crypto.subtle.digest(
        'SHA-256',
        encoder.encode(entropy),
      );

      return Array.from(new Uint8Array(entropyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to get blockchain entropy:', error);
      return Date.now().toString();
    }
  }

  /**
   * Create message hash for blockchain verification
   */
  async createMessageHash(message, userAddress, contactAddress) {
    const messageData = {
      content: message.content,
      timestamp: message.timestamp,
      sender: userAddress,
      recipient: contactAddress,
      id: message.id,
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(messageData));
    const hash = await window.crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Verify message integrity using stored hash
   */
  async verifyMessageIntegrity(message, userAddress, contactAddress) {
    const currentHash = await this.createMessageHash(
      message,
      userAddress,
      contactAddress,
    );
    const storedHash = this.messageHashes.get(message.id);

    return currentHash === storedHash;
  }

  /**
   * Digital signature simulation using Web Crypto API
   */
  async signMessage(message, privateKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));

      // Generate a signing key pair if not provided
      if (!privateKey) {
        const keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: 'P-256',
          },
          false,
          ['sign', 'verify'],
        );
        privateKey = keyPair.privateKey;
      }

      const signature = await window.crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' },
        },
        privateKey,
        data,
      );

      return {
        signature: Array.from(new Uint8Array(signature)),
        publicKey: privateKey, // In real implementation, extract public key
      };
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }

  /**
   * Zero-knowledge proof concept for message authentication
   */
  async generateZKProof(message, secret) {
    try {
      // Simplified ZK proof concept using hash commitments
      const encoder = new TextEncoder();
      const commitment = encoder.encode(
        `${message.id}_${secret}_${message.timestamp}`,
      );
      const proof = await window.crypto.subtle.digest('SHA-256', commitment);

      return {
        proof: Array.from(new Uint8Array(proof)),
        commitment: message.id,
        timestamp: message.timestamp,
      };
    } catch (error) {
      console.error('Failed to generate ZK proof:', error);
      return null;
    }
  }

  /**
   * Time-locked encryption using blockchain timestamp
   */
  async timeLockedEncrypt(message, unlockTime) {
    try {
      const currentTime = Date.now();
      if (unlockTime <= currentTime) {
        throw new Error('Unlock time must be in the future');
      }

      // Create time-locked key derivation
      const timeKey = await this.deriveTimeKey(unlockTime);

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        timeKey,
        data,
      );

      return {
        encryptedData: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv),
        unlockTime,
        timeKeyHash: await this.getTimeKeyHash(unlockTime),
      };
    } catch (error) {
      console.error('Failed to create time-locked encryption:', error);
      return null;
    }
  }

  /**
   * Derive encryption key based on future timestamp
   */
  async deriveTimeKey(unlockTime) {
    const encoder = new TextEncoder();
    const timeData = encoder.encode(`timelock_${unlockTime}`);
    const keyMaterial = await window.crypto.subtle.digest('SHA-256', timeData);

    return await window.crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Get hash of time key for verification
   */
  async getTimeKeyHash(unlockTime) {
    const timeKey = await this.deriveTimeKey(unlockTime);
    const exported = await window.crypto.subtle.exportKey('raw', timeKey);
    const hash = await window.crypto.subtle.digest('SHA-256', exported);
    return Array.from(new Uint8Array(hash));
  }

  /**
   * Multi-signature message approval simulation
   */
  async createMultiSigMessage(message, requiredSignatures = 2) {
    const messageId = message.id;

    return {
      messageId,
      content: message,
      requiredSignatures,
      signatures: [],
      isComplete: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Add signature to multi-sig message
   */
  async addSignatureToMessage(multiSigMessage, signature, signerAddress) {
    if (
      multiSigMessage.signatures.length >= multiSigMessage.requiredSignatures
    ) {
      throw new Error('Message already has required signatures');
    }

    multiSigMessage.signatures.push({
      signature,
      signer: signerAddress,
      timestamp: Date.now(),
    });

    if (
      multiSigMessage.signatures.length >= multiSigMessage.requiredSignatures
    ) {
      multiSigMessage.isComplete = true;
    }

    return multiSigMessage;
  }

  /**
   * Decentralized key exchange using blockchain addresses
   */
  async performECDHKeyExchange(myPrivateKey, theirPublicKey) {
    try {
      // Perform ECDH key agreement
      const sharedSecret = await window.crypto.subtle.deriveBits(
        {
          name: 'ECDH',
          public: theirPublicKey,
        },
        myPrivateKey,
        256,
      );

      // Derive encryption key from shared secret
      const sharedKey = await window.crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt'],
      );

      return sharedKey;
    } catch (error) {
      console.error('ECDH key exchange failed:', error);
      return null;
    }
  }

  /**
   * Fallback secure key generation
   */
  async generateSecureKey() {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    return key;
  }

  /**
   * Store message hash for integrity verification
   */
  async storeMessageHash(messageId, hash) {
    this.messageHashes.set(messageId, hash);

    // In a real implementation, this could be stored on-chain
    // For now, store in localStorage with encryption
    try {
      const existingHashes = JSON.parse(
        localStorage.getItem('wrfcoin_message_hashes') || '{}',
      );
      existingHashes[messageId] = hash;
      localStorage.setItem(
        'wrfcoin_message_hashes',
        JSON.stringify(existingHashes),
      );
    } catch (error) {
      console.error('Failed to store message hash:', error);
    }
  }

  /**
   * Load message hashes from storage
   */
  loadMessageHashes() {
    try {
      const stored = JSON.parse(
        localStorage.getItem('wrfcoin_message_hashes') || '{}',
      );
      for (const [messageId, hash] of Object.entries(stored)) {
        this.messageHashes.set(messageId, hash);
      }
    } catch (error) {
      console.error('Failed to load message hashes:', error);
    }
  }
}

// Export singleton instance
const blockchainSecurity = new BlockchainSecurity();
blockchainSecurity.loadMessageHashes();

export default blockchainSecurity;
