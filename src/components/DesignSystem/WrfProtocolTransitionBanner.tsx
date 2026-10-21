/**
 * WrfProtocolTransitionBanner
 *
 * Displays a sticky alert banner when a protocol upgrade/fork transition
 * is active. Severity escalates with the transition phase.
 *
 * Usage:
 *   <WrfProtocolTransitionBanner />                       -- app-level, all modules
 *   <WrfProtocolTransitionBanner scope="governance" />    -- only for governance module
 *   <WrfProtocolTransitionBanner dismissible />           -- user can dismiss
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SxProps, Theme } from '@mui/material/styles';
import { WrfAlert } from './WrfAlert';
import { useCapabilitiesContext } from '../../contexts/CapabilitiesContext';
import type { TransitionPhase, ProtocolTransitionState } from '../../types/capabilities';

export interface WrfProtocolTransitionBannerProps {
  /** Direct transition state (overrides context lookup) */
  transition?: ProtocolTransitionState;
  /** Whether the banner can be dismissed (persisted per proposal in sessionStorage) */
  dismissible?: boolean;
  /** Only show if this module is in the affected list */
  scope?: string;
  sx?: SxProps<Theme>;
}

interface PhaseConfig {
  severity: 'info' | 'warning' | 'error';
  icon: React.ReactElement;
  titlePrefix: string;
}

const PHASE_CONFIG: Record<TransitionPhase, PhaseConfig> = {
  none: { severity: 'info', icon: <InfoOutlinedIcon />, titlePrefix: '' },
  planned: { severity: 'info', icon: <InfoOutlinedIcon />, titlePrefix: 'Upcoming Upgrade' },
  simulation: { severity: 'info', icon: <ScienceIcon />, titlePrefix: 'Upgrade Simulation' },
  timelock: { severity: 'warning', icon: <TimerIcon />, titlePrefix: 'Upgrade Timelock' },
  'compatibility-window': { severity: 'warning', icon: <WarningAmberIcon />, titlePrefix: 'Compatibility Window' },
  finalization: { severity: 'warning', icon: <BuildIcon />, titlePrefix: 'Upgrade Finalizing' },
  rollback: { severity: 'error', icon: <ErrorOutlineIcon />, titlePrefix: 'Upgrade Rollback' },
};

function getDismissKey(proposalId: string): string {
  return `wrf-transition-dismissed-${proposalId}`;
}

export const WrfProtocolTransitionBanner = React.forwardRef<
  HTMLDivElement,
  WrfProtocolTransitionBannerProps
>(function WrfProtocolTransitionBanner(
  { transition: transitionProp, dismissible = false, scope, sx },
  ref,
) {
  const { protocolTransition: contextTransition } = useCapabilitiesContext();
  const transition = transitionProp ?? contextTransition;

  const proposalId = transition?.proposal?.id ?? '';
  const [dismissed, setDismissed] = useState(() => {
    if (!proposalId) return false;
    try {
      return sessionStorage.getItem(getDismissKey(proposalId)) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (proposalId) {
      try {
        sessionStorage.setItem(getDismissKey(proposalId), 'true');
      } catch {
        // sessionStorage may be unavailable
      }
    }
  }, [proposalId]);

  const shouldShow = useMemo(() => {
    if (!transition || transition.phase === 'none') return false;
    if (!transition.active && transition.phase !== 'rollback') return false;
    if (dismissed) return false;
    if (scope && !transition.affectedModules.includes(scope)) return false;
    return true;
  }, [transition, dismissed, scope]);

  if (!shouldShow || !transition) {
    return null;
  }

  const config = PHASE_CONFIG[transition.phase];
  const title = transition.proposal
    ? `${config.titlePrefix}: ${transition.proposal.title}`
    : config.titlePrefix;

  const remainingText = transition.timing?.remainingSeconds != null
    ? formatRemaining(transition.timing.remainingSeconds)
    : null;

  return (
    <Box ref={ref} sx={[{ mb: 2 }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}>
      <WrfAlert
        severity={config.severity}
        icon={config.icon}
        title={title}
        dismissible={dismissible}
        onDismiss={handleDismiss}
      >
        <Typography variant="body2">{transition.message}</Typography>
        {transition.proposal && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Risk: {transition.proposal.riskLevel} | Module: {transition.proposal.targetModule}
            {remainingText && ` | ${remainingText} remaining`}
          </Typography>
        )}
        {transition.gateRiskyActions && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.5, fontWeight: 600, color: 'warning.main' }}
          >
            Sensitive operations are restricted during this phase.
          </Typography>
        )}
      </WrfAlert>
    </Box>
  );
});

function formatRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
