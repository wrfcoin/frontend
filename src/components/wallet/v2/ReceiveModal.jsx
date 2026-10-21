/**
 * ReceiveModal Component
 *
 * Displays the receiving address with copy and share.
 *
 * frontend#348 review: the former "QR code" was a decorative pattern derived
 * from the address that no scanner could decode, labelled "Scan to receive".
 * It is removed until a real QR encoder is wired in; the address and Copy
 * are the working path.
 */

import React, { useState } from 'react';
import {
  X,
  Copy,
  CheckCircle2,
  Share2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { WrfButton } from '../../DesignSystem';
import { NETWORK_NAME, NATIVE_SYMBOL } from '../../../config/network';
import './ReceiveModal.css';
import { devLog } from '../../../utils/logger';

// Token selector for receiving specific tokens
const TokenSelector = ({ selectedToken, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tokens = [
    { symbol: 'WRF', name: 'WRFCoin' },
  ];

  const selected = tokens.find(t => t.symbol === selectedToken) || tokens[0];

  return (
    <div className="receive-token-selector">
      <button
        className="token-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="token-badge">{selected.symbol}</span>
        <span className="token-name">{selected.name}</span>
        <ChevronDown size={18} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="token-select-dropdown">
          {tokens.map((token) => (
            <button
              key={token.symbol}
              className={`token-select-option ${token.symbol === selectedToken ? 'active' : ''}`}
              onClick={() => {
                onSelect(token.symbol);
                setIsOpen(false);
              }}
            >
              <span className="token-badge">{token.symbol}</span>
              <span className="token-name">{token.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ReceiveModal = ({ onClose, walletAddress = null }) => {
  const [selectedToken, setSelectedToken] = useState(NATIVE_SYMBOL);
  const [copied, setCopied] = useState(false);

  // Hooks must run unconditionally (rules of hooks); bail out after they run.
  if (!walletAddress) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wallet Address',
          text: `Send crypto to my wallet: ${walletAddress}`,
        });
      } catch (err) {
        // User cancelled or share failed
        devLog('Share cancelled');
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container receive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Receive</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Token Selector */}
          <div className="receive-section">
            <label className="receive-label">Receive Token</label>
            <TokenSelector
              selectedToken={selectedToken}
              onSelect={setSelectedToken}
            />
          </div>

          {/* Address Display */}
          <div className="address-section">
            <label className="receive-label">Wallet Address</label>
            <div className="address-display">
              <span className="address-text">{shortenAddress(walletAddress)}</span>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
                title="Copy address"
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button className="full-address-btn" onClick={copyToClipboard}>
              <span className="full-address">{walletAddress}</span>
              {copied && <span className="copied-toast">Copied!</span>}
            </button>
          </div>

          {/* Network Info */}
          <div className="network-info">
            <Info size={16} />
            <span>Only send {NATIVE_SYMBOL} on the {NETWORK_NAME} to this address.</span>
          </div>

          {/* Actions */}
          <div className="receive-actions">
            <WrfButton variant="secondary" onClick={copyToClipboard}>
              <Copy size={18} />
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </WrfButton>
            <WrfButton variant="primary" onClick={handleShare}>
              <Share2 size={18} />
              <span>Share</span>
            </WrfButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;
