// What the visual QA captures. Pure data so a unit test can check it against the
// public route policy without a browser.
//
// `routes`: every public route, loaded fresh (full navigation) at both widths.
// `scenarios`: states that need interaction in the same SPA session (names only;
// run.mjs implements them).

// The fixture commit id (fixtures.mjs PROOF_COMMIT).
export const PROOF_COMMIT = 'c0ffee'.padEnd(64, '0').replace(/0{8}$/, '4d2a91e7');

export const ROUTES = [
  { name: 'home', route: '/' },
  { name: 'onboarding', route: '/onboarding' },
  { name: 'map', route: '/map' },
  { name: 'explore', route: '/explore' },
  { name: 'explorer', route: '/explorer' },
  { name: 'search', route: '/search' },
  { name: 'station-detail', route: '/weather/station/st-0' },
  { name: 'leaderboard', route: '/leaderboard/contributors' },
  { name: 'contributor', route: '/contributor/c_0123456789abcdef01234567' },
  { name: 'forecasters', route: '/forecasters' },
  { name: 'forecaster', route: '/forecasters/c_0123456789abcdef01234567' },
  { name: 'competitions', route: '/competitions' },
  { name: 'bond-grants', route: '/faucet/bond-grants' },
  { name: 'proof-card', route: `/proof/${PROOF_COMMIT}` },
  { name: 'nodes', route: '/nodes' },
  { name: 'governance', route: '/governance/public' },
  { name: 'governance-proposal', route: '/governance/public/WIP-12' },
  { name: 'forecast', route: '/weather/forecast' },
  { name: 'wallet-locked', route: '/wallet' },
  { name: 'wallet-passkey', route: '/wallet/passkey' },
  { name: 'connect-station-locked', route: '/connect-station' },
  { name: 'downloads', route: '/downloads' },
  { name: 'terms', route: '/terms' },
  { name: 'privacy', route: '/privacy' },
  { name: 'api-terms', route: '/api-terms' },
  { name: 'security', route: '/security' },
];

export const SCENARIOS = [
  { name: 'forecast-filled', route: '/weather/forecast', note: 'coordinates entered, stubbed NOAA proxy' },
  { name: 'home-dismissed', route: '/', note: 'testnet banner dismissed; chip in the taskbar' },
  { name: 'downloads-unpublished', route: '/downloads', note: 'the shipped manifest (nothing published)' },
  { name: 'wallet-unlocked', route: '/wallet', note: 'after the real web-wallet setup and ed25519 login (stubbed challenge)' },
  { name: 'wallet-backup-warning', route: '/wallet', note: 'unlocked phrase wallet: the Back up recovery phrase warning (nothing revealed)' },
  { name: 'onboarding-advanced', route: '/onboarding', note: 'passkey build: the Advanced 12-word section opened' },
  { name: 'connect-station-unlocked', route: '/connect-station', note: 'same signed-in session' },
  { name: 'wallet-send-review', route: '/wallet', note: 'Send form filled and reviewed, not confirmed' },
  { name: 'wallet-address-book', route: '/wallet', note: 'Send → Address book: allowlist on, one contact allowed, one waiting 24 h (device-only)' },
  { name: 'wallet-send-allowlist-refused', route: '/wallet', note: 'Send to an address outside the address book while the allowlist is on' },
  { name: 'forecasters-empty', route: '/forecasters', note: 'index running, no forecasts yet: the honest empty state' },
  { name: 'forecaster-empty', route: '/forecasters/c_0123456789abcdef01234567', note: 'a forecaster with no decisions in the index' },
  { name: 'forecasters-unavailable', route: '/forecasters', note: 'the backend 503 while the chain-reward index is off on a network' },
  { name: 'competitions-empty', route: '/competitions', note: 'a new week with no scored forecasts yet' },
  { name: 'competitions-past-week', route: '/competitions', note: 'last week picked from the tabs: final standings' },
  { name: 'competitions-unavailable', route: '/competitions', note: 'the backend 503 while the index or the competition flag is off' },
  { name: 'bond-grants-empty', route: '/faucet/bond-grants', note: 'no grants yet: the honest empty state' },
  { name: 'bond-grants-unavailable', route: '/faucet/bond-grants', note: 'the 503 a network without the public audit list answers' },
  { name: 'explore-address', route: '/explore', note: 'a wrf address looked up: balance and earned total' },
  { name: 'proof-card-not-located', route: `/proof/${PROOF_COMMIT}`, note: 'the reading is outside the server\'s bounded block search: said, never guessed' },
  { name: 'proof-card-off', route: `/proof/${PROOF_COMMIT}`, note: 'the 404 while PROOF_CARDS_ENABLED is not true' },
  { name: 'nodes-partial', route: '/nodes', note: 'bonds and attesters unavailable from the node: said, never zero' },
  { name: 'nodes-off', route: '/nodes', note: 'the 404 while NETWORK_NODES_READ_ENABLED is not true' },
  { name: 'proof-card-wolfram', route: `/proof/${PROOF_COMMIT}`, note: 'Is this reading unusual? answered with a saved (fixture) Wolfram AppID, stubbed relay' },
  { name: 'explore-address-off', route: '/explore', note: 'the 404 while the public balance read is switched off' },
  { name: 'explore-notify-visitor', route: '/explore', note: 'notifications on, not signed in: how to turn them on (backend#389)' },
  { name: 'explore-notify-owner', route: '/explore', note: 'signed in with the looked-up address: browser push and ntfy topics' },
];

/** Public navigation paths with route params are reached through a fixture id. */
export const PARAM_ROUTE_EXAMPLES = {
  '/governance/public/:proposalId': '/governance/public/WIP-12',
  '/weather/station/:stationId': '/weather/station/st-0',
  '/contributor/:key': '/contributor/c_0123456789abcdef01234567',
  '/forecasters/:profileKey': '/forecasters/c_0123456789abcdef01234567',
  '/proof/:commitId': `/proof/${PROOF_COMMIT}`,
};

export const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900, tall: 2400 },
  { name: 'phone-390', width: 390, height: 844, tall: 3200, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
