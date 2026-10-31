/** @jest-environment jsdom */
/**
 * "Notify me when this address is paid" (backend#389): hidden unless the server enables it, asks a
 * visitor to sign in with the address's own wallet, and for the owner adds/removes ntfy topics and
 * sends tests with the wallet session Bearer. Never asks for an email. Every request matches the edge
 * allowlist fixture.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import NotifyMe from '../NotifyMe';
import { setAuthToken, clearAuthToken } from '../../../services/authTokenStore';
import { signedInAddress, suggestTopic, NTFY_TOPIC_RE } from '../../../services/payoutNotifications';
import { shouldAttachBearer } from '../../../services/apiClient/authScope';
import edge from '../../../routes/__fixtures__/public-edge-allowlist.json';

const ADDR = `0x${'a1'.repeat(20)}`;
const OTHER = `0x${'b2'.repeat(20)}`;
const SUB_ID = '0b0b0b0b-1c1c-4d4d-8e8e-9f9f9f9f9f9f';
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwtFor = (sub: string) => `${b64({ alg: 'HS256' })}.${b64({ sub, type: 'access' })}.sig`;
const CONFIG = { enabled: true, events: ['payout.credited'], checkEveryMinutes: 5, webPush: { available: false, publicKey: null }, ntfy: { available: true, server: 'https://ntfy.sh' }, stores: 'x' };

type Call = { method: string; url: string; auth: string | null; body: unknown };
let calls: Call[] = [];
let subs: any[] = [];
let config: any = CONFIG;
beforeEach(() => {
  calls = []; subs = []; config = CONFIG;
  global.fetch = jest.fn(async (input: unknown, init?: any) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ method, url, auth: init?.headers?.Authorization ?? null, body: init?.body ? JSON.parse(init.body) : undefined });
    const path = url.replace(/^.*\/api/, '/api');
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
    if (path === '/api/notifications/config') return json(config);
    if (path === `/api/notifications/subscriptions/${ADDR}`) return json({ success: true, address: ADDR, subscriptions: subs });
    if (path === '/api/notifications/subscriptions' && method === 'POST') {
      const s = { id: SUB_ID, address: ADDR, channel: 'ntfy', label: JSON.parse(init.body).topic, targetHash: 'h', createdAt: 'now', lastDeliveredAt: null };
      subs = [s];
      return json({ success: true, subscription: s }, 201);
    }
    if (path === `/api/notifications/subscriptions/${SUB_ID}/test`) return json({ success: true, delivered: true });
    if (path === `/api/notifications/subscriptions/${SUB_ID}` && method === 'DELETE') { subs = []; return json({ success: true, removed: 1 }); }
    return json({ error: 'unexpected' }, 404);
  }) as typeof fetch;
});
afterEach(() => { cleanup(); clearAuthToken(); jest.restoreAllMocks(); });

const mount = () => render(<MemoryRouter><NotifyMe address={ADDR} /></MemoryRouter>);

describe('NotifyMe', () => {
  it('renders nothing when the server has notifications off', async () => {
    config = { ...CONFIG, enabled: false };
    const { container } = mount();
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(container).toBeEmptyDOMElement();
  });

  it('a visitor (or another wallet) is told to sign in with this address, and nothing is listed', async () => {
    setAuthToken(jwtFor(OTHER));
    mount();
    expect(await screen.findByTestId('notify-me-signin')).toHaveTextContent("sign in with this address's wallet");
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/wallet');
    expect(calls.map(c => c.url)).toEqual([expect.stringMatching(/\/api\/notifications\/config$/)]);
    expect(document.body.textContent).not.toMatch(/e-?mail address|phone number/i);
  });

  it('the owner adds an ntfy topic, sends a test and removes it, always with the session Bearer', async () => {
    setAuthToken(jwtFor(ADDR));
    mount();
    const topic = await screen.findByTestId('notify-me-topic');
    expect(screen.queryByTestId('notify-me-push-on')).not.toBeInTheDocument(); // web push not configured
    fireEvent.click(screen.getByRole('button', { name: 'Random topic' }));
    const value = (topic as HTMLInputElement).value;
    expect(value).toMatch(/^wrfcoin-pay-[0-9a-f]{16}$/);
    fireEvent.click(screen.getByTestId('notify-me-ntfy-add'));
    expect(await screen.findByText(value)).toBeInTheDocument();
    const add = calls.find(c => c.method === 'POST' && c.url.endsWith('/notifications/subscriptions'))!;
    expect(add.body).toEqual({ address: ADDR, channel: 'ntfy', topic: value });
    expect(add.auth).toBe(`Bearer ${jwtFor(ADDR)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Send a test' }));
    expect(await screen.findByText('Test sent to the topic.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText(value)).not.toBeInTheDocument());
    expect(calls.filter(c => c.url.includes('/subscriptions')).every(c => c.auth === `Bearer ${jwtFor(ADDR)}`)).toBe(true);
  });

  it('every request it makes is admitted by the edge allowlist and scoped for the Bearer', async () => {
    setAuthToken(jwtFor(ADDR));
    mount();
    fireEvent.change(await screen.findByTestId('notify-me-topic'), { target: { value: 'wrfcoin-pay-0123456789abcdef' } });
    fireEvent.click(screen.getByTestId('notify-me-ntfy-add'));
    fireEvent.click(await screen.findByRole('button', { name: 'Send a test' }));
    await screen.findByText('Test sent to the topic.');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(calls.some(c => c.method === 'DELETE')).toBe(true));
    const rules = [...edge.get.map(r => ({ ...r, m: 'GET' })), ...edge.post.map(r => ({ ...r, m: 'POST' })), ...((edge as any).delete ?? []).map((r: any) => ({ ...r, m: 'DELETE' }))];
    for (const c of calls) {
      const path = c.url.replace(/^.*?(\/api\/)/, '/api/').split('?')[0];
      const rule = rules.find(r => r.m === c.method && new RegExp(r.path).test(path));
      expect({ call: `${c.method} ${path}`, admitted: !!rule }).toEqual({ call: `${c.method} ${path}`, admitted: true });
      if ((rule as any)?.requiresBearer) {
        expect(c.auth).toMatch(/^Bearer /);
        expect(shouldAttachBearer(c.method, path)).toBe(true);
      }
    }
  });

  it('a server failure shows a calm message and changes nothing', async () => {
    setAuthToken(jwtFor(ADDR));
    global.fetch = jest.fn(async (input: unknown) => {
      const url = String(input);
      if (url.endsWith('/notifications/config')) return new Response(JSON.stringify(CONFIG), { status: 200 });
      if (url.endsWith(`/subscriptions/${ADDR}`)) return new Response(JSON.stringify({ subscriptions: [] }), { status: 200 });
      return new Response(JSON.stringify({ error: { code: 'NOTIFICATIONS_UNAVAILABLE' } }), { status: 503 });
    }) as typeof fetch;
    mount();
    fireEvent.change(await screen.findByTestId('notify-me-topic'), { target: { value: 'wrfcoin-pay-0123456789abcdef' } });
    fireEvent.click(screen.getByTestId('notify-me-ntfy-add'));
    expect(await screen.findByTestId('notify-me-message')).toHaveTextContent('That did not work. Nothing was changed');
  });
});

describe('helpers', () => {
  it('reads the session subject (display only) and rejects junk', () => {
    expect(signedInAddress(jwtFor(ADDR.toUpperCase().replace('0X', '0x')))).toBe(ADDR);
    expect(signedInAddress('')).toBeNull();
    expect(signedInAddress('a.b.c')).toBeNull();
    expect(signedInAddress(jwtFor('not-an-address'))).toBeNull();
  });
  it('suggests a long random topic the backend accepts', () => {
    const t = suggestTopic(n => new Uint8Array(n).fill(171));
    expect(t).toBe('wrfcoin-pay-abababababababab');
    expect(NTFY_TOPIC_RE.test(t)).toBe(true);
  });
});
