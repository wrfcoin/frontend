/** @jest-environment jsdom */
/**
 * frontend#383: under jest-jsdom, AbortController is jsdom's while fetch and
 * Request come from Node (jest.setup.cjs). Node 24's undici rejects a
 * foreign-realm signal, so every ApiClient request (which passes
 * `controller.signal`) failed under MSW. The setup bridges the signal; these
 * pin that a jsdom signal is accepted and that aborting it still aborts.
 */
import vm from 'node:vm';
import { describe, expect, it } from '@jest/globals';

// Node's own realm, where the unwrapped undici fetch/Request live.
const nodeGlobal = vm.runInThisContext('globalThis');

describe('jest.setup.cjs AbortSignal bridge (frontend#383)', () => {
  it('new Request accepts a jsdom AbortController signal', () => {
    const controller = new window.AbortController();
    expect(() => new Request('https://api.test/x', { signal: controller.signal })).not.toThrow();
  });

  it('aborting the jsdom controller aborts the Request signal', () => {
    const controller = new window.AbortController();
    const request = new Request('https://api.test/x', { signal: controller.signal });
    expect(request.signal.aborted).toBe(false);
    controller.abort();
    expect(request.signal.aborted).toBe(true);
  });

  it('an already-aborted jsdom signal yields an aborted Request', () => {
    const controller = new window.AbortController();
    controller.abort();
    expect(new Request('https://api.test/x', { signal: controller.signal }).signal.aborted).toBe(true);
  });

  it('fetch with an aborted jsdom signal rejects as an abort, not a TypeError', async () => {
    const controller = new window.AbortController();
    controller.abort();
    await expect(fetch('https://api.test/x', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('Request stays usable as a class', () => {
    const request = new Request('https://api.test/x');
    expect(request).toBeInstanceOf(Request);
    expect(request.url).toBe('https://api.test/x');
  });
});

// Codex on #397: only a genuine jsdom AbortSignal may be bridged. Anything else
// must reach native validation unchanged, so a programming error still throws
// a TypeError instead of being laundered into an abort.
const impostors = () => [
  ['a pre-aborted plain object', { aborted: true }],
  ['a plain object', { aborted: false }],
  ['an EventTarget impostor', Object.assign(new window.EventTarget(), { aborted: true })],
  ['an object on the jsdom AbortSignal prototype', Object.create(window.AbortSignal.prototype)],
];

const outcome = fn => {
  try {
    fn();
    return 'accepted';
  } catch (error) {
    return error.constructor.name;
  }
};
const asyncOutcome = async promise => {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error.name;
  }
};

describe('jest.setup.cjs bridges only genuine jsdom signals (frontend#383)', () => {
  it.each(impostors())('new Request with %s behaves exactly as native undici', (_label, signal) => {
    const url = 'https://api.test/x';
    const native = outcome(() => new nodeGlobal.Request(url, { signal }));
    expect(outcome(() => new Request(url, { signal }))).toBe(native);
  });

  it.each(impostors())('fetch with %s behaves exactly as native undici', async (_label, signal) => {
    const url = 'https://api.test/x';
    const native = await asyncOutcome(nodeGlobal.fetch(url, { signal }));
    expect(await asyncOutcome(fetch(url, { signal }))).toBe(native);
  });

  it('a pre-aborted plain object is a TypeError for Request and fetch, never an AbortError', async () => {
    const signal = { aborted: true };
    expect(() => new Request('https://api.test/x', { signal })).toThrow(nodeGlobal.TypeError);
    await expect(fetch('https://api.test/x', { signal })).rejects.toBeInstanceOf(nodeGlobal.TypeError);
  });

  it('an EventTarget impostor is not bridged: on Node >= 24 it is a TypeError', async () => {
    const major = Number(process.versions.node.split('.')[0]);
    const signal = Object.assign(new window.EventTarget(), { aborted: true });
    if (major < 24) return; // Node 20/22 undici duck-types EventTargets; covered by the parity cases above.
    expect(() => new Request('https://api.test/x', { signal })).toThrow(nodeGlobal.TypeError);
    await expect(fetch('https://api.test/x', { signal })).rejects.toMatchObject({ name: 'TypeError' });
  });
});
