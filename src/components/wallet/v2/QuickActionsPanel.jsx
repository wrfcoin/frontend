/**
 * QuickActionsPanel Component
 *
 * Primary action buttons for wallet operations.
 * Primary: Send, Receive, Swap, Buy
 * Secondary: Bridge, Settings
 */

import React, { useState } from 'react';
import {
  Send,
  ArrowDownToLine,
  ArrowUpDown,
  CreditCard,
  Link2,
  Settings,
  X,
} from 'lucide-react';
import { WrfButton } from '../../DesignSystem';
import {
  filterPublicSurfaces,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
} from '../../../config/contractSurfacePolicy';
import ComingSoonPanel from './ComingSoonPanel';
import './QuickActionsPanel.css';

// Buy modal. frontend#348 review: WRF is not listed on any exchange and has
// no fiat on-ramp, so this names no venue and links nowhere.
const BuyComingSoonModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-container buy-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Buy WRF</h2>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body" data-testid="wallet-buy-unavailable">
        <ComingSoonPanel
          icon={CreditCard}
          title="WRF can't be bought"
          showBadge={false}
          description="WRF is a testnet asset. It isn't listed on any exchange and there's no card or bank purchase. Testnet WRF comes from the faucet and from contributing weather data."
        />
      </div>
      <div className="modal-footer">
        <WrfButton variant="secondary" onClick={onClose}>
          Close
        </WrfButton>
      </div>
    </div>
  </div>
);

const QuickActionsPanel = ({ onSend, onReceive, onSwap }) => {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const fullStudioEnabled = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const operatorPreviewEnabled = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );

  const primaryActions = [
    {
      id: 'send',
      label: 'Send',
      icon: Send,
      color: 'var(--accent-primary)',
      onClick: onSend,
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: ArrowDownToLine,
      color: 'var(--accent-green)',
      onClick: onReceive,
    },
    {
      id: 'swap',
      label: 'Swap',
      icon: ArrowUpDown,
      color: 'var(--accent-purple, #A855F7)',
      onClick: onSwap,
    },
    {
      id: 'buy',
      label: 'Buy',
      icon: CreditCard,
      color: 'var(--accent-amber, #F59E0B)',
      onClick: () => setShowBuyModal(true),
    },
  ];
  // Send is in the DOM only when the page passes a handler, which it does only
  // when wallet send is enabled (operator-only, frontend#345/#346).
  const visiblePrimaryActions = primaryActions.filter(
    action => action.id !== 'send' || typeof onSend === 'function',
  );

  const secondaryActions = filterPublicSurfaces([
    {
      id: 'bridge',
      label: 'Bridge',
      icon: Link2,
      path: '/bridge',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings/security',
    },
  ], fullStudioEnabled, operatorPreviewEnabled);

  return (
    <>
      <div className="wallet-card quick-actions-panel">
        {/* Primary Actions - 2x2 Grid */}
        <div className="primary-actions">
          {visiblePrimaryActions.map(action => (
            <button
              key={action.id}
              className="action-btn primary"
              onClick={action.onClick}
              style={{ '--action-color': action.color }}
            >
              <span className="action-icon">
                <action.icon size={22} />
              </span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="actions-divider" />

        {/* Secondary Actions */}
        <div className="secondary-actions">
          {secondaryActions.map(action => (
            <a
              key={action.id}
              href={action.path}
              className="action-btn secondary"
            >
              <action.icon size={16} />
              <span>{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Buy Coming Soon Modal */}
      {showBuyModal && (
        <BuyComingSoonModal onClose={() => setShowBuyModal(false)} />
      )}
    </>
  );
};

export default QuickActionsPanel;
