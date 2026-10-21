/**
 * @jest-environment jsdom
 *
 * frontend#348 review (PR #381): operator preview makes /wallet reachable, so
 * the page must not render fabricated security, recovery or fiat/exchange
 * claims. These pins render the real NewWalletPage with every collapsible
 * section open and fail if any of that content returns.
 */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

const stub = name => ({ __esModule: true, default: () => <div data-testid={`stub-${name}`} /> });

await jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({
  useWalletConnection: () => ({
    account: 'wrf1testaccount',
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
// Data-fetching children are out of scope for these pins; stub them.
for (const name of [
  'WalletHero', 'TokenList', 'TransactionFeed', 'PortfolioInsights', 'AdvancedPanel',
  // ReceiveModal is deliberately NOT stubbed: the honesty pin renders it.
  'MobileBottomNav', 'SendModal', 'WalletOverviewSection',
  'NFTGallerySection', 'HardwareWalletSection',
]) {
  await jest.unstable_mockModule(`../../components/wallet/v2/${name}`, () => stub(name));
}

const { default: NewWalletPage } = await import('../NewWalletPage');

const FABRICATED_TEXT = [
  // (a) hardcoded "recovery phrase" and its copy button
  // textContent runs the numbered words together ("1weather2forecast…").
  /weather\W*\d*\W*forecast\W*\d*\W*climate/i,
  /satellite\W*\d*\W*station/i,
  /Copy to Clipboard/i,
  /View Recovery Phrase/i,
  // (b) invented security posture
  /Security Score/i,
  /Checks Passed/i,
  /Recovery Phrase Backed Up/i,
  /Email Verified/i,
  /Two-Factor Authentication/i,
  /Active Sessions/i,
  /Last changed/i,
  // (c) fiat on/off-ramp for an unlisted testnet asset
  /Buy WRF with credit card/i,
  /Cash Out/i,
  /USD, EUR, or GBP/i,
  // (e) a decorative "QR code" that encodes nothing
  /Scan to receive/i,
  // (d) exchange listings that do not exist
  /Uniswap/i,
  /SushiSwap/i,
  // No word boundaries: adjacent elements run together in textContent
  // ("SushiSwapCurveClose").
  /Curve/,
  /acquire\s+WRF/i,
];

const FORBIDDEN_LINK_HOSTS = ['ramp.network', 'uniswap', 'sushi.com', 'curve.fi'];

async function renderWalletWithEverythingOpen() {
  jest.useFakeTimers();
  for (const key of ['insights', 'advanced', 'multiasset', 'txhistory', 'nftgallery', 'crosschain', 'security', 'hardware']) {
    localStorage.setItem(`wallet_section_${key}`, 'true');
  }
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  const view = render(<NewWalletPage />);
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  jest.useRealTimers();
  // Let every lazy section resolve.
  await screen.findByText('Buy');
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  return { ...view, openSpy };
}

// We make no promise that WRF will ever be buyable, so the "no fiat" and
// "can't be bought" panels must not carry the "Post-testnet" badge.
function postTestnetBadge(panel) {
  return Array.from(panel.querySelectorAll('.wallet-coming-soon-badge'))
    .map(badge => badge.textContent)
    .filter(text => /post-testnet/i.test(text));
}

function assertNoFabrication(container) {
  // Collect every hit so one failure names all the fabricated content found.
  const text = container.textContent;
  const hrefs = Array.from(container.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
  const found = [
    ...FABRICATED_TEXT.filter(pattern => pattern.test(text)).map(String),
    ...hrefs.filter(href => FORBIDDEN_LINK_HOSTS.some(host => href.includes(host))),
  ];
  expect(found).toEqual([]);
}

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('/wallet renders no fabricated security, recovery or fiat claims', () => {
  it('the fully expanded page carries none of the fabricated content', async () => {
    const { container } = await renderWalletWithEverythingOpen();
    // Sanity: the sections really are open (Cross-chain is a closed-by-default one).
    expect(screen.getByText('Cross-chain bridge coming soon')).toBeInTheDocument();
    assertNoFabrication(container);
    expect(screen.getByTestId('wallet-security-unavailable')).toBeInTheDocument();
    expect(postTestnetBadge(screen.getByTestId('wallet-fiat-unavailable'))).toEqual([]);
    // The shared panel's default is unchanged elsewhere on the page.
    expect(postTestnetBadge(screen.getByTestId('wallet-security-unavailable'))).toEqual(['Post-testnet']);
  });

  it('the Buy quick action opens an honest modal with no exchange or ramp link', async () => {
    const { container, openSpy } = await renderWalletWithEverythingOpen();
    fireEvent.click(screen.getByText('Buy'));
    await waitFor(() => expect(container.querySelector('.buy-modal')).not.toBeNull());
    assertNoFabrication(container);
    expect(postTestnetBadge(screen.getByTestId('wallet-buy-unavailable'))).toEqual([]);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('Receive opens the real modal with the address and no fake QR code', async () => {
    const { container } = await renderWalletWithEverythingOpen();
    fireEvent.click(screen.getByText('Receive'));
    await waitFor(() => expect(container.querySelector('.receive-modal')).not.toBeNull());
    const modal = container.querySelector('.receive-modal');
    // The real modal rendered: the full address is there to copy.
    expect(modal.textContent).toContain('wrf1testaccount');
    assertNoFabrication(container);
    // No QR-looking element of any kind until a real encoder is wired in.
    expect(
      Array.from(modal.querySelectorAll('.qr-section, .qr-container, .qr-code-svg, .qr-label, svg[class*="qr"]'))
        .map(el => el.className.baseVal ?? el.className),
    ).toEqual([]);
  });

  it('no reveal/buy/cash-out control shows a phrase or sends the address to a ramp', async () => {
    const { container, openSpy } = await renderWalletWithEverythingOpen();
    for (const button of Array.from(container.querySelectorAll('button'))) {
      if (/View|Reveal|Show|Buy|Cash|Ramp/i.test(button.textContent)) {
        fireEvent.click(button);
      }
    }
    assertNoFabrication(container);
    expect(openSpy).not.toHaveBeenCalled();
  });
});

// Baseline audit (PR #398, frontend#352): the page used to show "Loading Wallet..."
// for a fixed 300 ms while nothing was loading ("// Simulate initial load"). The
// wallet content must render on the first pass, with no timer advanced and no
// invented loading state.
describe('/wallet has no simulated loading state', () => {
  it('renders the wallet on first render without a timer-driven "Loading Wallet..." screen', async () => {
    jest.useFakeTimers();
    try {
      await act(async () => {
        render(<NewWalletPage />);
      });
      expect(screen.queryByText(/Loading Wallet/i)).toBeNull();
      expect(document.querySelector('.wallet-loading')).toBeNull();
      expect(document.querySelector('.wallet-v2')).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
