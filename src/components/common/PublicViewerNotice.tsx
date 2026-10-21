import React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
// Import the component file directly, not the `../DesignSystem` barrel: the
// barrel re-exports ~20 files, several of which read import.meta.env at
// module scope via config/features.ts — which throws under this repo's
// current Jest/ts-jest ESM setup (import.meta.env is undefined there). No
// existing test happens to exercise that path today; importing the barrel
// here would make this the first one to trip it.
import { WrfEmptyState } from '../DesignSystem/WrfEmptyState';

/**
 * Honest "not available to you right now" state for a public, anonymous
 * visitor — used in place of a spinner-forever, a red error toast, or mock
 * numbers when a page's data isn't reachable (sonnet-r1, docs/plans/2026-09-09-sonnet-r1.md).
 *
 * Two reasons, because the honest explanation differs:
 *   - 'wallet'   — the data exists but is scoped to a connected wallet.
 *   - 'not-live' — the surface just isn't wired to a live backend endpoint
 *                  yet (public edge doesn't admit it, or the route doesn't
 *                  exist in production yet). "Sign in" would be misleading
 *                  here since signing in wouldn't change anything.
 */
export type PublicViewerNoticeReason = 'wallet' | 'not-live';

const COPY: Record<PublicViewerNoticeReason, { title: string; description: string }> = {
  wallet: {
    title: 'This view is live on the testnet',
    description: 'Sign in with a wallet to see it.',
  },
  'not-live': {
    title: 'Not live on the testnet yet',
    description: 'This view will populate once its data source is connected.',
  },
};

export interface PublicViewerNoticeProps {
  reason?: PublicViewerNoticeReason;
  /** Override the default copy for this reason (still no mock numbers). */
  title?: string;
  description?: string;
  sx?: SxProps<Theme>;
}

export default function PublicViewerNotice({
  reason = 'wallet',
  title,
  description,
  sx,
}: PublicViewerNoticeProps) {
  const defaults = COPY[reason];
  return (
    <WrfEmptyState
      variant="no-data"
      title={title ?? defaults.title}
      description={description ?? defaults.description}
      sx={sx}
    />
  );
}
