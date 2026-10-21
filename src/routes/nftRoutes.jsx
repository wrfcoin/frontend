import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';

const UnifiedNFTDashboard = lazy(() => import('../components/nft/UnifiedNFTDashboard'));
const ComputationalNFTPage = lazy(() => import('../pages/ComputationalNFTPage'));
const EnhancedNFTPage = lazy(() => import('../pages/EnhancedNFTPage'));
const GraphQLQueryInterface = lazy(() => import('../components/ComputationalNFT/GraphQLQueryInterface'));

export default function nftRoutes() {
  return <>
    <Route path="/nfts" element={<PageWrapper tabType="nft"><UnifiedNFTDashboard /></PageWrapper>} />
    <Route path="/nfts/details/:id" element={<PageWrapper tabType="nft"><ComputationalNFTPage /></PageWrapper>} />
    <Route path="/nfts/enhanced" element={<PageWrapper tabType="nft"><EnhancedNFTPage /></PageWrapper>} />
    <Route path="/nfts/graphql" element={<PageWrapper tabType="nft"><GraphQLQueryInterface /></PageWrapper>} />
  </>;
}
