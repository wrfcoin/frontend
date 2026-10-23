/**
 * WRFCoin Data Processing v2.0 - "Terminal Luxe" Design
 *
 * A premium data processing dashboard interface with distinctive computational aesthetics.
 * Features real-time throughput monitoring, hardware status, and weather station integration.
 *
 * @version 2.0.0
 * @date January 2026
 */

import React, { useEffect, useState, Suspense, lazy } from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  Cpu,
  Zap,
  Activity,
  Cloud,
  Server,
  Settings,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Thermometer,
  TrendingUp,
  Wallet,
  Award,
} from 'lucide-react';
import { MiningProvider, useMining } from '../contexts/MiningContext';
import { deriveNodeStatus, NODE_STATUS_LABEL } from '../components/Miner/v2/nodeStatus';
import { lazyImportWithRetry } from '../utils/lazyImportWithRetry.js';
import './NewMinerPage.css';

const lazyWithRetry = importer =>
  lazy(() => lazyImportWithRetry(importer, { retries: 2, retryDelayMs: 300 }));

const readSectionOpenState = (storageKey, defaultOpen) => {
  if (!storageKey || typeof window === 'undefined') {
    return defaultOpen;
  }

  try {
    const saved = window.localStorage.getItem(`miner_section_${storageKey}`);
    if (saved === null) {
      return defaultOpen;
    }

    const parsed = JSON.parse(saved);
    return typeof parsed === 'boolean' ? parsed : defaultOpen;
  } catch (error) {
    return defaultOpen;
  }
};

// Lazy load v2 components
const MinerHero = lazyWithRetry(() => import('../components/Miner/v2/MinerHero'));
const MiningControlsPanel = lazyWithRetry(() =>
  import('../components/Miner/v2/MiningControlsPanel'),
);
const MiningStatsSection = lazyWithRetry(() =>
  import('../components/Miner/v2/MiningStatsSection'),
);
const HardwareStatusSection = lazyWithRetry(() =>
  import('../components/Miner/v2/HardwareStatusSection'),
);
const WeatherStationSection = lazyWithRetry(() =>
  import('../components/Miner/v2/WeatherStationSection'),
);
const PoolStatusSection = lazyWithRetry(() =>
  import('../components/Miner/v2/PoolStatusSection'),
);
const PerformanceSection = lazyWithRetry(() =>
  import('../components/Miner/v2/PerformanceSection'),
);
const ConfigurationSection = lazyWithRetry(() =>
  import('../components/Miner/v2/ConfigurationSection'),
);
const MobileBottomNav = lazyWithRetry(() =>
  import('../components/Miner/v2/MobileBottomNav'),
);

// Loading skeleton component
const CardSkeleton = ({ height = '200px', span = 4 }) => (
  <div
    className="miner-card skeleton"
    style={{
      '--card-height': height,
      gridColumn: `span ${span}`,
    }}
  >
    <div className="skeleton-shimmer" />
  </div>
);

// Collapsible section wrapper
const CollapsibleSection = ({
  title,
  icon: Icon,
  accentColor = 'var(--color-mining)',
  defaultOpen = true,
  storageKey,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    return readSectionOpenState(storageKey, defaultOpen);
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (storageKey) {
      try {
        window.localStorage.setItem(
          `miner_section_${storageKey}`,
          JSON.stringify(newState),
        );
      } catch (error) {
        // Keep UI responsive even if localStorage is unavailable or corrupted.
      }
    }
  };

  return (
    <section className="miner-section collapsible">
      <div className="section-header" onClick={toggleOpen}>
        <div className="section-title">
          {Icon && (
            <span className="section-icon" style={{ '--accent-color': accentColor }}>
              <Icon size={20} />
            </span>
          )}
          <h2>{title}</h2>
        </div>
        <button className="collapse-toggle" aria-label={isOpen ? 'Collapse' : 'Expand'}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {isOpen && (
        <div className="section-content">
          {children}
        </div>
      )}
    </section>
  );
};

// Section wrapper (non-collapsible)
const MinerSection = ({ title, icon: Icon, accentColor, children, className = '' }) => (
  <section className={`miner-section ${className}`}>
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

const NewMinerPageContent = () => {
  const [isMobile, setIsMobile] = useState(false);
  // frontend#355: status comes from the real node-stats poll. Nothing in the
  // browser starts, pauses or stops contribution; station collectors do.
  const { state } = useMining();
  const nodeStatus = deriveNodeStatus(state.node);

  // Handle responsive detection
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply miner theme class and sync with app dark mode
  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      typeof window === 'undefined' ||
      typeof MutationObserver === 'undefined'
    ) {
      return undefined;
    }

    // Check app's dark mode preference
    let isDarkMode = document.body.classList.contains('dark-mode');
    try {
      isDarkMode = window.localStorage.getItem('darkMode') === 'true' || isDarkMode;
    } catch (error) {
      // Continue with document class only when localStorage is unavailable.
    }

    // Add miner-v2 class
    document.body.classList.add('miner-v2');

    // Sync dark mode
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Listen for dark mode changes
    const darkModeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const hasDarkMode = document.body.classList.contains('dark-mode');
          try {
            window.localStorage.setItem('darkMode', hasDarkMode.toString());
          } catch (error) {
            // Ignore persistence failures so UI state stays functional.
          }
        }
      });
    });

    darkModeObserver.observe(document.body, { attributes: true });

    return () => {
      document.body.classList.remove('miner-v2');
      darkModeObserver.disconnect();
    };
  }, []);

  return (
    <div className="miner-v2">
      <div className="miner-main">
        {/* Page Header */}
        <header className="miner-header">
          <h1 className="miner-title">Weather Processing</h1>
          <div
            className={`miner-status-badge ${nodeStatus === 'online' ? 'active' : ''}`}
            data-testid="miner-node-status"
            title="From the node statistics poll (GET /api/mining/node-stats)"
          >
            {NODE_STATUS_LABEL[nodeStatus]}
          </div>
        </header>

        {/* Hero Row: Hashrate Display + Quick Controls */}
        <div className="miner-grid hero-row">
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="280px" span={8} />}>
              <div className="grid-span-8">
                <MinerHero nodeStatus={nodeStatus} />
              </div>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="280px" span={4} />}>
              <div className="grid-span-4">
                <MiningControlsPanel nodeStatus={nodeStatus} />
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Mining Statistics - Collapsible, default OPEN */}
        <CollapsibleSection
          title="Processing Statistics"
          icon={Activity}
          accentColor="var(--color-mining)"
          defaultOpen={true}
          storageKey="stats"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
              <MiningStatsSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>

        {/* Hardware Status - Collapsible, default OPEN */}
        <CollapsibleSection
          title="Hardware Status"
          icon={Cpu}
          accentColor="var(--color-mining)"
          defaultOpen={true}
          storageKey="hardware"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="180px" span={12} />}>
              <HardwareStatusSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>

        {/* Weather Stations - Collapsible, default OPEN */}
        <CollapsibleSection
          title="Weather Station Processing"
          icon={Cloud}
          accentColor="var(--color-weather)"
          defaultOpen={true}
          storageKey="weather"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
              <WeatherStationSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>

        {/* Pool Status - Collapsible, default CLOSED */}
        <CollapsibleSection
          title="Network Connections"
          icon={Server}
          accentColor="var(--accent-primary)"
          defaultOpen={false}
          storageKey="pools"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="150px" span={12} />}>
              <PoolStatusSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>

        {/* Performance Charts - Collapsible, default CLOSED */}
        <CollapsibleSection
          title="Performance Analytics"
          icon={BarChart3}
          accentColor="var(--accent-primary)"
          defaultOpen={false}
          storageKey="performance"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="300px" span={12} />}>
              <PerformanceSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>

        {/* Configuration - Collapsible, default CLOSED */}
        <CollapsibleSection
          title="Processing Configuration"
          icon={Settings}
          accentColor="var(--text-secondary, #94A3B8)"
          defaultOpen={false}
          storageKey="config"
        >
          <ErrorBoundary>
            <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
              <ConfigurationSection />
            </Suspense>
          </ErrorBoundary>
        </CollapsibleSection>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <MobileBottomNav nodeStatus={nodeStatus} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};

// Wrap with MiningProvider and ErrorBoundary
const NewMinerPage = () => (
  <ErrorBoundary>
    <MiningProvider>
      <NewMinerPageContent />
    </MiningProvider>
  </ErrorBoundary>
);

export default NewMinerPage;
