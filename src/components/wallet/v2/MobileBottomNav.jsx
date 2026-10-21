/**
 * MobileBottomNav Component
 *
 * Sticky bottom navigation bar for mobile with primary actions.
 * Hides when scrolling down, shows when scrolling up.
 * Includes safe area padding for notched devices.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, ArrowDownToLine, ArrowUpDown } from 'lucide-react';
import './MobileBottomNav.css';

const MobileBottomNav = ({ onSend, onReceive, onSwap }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = useRef(null);

  // Handle scroll to show/hide nav
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    // Show when scrolling up, hide when scrolling down
    // Use a threshold to avoid jittery behavior
    if (scrollDelta > 10) {
      setIsVisible(false);
    } else if (scrollDelta < -10) {
      setIsVisible(true);
    }

    // Always show when at top
    if (currentScrollY <= 50) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [handleScroll]);

  const actions = [
    {
      id: 'send',
      label: 'Send',
      icon: Send,
      color: 'var(--accent-primary, #3B82F6)',
      onClick: onSend,
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: ArrowDownToLine,
      color: 'var(--accent-green, #22C55E)',
      onClick: onReceive,
    },
    {
      id: 'swap',
      label: 'Swap',
      icon: ArrowUpDown,
      color: 'var(--accent-purple, #A855F7)',
      onClick: onSwap,
    },
  ];
  // Send only with a handler (wallet send enabled); never a dead button.
  const visibleActions = actions.filter(
    action => action.id !== 'send' || typeof onSend === 'function',
  );

  return (
    <nav
      ref={navRef}
      className={`mobile-bottom-nav ${isVisible ? 'visible' : 'hidden'}`}
      aria-label="Quick actions"
    >
      <div className="nav-container">
        {visibleActions.map((action) => (
          <button
            key={action.id}
            className="nav-action"
            onClick={action.onClick}
            style={{ '--action-color': action.color }}
            aria-label={action.label}
          >
            <span className="nav-icon">
              <action.icon size={22} />
            </span>
            <span className="nav-label">{action.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
