import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';

const IdentityDashboard = lazy(() => import('../components/Identity/IdentityDashboard'));
const NamingService = lazy(() => import('../components/Identity/NamingService'));
const ReputationDisplay = lazy(() => import('../components/Identity/ReputationDisplay'));

export default function identityRoutes({ isFeatureEnabled = () => false } = {}) {
  if (!isFeatureEnabled('identity')) return null;
  return <>
    <Route path="/identity" element={<PageWrapper tabType="identity"><IdentityDashboard /></PageWrapper>} />
    <Route path="/identity/names" element={<PageWrapper tabType="identity"><NamingService /></PageWrapper>} />
    <Route path="/identity/reputation" element={<PageWrapper tabType="identity"><ReputationDisplay /></PageWrapper>} />
  </>;
}
