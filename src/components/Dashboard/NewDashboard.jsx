/**
 * WRFCoin Dashboard v2.0
 *
 * A modern, data-driven dashboard for the WRFCoin blockchain platform.
 * Features real-time weather data, crypto portfolio tracking, mining stats,
 * and DeFi integration with a professional dark theme.
 *
 * @version 2.0.0
 * @date January 2026
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Wallet,
  Cloud,
  TrendingUp,
  Server,
} from 'lucide-react';
import BackendUnavailableBanner from '../RealTime/BackendUnavailableBanner';
import { useBackendHealth } from '../../hooks/api/useBackendHealth';
import './NewDashboard.css';

const HeroStatsBar = lazy(() => import('./HeroStatsBar'));
const PortfolioCard = lazy(() => import('./PortfolioCard'));
const QuickActions = lazy(() => import('./QuickActions'));
const RecentTransactions = lazy(() => import('./RecentTransactions'));

const WeatherMap = lazy(() => import('../Weather/WeatherMap'));
const StationCarousel = lazy(() => import('../Weather/StationCarousel'));
const ImpactScore = lazy(() => import('../Weather/ImpactScore'));

const EarningsDashboard = lazy(() => import('../Earnings/EarningsDashboard'));
const PendingPayouts = lazy(() => import('../Earnings/PendingPayouts'));
const EarningsCalendar = lazy(() => import('../Earnings/EarningsCalendar'));

const NodeStatusPanel = lazy(() => import('../Network/NodeStatusPanel'));
const MiningChart = lazy(() => import('../Network/MiningChart'));
const NetworkHealth = lazy(() => import('../Network/NetworkHealth'));

const CardSkeleton = ({ height = '200px', span = 4 }) => (
  <div
    className="dashboard-card skeleton"
    style={{
      '--card-height': height,
      gridColumn: `span ${span}`,
    }}
  >
    <div className="skeleton-shimmer" />
  </div>
);

const DashboardSection = ({ title, icon: Icon, accentColor, children, className = '' }) => (
  <section className={`dashboard-section ${className}`}>
    <div className="section-header">
      <div className="section-title">
        {Icon && (
          <span className="section-icon" style={{ '--accent-color': accentColor }}>
            <Icon size={20} />
          </span>
        )}
        <h2>{title}</h2>
      </div>
    </div>
    <div className="section-content">
      {children}
    </div>
  </section>
);

const NewDashboard = () => {
  const backendHealthQuery = useBackendHealth();

  useEffect(() => {
    document.body.classList.add('dashboard-v2', 'dark-mode');

    return () => {
      document.body.classList.remove('dashboard-v2');
      document.body.classList.remove('dark-mode');
    };
  }, []);

  if (backendHealthQuery.isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Checking WRFCoin backend health...</p>
      </div>
    );
  }

  if (backendHealthQuery.isError) {
    return (
      <div className="dashboard-v2">
        <main className="dashboard-main">
          <Box sx={{ maxWidth: 920, mx: 'auto', py: 5 }}>
            <Typography variant="h4" sx={{ color: '#F8FAFC', fontWeight: 700, mb: 2 }}>
              WRFCoin Dashboard
            </Typography>
            <Typography sx={{ color: '#94A3B8', mb: 3 }}>
              Dashboard cards stay hidden until the backend confirms it is reachable.
            </Typography>
            <BackendUnavailableBanner error={backendHealthQuery.error} />
          </Box>
        </main>
        <footer className="dashboard-footer">
          <div className="footer-content">
            <span className="footer-version">WRFCoin Dashboard v2.0</span>
            <span className="footer-status">
              <span className="status-dot" />
              Backend disconnected
            </span>
            <span className="footer-timestamp">
              Last checked: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="dashboard-v2">
      <Suspense fallback={<div className="hero-stats-skeleton" />}>
        <HeroStatsBar />
      </Suspense>

      <main className="dashboard-main">
        <DashboardSection
          title="Weather & Environment"
          icon={Cloud}
          accentColor="var(--color-weather)"
          className="section-weather"
        >
          <div className="dashboard-grid">
            <Suspense fallback={<CardSkeleton height="400px" span={8} />}>
              <div className="grid-span-8">
                <WeatherMap />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="400px" span={4} />}>
              <div className="grid-span-4">
                <ImpactScore />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
              <div className="grid-span-12">
                <StationCarousel />
              </div>
            </Suspense>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Portfolio Overview"
          icon={Wallet}
          accentColor="var(--accent-primary)"
          className="section-portfolio"
        >
          <div className="dashboard-grid">
            <Suspense fallback={<CardSkeleton height="320px" span={8} />}>
              <div className="grid-span-8">
                <PortfolioCard />
              </div>
            </Suspense>

            <div className="grid-span-4 stack-vertical">
              <Suspense fallback={<CardSkeleton height="80px" span={4} />}>
                <QuickActions />
              </Suspense>

              <Suspense fallback={<CardSkeleton height="220px" span={4} />}>
                <RecentTransactions />
              </Suspense>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Earnings"
          icon={TrendingUp}
          accentColor="var(--accent-green)"
          className="section-earnings"
        >
          <div className="dashboard-grid">
            <Suspense fallback={<CardSkeleton height="280px" span={8} />}>
              <div className="grid-span-8">
                <EarningsDashboard />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="280px" span={4} />}>
              <div className="grid-span-4">
                <PendingPayouts />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
              <div className="grid-span-12">
                <EarningsCalendar />
              </div>
            </Suspense>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Network & Mining"
          icon={Server}
          accentColor="var(--color-mining)"
          className="section-network"
        >
          <div className="dashboard-grid">
            <Suspense fallback={<CardSkeleton height="300px" span={4} />}>
              <div className="grid-span-4">
                <NetworkHealth />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="300px" span={8} />}>
              <div className="grid-span-8">
                <MiningChart />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="250px" span={12} />}>
              <div className="grid-span-12">
                <NodeStatusPanel />
              </div>
            </Suspense>
          </div>
        </DashboardSection>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-content">
          <span className="footer-version">WRFCoin Dashboard v2.0</span>
          <span className="footer-status">
            <span className="status-dot online" />
            Connected to backend
          </span>
          <span className="footer-timestamp">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default NewDashboard;
