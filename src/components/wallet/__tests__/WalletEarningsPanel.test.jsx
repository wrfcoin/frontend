// S3: Earnings panel on /wallet: BigInt formatting goldens, session gating, reward totals, activity, Receive.
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const walletService = { getBalance: jest.fn(), getWalletHistory: jest.fn() };
await jest.unstable_mockModule('../../../services/apiClient', () => ({ walletService }));
const { default: WalletEarningsPanel, formatWrf, mergeActivity, HISTORY_LIMIT, SIGNED_OUT_MESSAGE, EMPTY_WINDOW_MESSAGE } = await import('../WalletEarningsPanel.tsx');
const { setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore.ts');

// Amounts render as integer + smaller fraction/unit spans; match on the span's whole text.
const amountNode = text => screen.getByText((_, node) => node.tagName === 'SPAN' && node.textContent === text);

const ADDRESS = `0x${'ab12'.repeat(10)}`;
const wallet = (over = {}) => ({
  address: ADDRESS, balance: '12345678', earnedBalanceTotal: '500000000', weatherRewards: '300000000',
  weatherRewardsPending: '0', weatherRewardsUnavailable: null, ...over,
});
const page = (over = {}) => ({ items: [], creditItems: [], offset: 0, limit: HISTORY_LIMIT, complete: null, creditNextCursor: null, windowStartHeight: null, totalInWindow: null, ...over });

beforeEach(() => {
  jest.clearAllMocks();
  clearAuthToken();
  walletService.getBalance.mockResolvedValue(wallet());
  walletService.getWalletHistory.mockResolvedValue(page());
});
afterEach(() => { cleanup(); clearAuthToken(); });

describe('formatWrf (BigInt, 8 decimals, never a float)', () => {
  it.each([
    ['0', '0.00000000 WRF'],
    ['1', '0.00000001 WRF'],
    ['99999999', '0.99999999 WRF'],
    ['100000000', '1.00000000 WRF'],
    ['12345678', '0.12345678 WRF'],
    ['9007199254740993', '90,071,992.54740993 WRF'],
    ['9000000000000000001', '90,000,000,000.00000001 WRF'],
    ['123456789012345678901', '1,234,567,890,123.45678901 WRF'],
  ])('%s -> %s', (units, expected) => { expect(formatWrf(units)).toBe(expected); });

  it.each([[null], [undefined], ['1.5'], ['abc'], ['']])('%s is not available', value => {
    expect(formatWrf(value)).toBeNull();
  });
});

describe('WalletEarningsPanel', () => {
  it('renders nothing for a non-owner and reads nothing', () => {
    setAuthToken('tok');
    const view = render(<WalletEarningsPanel ownerAddress={null} />);
    expect(view.container.innerHTML).toBe('');
    expect(walletService.getBalance).not.toHaveBeenCalled();
  });

  it('without a session token it asks to unlock and makes no request (the edge would 404)', () => {
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    expect(screen.getByText(SIGNED_OUT_MESSAGE)).toBeTruthy();
    expect(walletService.getBalance).not.toHaveBeenCalled();
    expect(walletService.getWalletHistory).not.toHaveBeenCalled();
  });

  it('loads when the session appears after unlock, without remounting', async () => {
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    expect(walletService.getBalance).not.toHaveBeenCalled();
    setAuthToken('tok');
    expect((await screen.findByTestId('wallet-balance')).textContent).toBe('0.12345678 WRF');
    expect(walletService.getBalance).toHaveBeenCalledWith(ADDRESS);
    expect(walletService.getWalletHistory).toHaveBeenCalledWith(ADDRESS, { limit: HISTORY_LIMIT, offset: 0 });
  });

  it('shows balance and reward totals in exact 8-decimal units', async () => {
    setAuthToken('tok');
    walletService.getBalance.mockResolvedValue(wallet({ balance: '9000000000000000001' }));
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    expect((await screen.findByTestId('wallet-balance')).textContent).toBe('90,000,000,000.00000001 WRF');
    expect(amountNode('5.00000000 WRF')).toBeTruthy();
    expect(amountNode('3.00000000 WRF')).toBeTruthy();
    expect(amountNode('0.00000000 WRF')).toBeTruthy();
  });

  it('an unreported total reads Not available with the node reason, never zero', async () => {
    setAuthToken('tok');
    walletService.getBalance.mockResolvedValue(wallet({
      earnedBalanceTotal: null, weatherRewards: null, weatherRewardsPending: null,
      weatherRewardsUnavailable: 'core4 did not report contribution_rewards for this address',
    }));
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    await screen.findByTestId('wallet-balance');
    expect(screen.getAllByText('Not available')).toHaveLength(3);
    expect(screen.getByText(/core4 did not report contribution_rewards/)).toBeTruthy();
    expect(screen.getByText(/has not reported total earned/)).toBeTruthy();
  });

  it('lists activity and paid rewards; unreported amount and time are said so', async () => {
    setAuthToken('tok');
    walletService.getWalletHistory.mockResolvedValue(page({
      items: [
        { id: 'a', type: 'transfer', direction: 'sent', amount: '150000000', counterparty: '0xcc', timestamp: '2026-10-15T00:00:00Z', settlement: null, blockHeight: 5 },
        { id: 'b', type: null, direction: 'received', amount: null, counterparty: null, timestamp: null, settlement: null, blockHeight: null },
      ],
      creditItems: [
        { id: 'c', type: 'weather_reward', direction: 'received', amount: '250000000', counterparty: null, timestamp: '2026-10-15T01:00:00Z', settlement: 'paid', blockHeight: null },
      ],
    }));
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    const list = await screen.findByTestId('wallet-activity');
    expect(list.textContent).toContain('-1.50000000 WRF');
    expect(list.textContent).toContain('+2.50000000 WRF');
    expect(list.textContent).toContain('Amount not reported');
    expect(list.textContent).toContain('Time not reported');
  });

  it('an empty history says so, and a failed read is unavailable, not empty', async () => {
    setAuthToken('tok');
    walletService.getWalletHistory.mockResolvedValue(page({ complete: true }));
    const first = render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    await screen.findByText('No activity yet.');
    first.unmount();
    walletService.getWalletHistory.mockRejectedValue(new Error('503'));
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    await screen.findByText(/Activity is not available right now/);
    expect(screen.queryByText('No activity yet.')).toBeNull();
    expect(screen.getByTestId('wallet-balance')).toBeTruthy();
  });

  it('an empty bounded window is not a whole-history claim', async () => {
    setAuthToken('tok');
    walletService.getWalletHistory.mockResolvedValue(page({ complete: false, creditNextCursor: 'cur-1' }));
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    await screen.findByText(EMPTY_WINDOW_MESSAGE);
    expect(screen.queryByText('No activity yet.')).toBeNull();
  });

  it('an empty window with no completeness metadata is also not "No activity yet"', async () => {
    setAuthToken('tok');
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    await screen.findByText(EMPTY_WINDOW_MESSAGE);
  });

  it('merges transfers and rewards newest first, untimed rows last', async () => {
    setAuthToken('tok');
    const row = (id, timestamp, over = {}) => ({ id, type: null, direction: 'received', amount: '100000000',
      counterparty: null, from: null, to: null, timestamp, settlement: null, status: null, blockHeight: null, ...over });
    const mixed = page({
      items: [row('t-oct15', '2026-10-15T12:00:00Z'), row('t-none', null), row('t-oct13', '2026-10-13T12:00:00Z')],
      creditItems: [row('c-oct14', '2026-10-14T12:00:00Z', { type: 'weather_reward' }), row('c-none', 'garbage')],
    });
    walletService.getWalletHistory.mockResolvedValue(mixed);
    expect(mergeActivity(mixed).map(r => r.item.id))
      .toEqual(['t-oct15', 'c-oct14', 't-oct13', 't-none', 'c-none']);
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    const list = await screen.findByTestId('wallet-activity');
    const rows = [...list.querySelectorAll('tbody tr')].map(tr => tr.textContent);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toContain('Received');
    expect(rows[1]).toContain('Reward');
    expect(rows[2]).toContain('Received');
    expect(rows[3]).toContain('Time not reported');
    expect(rows[4]).toContain('Reward');
    expect(rows[4]).toContain('Time not reported');
  });

  it('Receive: real QR of the address and Copy writes the address to the clipboard', async () => {
    setAuthToken('tok');
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    const qr = await screen.findByTestId('receive-qr');
    expect(qr.querySelectorAll('path').length).toBe(1);
    expect(qr.querySelector('path').getAttribute('d').length).toBeGreaterThan(200);
    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(ADDRESS));
    await screen.findByText(/Address copied/);
  });

  it('Receive works even before the session is signed in (address only, no API)', () => {
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    expect(screen.getByTestId('receive-qr')).toBeTruthy();
  });

  it('a copy failure is reported, not swallowed', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) }, configurable: true });
    render(<WalletEarningsPanel ownerAddress={ADDRESS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));
    await screen.findByText(/Could not copy/);
  });
});
