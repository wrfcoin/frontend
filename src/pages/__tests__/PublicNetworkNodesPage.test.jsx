/** @jest-environment jsdom */
/**
 * Owner demo 2026-11-01 item 3: producers, bonded nodes and attesters on the ladder. One GET to
 * /api/network/nodes; a section the node could not answer reads "Unavailable", never a zero.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(cleanup);

const { default: Page } = await import('../PublicNetworkNodesPage');

const N5 = '1e5180e7add06bbe07cf2698ec9d4882ae1cfb54b13de67bae92a4e625ceec1a';
const snapshot = (over = {}) => ({
  chain: { networkId: 'testnet', chainId: '888', height: 12000, status: 'ok' },
  producers: {
    status: 'ok', rosterSource: 'core4 genesis_producer_pins.rs (testnet genesis roster)',
    window: { fromHeight: 11937, toHeight: 12000, read: 64, unreadable: 0, unsigned: 0 },
    members: [
      { producerId: 'n5-node-a', publicKey: N5, payoutAddress: '0x680d51f7543ca70029866956376306d47ce60ed0', blocksInWindow: 64, lastBlock: { height: 12000, time: '2026-10-31T12:00:00.000Z' }, earnedTotal: '123400000000' },
      { producerId: 'mango-mini', publicKey: 'cd'.repeat(32), payoutAddress: '0xc536d2026661522cb8631b3c723d4af43784a990', blocksInWindow: 0, lastBlock: null, earnedTotal: null },
    ],
    unrostered: [{ publicKey: 'ab'.repeat(32), blocksInWindow: 2, lastBlock: { height: 11990, time: null } }],
  },
  bonded: {
    status: 'ok', epoch: 11, discovery: { settlementEpochs: [11, 10, 9, 8], configured: 3 },
    nodes: [{ deploymentId: 'a1'.repeat(32), alias: 'ws-node', principal: '25036000000', escrowBalance: '25036000000', jailed: false, registeredEpoch: 1, exitEffectiveHeight: null, payoutAddress: '0xc37f000000000000000000000000000000000001', earnedTotal: '37925925888', lastPayout: { epoch: 10, status: 'PAID', amount: '18962962944' } }],
  },
  attesters: { status: 'ok', quorum: 2, ids: ['oracle-n5', 'oracle-ws'] },
  checkedAt: '2026-10-31T12:00:05.000Z',
  ...over,
});

function mockFetch(status, body) {
  globalThis.fetch = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body }));
}
const renderPage = () => render(<MemoryRouter><Page /></MemoryRouter>);

test('shows producers with blocks counted from the chain, bonded nodes, attesters and the ladder', async () => {
  mockFetch(200, snapshot());
  renderPage();
  const producers = await screen.findByTestId('nodes-producers');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(String(globalThis.fetch.mock.calls[0][0])).toMatch(/\/api\/network\/nodes$/);
  expect(within(producers).getByText('n5-node-a')).toBeInTheDocument();
  expect(within(producers).getByText('64 of 64')).toBeInTheDocument();
  expect(within(producers).getByText('0 of 64')).toBeInTheDocument();
  expect(producers).toHaveTextContent('1,234.00000000 WRF');
  expect(within(producers).getByText('Unnamed producer')).toBeInTheDocument();
  // mango has no paid total from the node: Unavailable, never 0.
  expect(within(producers).getAllByText('Unavailable').length).toBeGreaterThan(0);
  const bonded = screen.getByTestId('nodes-bonded');
  expect(within(bonded).getByText('ws-node')).toBeInTheDocument();
  expect(bonded).toHaveTextContent('379.25925888 WRF');
  expect(screen.getByTestId('nodes-attesters')).toHaveTextContent('2 seated · 2 must agree');
  const ladder = screen.getByTestId('nodes-ladder');
  expect(ladder).toHaveTextContent('Height 12,000');
  expect(ladder).toHaveTextContent('1 bonded');
  expect(ladder).toHaveTextContent('1 of 2 producing');
});

test('a section the node could not answer says Unavailable and the others still show', async () => {
  mockFetch(200, snapshot({ bonded: { status: 'unavailable', epoch: null, discovery: { settlementEpochs: [], configured: 0 }, nodes: [] }, attesters: { status: 'unavailable', quorum: null, ids: [] } }));
  renderPage();
  expect(await screen.findByTestId('nodes-producers')).toBeInTheDocument();
  expect(screen.getByText(/Bonded nodes unavailable/)).toBeInTheDocument();
  expect(screen.getByText(/Attesters unavailable/)).toBeInTheDocument();
  expect(screen.queryByTestId('nodes-bonded')).toBeNull();
  expect(screen.getByTestId('nodes-ladder')).toHaveTextContent('Unavailable');
});

test('404 says the list is not switched on; a failure offers Retry', async () => {
  mockFetch(404, { error: 'Not found' });
  const { unmount } = renderPage();
  expect(await screen.findByText('Not switched on yet')).toBeInTheDocument();
  unmount();
  mockFetch(502, {});
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('the chain node could not answer');
});
