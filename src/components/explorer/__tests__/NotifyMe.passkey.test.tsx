/** @jest-environment jsdom */
/**
 * "Notify me about payouts" for a passkey wallet (owner approval 2026-11-01). A passkey wallet has no
 * wallet login, so each add or remove asks the server for a single-use nonce and signs a challenge bound to
 * the address, action, channel and target with the passkey. No Bearer is ever sent, every request is on the
 * edge allowlist, and the challenge bytes match the backend's pinned vector.
 */
import React from 'react';
import { createHash } from 'node:crypto';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import NotifyMe from '../NotifyMe';
import { clearAuthToken } from '../../../services/authTokenStore';
import { bytesToHex, passkeyRecordAddress, type PasskeyCredentialRecord } from '../../../services/walletCrypto/passkey';
import { saveStoredPasskey, clearStoredPasskey } from '../../../services/walletCrypto/passkeySend';
import { listPasskeySubscriptions, passkeyNotifyChallenge } from '../../../services/payoutNotifications';
import edge from '../../../routes/__fixtures__/public-edge-allowlist.json';

const sha256Hex = (s: string) => createHash('sha256').update(s).digest('hex');
const RECORD: PasskeyCredentialRecord = { credentialId: new Uint8Array([1, 2, 3, 4]), publicKeyXY: new Uint8Array(64).fill(7), rpId: 'wrfcoin.com' };
const ADDR = passkeyRecordAddress(RECORD);
const NONCE = '5a'.repeat(32);
const CONFIG = { enabled: true, events: ['payout.credited'], checkEveryMinutes: 5, webPush: { available: false, publicKey: null }, ntfy: { available: true, server: 'https://ntfy.sh' }, stores: 'x' };

type Call = { method: string; url: string; auth: string | null; body: any };
let calls: Call[] = [];
let challenges: Uint8Array[] = [];
beforeEach(() => {
  calls = []; challenges = [];
  localStorage.clear();
  saveStoredPasskey(RECORD);
  global.fetch = jest.fn(async (input: unknown, init?: any) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, auth: init?.headers?.Authorization ?? null, body });
    const path = url.replace(/^.*\/api/, '/api');
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
    if (path === '/api/notifications/config') return json(CONFIG);
    if (path === '/api/notifications/passkey/challenge') return json({ success: true, domain: 'wrfcoin_passkey_payout_notify_v1', chainId: '888', network: 'testnet', address: body.address, nonce: NONCE, expiresAt: 1_800_000_300 }, 201);
    if (path === '/api/notifications/passkey/subscriptions') {
      return json({ success: true, subscription: { id: '0b0b0b0b-1c1c-4d4d-8e8e-9f9f9f9f9f9f', address: ADDR, channel: 'ntfy', label: body.topic, targetHash: sha256Hex(body.topic), createdAt: 'now', lastDeliveredAt: null } }, 201);
    }
    if (path === '/api/notifications/passkey/unsubscribe') return json({ success: true, removed: 1 });
    return json({ error: 'unexpected' }, 404);
  }) as typeof fetch;
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: {
      get: jest.fn(async (options: any) => {
        challenges.push(options.publicKey.challenge);
        return { response: { authenticatorData: new Uint8Array(37), clientDataJSON: new TextEncoder().encode('{}'), signature: Uint8Array.from([0x30, 6, 2, 1, 1, 2, 1, 1]) } };
      }),
    },
  });
});
afterEach(() => { cleanup(); clearAuthToken(); clearStoredPasskey(); jest.restoreAllMocks(); });

const mount = (address = ADDR) => render(<MemoryRouter><NotifyMe address={address} title="Notify me about payouts" /></MemoryRouter>);

describe('NotifyMe for a passkey wallet', () => {
  it('shows the controls for the passkey address on this device, with no wallet login', async () => {
    mount();
    expect(await screen.findByText('Notify me about payouts')).toBeInTheDocument();
    expect(await screen.findByTestId('notify-me-topic')).toBeInTheDocument();
    expect(screen.queryByTestId('notify-me-signin')).not.toBeInTheDocument();
    expect(screen.getByText(/Your passkey confirms each change/)).toBeInTheDocument();
  });

  it('another address on this device still asks to sign in', async () => {
    mount(`0x${'b2'.repeat(20)}`);
    expect(await screen.findByTestId('notify-me-signin')).toBeInTheDocument();
  });

  it('adds a topic with a passkey-signed request bound to it, then removes it the same way', async () => {
    mount();
    const topic = 'wrfcoin-pay-0123456789abcdef';
    fireEvent.change(await screen.findByTestId('notify-me-topic'), { target: { value: topic } });
    fireEvent.click(screen.getByTestId('notify-me-ntfy-add'));
    expect(await screen.findByText(topic)).toBeInTheDocument();
    const add = calls.find(c => c.url.endsWith('/notifications/passkey/subscriptions'))!;
    expect(add.body).toMatchObject({ address: ADDR, channel: 'ntfy', topic, nonce: NONCE, passkey_auth: { public_key_p256: bytesToHex(RECORD.publicKeyXY) } });
    expect(bytesToHex(challenges[0])).toBe(bytesToHex(passkeyNotifyChallenge({
      chainId: '888', network: 'testnet', address: ADDR, action: 'subscribe', channel: 'ntfy', targetHash: sha256Hex(topic), nonce: NONCE, expiresAtSec: 1_800_000_300,
    })));
    expect(listPasskeySubscriptions(ADDR).map(s => s.label)).toEqual([topic]);
    expect(screen.queryByRole('button', { name: 'Send a test' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText(topic)).not.toBeInTheDocument());
    const remove = calls.find(c => c.url.endsWith('/notifications/passkey/unsubscribe'))!;
    expect(remove.body).toMatchObject({ address: ADDR, channel: 'ntfy', targetHash: sha256Hex(topic), nonce: NONCE });
    expect(bytesToHex(challenges[1])).toBe(bytesToHex(passkeyNotifyChallenge({
      chainId: '888', network: 'testnet', address: ADDR, action: 'unsubscribe', channel: 'ntfy', targetHash: sha256Hex(topic), nonce: NONCE, expiresAtSec: 1_800_000_300,
    })));
    expect(listPasskeySubscriptions(ADDR)).toEqual([]);

    // Never a Bearer; every request admitted by the edge allowlist.
    const rules = [...edge.get.map(r => ({ ...r, m: 'GET' })), ...edge.post.map(r => ({ ...r, m: 'POST' }))];
    for (const c of calls) {
      expect(c.auth).toBeNull();
      const path = c.url.replace(/^.*?(\/api\/)/, '/api/').split('?')[0];
      expect({ call: `${c.method} ${path}`, admitted: rules.some(r => r.m === c.method && new RegExp(r.path).test(path)) }).toEqual({ call: `${c.method} ${path}`, admitted: true });
    }
  });

  it('a cancelled passkey prompt changes nothing', async () => {
    (navigator.credentials.get as jest.Mock<any>).mockRejectedValueOnce(Object.assign(new Error('The operation either timed out or was not allowed.'), { name: 'NotAllowedError' }));
    mount();
    fireEvent.change(await screen.findByTestId('notify-me-topic'), { target: { value: 'wrfcoin-pay-0123456789abcdef' } });
    fireEvent.click(screen.getByTestId('notify-me-ntfy-add'));
    expect(await screen.findByTestId('notify-me-message')).toHaveTextContent('The passkey request was cancelled. Nothing was changed.');
    expect(calls.some(c => c.url.endsWith('/passkey/subscriptions'))).toBe(false);
  });
});

describe('the passkey notification challenge', () => {
  it('matches the backend pinned vector byte for byte', () => {
    expect(bytesToHex(passkeyNotifyChallenge({
      chainId: '888', network: 'testnet', address: `0x${'ab'.repeat(20)}`, action: 'subscribe', channel: 'ntfy',
      targetHash: sha256Hex('wrf-payouts-7f3a9c11'), nonce: '01'.repeat(32), expiresAtSec: 1_800_000_300,
    }))).toBe('8a03d3ee0b3d001ea3f8d67b5cc9eb823520b6218597b4f02a3aadfa84995aad');
  });
});
