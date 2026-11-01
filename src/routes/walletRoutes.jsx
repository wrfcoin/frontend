import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FirstPartyWalletProvider from '../components/wallet/FirstPartyWalletProvider';
import PublicWalletSetupProvider from '../components/wallet/PublicWalletSetupProvider';
import { WalletProvider } from '../contexts/WalletContext.jsx';
import FEATURES from '../config/features';

const OwnWalletAddress = lazy(() => import('../pages/OwnWalletAddress'));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'));
const PasskeyWalletPage = lazy(() => import('../pages/PasskeyWalletPage'));
const PasskeyBondPayoutPage = lazy(() => import('../pages/PasskeyBondPayoutPage'));

export default function walletRoutes() {
  const OnboardingProvider = FEATURES.publicReadonly && !FEATURES.fullStudio
    ? PublicWalletSetupProvider : WalletProvider;
  return <>
    <Route path="/wallet" element={<PageWrapper tabType="wallet"><FirstPartyWalletProvider><OwnWalletAddress /></FirstPartyWalletProvider></PageWrapper>} />
    {FEATURES.passkeyWallet && <Route path="/wallet/passkey" element={<PageWrapper tabType="wallet"><PasskeyWalletPage /></PageWrapper>} />}
    {FEATURES.passkeyWallet && <Route path="/wallet/passkey/bond-payout" element={<PageWrapper tabType="wallet"><PasskeyBondPayoutPage /></PageWrapper>} />}
    <Route path="/onboarding" element={<PageWrapper tabType="wallet"><OnboardingProvider><OnboardingPage /></OnboardingProvider></PageWrapper>} />
  </>;
}
