import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FEATURES from '../config/features';

const NewMinerPage = lazy(() => import('../pages/NewMinerPage'));
const ComputeMarketplace = lazy(() => import('../components/ComputeMarketplace'));

export default function miningRoutes() {
  return <>
    <Route path="/miner" element={<PageWrapper tabType="mining"><NewMinerPage /></PageWrapper>} />
    {FEATURES.computeMarketplace && <Route path="/compute" element={<PageWrapper tabType="mining"><ComputeMarketplace /></PageWrapper>} />}
  </>;
}
