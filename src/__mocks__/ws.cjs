// ws mock: exposes globalThis.WebSocket (provided by jest-environment-jsdom)
// as both default and named export to satisfy `import { WebSocket } from 'ws'`
const WS = typeof globalThis.WebSocket !== 'undefined'
  ? globalThis.WebSocket
  : class MockWebSocket {};

module.exports = WS;
module.exports.WebSocket = WS;
module.exports.default = WS;
