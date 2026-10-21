/**
 * @jest-environment jsdom
 *
 * frontend#437 (lead decision 2026-10-01): wallet send is operator-only
 * (frontend#345/#346), and where it is off there is no Send button anywhere on
 * /wallet, not a disabled one or one that opens an "unavailable" modal. The
 * three Send entry points (quick actions, the mobile bottom bar, the overview
 * section) render for real here; data-fetching children are stubbed.
 */
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const flags = { walletSend: false };
const features = new Proxy(flags, {
  get: (target, prop) => (prop in target ? target[prop] : false),
});
await jest.unstable_mockModule('../../config/features', () => ({
  default: features,
  FEATURES: features,
  isMvpMode: () => false,
}));

await jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({
  useWalletConnection: () => ({
    account: '0x' + 'a'.repeat(40),
    refreshAccountBalance: jest.fn(),
    sendTransaction: jest.fn(),
    walletNotice: null,
    activeProvider: 'custom',
    receiveOnly: false,
  }),
}));
await jest.unstable_mockModule('../../hooks/useWalletData', () => ({
  useWalletData: () => ({ balance: '0', isConnected: true, isLoading: false, error: null, refresh: jest.fn() }),
}));

const stub = name => ({ __esModule: true, default: () => <div data-testid={`stub-${name}`} /> });
for (const name of ['WalletHero', 'TokenList', 'TransactionFeed', 'NFTGallerySection', 'HardwareWalletSection']) {
  await jest.unstable_mockModule(`../../components/wallet/v2/${name}`, () => stub(name));
}
await jest.unstable_mockModule('../../components/wallet/v2/SendModal', () => ({
  __esModule: true,
  default: () => <div data-testid="send-modal" />,
}));

const { default: NewWalletPage } = await import('../NewWalletPage');

async function renderWallet() {
  jest.useFakeTimers();
  // A phone-width window mounts the bottom bar; the overview section is open.
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
  localStorage.setItem('wallet_section_overview', 'true');
  const view = render(<NewWalletPage />);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(400);
  });
  return view;
}

const sendControls = () =>
  screen
    .queryAllByRole('button')
    .filter(button => /^\s*Send\s*$/.test(button.textContent ?? '') || button.getAttribute('aria-label') === 'Send');

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  localStorage.clear();
  flags.walletSend = false;
});

describe('/wallet Send entry points', () => {
  it('wallet send off: no Send control anywhere and no Send modal', async () => {
    const view = await renderWallet();
    // Not vacuous: the three components that carry Send rendered.
    expect(screen.getAllByText('Receive').length).toBeGreaterThanOrEqual(3);
    expect(sendControls()).toEqual([]);
    expect(view.container.textContent).not.toMatch(/\bSend\b/);
    expect(screen.queryByTestId('send-modal')).toBeNull();
  });

  it('wallet send on (operator preview): Send is in all three places and opens the send modal', async () => {
    flags.walletSend = true;
    await renderWallet();
    const controls = sendControls();
    expect(controls).toHaveLength(3);
    await act(async () => {
      fireEvent.click(controls[0]);
      await jest.advanceTimersByTimeAsync(50);
    });
    expect(screen.getByTestId('send-modal')).toBeInTheDocument();
  });

  it('no unmeasured "online" status and no Phase 2 teaser panels', async () => {
    const view = await renderWallet();
    expect(view.container.querySelector('.status-dot.online')).toBeNull();
    expect(view.container.textContent).not.toMatch(/Connected to/);
    expect(view.container.textContent).not.toMatch(/Phase 2|Portfolio Insights|Two-Factor|2FA/);
  });
});
