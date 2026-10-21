import React, { useState } from 'react';
import { walletManager } from '../../utils/walletUtils.ts';
import encryptionService from '../../services/encryptionService.ts';

const SENSITIVE_KEYS = new Set(['mnemonic', 'password', 'privateKey']);

function sanitizeWalletData(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeWalletData);
  }
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!SENSITIVE_KEYS.has(k)) {
        out[k] = sanitizeWalletData(v);
      }
    }
    return out;
  }
  return obj;
}

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function WalletImport({ onWalletImported, onClose }) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const wordCount = countWords(mnemonic);
  const isValidMnemonic = wordCount === 12 || wordCount === 24;

  const handleImport = async () => {
    setError('');
    setImporting(true);

    try {
      let wallet;
      try {
        wallet = await walletManager.createWalletFromMnemonic(mnemonic, password);
      } catch (e) {
        setError(
          'Failed to import wallet securely. Please verify your recovery phrase and try again.',
        );
        return;
      }

      let encryptedMnemonic;
      try {
        encryptedMnemonic = await encryptionService.encryptMnemonicAsync(mnemonic, password);
      } catch (e) {
        setError(
          'Failed to import wallet securely. Please verify your recovery phrase and try again.',
        );
        return;
      }

      if (!encryptionService.isValidEncryptedPayload(encryptedMnemonic)) {
        setError(
          'Failed to import wallet securely. Please verify your recovery phrase and try again.',
        );
        return;
      }

      const sanitized = sanitizeWalletData(wallet);
      const payload = {
        ...sanitized,
        hasWallet: true,
        encrypted: true,
        encryptedMnemonic,
        wordCount,
        strength: wordCount === 12 ? 128 : 256,
      };

      try {
        localStorage.setItem('wrfcoin_wallet_imported', JSON.stringify(payload));
      } catch (e) {
        setError(
          'Failed to import wallet securely. Please verify your recovery phrase and try again.',
        );
        return;
      }

      try {
        onWalletImported?.(payload);
      } catch (e) {
        console.error('onWalletImported callback threw:', e);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h2>Import Wallet</h2>

      <div>
        <label htmlFor="mnemonic-input">Mnemonic Phrase</label>
        <textarea
          id="mnemonic-input"
          aria-label="Mnemonic Phrase"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your 12 or 24 word recovery phrase"
          rows={3}
        />
        {isValidMnemonic && (
          <span>Valid {wordCount}-word mnemonic phrase detected</span>
        )}
      </div>

      <div>
        <label htmlFor="password-input">Wallet Password</label>
        <input
          id="password-input"
          type="password"
          aria-label="Wallet Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a strong password"
        />
      </div>

      {error && <div role="alert">{error}</div>}

      <div>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !isValidMnemonic || !password}
        >
          {importing ? 'Importing…' : 'Import Wallet'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
