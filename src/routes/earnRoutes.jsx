import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FirstPartyWalletProvider from '../components/wallet/FirstPartyWalletProvider';

// Self-service "Connect Your Station & Earn" onboarding flow. Wrapped in the active first-party wallet
// provider (frontend#457) so a station joins with the visitor's own signed-in wallet (W28).
const ConnectStationPage = lazy(() => import('../pages/ConnectStationPage'));

export default function earnRoutes() {
  return (
    <>
      <Route
        path="/earn"
        element={
          <PageWrapper tabType="weather">
            <FirstPartyWalletProvider>
              <ConnectStationPage />
            </FirstPartyWalletProvider>
          </PageWrapper>
        }
      />
      <Route
        path="/connect-station"
        element={
          <PageWrapper tabType="weather">
            <FirstPartyWalletProvider>
              <ConnectStationPage />
            </FirstPartyWalletProvider>
          </PageWrapper>
        }
      />
    </>
  );
}
