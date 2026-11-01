import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FEATURES from '../config/features';

// Leaderboard
const GlobalLeaderboard = lazy(() => import('../components/Leaderboard'));
const StationOfTheDay = lazy(() => import('../components/Leaderboard/StationOfTheDay'));
const ContributorProfile = lazy(() => import('../components/Leaderboard/ContributorProfile'));
const NearbyStations = lazy(() => import('../components/Leaderboard/NearbyStations'));
const CooperativeHub = lazy(() => import('../components/Leaderboard/CooperativeHub'));
const ContributorLeaderboardPage = lazy(() => import('../pages/ContributorLeaderboardPage'));
const PublicContributorProfilePage = lazy(() => import('../pages/PublicContributorProfilePage'));
const PublicForecastersPage = lazy(() => import('../pages/PublicForecastersPage'));
const PublicForecasterPage = lazy(() => import('../pages/PublicForecasterPage'));
const PublicProofCardPage = lazy(() => import('../pages/PublicProofCardPage'));
const PublicNetworkNodesPage = lazy(() => import('../pages/PublicNetworkNodesPage'));
const PublicCompetitionsPage = lazy(() => import('../pages/PublicCompetitionsPage'));
const PublicForecastCheckPage = lazy(() => import('../pages/PublicForecastCheckPage'));

// Community & Social
const CommunityForums = lazy(() => import('../components/CommunityForums'));
const GamificationDashboard = lazy(() => import('../components/Gamification/GamificationDashboard'));
const AchievementBadgeSystem = lazy(() => import('../components/Achievements/AchievementBadgeSystem'));
const WeatherStreakPage = lazy(() => import('../pages/WeatherStreakPage'));
const ProofOfMemePage = lazy(() => import('../pages/ProofOfMemePage'));
const ReferralsPage = lazy(() => import('../pages/ReferralsPage'));
const WeatherRecapPage = lazy(() => import('../pages/WeatherRecapPage'));

// Messaging
const SecureMessaging = lazy(() => import('../components/SecureMessaging/SecureMessaging'));
const MessagingHub = lazy(() => import('../components/Communication/MessagingHub'));
const SecureMessagingTest = lazy(() => import('../components/Testing/SecureMessagingTest'));
const AddressBook = lazy(() => import('../components/AddressBook/AddressBook'));

export default function communityRoutes({ isFeatureEnabled = () => false } = {}) {
  return <>
    {/* Leaderboard */}
    {isFeatureEnabled('leaderboard') && <>
      <Route path="/leaderboard" element={<PageWrapper tabType="community"><GlobalLeaderboard /></PageWrapper>} />
      {/*
        StationOfTheDay makes ZERO network calls and renders a hard-coded
        FEATURED_STATION constant ('Eagle Ridge Observatory'). Verified by direct
        render: 979 characters of invented station data, no live path at all.

        It sits one click from /leaderboard, which IS wired to real data — a real
        parent vouching for a fabricated child, which is worse than an obviously
        fake page because the surrounding truth lends it credibility.

        Gated rather than labelled because there is no endpoint to wire it to and
        nothing here is real. demoSurfaces defaults FALSE (frontend#214).
      */}
      {FEATURES.demoSurfaces && (
        <Route path="/leaderboard/station-of-the-day" element={<PageWrapper tabType="community"><StationOfTheDay /></PageWrapper>} />
      )}
      <Route path="/leaderboard/profile/:address" element={<PageWrapper tabType="community"><ContributorProfile /></PageWrapper>} />
      <Route path="/leaderboard/nearby" element={<PageWrapper tabType="community"><NearbyStations /></PageWrapper>} />
      {isFeatureEnabled('community') && <Route path="/leaderboard/cooperatives" element={<PageWrapper tabType="community"><CooperativeHub /></PageWrapper>} />}
    </>}
    {/* The public read-only page has its own capability gate (`leaderboardRead`): see CapabilitiesContext. */}
    {isFeatureEnabled('leaderboardRead') && <Route path="/leaderboard/contributors" element={<PageWrapper tabType="community"><ContributorLeaderboardPage /></PageWrapper>} />}

    {/* Public contributor profile by opaque c_ key (S6); never a raw address */}
    <Route path="/contributor/:key" element={<PageWrapper tabType="community"><PublicContributorProfilePage /></PageWrapper>} />

    {/* Forecaster track record (core4#3604 A4, [post-GO]); the public route policy decides reachability */}
    <Route path="/forecasters" element={<PageWrapper tabType="community"><PublicForecastersPage /></PageWrapper>} />
    <Route path="/forecasters/:profileKey" element={<PageWrapper tabType="community"><PublicForecasterPage /></PageWrapper>} />
    <Route path="/competitions" element={<PageWrapper tabType="community"><PublicCompetitionsPage /></PageWrapper>} />

    {/* Proof card for one station reading (backend#229, owner demo 2026-11-01); the public route policy decides reachability */}
    <Route path="/proof/:commitId" element={<PageWrapper tabType="community"><PublicProofCardPage /></PageWrapper>} />
    {/* Producers and bonded nodes (owner demo 2026-11-01); /network/* is never public, so the page is /nodes */}
    <Route path="/nodes" element={<PageWrapper tabType="community"><PublicNetworkNodesPage /></PageWrapper>} />

    {/* Forecast check: on-chain forecasts vs station readings and NOAA (demo item 7); the public route policy decides reachability */}
    <Route path="/forecast-check" element={<PageWrapper tabType="community"><PublicForecastCheckPage /></PageWrapper>} />

    {/* Community */}
    {isFeatureEnabled('community') && <Route path="/community" element={<PageWrapper tabType="weather"><CommunityForums /></PageWrapper>} />}
    {FEATURES.gamification && <Route path="/gamification" element={<PageWrapper tabType="gamification"><GamificationDashboard /></PageWrapper>} />}
    {FEATURES.achievements && <Route path="/achievements" element={<PageWrapper tabType="achievements"><AchievementBadgeSystem /></PageWrapper>} />}
    <Route path="/streak" element={<PageWrapper tabType="gamification"><WeatherStreakPage /></PageWrapper>} />
    <Route path="/meme" element={<PageWrapper tabType="gamification"><ProofOfMemePage /></PageWrapper>} />
    <Route path="/referrals" element={<PageWrapper tabType="community"><ReferralsPage /></PageWrapper>} />
    {FEATURES.impact && <>
      <Route path="/impact" element={<PageWrapper tabType="community"><WeatherRecapPage /></PageWrapper>} />
      <Route path="/impact/:address" element={<PageWrapper tabType="community"><WeatherRecapPage /></PageWrapper>} />
    </>}

    {/* Messaging */}
    {FEATURES.messaging && <>
      <Route path="/messaging" element={<PageWrapper tabType="messaging"><SecureMessaging /></PageWrapper>} />
      <Route path="/messaging/hub" element={<PageWrapper tabType="messaging"><MessagingHub /></PageWrapper>} />
      <Route path="/messaging/test" element={<PageWrapper tabType="messaging"><SecureMessagingTest /></PageWrapper>} />
      <Route path="/address-book" element={<PageWrapper tabType="contacts"><AddressBook /></PageWrapper>} />
    </>}
  </>;
}
