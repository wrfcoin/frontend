/** @jest-environment jsdom */
/**
 * "Bond your node" on /nodes (FEATURES.bondGuide, default off): the steps, and one node's progress read from
 * GET /api/bond-admission/recent plus the bonded list the page already holds.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const flags = { bondGuide: false };
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: flags }));
const { default: BondYourNode } = await import('../BondYourNode');
const { default: Page } = await import('../PublicNetworkNodesPage');

afterEach(() => { cleanup(); flags.bondGuide = false; });

const KEY = '1a2b3c4d'.padEnd(64, 'e');
const BOND = 'b0'.repeat(32);
const admissions = [{ action: 'Deposit', deploymentId: BOND, serverKey: KEY, serviceAlias: 'node-1a2b3c4d', effectiveEpoch: 12, renewal: false, time: '2026-11-10T10:00:00.000Z' }];
const bonded = (nodes = []) => ({ status: 'ok', epoch: 11, nodes });

function mockFetch(status, body) {
  globalThis.fetch = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body }));
}
const renderCard = b => render(<MemoryRouter><BondYourNode bonded={b} /></MemoryRouter>);
async function check(text) {
  fireEvent.change(screen.getByLabelText('Check your node'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  return screen.findByTestId('bond-verdict');
}

test('lists the six steps and reads nothing until asked', () => {
  mockFetch(200, { admissions: [] });
  renderCard(bonded());
  for (const title of ['Run a node', 'Open your port', 'Ask for a bond grant', 'Request admission', 'Bond', 'Earn']) {
    expect(screen.getByText(title)).toBeInTheDocument();
  }
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

test('a value that is not a key or alias is refused without a request', async () => {
  mockFetch(200, { admissions });
  renderCard(bonded());
  expect(await check('my recovery phrase words')).toHaveTextContent('That is not a node key');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

test('admitted: one GET to the admission list, no query, and the step is marked', async () => {
  mockFetch(200, { admissions });
  renderCard(bonded());
  const verdict = await check(KEY);
  expect(verdict).toHaveTextContent('Admitted, waiting for the bond');
  expect(verdict).toHaveTextContent('epoch 12');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(String(globalThis.fetch.mock.calls[0][0])).toMatch(/\/api\/bond-admission\/recent$/);
  expect(globalThis.fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', credentials: 'omit' });
  expect(screen.getByText('Request admission').closest('li')).toHaveAttribute('aria-current', 'step');
});

test('bonded and paid: says earning with the chain total', async () => {
  mockFetch(200, { admissions });
  renderCard(bonded([{ deploymentId: BOND, alias: 'node-1a2b3c4d', earnedTotal: '14222222208', lastPayout: { epoch: 11, status: 'PAID', amount: '14222222208' } }]));
  const verdict = await check('node-1a2b3c4d');
  expect(verdict).toHaveTextContent('Bonded, earning');
  expect(verdict).toHaveTextContent('142.22222208 WRF');
});

test('not found anywhere: not admitted yet', async () => {
  mockFetch(200, { admissions: [] });
  renderCard(bonded());
  expect(await check(KEY)).toHaveTextContent('Not admitted yet');
});

test('the 404 while admission is off says it is not open; a bonded node is still found', async () => {
  mockFetch(404, { error: { code: 'ADMISSION_DISABLED' } });
  renderCard(bonded([{ deploymentId: BOND, alias: 'node-1a2b3c4d', earnedTotal: '0', lastPayout: null }]));
  expect(await check('f'.repeat(64))).toHaveTextContent('Admission is not open yet');
  expect(await check('node-1a2b3c4d')).toHaveTextContent('Bonded');
});

test('an unreadable list is Unavailable, never "not admitted"', async () => {
  mockFetch(503, {});
  renderCard(bonded());
  const verdict = await check(KEY);
  expect(verdict).toHaveTextContent('Unavailable');
  expect(verdict).not.toHaveTextContent('Not admitted');
});

const snapshot = { chain: { status: 'ok', height: 1 }, producers: { status: 'unavailable' }, bonded: bonded(), attesters: { status: 'unavailable' }, checkedAt: '2026-11-10T10:00:00.000Z' };

test('/nodes shows the card only when the flag is on', async () => {
  mockFetch(200, snapshot);
  const first = render(<MemoryRouter><Page /></MemoryRouter>);
  await screen.findByTestId('nodes-ladder');
  expect(screen.queryByTestId('bond-your-node')).toBeNull();
  first.unmount();
  flags.bondGuide = true;
  render(<MemoryRouter><Page /></MemoryRouter>);
  expect(await screen.findByTestId('bond-your-node')).toBeInTheDocument();
  // Still one request on load: the admission list is read only on Check.
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});
