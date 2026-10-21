import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import DeprecatedRedirect from '../components/common/DeprecatedRedirect';
import FEATURES from '../config/features';

const ProposalDetail = lazy(() => import('../components/Governance/ProposalDetail'));
const ComprehensiveGovernanceDashboard = lazy(() => import('../components/Governance/ComprehensiveGovernanceDashboard'));
const QuadraticVotingPanel = lazy(() => import('../components/GovernanceAdvanced'));
const ConvictionVotingPanel = lazy(() => import('../components/GovernanceAdvanced/ConvictionVotingPanel'));
const DelegationManager = lazy(() => import('../components/GovernanceAdvanced/DelegationManager'));
const TreasuryDashboard = lazy(() => import('../components/GovernanceAdvanced/TreasuryDashboard'));
const ProposalAnalytics = lazy(() => import('../components/GovernanceAdvanced/ProposalAnalytics'));
const ActorStatusPage = lazy(() => import('../pages/ActorStatusPage'));
const SanctionTimelinePage = lazy(() => import('../pages/SanctionTimelinePage'));
const ParticipationOnboardingPage = lazy(() => import('../pages/ParticipationOnboardingPage'));
const AppealsPortalPage = lazy(() => import('../pages/AppealsPortalPage'));
const ActorTransparencyPage = lazy(() => import('../pages/ActorTransparencyPage'));
const MultilingualPolicyPage = lazy(() => import('../pages/MultilingualPolicyPage'));
const ForecastCoverageDashboardPage = lazy(() => import('../pages/ForecastCoverageDashboardPage'));

const PublicGovernanceListPage = lazy(() => import('../pages/PublicGovernancePage').then(m => ({ default: m.PublicGovernanceListPage })));
const PublicGovernanceProposalPage = lazy(() => import('../pages/PublicGovernancePage').then(m => ({ default: m.PublicGovernanceProposalPage })));

export default function governanceRoutes() {
  return <>
    {/* Public read-only governance (S4): exact policy entries, read-only service calls only */}
    <Route path="/governance/public" element={<PageWrapper tabType="governance"><PublicGovernanceListPage /></PageWrapper>} />
    <Route path="/governance/public/:proposalId" element={<PageWrapper tabType="governance"><PublicGovernanceProposalPage /></PageWrapper>} />

    {/* Main governance redirects */}
    <Route path="/governance" element={<DeprecatedRedirect to="/governance/comprehensive" />} />
    <Route path="/governance/proposals/enhanced" element={<DeprecatedRedirect to="/governance/comprehensive" />} />
    <Route path="/governance/foundation" element={<DeprecatedRedirect to="/governance/comprehensive" />} />
    <Route path="/governance/eip712" element={<DeprecatedRedirect to="/resources" />} />
    <Route path="/governance/proposals/:id" element={<PageWrapper tabType="governance"><ProposalDetail /></PageWrapper>} />
    <Route path="/governance/comprehensive" element={<PageWrapper tabType="governance"><ComprehensiveGovernanceDashboard /></PageWrapper>} />

    {/* Advanced Governance */}
    {FEATURES.governanceAdvanced && <>
      <Route path="/governance/quadratic" element={<PageWrapper tabType="governance"><QuadraticVotingPanel /></PageWrapper>} />
      <Route path="/governance/conviction" element={<PageWrapper tabType="governance"><ConvictionVotingPanel /></PageWrapper>} />
      <Route path="/governance/delegation" element={<PageWrapper tabType="governance"><DelegationManager /></PageWrapper>} />
      <Route path="/governance/treasury" element={<PageWrapper tabType="governance"><TreasuryDashboard /></PageWrapper>} />
      <Route path="/governance/analytics" element={<PageWrapper tabType="governance"><ProposalAnalytics /></PageWrapper>} />
    </>}

    {/* Governance UX pages */}
    <Route path="/governance/actor-status" element={<PageWrapper tabType="governance"><ActorStatusPage /></PageWrapper>} />
    <Route path="/governance/sanctions" element={<PageWrapper tabType="governance"><SanctionTimelinePage /></PageWrapper>} />
    <Route path="/governance/onboarding" element={<PageWrapper tabType="governance"><ParticipationOnboardingPage /></PageWrapper>} />
    <Route path="/governance/appeals" element={<PageWrapper tabType="governance"><AppealsPortalPage /></PageWrapper>} />
    <Route path="/governance/actor-transparency" element={<PageWrapper tabType="governance"><ActorTransparencyPage /></PageWrapper>} />
    <Route path="/governance/policies" element={<PageWrapper tabType="governance"><MultilingualPolicyPage /></PageWrapper>} />
    <Route path="/governance/coverage" element={<PageWrapper tabType="governance"><ForecastCoverageDashboardPage /></PageWrapper>} />
  </>;
}
