/**
 * QuickActions Component
 *
 * Horizontal button group for common wallet operations:
 * Send, Receive, Swap, Bridge, Buy
 */

import React, { useState } from 'react';
import {
  Send,
  ArrowDownToLine,
  ArrowUpDown,
  Landmark,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import './QuickActions.css';

const actions = [
  {
    id: 'send',
    label: 'Send',
    icon: Send,
    color: '#3B82F6',
    description: 'Transfer tokens',
  },
  {
    id: 'receive',
    label: 'Receive',
    icon: ArrowDownToLine,
    color: '#22C55E',
    description: 'Get your address',
  },
  {
    id: 'swap',
    label: 'Swap',
    icon: ArrowUpDown,
    color: '#8B5CF6',
    description: 'Exchange tokens',
  },
  {
    id: 'bridge',
    label: 'Bridge',
    icon: Landmark,
    color: '#F97316',
    description: 'Cross-chain transfer',
  },
  {
    id: 'buy',
    label: 'Buy',
    icon: CreditCard,
    color: '#14B8A6',
    description: 'Purchase crypto',
  },
];

const ActionButton = ({ action, onClick, isActive }) => {
  const Icon = action.icon;

  return (
    <button
      className={`action-btn ${isActive ? 'active' : ''}`}
      onClick={() => onClick(action.id)}
      style={{ '--action-color': action.color }}
      title={action.description}
    >
      <span className="action-icon">
        <Icon size={20} />
      </span>
      <span className="action-label">{action.label}</span>
    </button>
  );
};

const QuickActions = ({ onActionClick }) => {
  const [activeAction, setActiveAction] = useState(null);

  const handleClick = (actionId) => {
    setActiveAction(actionId);

    // In production, this would open a modal or navigate
    if (onActionClick) {
      onActionClick(actionId);
    }

    // Reset after animation
    setTimeout(() => setActiveAction(null), 300);
  };

  return (
    <div className="quick-actions dashboard-card no-hover">
      <div className="actions-header">
        <h4>Quick Actions</h4>
        <button className="more-actions-btn">
          More <ChevronRight size={14} />
        </button>
      </div>

      <div className="actions-grid">
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={handleClick}
            isActive={activeAction === action.id}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
