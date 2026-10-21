/**
 * WRFCoin Wallet v2.0
 *
 * A modern, streamlined wallet interface matching Dashboard v2.0 design.
 * Features progressive disclosure, crypto-only MVP scope, and mobile-first design.
 *
 * @version 2.0.0
 * @date January 2026
 */

import React, { useEffect, useState, Suspense, lazy } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  PieChart,
  History,
  Image,
  Link2,
  Shield,
  Cpu,
  ArrowUpDown,
  AlertTriangle,
  X,
} from 'lucide-react';
import './NewWalletPage.css';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWalletData } from '../hooks/useWalletData';
import { NETWORK_NAME } from '../config/network';
import { FEATURES } from '../config/features';

// Lazy load components for better performance
const WalletHero = lazy(() => import('../components/wallet/v2/WalletHero'));
const QuickActionsPanel = lazy(() => import('../components/wallet/v2/QuickActionsPanel'));
const TokenList = lazy(() => import('../components/wallet/v2/TokenList'));
const TransactionFeed = lazy(() => import('../components/wallet/v2/TransactionFeed'));
const MobileBottomNav = lazy(() => import('../components/wallet/v2/MobileBottomNav'));
const SendModal = lazy(() => import('../components/wallet/v2/SendModal'));
const ReceiveModal = lazy(() => import('../components/wallet/v2/ReceiveModal'));

// Phase 2: Collapsible section components
const WalletOverviewSection = lazy(() => import('../components/wallet/v2/WalletOverviewSection'));
const NFTGallerySection = lazy(() => import('../components/wallet/v2/NFTGallerySection'));
const HardwareWalletSection = lazy(() => import('../components/wallet/v2/HardwareWalletSection'));

// Surfaces that previously rendered fabricated holdings / fiat values. The
// backend has no per-token-balance or fiat-price endpoint yet, so for the
// testnet launch these are gated behind a "Coming soon (post-testnet)" panel
// instead of showing mock data. The mock components (MultiAssetSection,
// SwapModal, CrossChainSection, TransactionHistorySection) remain in the repo,
// unrendered, ready to re-enable once the backend endpoints land.
import ComingSoonPanel from '../components/wallet/v2/ComingSoonPanel';

// Loading skeleton component
const CardSkeleton = ({ height = '200px', span = 4 }) => (
  <div
    className="wallet-card skeleton"
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
  accentColor,
  defaultOpen = true,
  storageKey,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`wallet_section_${storageKey}`);
      return saved !== null ? JSON.parse(saved) : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (storageKey) {
      localStorage.setItem(`wallet_section_${storageKey}`, JSON.stringify(newState));
    }
  };

  return (
    <section className="wallet-section collapsible">
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
const WalletSection = ({ title, icon: Icon, accentColor, children, className = '' }) => (
  <section className={`wallet-section ${className}`}>
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

// Swap is not wired to a live AMM / price source for the testnet launch.
// Show an honest "coming soon" modal instead of the mock SwapModal.
const SwapComingSoonModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Swap</h2>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        <ComingSoonPanel
          icon={ArrowUpDown}
          title="Swaps are coming soon"
          description="Token swaps will be available after the testnet launch, once on-chain liquidity and live pricing are wired up."
        />
      </div>
    </div>
  </div>
);

const NewWalletPage = () => {
  const [activeModal, setActiveModal] = useState(null); // 'send' | 'receive' | 'swap' | null
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const {
    account,
    refreshAccountBalance,
    sendTransaction,
    walletNotice,
    activeProvider,
    receiveOnly,
  } = useWalletConnection();
  const { balance: walletBalance } = useWalletData({ withTransactions: false });

  // Handle responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply wallet theme class and sync with app dark mode
  useEffect(() => {
    // Check app's dark mode preference from localStorage or existing body class
    const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
                       document.body.classList.contains('dark-mode');

    // Add wallet-v2 class
    document.body.classList.add('wallet-v2');

    // Sync dark mode
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Listen for dark mode changes (from other parts of the app)
    const darkModeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // Force re-render if dark mode changes
          const hasDarkMode = document.body.classList.contains('dark-mode');
          localStorage.setItem('darkMode', hasDarkMode.toString());
        }
      });
    });

    darkModeObserver.observe(document.body, { attributes: true });

    return () => {
      document.body.classList.remove('wallet-v2');
      darkModeObserver.disconnect();
    };
  }, []);

  // Modal handlers
  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);
  // Send is operator-only (frontend#345/#346): without it there is no Send
  // button anywhere on the page, not a disabled one.
  const walletSend = Boolean(FEATURES.walletSend);
  const onSend = walletSend ? () => openModal('send') : undefined;

  return (
    <div className="wallet-v2">
      {/* Main Wallet Content */}
      <main className="wallet-main">
        {walletNotice && (
          <div className="wallet-scheme-notice" role="alert" data-testid="wallet-scheme-notice">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>{walletNotice}</span>
          </div>
        )}
        {/* Hero Row: Balance + Quick Actions */}
        <div className="wallet-grid hero-row">
          <Suspense fallback={<CardSkeleton height="200px" span={8} />}>
            <div className="grid-span-8">
              <WalletHero />
            </div>
          </Suspense>

          <Suspense fallback={<CardSkeleton height="200px" span={4} />}>
            <div className="grid-span-4">
              <QuickActionsPanel
                onSend={onSend}
                onReceive={() => openModal('receive')}
                onSwap={() => openModal('swap')}
              />
            </div>
          </Suspense>
        </div>

        {/* Buy & Sell Section */}
        <WalletSection
          title="Buy & Sell"
          icon={CreditCard}
          accentColor="var(--accent-green)"
          className="section-fiat-ramp"
        >
          {/* frontend#348 review: WRF is an unlisted testnet asset, so there is
              no card/bank purchase or fiat cash-out. No ramp link, and the
              wallet address is never sent to a third party. */}
          <div data-testid="wallet-fiat-unavailable">
            <ComingSoonPanel
              icon={CreditCard}
              title="No fiat purchases or cash-out on testnet"
              showBadge={false}
              description="WRF is a testnet asset with no market price and no exchange or fiat listing. You can't buy it with a card or bank transfer, and you can't convert it to USD, EUR or GBP."
            />
          </div>
        </WalletSection>

        {/* Assets Section */}
        <WalletSection
          title="Your Assets"
          icon={Wallet}
          accentColor="var(--accent-primary)"
          className="section-assets"
        >
          <div className="wallet-grid">
            <Suspense fallback={<CardSkeleton height="320px" span={6} />}>
              <div className="grid-span-6">
                <TokenList onQuickSwap={(token) => {
                  // Pre-fill swap with token and open modal
                  openModal('swap');
                }} />
              </div>
            </Suspense>

            <Suspense fallback={<CardSkeleton height="320px" span={6} />}>
              <div className="grid-span-6">
                <TransactionFeed />
              </div>
            </Suspense>
          </div>
        </WalletSection>

        {/* Portfolio Insights and the Advanced panel were "coming in Phase 2"
            teasers for features that do not exist (2FA, Ledger); removed. */}

        {/* Phase 2: Detailed Section Expanders */}

        {/* Wallet Overview Section */}
        <CollapsibleSection
          title="Wallet Overview"
          icon={LayoutDashboard}
          accentColor="var(--accent-primary)"
          defaultOpen={false}
          storageKey="overview"
        >
          <Suspense fallback={<CardSkeleton height="200px" span={12} />}>
            <WalletOverviewSection onSend={onSend} onReceive={() => openModal('receive')} />
          </Suspense>
        </CollapsibleSection>

        {/* Multi-Asset Portfolio */}
        <CollapsibleSection
          title="Multi-Asset Portfolio"
          icon={PieChart}
          accentColor="var(--accent-purple, #8B5CF6)"
          defaultOpen={false}
          storageKey="multiasset"
        >
          <ComingSoonPanel
            icon={PieChart}
            title="Multi-asset portfolio coming soon"
            description="Per-token balances and fiat valuations need a backend price feed that isn't live yet. We won't show fabricated holdings — this unlocks after the testnet launch."
          />
        </CollapsibleSection>

        {/* Transaction History */}
        <CollapsibleSection
          title="Transaction History"
          icon={History}
          accentColor="var(--accent-amber, #F59E0B)"
          defaultOpen={false}
          storageKey="txhistory"
        >
          <ComingSoonPanel
            icon={History}
            title="Detailed history coming soon"
            description="This advanced view mixed cross-chain and fiat figures we can't source yet. Your live on-chain activity is shown in the Your Assets section above. The full history view unlocks after the testnet launch."
          />
        </CollapsibleSection>

        {/* NFT Gallery */}
        <CollapsibleSection
          title="NFT Gallery"
          icon={Image}
          accentColor="var(--accent-pink, #EC4899)"
          defaultOpen={false}
          storageKey="nftgallery"
        >
          <Suspense fallback={<CardSkeleton height="350px" span={12} />}>
            <NFTGallerySection />
          </Suspense>
        </CollapsibleSection>

        {/* Cross-Chain Bridge */}
        <CollapsibleSection
          title="Cross-Chain Bridge"
          icon={Link2}
          accentColor="var(--accent-cyan, #06B6D4)"
          defaultOpen={false}
          storageKey="crosschain"
        >
          <ComingSoonPanel
            icon={Link2}
            title="Cross-chain bridge coming soon"
            description="Bridging to other chains isn't enabled for the testnet launch. This section previously showed placeholder bridge data — it returns post-testnet."
          />
        </CollapsibleSection>

        {/* Security & Backup */}
        <CollapsibleSection
          title="Security & Backup"
          icon={Shield}
          accentColor="var(--accent-green)"
          defaultOpen={false}
          storageKey="security"
        >
          {/* frontend#348 review: this section used to show an invented security
              score, "passed" checks and a hardcoded 12-word recovery phrase.
              None of it had a source, so nothing is shown. */}
          <div data-testid="wallet-security-unavailable">
            <ComingSoonPanel
              icon={Shield}
              title="Security tools aren't available yet"
              description="This page doesn't track security settings, and it never shows or backs up your recovery phrase. The phrase you wrote down when you created the wallet is the only way to recover it — keep it offline and never share it."
            />
          </div>
        </CollapsibleSection>

        {/* Hardware Wallet */}
        <CollapsibleSection
          title="Hardware Wallet"
          icon={Cpu}
          accentColor="var(--accent-orange, #F97316)"
          defaultOpen={false}
          storageKey="hardware"
        >
          <Suspense fallback={<CardSkeleton height="300px" span={12} />}>
            <HardwareWalletSection />
          </Suspense>
        </CollapsibleSection>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Suspense fallback={null}>
          <MobileBottomNav
            onSend={onSend}
            onReceive={() => openModal('receive')}
            onSwap={() => openModal('swap')}
          />
        </Suspense>
      )}

      {/* Modals */}
      {walletSend && activeModal === 'send' && (
        <Suspense fallback={null}>
          <SendModal
            onClose={closeModal}
            activeProvider={activeProvider}
            receiveOnly={receiveOnly}
            senderAddress={account}
            walletBalance={walletBalance}
            sendWalletTransaction={async ({ to, amount }) => ({
              txHash: await sendTransaction({ to, amount }),
            })}
            onSendComplete={() => refreshAccountBalance(account)}
          />
        </Suspense>
      )}

      {activeModal === 'receive' && (
        <Suspense fallback={null}>
          <ReceiveModal onClose={closeModal} walletAddress={account} />
        </Suspense>
      )}

      {activeModal === 'swap' && <SwapComingSoonModal onClose={closeModal} />}

      {/* Footer */}
      <footer className="wallet-footer">
        <div className="footer-content">
          <span className="footer-version">WRFCoin Wallet v2.0</span>
          <span className="footer-status">Network: {NETWORK_NAME}</span>
        </div>
      </footer>
    </div>
  );
};

export default NewWalletPage;
