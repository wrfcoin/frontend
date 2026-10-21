import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { ArrowDownward } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PullToRefreshProps {
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  primary: '#3B82F6',
  muted: '#94A3B8',
} as const;

const THRESHOLD = 80;
const MAX_PULL = 120;
const RESISTANCE = 2.5;

// ---------------------------------------------------------------------------
// Haptic feedback helper
// ---------------------------------------------------------------------------

const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  try {
    if ('vibrate' in navigator) {
      const durations: Record<string, number> = { light: 10, medium: 20, heavy: 40 };
      navigator.vibrate(durations[style]);
    }
  } catch {
    // Haptic not available
  }
};

// ---------------------------------------------------------------------------
// PullToRefresh
// ---------------------------------------------------------------------------

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTouchDevice =
    typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;

      const scrollTop =
        containerRef.current?.scrollTop ??
        document.documentElement.scrollTop ??
        0;
      if (scrollTop > 0) return;

      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || disabled || refreshing) return;

      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY < 0) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }

      const distance = Math.min(deltaY / RESISTANCE, MAX_PULL);
      setPullDistance(distance);

      // Trigger haptic when crossing threshold
      if (distance >= THRESHOLD && !hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = true;
        triggerHaptic('medium');
      } else if (distance < THRESHOLD && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    },
    [disabled, refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && onRefresh && !refreshing) {
      triggerHaptic('heavy');
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } catch {
        // Refresh failed silently
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh, disabled, refreshing]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;
  const showIndicator = pullDistance > 5 || refreshing;

  if (!isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <Box
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ position: 'relative', minHeight: '100%' }}
    >
      {/* Pull indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: pullDistance > 5 ? pullDistance : 0,
          overflow: 'hidden',
          transition: isPulling.current
            ? 'none'
            : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {showIndicator && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'rgba(59,130,246,0.15)',
              opacity: Math.min(progress * 1.5, 1),
              transition: isPulling.current ? 'none' : 'opacity 0.2s ease',
            }}
          >
            {refreshing ? (
              <CircularProgress size={20} sx={{ color: COLORS.primary }} />
            ) : (
              <ArrowDownward
                sx={{
                  color: progress >= 1 ? COLORS.primary : COLORS.muted,
                  fontSize: 20,
                  transform: `rotate(${rotation}deg)`,
                  transition: isPulling.current
                    ? 'none'
                    : 'transform 0.2s ease, color 0.2s ease',
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Content area pushed down during pull */}
      <Box
        sx={{
          transform: `translateY(${pullDistance > 5 ? pullDistance : 0}px)`,
          transition: isPulling.current
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: pullDistance > 0 ? 'transform' : 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PullToRefresh;
