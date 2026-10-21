import { useSyncExternalStore } from 'react';
import { DISCLAIMER_URL, dismiss, isDismissed, subscribe } from './testnetDisclaimerStore';
import './TestnetNotice.css';

const WarnIcon = () => (
  <svg className="tn-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

/**
 * Compact testnet expectations banner (#559). One line on desktop, two on phone; the full wording lives
 * on the linked disclaimer page. Dismissal is remembered on this device (see testnetDisclaimerStore).
 */
export default function TestnetNotice() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, isDismissed);
  if (dismissed) return null;
  return (
    <aside className="tn-banner" aria-label="Testnet expectations">
      <WarnIcon />
      <p className="tn-banner__text">
        <strong>Test network.</strong>{' '}
        <span className="tn-banner__long">
          Coins have no monetary value and the chain may be reset without notice.{' '}
          <a href={DISCLAIMER_URL} target="_blank" rel="noopener noreferrer">Read the testnet disclaimer</a>
        </span>
        <span className="tn-banner__short">
          Coins have no monetary value and may be reset without notice.{' '}
          <a href={DISCLAIMER_URL} target="_blank" rel="noopener noreferrer">Disclaimer</a>
        </span>
      </p>
      <button type="button" className="tn-banner__close" onClick={dismiss} aria-label="Dismiss; remembered on this device">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </aside>
  );
}

/** Taskbar chip: appears once the banner is dismissed so the disclaimer stays one click away. */
export function TestnetChip() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, isDismissed);
  if (!dismissed) return null;
  return (
    <a className="tn-chip" href={DISCLAIMER_URL} target="_blank" rel="noopener noreferrer" aria-label="Testnet disclaimer" data-testid="testnet-chip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <span>Testnet</span>
    </a>
  );
}
