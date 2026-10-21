/**
 * ComingSoonPanel
 *
 * Honest placeholder for wallet surfaces that are not wired to real on-chain
 * data yet (per-token balances, fiat pricing, cross-chain bridge state).
 *
 * For the testnet launch these surfaces previously rendered fabricated
 * holdings / fiat numbers. Rather than show fake data we render a clear
 * "Coming soon (post-testnet)" panel. The underlying mock components are kept
 * in the tree (unrendered) so they can be re-enabled once the backend exposes
 * the missing per-token-balance and fiat-price endpoints.
 *
 * @see NewWalletPage.jsx for usage / gating.
 */

import React from 'react';
import { Clock } from 'lucide-react';
import './ComingSoonPanel.css';

const ComingSoonPanel = ({
  icon: Icon = Clock,
  title = 'Coming soon',
  description = 'This feature is not available during the testnet launch.',
  // Set false where "Post-testnet" would promise something we don't (e.g.
  // that WRF will become buyable). Defaults to the original behaviour.
  showBadge = true,
}) => (
  <div className="wallet-coming-soon" role="status">
    <div className="wallet-coming-soon-icon">
      <Icon size={40} />
    </div>
    <h3 className="wallet-coming-soon-title">{title}</h3>
    <p className="wallet-coming-soon-desc">{description}</p>
    {showBadge && <span className="wallet-coming-soon-badge">Post-testnet</span>}
  </div>
);

export default ComingSoonPanel;
