// Polyfill globals that react-router v7 and MSW expect to find in the test environment.
// This runs in setupFiles (before test framework), ensuring module-init-time code sees them.
const { TextEncoder, TextDecoder } = require('util');
const vm = require('vm');

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

// In jest-jsdom, globalThis = jsdom window (no native fetch API).
// Use vm.runInThisContext to reach Node.js 20's native globalThis where
// Response/Request/Headers/fetch live (from Node's built-in undici).
const nodeGlobal = vm.runInThisContext('globalThis');

if (typeof globalThis.Response === 'undefined' && typeof nodeGlobal.Response !== 'undefined') {
  globalThis.Response = nodeGlobal.Response;
}
// jsdom's AbortController stays on the window (jsdom's own APIs need it), but
// Node's fetch/Request (undici) reject a foreign-realm signal: Node 24 checks
// `signal instanceof AbortSignal` strictly. Bridge a genuine jsdom AbortSignal
// to a Node-realm one so code under test can pass `controller.signal` as a
// browser would. MSW builds `new Request(input, init)` itself, so Request needs
// it too. Anything else (plain objects, impostors) goes to native validation
// unchanged, so programming errors still throw as they would natively.
const jsdomAbortSignal =
  globalThis.AbortSignal !== nodeGlobal.AbortSignal ? globalThis.AbortSignal : undefined;
const jsdomAbortedGetter =
  jsdomAbortSignal && Object.getOwnPropertyDescriptor(jsdomAbortSignal.prototype, 'aborted')?.get;
// jsdom's IDL getter brand-checks its receiver: it throws for anything that is
// not a real jsdom AbortSignal, even an object built on its prototype.
const isJsdomAbortSignal = value => {
  if (!jsdomAbortedGetter || value === null || typeof value !== 'object') return false;
  try {
    jsdomAbortedGetter.call(value);
    return true;
  } catch {
    return false;
  }
};
const bridgeSignal = init => {
  if (!init || !isJsdomAbortSignal(init.signal)) return init;
  const { signal } = init;
  const bridged = new nodeGlobal.AbortController();
  if (signal.aborted) bridged.abort(signal.reason);
  else signal.addEventListener('abort', () => bridged.abort(signal.reason), { once: true });
  return { ...init, signal: bridged.signal };
};

if (typeof globalThis.Request === 'undefined' && typeof nodeGlobal.Request !== 'undefined') {
  globalThis.Request = new Proxy(nodeGlobal.Request, {
    construct: (Target, [input, init], newTarget) =>
      Reflect.construct(Target, [input, bridgeSignal(init)], newTarget),
  });
}
if (typeof globalThis.Headers === 'undefined' && typeof nodeGlobal.Headers !== 'undefined') {
  globalThis.Headers = nodeGlobal.Headers;
}
if (typeof globalThis.fetch === 'undefined' && typeof nodeGlobal.fetch !== 'undefined') {
  globalThis.fetch = (input, init) => nodeGlobal.fetch(input, bridgeSignal(init));
}
if (typeof globalThis.BroadcastChannel === 'undefined' && typeof nodeGlobal.BroadcastChannel !== 'undefined') {
  globalThis.BroadcastChannel = nodeGlobal.BroadcastChannel;
}
if (typeof globalThis.ReadableStream === 'undefined' && typeof nodeGlobal.ReadableStream !== 'undefined') {
  globalThis.ReadableStream = nodeGlobal.ReadableStream;
}
if (typeof globalThis.WritableStream === 'undefined' && typeof nodeGlobal.WritableStream !== 'undefined') {
  globalThis.WritableStream = nodeGlobal.WritableStream;
}
if (typeof globalThis.TransformStream === 'undefined' && typeof nodeGlobal.TransformStream !== 'undefined') {
  globalThis.TransformStream = nodeGlobal.TransformStream;
}
