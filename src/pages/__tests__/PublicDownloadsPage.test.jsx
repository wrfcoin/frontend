/** @jest-environment jsdom */
/**
 * frontend#574: the Downloads page renders every release fact from /downloads/manifest.json and never a
 * placeholder hash: an artifact is downloadable only when the manifest marks it published AND carries a
 * verifiable SHA-256 (file) or commit (git).
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { default: PublicDownloadsPage, PLATFORMS, TESTNET_GENESIS_HASH, VERIFY_COMMANDS, NODE_PLATFORMS, WINDOWS_NODE_ID, LINKS } = await import('../PublicDownloadsPage');
const { parseManifest, formatBytes, fileNameOf } = await import('../../services/downloadsManifest');

const HEX64 = /\b[0-9a-f]{64}\b/;
// The page's text without the one fixed hash it always shows (the testnet genesis hash), so the
// "no release hash until the manifest publishes one" checks still bite.
const releaseText = () => screen.getByTestId('public-downloads').textContent.replace(TESTNET_GENESIS_HASH, '');
const APK_SHA = 'd2c1b0a9f8e7d6c5b4a3928170605f4e3d2c1b0a9f8e7d6c5b4a3928170605f4';
const COMMIT = '0123456789abcdef0123456789abcdef01234567';

const UNPUBLISHED = {
  generated: '2026-10-19T04:20:00Z',
  release: null,
  artifacts: [
    { id: 'node-source', kind: 'git', repo: 'wrfcoin/core4', url: 'https://github.com/wrfcoin/core4', published: false },
    { id: 'android-apk', kind: 'file', url: null, size: null, sha256: null, published: false },
    { id: 'cli-source', kind: 'git', repo: 'wrfcoin/core4', url: 'https://github.com/wrfcoin/core4', published: false },
  ],
};

const PUBLISHED = {
  generated: '2026-10-22T12:00:00Z',
  release: 'testnet-r21',
  artifacts: [
    { id: 'node-source', kind: 'git', repo: 'wrfcoin/core4', url: 'https://github.com/wrfcoin/core4', tag: 'testnet-r21', commit: COMMIT, published: true },
    { id: 'android-apk', kind: 'file', url: 'https://github.com/wrfcoin/mobile/releases/download/testnet-r21/wrfcoin-testnet-r21.apk', size: 50532114, sha256: APK_SHA, signedBy: 'WRFCoin testnet release key', published: true },
  ],
};

let requested;
function mockManifest(body, status = 200) {
  requested = [];
  global.fetch = jest.fn(async input => {
    requested.push(String(input));
    if (body instanceof Error) throw body;
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  });
}

const mount = () => render(<MemoryRouter initialEntries={['/downloads']}><PublicDownloadsPage /></MemoryRouter>);
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('reads only the same-origin manifest and shows every artifact as not yet published, with no hash anywhere', async () => {
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  expect(requested).toEqual(['/downloads/manifest.json']);
  expect(screen.getByTestId('download-node-status')).toHaveTextContent('Not yet available');
  expect(screen.queryByRole('button', { name: 'Copy address' })).toBeNull();

  expect(screen.getAllByText('Not yet published').length).toBeGreaterThanOrEqual(3);
  expect(releaseText()).not.toMatch(HEX64);
  expect(screen.getByRole('button', { name: 'Download APK' })).toBeDisabled();
  expect(screen.queryByRole('link', { name: 'Download APK' })).toBeNull();
  // The verify section prints the manifest the page actually read.
  expect(screen.getByTestId('manifest-json').textContent).toContain('"published": false');
});

it('renders release, commit, file, size, SHA-256 and signer for a published artifact and enables the download', async () => {
  mockManifest(PUBLISHED);
  mount();
  const apk = await screen.findByTestId('release-android-apk');
  expect(apk).toHaveTextContent('testnet-r21');
  expect(apk).toHaveTextContent('wrfcoin-testnet-r21.apk · 48.2 MB');
  expect(apk).toHaveTextContent(APK_SHA);
  expect(apk).toHaveTextContent('WRFCoin testnet release key');
  expect(within(apk).getByRole('button', { name: 'Copy the SHA-256' })).toBeInTheDocument();

  const node = screen.getByTestId('release-node-source');
  expect(node).toHaveTextContent('0123456789…');
  expect(within(node).getByRole('button', { name: 'Copy the full commit' })).toBeInTheDocument();

  const download = screen.getByRole('link', { name: 'Download APK' });
  expect(download).toHaveAttribute('href', PUBLISHED.artifacts[1].url);
  expect(within(screen.getByTestId('download-android-app')).queryByText('Not yet published')).toBeNull();
  expect(within(screen.getByTestId('download-android-app')).getAllByText('Published')).toHaveLength(2);
  // The CLI entry is absent from this manifest: still "not yet published", never invented.
  expect(screen.getByTestId('release-cli-source')).toHaveTextContent('Not yet published');
});

it('treats a published flag without a verifiable hash or commit as not published', () => {
  const parsed = parseManifest({
    release: 'testnet-r21',
    artifacts: [
      { id: 'android-apk', kind: 'file', url: 'https://x/y.apk', sha256: 'TBD', published: true },
      { id: 'cli-linux-x86_64', kind: 'file', url: 'https://x/z.tar.gz', sha256: 'abc123', published: true },
      { id: 'node-source', kind: 'git', commit: '', published: true },
      { id: 'ok', kind: 'file', url: 'https://x/ok.bin', size: 1536, sha256: APK_SHA.toUpperCase(), published: true },
      { id: 'dup', kind: 'file', published: false }, { id: 'dup', kind: 'file', published: false },
      { kind: 'file', published: true }, 'junk', null,
    ],
  });
  expect(parsed.release).toBe('testnet-r21');
  expect(parsed.artifacts.map(a => [a.id, a.published, a.sha256])).toEqual([
    ['android-apk', false, null],
    ['cli-linux-x86_64', false, null],
    ['node-source', false, null],
    ['ok', true, APK_SHA],
    ['dup', false, null],
  ]);
  expect(formatBytes(1536)).toBe('2 KB');
  expect(formatBytes(50532114)).toBe('48.2 MB');
  expect(formatBytes(null)).toBeNull();
  expect(fileNameOf('https://host/a/b/wrfcoin%20x.apk?x=1')).toBe('wrfcoin x.apk');
});

it('keeps downloads off and says so when the manifest cannot be read', async () => {
  mockManifest(new Error('offline'));
  mount();
  const alerts = await screen.findAllByRole('alert');
  expect(alerts.map(a => a.textContent).join(' ')).toContain('The release manifest could not be read');
  expect(screen.getAllByText('Release manifest unavailable').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByRole('button', { name: 'Download APK' })).toBeDisabled();
  expect(releaseText()).not.toMatch(HEX64);
  expect(screen.queryByTestId('manifest-json')).toBeNull();
});

it('filters the cards by platform chip and keeps "All" as the default', async () => {
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  const group = screen.getByRole('group', { name: 'Filter by platform' });
  expect(within(group).getAllByRole('button')).toHaveLength(PLATFORMS.length);
  expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(6);

  fireEvent.click(within(group).getByRole('button', { name: 'Android' }));
  await waitFor(() => expect(screen.getAllByRole('article').map(a => a.getAttribute('aria-label'))).toEqual(['Android app', 'Weather stations', 'For developers']));
  expect(screen.getByText('3 of 6 items for Android')).toBeInTheDocument();

  fireEvent.click(within(group).getByRole('button', { name: 'Linux' }));
  await waitFor(() => expect(screen.getAllByRole('article').map(a => a.getAttribute('aria-label'))).toEqual(['Sync node', 'Node status page', 'Command-line wallet', 'For developers']));
  fireEvent.click(within(group).getByRole('button', { name: 'All' }));
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(6));
});

it('links in-app destinations by router link and external ones with noopener', async () => {
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  expect(screen.getByRole('link', { name: 'Open the web wallet' })).toHaveAttribute('href', '/wallet');
  expect(screen.getByRole('link', { name: 'Connect a station' })).toHaveAttribute('href', '/connect-station');
  expect(screen.getByRole('link', { name: 'Security policy' })).toHaveAttribute('href', '/security');
  const external = screen.getAllByRole('link').filter(a => /^https?:/.test(a.getAttribute('href') || ''));
  expect(external.length).toBeGreaterThan(5);
  for (const a of external) {
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a.getAttribute('href')).toMatch(/^https:\/\/github\.com\/wrfcoin(\/|$)/);
  }
});

it('Copy always copies the whole command, however the box renders it', async () => {
  const writeText = jest.fn(async (_text) => undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  const join = 'git clone https://github.com/wrfcoin/infra.git wrfcoin/infra && bash wrfcoin/infra/testnet/join.sh';
  fireEvent.click(screen.getAllByRole('button', { name: 'Copy command' })[0]);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(join));
  // The command box wraps instead of clipping: no nowrap, no horizontal scroll container.
  const css = (await import('node:fs')).readFileSync(new URL('../PublicDownloadsPage.css', import.meta.url), 'utf8');
  const rule = css.match(/\.dl-cmd code \{[^}]*\}/)[0];
  expect(rule).toMatch(/white-space:\s*pre-wrap/);
  expect(rule).toMatch(/overflow-wrap:\s*anywhere/);
  expect(rule).not.toMatch(/nowrap/);
});

it('does not mark Windows as available until the manifest publishes it: a native download is coming, not WSL or Docker', async () => {
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  const node = screen.getByTestId('download-sync-node');
  expect(node.textContent).not.toMatch(/WSL2|Docker Desktop/);
  expect(within(node).queryByText('Available')).toBeNull();
  expect(within(node).getByText('Linux and macOS')).toBeInTheDocument();
  expect(NODE_PLATFORMS.find(r => r.os === 'Windows')).toEqual({ os: 'Windows', status: 'neutral', label: 'Not available yet' });
  expect(screen.getByTestId('windows-node-note')).toHaveTextContent('A native Windows download is coming: one file to run, no WSL and no Docker. It is not available yet.');
  // Linux and macOS rows are unchanged.
  expect(NODE_PLATFORMS.map(r => r.os)).toEqual(['Linux x86_64', 'macOS, Intel', 'macOS, Apple Silicon', 'Windows']);
});

it('renders each per-OS checksum command as its own one-line copyable code box with no trailing punctuation', async () => {
  const writeText = jest.fn(async () => undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  const cmds = screen.getByTestId('verify-commands');
  const codes = [...cmds.querySelectorAll('code')].map(c => c.textContent);
  expect(codes).toEqual(['sha256sum -c SHA256SUMS', 'shasum -a 256 -c SHA256SUMS', 'certutil -hashfile <file> SHA256']);
  for (const box of cmds.querySelectorAll('.dl-cmd')) expect(box).toHaveClass('dl-cmd--nowrap');
  expect(cmds.textContent).not.toMatch(/SHA256\./);
  fireEvent.click(within(cmds).getByRole('button', { name: 'Copy the Windows command' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('certutil -hashfile <file> SHA256'));
  expect(VERIFY_COMMANDS.map(v => v.os)).toEqual(['Linux', 'macOS', 'Windows']);
  // The nowrap modifier keeps the command on one line; the base rule still wraps long commands.
  const css = (await import('node:fs')).readFileSync(new URL('../PublicDownloadsPage.css', import.meta.url), 'utf8');
  const rule = css.match(/\.dl-cmd--nowrap code \{[^}]*\}/)[0];
  expect(rule).toMatch(/white-space:\s*pre;/);
  expect(rule).toMatch(/overflow-x:\s*auto/);
});

it('shows the real testnet genesis hash on the command-line wallet card, never a placeholder', async () => {
  mockManifest(UNPUBLISHED);
  mount();
  await screen.findByTestId('manifest-json');
  expect(TESTNET_GENESIS_HASH).toBe('553a3758386d9631037d7469686acb4a121ced81dcf5cde256e2d05667c5f332');
  const cli = screen.getByTestId('download-cli-wallet');
  expect(cli).toHaveTextContent(TESTNET_GENESIS_HASH);
  expect(within(cli).getByRole('button', { name: 'Copy the genesis hash' })).toBeInTheDocument();
  expect(screen.getByTestId('public-downloads').textContent).not.toMatch(/placeholder|genesis-hash>|<888/i);
});

// The real manifest this site serves (public/downloads/manifest.json): the Windows installer is the one
// published file. The core4 source is public (published: true) but names no release tag or commit yet,
// so the parser still shows no verifiable source release; every other entry stays unpublished.
const fs = await import('node:fs');
const SHIPPED = JSON.parse(fs.readFileSync(new URL('../../../public/downloads/manifest.json', import.meta.url), 'utf8'));
const WIN_URL = 'https://github.com/wrfcoin/core4/releases/download/v888-windows-preview-3/wrfcoin-node-0.3.0-g0c6e0fbb-windows-x86_64-setup.exe';
const WIN_SHA = '9ae02d6d3f058b140fd84ffbaa26f6a0f1b76a20bb4921ebd70f4468226c1d4e';

it('ships a manifest whose only verifiable published artifact is the Windows node installer', () => {
  expect(Number.isNaN(Date.parse(SHIPPED.generated))).toBe(false);
  const win = SHIPPED.artifacts.find(a => a.id === WINDOWS_NODE_ID);
  expect(win).toEqual({
    id: 'node-windows-x86_64', kind: 'file', repo: 'wrfcoin/core4', url: WIN_URL, size: 11052313, sha256: WIN_SHA,
    tag: 'v888-windows-preview-3', commit: '0c6e0fbba667d329ddd07b4057c27f4e01a77e9c', signedBy: null, published: true,
  });
  // The tag and commit in the URL agree with the entry.
  expect(win.url).toContain(`/download/${win.tag}/`);
  expect(win.url).toContain(`-g${win.commit.slice(0, 8)}-`);
  expect(SHIPPED.artifacts.filter(a => a.published === true).map(a => a.id)).toEqual(['node-source', 'cli-source', WINDOWS_NODE_ID]);
  for (const id of ['node-source', 'cli-source']) {
    expect(SHIPPED.artifacts.find(a => a.id === id)).toMatchObject({ kind: 'git', repo: 'wrfcoin/core4', url: 'https://github.com/wrfcoin/core4', tag: 'v888-h3000', commit: 'de9d0d268e1a914109444c1d49b2dcfffe896d80' });
  }
  const parsed = parseManifest(SHIPPED);
  // Source rows are published as a tag + commit (frontend#37); only the installer is a file with a hash.
  expect(parsed.artifacts.filter(a => a.published).map(a => [a.id, a.sha256])).toEqual([['node-source', null], ['cli-source', null], [WINDOWS_NODE_ID, WIN_SHA]]);
});

it('renders the Windows download from the manifest: link, size, SHA-256 next to it, check, run, use, unsigned note', async () => {
  const writeText = jest.fn(async () => undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  mockManifest(SHIPPED);
  mount();
  await screen.findByTestId('manifest-json');
  const win = screen.getByTestId('windows-node');
  const node = screen.getByTestId('download-sync-node');
  expect(within(node).getByText('Linux, macOS · Windows preview')).toBeInTheDocument();
  expect(within(node).getByText('Preview download')).toBeInTheDocument();
  expect(within(node).queryByText('Not available yet')).toBeNull();
  expect(screen.queryByTestId('windows-node-note')).toBeNull();

  const download = within(win).getByRole('link', { name: 'Download for Windows (10.5 MB)' });
  expect(download).toHaveAttribute('href', WIN_URL);
  expect(download).toHaveAttribute('rel', 'noopener noreferrer');
  const facts = within(win).getByTestId(`release-${WINDOWS_NODE_ID}`);
  expect(facts).toHaveTextContent('wrfcoin-node-0.3.0-g0c6e0fbb-windows-x86_64-setup.exe · 10.5 MB');
  expect(facts).toHaveTextContent(WIN_SHA);
  expect(facts).toHaveTextContent('v888-windows-preview-3');
  expect(facts).toHaveTextContent('0c6e0fbba6…');
  // The hash sits in the same step as the download button.
  expect(download.closest('li')).toContainElement(facts);

  const steps = within(win).getAllByRole('listitem');
  expect(steps.map(li => li.querySelector('.dl-step-title').textContent)).toEqual([
    'Download the installer', 'Check the file before you run it', 'Run the setup',
  ]);
  const check = 'certutil -hashfile wrfcoin-node-0.3.0-g0c6e0fbb-windows-x86_64-setup.exe SHA256';
  expect(steps[1].querySelector('code').textContent).toBe(check);
  fireEvent.click(within(steps[1]).getByRole('button', { name: 'Copy the Windows check command' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(check));
  expect(steps[1]).toHaveTextContent('must match the SHA-256 above');

  expect(screen.getByTestId('windows-node-use')).toHaveTextContent('WRFCoin Node starts the node in the background and opens its dashboard at http://127.0.0.1:8556/dashboard. Stop WRFCoin Node stops it.');
  expect(screen.getByTestId('windows-node-use')).toHaveTextContent('%LOCALAPPDATA%\\WRFCoin');
  expect(screen.getByTestId('windows-node-unsigned')).toHaveTextContent('testnet preview and the installer is not code-signed yet');
  expect(screen.getByTestId('windows-node-unsigned')).toHaveTextContent('If the hash matched, choose More info, then Run anyway.');
  expect(within(win).getByRole('link', { name: /Windows node guide/ })).toHaveAttribute('href', LINKS.windowsGuide);
  expect(win.textContent).not.toMatch(/WSL2|Docker Desktop/);

  // The APK stays unpublished.
  expect(screen.getByRole('button', { name: 'Download APK' })).toBeDisabled();
  // The source rows name the v888-h3000 commit (frontend#37).
  expect(screen.getByTestId('release-node-source')).toHaveTextContent('Source commitde9d0d268e…');
  expect(screen.getByTestId('release-cli-source')).toHaveTextContent('Source commitde9d0d268e…');
  // The Windows filter still shows the sync node.
  fireEvent.click(screen.getByRole('button', { name: 'Windows' }));
  await waitFor(() => expect(screen.getAllByRole('article').map(a => a.getAttribute('aria-label'))).toContain('Sync node'));
});

it('never shows a Windows hash or download from a published flag without a well-formed hash, or before the manifest loads', async () => {
  const bad = { ...SHIPPED, artifacts: SHIPPED.artifacts.map(a => (a.id === WINDOWS_NODE_ID ? { ...a, sha256: 'TBD' } : a)) };
  mockManifest(bad);
  mount();
  await screen.findByTestId('manifest-json');
  expect(screen.getByTestId('windows-node-note')).toHaveTextContent('It is not available yet.');
  expect(screen.queryByRole('link', { name: /Download for Windows/ })).toBeNull();
  expect(within(screen.getByTestId('download-sync-node')).getByText('Linux and macOS')).toBeInTheDocument();
  expect(releaseText()).not.toMatch(HEX64);
  cleanup();

  mockManifest(new Error('offline'));
  mount();
  await screen.findAllByRole('alert');
  expect(within(screen.getByTestId('windows-node')).getByText('Release manifest unavailable')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Download for Windows/ })).toBeNull();
});
