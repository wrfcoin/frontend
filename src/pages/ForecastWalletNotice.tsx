import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WrfAlert } from '../components/DesignSystem/WrfAlert';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { readSavedWallets, shortAddress, type SavedWallets } from '../components/wallet/WalletSwitcher';
import { clearWalletAuthSession } from '../services/walletAuthService';
import { UNLOCK_RETURN_STATE } from './unlockReturn';

const mono: React.CSSProperties = { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' };

interface Props {
  /** The signed-in wallet (the login token's address), or null. */
  you: string | null;
  /** True when the signed-in wallet is the 12-word wallet saved in this browser, so it can sign here. */
  canSign: boolean;
  /** The saved wallets, from useForecastWallets (the page decides with the same read). */
  saved: SavedWallets;
}

/**
 * Make a forecast, multi-wallet builds: says which wallet signs the forecast, and offers the one step that
 * gets there when the active wallet cannot. Forecasts are signed by the 12-word wallet only (the chain's
 * commit takes an ed25519 key), so a passkey session is offered a switch: it is signed out first, and the
 * 12-word wallet then signs in with its own password. Returns null when it has nothing to add, and the page
 * shows its usual text.
 */
export default function ForecastWalletNotice({ you, canSign, saved }: Props) {
  const navigate = useNavigate();
  const openSetup = () => navigate('/onboarding', { state: UNLOCK_RETURN_STATE.forecastNew });

  if (you && canSign) {
    return (
      <p className="fc-note" data-testid="forecast-wallet-line">
        Forecasting as your 12-word wallet <span style={mono} title={you}>{shortAddress(you)}</span>.
      </p>
    );
  }

  if (!you && saved.phrase) {
    return (
      <WrfAlert severity="info" role="status" className="ch-notice" data-testid="forecast-wallet-unlock">
        <p>
          Forecasts are signed by your 12-word wallet <span style={mono} title={saved.phrase}>{shortAddress(saved.phrase)}</span>.
          Unlock it with the password you set in this browser, then you come back here.
        </p>
        <WrfButton variant="primary" onClick={openSetup}>Unlock 12-word wallet</WrfButton>
      </WrfAlert>
    );
  }

  if (you && saved.passkey && saved.passkey.toLowerCase() === you) {
    const switchWallet = () => {
      // One session, one wallet: the passkey session ends before the 12-word wallet signs in.
      clearWalletAuthSession();
      openSetup();
    };
    return (
      <WrfAlert severity="info" role="status" className="ch-notice" data-testid="forecast-wallet-switch">
        <p>
          You are signed in with your passkey wallet <span style={mono} title={you}>{shortAddress(you)}</span>.
          Passkeys can't sign a forecast yet, so forecasts use a 12-word wallet.{' '}
          {saved.phrase
            ? <>Switching signs the passkey wallet out and unlocks your 12-word wallet <span style={mono} title={saved.phrase}>{shortAddress(saved.phrase)}</span>.</>
            : 'You can add one next to your passkey wallet; the passkey wallet stays as it is.'}
        </p>
        <WrfButton variant="primary" onClick={switchWallet}>
          {saved.phrase ? 'Switch to 12-word wallet' : 'Add a 12-word wallet'}
        </WrfButton>
      </WrfAlert>
    );
  }

  return null;
}

/** True when the notice above replaces the page's own sign-in card or "cannot sign" alert, for the same read. */
export function forecastWalletNoticeReplaces(you: string | null, canSign: boolean, saved: SavedWallets): boolean {
  if (you && canSign) return false;
  if (!you) return Boolean(saved.phrase);
  return Boolean(saved.passkey && saved.passkey.toLowerCase() === you);
}

/**
 * The saved wallets, read once per mount for both the notice and the page's decision to hide its own text.
 * Not read at all when the build has no multi-wallet notice.
 */
export function useForecastWallets(enabled: boolean): SavedWallets {
  const [saved] = useState<SavedWallets>(() => (enabled ? readSavedWallets() : { passkey: null, phrase: null }));
  return saved;
}
