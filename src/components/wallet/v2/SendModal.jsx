/**
 * SendModal Component
 *
 * 3-step send flow:
 * 1. Select Token + Amount
 * 2. Select Recipient (saved contacts + recent addresses)
 * 3. Review + Confirm
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  User,
} from 'lucide-react';
import { WrfButton } from '../../DesignSystem';
import {
  formatBaseUnitsToWrf,
  toBaseUnits,
  WRF_UNITS_PER_COIN,
} from '../../../services/apiClient';
import { NETWORK_NAME, NATIVE_SYMBOL, explorerTxUrl } from '../../../config/network';
import { FEATURES } from '../../../config/features';
import { recipientStatus, LEGACY_RECIPIENT_MESSAGE, UNKNOWN_RECIPIENT_MESSAGE } from '../../../services/walletCrypto/recipientStatus';
import ComingSoonPanel from './ComingSoonPanel';
import './SendModal.css';

// No hardcoded token balances, contacts, or recent addresses.
// Balance is passed as walletBalance prop — an EXACT base-units string
// (1 WRF = 1e8 base units), null while loading. Contacts/recent are not wired
// to a backend yet — shown as empty.

// core4 launch addresses are 0x + 40 hex characters (matches the backend
// isLaunchAddress guard, server/routes/wallet-routes.js). The custom "Wrfcoin
// Wallet" provider surfaces the SAME 40 hex bytes under a `wrf` prefix — see
// walletUtils formatWrfcoinAddress, a pure `0x`<->`wrf` prefix swap. So we accept
// both input forms and normalize to 0x with toLaunchAddress before anything is
// sent to the backend, which must only ever receive 0x addresses.
const LAUNCH_HEX = /^[0-9a-fA-F]{40}$/;

const isValidLaunchAddress = (address) => {
  if (typeof address !== 'string') return false;
  if (recipientStatus(address) === 'known-legacy-receive-only') return false;
  const a = address.trim();
  if (a.startsWith('0x')) return LAUNCH_HEX.test(a.slice(2));
  if (a.startsWith('wrf')) return LAUNCH_HEX.test(a.slice(3));
  return false;
};

// Normalize a valid launch address to canonical `0x` + 40 hex. `wrf<40hex>` ->
// `0x<40hex>` (lossless prefix swap, inverse of formatWrfcoinAddress); `0x…`
// passes through unchanged. Returns null if the input isn't a launch address.
const toLaunchAddress = (address) => {
  if (typeof address !== 'string') return null;
  const a = address.trim();
  if (a.startsWith('0x') && LAUNCH_HEX.test(a.slice(2))) return a;
  if (a.startsWith('wrf') && LAUNCH_HEX.test(a.slice(3))) return `0x${a.slice(3)}`;
  return null;
};

// Convert a user-entered WRF decimal string into exact base units (BigInt),
// truncating beyond 8 fractional digits. Returns null for malformed input.
const wrfStringToBaseUnits = (wrfStr) => {
  if (typeof wrfStr !== 'string') return null;
  const trimmed = wrfStr.trim();
  if (trimmed === '' || trimmed === '.' || !/^\d*\.?\d*$/.test(trimmed)) return null;
  const [whole = '0', frac = ''] = trimmed.split('.');
  const fracPadded = frac.slice(0, 8).padEnd(8, '0');
  try {
    return BigInt(whole || '0') * WRF_UNITS_PER_COIN + BigInt(fracPadded || '0');
  } catch {
    return null;
  }
};

// Convert an exact base-units value into a plain WRF decimal string (no thousands
// separators) suitable for the amount <input>. Trailing fractional zeros trimmed.
const baseUnitsToWrfInput = (baseUnits) => {
  const formatted = formatBaseUnitsToWrf(baseUnits, 8);
  if (formatted === null) return '';
  const noCommas = formatted.replace(/,/g, '');
  return noCommas.includes('.')
    ? noCommas.replace(/0+$/, '').replace(/\.$/, '')
    : noCommas;
};

const extractErrorMessage = (error) => {
  if (error instanceof Error && error.message) return error.message;
  return 'Transaction failed. Please try again.';
};

// Step 1: Select Token + Amount
// walletBalance: base-units string | null — null means still loading (allow any
// positive amount; backend validates). 1 WRF = 1e8 base units.
const AmountStep = ({ formData, setFormData, onNext, walletBalance }) => {
  // Exact balance in base units (BigInt) or null when unknown/loading.
  const balanceUnits = toBaseUnits(walletBalance);
  // The amount the user typed is in WRF; convert to exact base units to compare
  // against the (base-units) balance without any 1e8 unit mismatch.
  const amountUnits = wrfStringToBaseUnits(formData.amount);

  const isPositive = amountUnits !== null && amountUnits > 0n;
  const exceedsBalance =
    balanceUnits !== null && amountUnits !== null && amountUnits > balanceUnits;
  // When balance is unknown we allow any positive amount so Continue isn't
  // permanently disabled; the backend is the source of truth on submit.
  const isValidAmount = isPositive && !exceedsBalance;

  const handleMaxClick = () => {
    if (balanceUnits !== null) {
      setFormData(prev => ({ ...prev, amount: baseUnitsToWrfInput(walletBalance) }));
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value.split('.').length <= 2) {
      setFormData(prev => ({ ...prev, amount: value }));
    }
  };

  return (
    <div className="send-step">
      <div className="step-header">
        <h3>Select Token & Amount</h3>
        <p>Choose the token and amount you want to send</p>
      </div>

      {/* Token display — WRF only for testnet launch */}
      <div className="form-group">
        <label className="form-label">Token</label>
        <div className="token-selector">
          <div className="token-select-btn static">
            <div className="selected-token">
              <span className="token-symbol-badge">WRF</span>
              <span className="token-name">WRFCoin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Amount</label>
          <button className="max-btn" onClick={handleMaxClick}>
            MAX
          </button>
        </div>
        <div className="amount-input-wrapper">
          <input
            type="text"
            className="form-input amount-input"
            value={formData.amount}
            onChange={handleAmountChange}
            placeholder="0.00"
          />
          <span className="amount-suffix">WRF</span>
        </div>
        <div className="amount-details">
          <span className="balance-available">
            Balance:{' '}
            {balanceUnits !== null
              ? `${formatBaseUnitsToWrf(walletBalance, 4)} WRF`
              : '—'}
          </span>
        </div>
      </div>

      {/* Validation Warning */}
      {exceedsBalance && (
        <div className="warning-banner">
          <AlertTriangle size={18} />
          <span>Insufficient balance</span>
        </div>
      )}

      {/* Next Button */}
      <WrfButton
        variant="primary"
        className="full-width"
        onClick={onNext}
        disabled={!isValidAmount}
      >
        <span>Continue</span>
        <ArrowRight size={18} />
      </WrfButton>
    </div>
  );
};

// Step 2: Select Recipient
// Contacts and recent addresses are not yet wired to a backend — show empty.
const RecipientStep = ({ formData, setFormData, onNext, onBack }) => {
  const handleAddressSelect = (address) => {
    setFormData(prev => ({ ...prev, recipient: address }));
  };

  const canProceed = formData.recipient && isValidLaunchAddress(formData.recipient);

  return (
    <div className="send-step">
      <div className="step-header">
        <h3>Select Recipient</h3>
        <p>Enter an address or select from contacts</p>
      </div>

      {/* Address Input */}
      <div className="form-group">
        <label className="form-label">Recipient Address</label>
        <div className="address-input-wrapper">
          <input
            type="text"
            className="form-input"
            value={formData.recipient}
            onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
            placeholder="0x… or wrf…"
          />
          {recipientStatus(formData.recipient) === 'known-legacy-receive-only'
            && <p role="alert">{LEGACY_RECIPIENT_MESSAGE}</p>}
          {isValidLaunchAddress(formData.recipient) && <p>{UNKNOWN_RECIPIENT_MESSAGE}</p>}
          {formData.recipient && isValidLaunchAddress(formData.recipient) && (
            <CheckCircle2 size={18} className="valid-icon" />
          )}
        </div>
      </div>

      {/* Contacts — not yet wired to backend */}
      <div className="contacts-section">
        <div className="contacts-empty">
          <User size={24} />
          <p>No saved contacts yet. Enter an address above.</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="step-actions">
        <WrfButton variant="ghost" onClick={onBack}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </WrfButton>
        <WrfButton
          variant="primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          <span>Review</span>
          <ArrowRight size={18} />
        </WrfButton>
      </div>
    </div>
  );
};

// Step 3: Review & Confirm
const ReviewStep = ({ formData, onConfirm, onBack, isSubmitting, submitError }) => {
  const [copied, setCopied] = useState(false);
  const estimatedFee = 0.001; // WRF network fee estimate

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (address) => {
    if (address.length <= 15) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="send-step">
      <div className="step-header">
        <h3>Review Transaction</h3>
        <p>Please verify the details before confirming</p>
      </div>

      {/* Transaction Summary */}
      <div className="review-summary">
        <div className="summary-amount">
          <span className="amount-value">
            {parseFloat(formData.amount).toLocaleString()} {formData.token}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="review-details">
        <div className="detail-item">
          <span className="detail-label">To</span>
          <div className="detail-value address">
            <span>{shortenAddress(formData.recipient)}</span>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(formData.recipient)}
              title="Copy address"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="detail-item">
          <span className="detail-label">Network</span>
          <span className="detail-value">{NETWORK_NAME}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Estimated Fee</span>
          <span className="detail-value">
            ~{estimatedFee} {NATIVE_SYMBOL}
          </span>
        </div>

        <div className="detail-item total">
          <span className="detail-label">Total</span>
          <span className="detail-value">
            {parseFloat(formData.amount).toLocaleString()} {formData.token} + fee
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <AlertTriangle size={16} />
        <span>
          Always verify the recipient address. Transactions cannot be reversed.
        </span>
      </div>

      {submitError && (
        <div className="warning-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="step-actions">
        <WrfButton variant="ghost" onClick={onBack} disabled={isSubmitting}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </WrfButton>
        <WrfButton
          variant="primary"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="spinning" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <span>Confirm & Send</span>
              <CheckCircle2 size={18} />
            </>
          )}
        </WrfButton>
      </div>
    </div>
  );
};

// Success State
const SuccessState = ({ txHash, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="send-success">
      <div className="success-icon">
        <CheckCircle2 size={48} />
      </div>
      <h3>Transaction Sent!</h3>
      <p>Your transaction has been submitted to the network.</p>

      <div className="tx-hash-container">
        <span className="tx-label">Transaction Hash</span>
        <div className="tx-hash">
          <span>{txHash}</span>
          <button className="copy-btn" onClick={copyToClipboard}>
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="success-actions">
        {explorerTxUrl(txHash) && (
          <WrfButton
            variant="ghost"
            href={explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={18} />
            <span>View on Explorer</span>
          </WrfButton>
        )}
        <WrfButton variant="primary" onClick={onClose}>
          Done
        </WrfButton>
      </div>
    </div>
  );
};

// Main SendModal Component
// walletBalance: number | null — null while loading; backend validates on submit
const SendFlowModal = ({
  onClose,
  initialToken = 'WRF',
  senderAddress = '',
  walletBalance = null,
  sendWalletTransaction = null,
  onSendComplete,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    token: initialToken,
    amount: '',
    recipient: '',
  });

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (typeof sendWalletTransaction !== 'function') {
        throw new Error('Connect a signing-capable wallet before sending.');
      }
      // Normalize the connected account to canonical 0x form. Custom "Wrfcoin
      // Wallet" accounts arrive as wrf…; MetaMask/WalletConnect as 0x…. The
      // backend only ever accepts 0x.
      const from = toLaunchAddress(senderAddress);
      if (!from) {
        throw new Error('Connect a WRFCoin wallet before sending.');
      }

      const to = toLaunchAddress(formData.recipient);
      if (!to) {
        throw new Error('Enter a valid recipient address.');
      }

      const result = await sendWalletTransaction({
        from,
        to,
        amount: formData.amount,
      });

      setTxHash(result.txHash);
      await onSendComplete?.(result);
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndicator = (
    <div className="step-indicator">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container send-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!txHash && stepIndicator}

          {txHash ? (
            <SuccessState txHash={txHash} onClose={onClose} />
          ) : (
            <>
              {step === 1 && (
                <AmountStep
                  formData={formData}
                  setFormData={setFormData}
                  onNext={() => setStep(2)}
                  walletBalance={walletBalance}
                />
              )}
              {step === 2 && (
                <RecipientStep
                  formData={formData}
                  setFormData={setFormData}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  formData={formData}
                  onConfirm={handleConfirm}
                  onBack={() => setStep(2)}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SendModal = (props) => {
  const customProviderCanSend =
    props.activeProvider === 'custom' && props.receiveOnly === false;

  if (!FEATURES.walletSend || !customProviderCanSend) {
    return (
      <div className="modal-overlay" onClick={props.onClose}>
        <div className="modal-container send-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <h2>Send</h2>
            <button className="modal-close" onClick={props.onClose} aria-label="Close send notice">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body" data-testid="send-unavailable">
            <ComingSoonPanel
              icon={AlertTriangle}
              title="Sending is not available yet"
              description="Transfers must be signed by your key, and the web wallet cannot do that yet. Receive, balances, and transaction history remain available."
            />
          </div>
        </div>
      </div>
    );
  }

  return <SendFlowModal {...props} />;
};

export default SendModal;
