/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({ useWalletConnection: () => ({ account: '0xwallet' }) }));
jest.unstable_mockModule('../../hooks/useReferrals', () => ({ useReferrals: () => ({ referralCode: 'INVITE', stats: { byStatus: { activated: 3, rewarded: 99 }, totalReferrals: 4, totalRewardsWrf: 0, reward: { state: 'not_paid', reason: 'no on-chain referral payout exists' } }, loading: false, generating: false, generateCode: jest.fn() }) }));
const { default: ReferralsPage } = await import('../ReferralsPage');
it('shows activations and unpaid posture without promising referral payouts in UI or sharing links', () => {
  const { container } = render(<ReferralsPage />);
  expect(screen.getByText('Activated').parentElement).toHaveTextContent('3');
  expect(container).toHaveTextContent(/not paid/i);
  expect(container).not.toHaveTextContent(/earn.*100|100 WRF|automatically earn/i);
  for (const link of screen.getAllByRole('link')) expect(decodeURIComponent(link.href)).not.toMatch(/earn.*100|100 WRF/i);
});
