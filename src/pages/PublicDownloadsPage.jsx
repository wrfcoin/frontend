import React, { useEffect, useMemo, useState } from 'react';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import { Link } from 'react-router-dom';
import { WrfAlert, WrfBadge, WrfButton, WrfCard } from '../components/DesignSystem';
import {
  bgPrimary, bgSecondary, borders, fontFamily, glows, primary, primaryLight, radii, shadows,
  textMuted, textPrimary, textSecondary,
} from '../components/DesignSystem/tokens';
import ReleaseFacts, { CommandLine, CopyButton } from '../components/downloads/ReleaseFacts';
import { DOWNLOADS_MANIFEST_PATH, fileNameOf, formatBytes, loadDownloadsManifest } from '../services/downloadsManifest';
import { WRFCOIN_CHAIN_ID } from '../config/network';
import './PublicDownloadsPage.css';

/**
 * Public Downloads page (frontend#574, owner-approved mock-up `mockups/downloads.html`).
 *
 * What a newcomer can install, where it works today, and how to check that a download is what we
 * published. Every release fact (version, file, size, SHA-256, source commit) comes from the release
 * manifest on this origin; the parser only marks an artifact published when it carries a verifiable
 * hash or commit, so the page shows "Not yet published" instead of a placeholder and keeps download
 * buttons disabled until then. Per-platform support rows mirror infra/testnet/JOIN_TESTNET.md.
 */

// Design-system tokens as CSS custom properties for PublicDownloadsPage.css.
const TOKEN_VARS = {
  '--dl-bg-primary': bgPrimary,
  '--dl-bg-secondary': bgSecondary,
  '--dl-text': textPrimary,
  '--dl-text-secondary': textSecondary,
  '--dl-text-muted': textMuted,
  '--dl-border': borders.default,
  '--dl-primary': primary,
  '--dl-primary-light': primaryLight,
  '--dl-r-sm': `${radii.sm}px`,
  '--dl-r-lg': `${radii.lg}px`,
  '--dl-r-full': `${radii.full}px`,
  '--dl-shadow-md': shadows.md,
  '--dl-glow-primary': glows.primary,
  '--dl-font': fontFamily.display,
  '--dl-mono': fontFamily.mono,
};

export const PLATFORMS = [
  { id: 'all', label: 'All' },
  { id: 'linux', label: 'Linux' },
  { id: 'macos', label: 'macOS' },
  { id: 'windows', label: 'Windows' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
  { id: 'web', label: 'Web' },
];

const ALL_PLATFORMS = PLATFORMS.filter(p => p.id !== 'all').map(p => p.id);

// Links. In-app destinations are router links; everything else opens the public GitHub organisation.
export const LINKS = {
  webWallet: '/wallet',
  quickstart: 'https://github.com/wrfcoin/docs/blob/main/testnet/quickstart.md',
  joinGuide: 'https://github.com/wrfcoin/infra/blob/main/testnet/JOIN_TESTNET.md',
  nodeSource: 'https://github.com/wrfcoin/core4',
  windowsGuide: 'https://github.com/wrfcoin/core4/blob/main/docs/operator/windows-node.md',
  statusPageWork: 'https://github.com/wrfcoin/docs/blob/main/testnet/node-status.md',
  androidReleases: 'https://github.com/wrfcoin/mobile/releases',
  cliGuide: 'https://github.com/wrfcoin/core4/blob/main/docs/WRFCOIN_CLI_GUIDE.md',
  connectStation: '/connect-station',
  apiReference: 'https://github.com/wrfcoin/core4/tree/main/docs/api-reference',
  rustSdk: 'https://github.com/wrfcoin/core4/tree/main/sdks/generated/rust',
  allRepos: 'https://github.com/wrfcoin',
  contributing: 'https://github.com/wrfcoin/core4/blob/main/CONTRIBUTING.md',
  reportBug: 'https://github.com/wrfcoin/testnet-support/issues',
  securityPolicy: '/security',
};

export const JOIN_COMMAND = 'git clone https://github.com/wrfcoin/infra.git wrfcoin/infra && bash wrfcoin/infra/testnet/join.sh';
export const STATUS_PAGE_URL = 'http://127.0.0.1:8556/dashboard';
export const WINDOWS_DASHBOARD_URL = 'http://127.0.0.1:8556/dashboard';
export const CLI_BUILD_COMMAND = 'cargo build --release -p wrfcoin_cli';
export const MANIFEST_URL = `https://wrfcoin.com${DOWNLOADS_MANIFEST_PATH}`;

/**
 * The testnet (chain 888) genesis block hash, unprefixed. Source of truth: infra
 * testnet/cut-pins.env WRFCOIN_CUT_GENESIS_HASH. A node reports it 0x-prefixed.
 */
export const TESTNET_GENESIS_HASH = '553a3758386d9631037d7469686acb4a121ced81dcf5cde256e2d05667c5f332';

/** Per-OS checksum commands. Each renders as its own one-line, copyable code box. */
export const VERIFY_COMMANDS = [
  { os: 'Linux', command: 'sha256sum -c SHA256SUMS' },
  { os: 'macOS', command: 'shasum -a 256 -c SHA256SUMS' },
  { os: 'Windows', command: 'certutil -hashfile <file> SHA256' },
];

/** Manifest id of the native Windows sync-node installer (wrfcoin/core4 release asset). */
export const WINDOWS_NODE_ID = 'node-windows-x86_64';

/**
 * Per-platform rows (validation status, not a promise). Windows is not a WSL2/Docker route (owner
 * ruling): the Windows sync node is a native download, one file. Its row reads "Not available yet"
 * until the release manifest publishes the installer, then "Preview download".
 */
export const NODE_PLATFORMS = [
  { os: 'Linux x86_64', status: 'active', label: 'Validated' },
  { os: 'macOS, Intel', status: 'active', label: 'Supported' },
  { os: 'macOS, Apple Silicon', status: 'warning', label: 'Native build, join not yet validated' },
  { os: 'Windows', status: 'neutral', label: 'Not available yet' },
];

export const WINDOWS_PREVIEW_ROW = { os: 'Windows', status: 'info', label: 'Preview download' };

/** The node rows with the Windows row reflecting whether the manifest publishes the installer. */
export function nodePlatforms(windowsPublished) {
  return NODE_PLATFORMS.map(row => (row.os === 'Windows' && windowsPublished ? WINDOWS_PREVIEW_ROW : row));
}

/** The Windows checksum command from VERIFY_COMMANDS, with the downloaded file's name filled in. */
export function windowsVerifyCommand(fileName) {
  const template = VERIFY_COMMANDS.find(v => v.os === 'Windows').command;
  return fileName ? template.replace('<file>', fileName) : template;
}

const ANDROID_PLATFORMS = [
  { os: 'Android (APK, sideload)', status: 'warning', label: 'Not yet published' },
  { os: 'Google Play', status: 'neutral', label: 'Not planned for testnet' },
  { os: 'iOS', status: 'neutral', label: 'Not available' },
];

const STATION_PLATFORMS = [
  { os: 'Ambient Weather (WS-2000, WS-5000 and others)', status: 'active', label: 'Supported' },
  { os: 'Phone as a station', status: 'warning', label: 'Not yet available' },
  { os: 'Radio receivers (rtl_433)', status: 'neutral', label: 'Experimental' },
];

/** Design-system badge: `dot` adds the status dot; otherwise the label alone. */
function Badge({ status, label, dot = false, className }) {
  return <WrfBadge status={status} variant={dot ? 'dot' : 'count'} label={label} className={className} />;
}

function PlatformRows({ rows }) {
  return (
    <ul className="dl-plat">
      {rows.map(row => (
        <li key={row.os}>
          <span className="dl-os">{row.os}</span>
          <Badge status={row.status} label={row.label} />
        </li>
      ))}
    </ul>
  );
}

function ExternalLink({ href, children, className }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children} <i className="bi bi-box-arrow-up-right dl-ext" aria-hidden="true" />
    </a>
  );
}

function CardHead({ icon, title, badge }) {
  return (
    <>
      <div className="dl-ttl">
        <span className="dl-ico"><i className={`bi ${icon}`} aria-hidden="true" /></span>
        <h2>{title}</h2>
      </div>
      {badge}
    </>
  );
}

/**
 * The Windows part of the sync-node card. Until the manifest publishes the installer it says so (and
 * shows the manifest state); once published, every fact (link, file, size, SHA-256, commit, tag)
 * comes from that manifest entry, with the hash right next to the download.
 */
function WindowsNode({ state, artifact }) {
  if (!artifact?.published) {
    return (
      <div className="dl-win" data-testid="windows-node">
        <h3 className="dl-sub">On Windows</h3>
        <p className="dl-req" data-testid="windows-node-note"><strong>Windows</strong> A native Windows download is coming: one file to run, no WSL and no Docker. It is not available yet.</p>
        {state === 'ready' ? null : <ReleaseFacts state={state} release={null} artifact={artifact} label={WINDOWS_NODE_ID} />}
      </div>
    );
  }
  const file = fileNameOf(artifact.url);
  const size = formatBytes(artifact.size);
  return (
    <section className="dl-win" data-testid="windows-node" aria-label="Windows download">
      <h3 className="dl-sub">On Windows <WrfBadge status="info" variant="count" label="Preview" /></h3>
      <p className="dl-req">One installer for 64-bit Windows 10 and 11. No WSL, no Docker and no admin prompt: it installs for your user only.</p>
      <ol className="dl-steps">
        <li>
          <span className="dl-step-title">Download the installer</span>
          <WrfButton variant="primary" component="a" href={artifact.url} rel="noopener noreferrer" className="dl-win-get">
            Download for Windows{size ? ` (${size})` : ''}
          </WrfButton>
          <ReleaseFacts state={state} release={artifact.tag} artifact={artifact} label={WINDOWS_NODE_ID} />
        </li>
        <li>
          <span className="dl-step-title">Check the file before you run it</span>
          <span className="dl-step-text">In Command Prompt or PowerShell, in the folder you saved it to, run:</span>
          <CommandLine text={windowsVerifyCommand(file)} label="Copy the Windows check command" />
          <span className="dl-step-text">The long line it prints must match the SHA-256 above exactly. If it does not, delete the file and do not run it.</span>
        </li>
        <li>
          <span className="dl-step-title">Run the setup</span>
          <span className="dl-step-text">Double-click {file ? <span className="dl-mono">{file}</span> : 'the installer'} and follow the steps.</span>
        </li>
      </ol>
      <p className="dl-req" data-testid="windows-node-use"><strong>Using it</strong> From the Start menu, <strong>WRFCoin Node</strong> starts the node in the background and opens its dashboard at <span className="dl-mono">{WINDOWS_DASHBOARD_URL}</span>. <strong>Stop WRFCoin Node</strong> stops it. Your node keeps its data in <span className="dl-mono">%LOCALAPPDATA%\WRFCoin</span>. It only syncs and needs no incoming connections, so choosing <em>Deny</em> if Windows Firewall asks is fine.</p>
      <WrfAlert severity="info" role="note" className="dl-alert" data-testid="windows-node-unsigned">
        This is a testnet preview and the installer is not code-signed yet, so Windows may say it protected your PC. If the hash matched, choose <strong>More info</strong>, then <strong>Run anyway</strong>.
      </WrfAlert>
      <ExternalLink className="dl-link" href={LINKS.windowsGuide}>Windows node guide</ExternalLink>
    </section>
  );
}

function SoftwareCard({ id, platforms, icon, title, badge, footer, children }) {
  return (
    <WrfCard
      component="article"
      className="dl-card"
      data-testid={`download-${id}`}
      data-platforms={platforms.join(' ')}
      aria-label={title}
      header={<CardHead icon={icon} title={title} badge={badge} />}
      footer={footer}
    >
      {children}
    </WrfCard>
  );
}

export default function PublicDownloadsPage() {
  // Light theme: surface/text/border variables come from the light token set; everything else stays.
  const isDark = useIsDarkTheme();
  const themeVars = { ...TOKEN_VARS, ...publicPageSurfaceVars('dl', isDark) };
  const [platform, setPlatform] = useState('all');
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    const controller = new globalThis.AbortController();
    loadDownloadsManifest(controller.signal)
      .then(setOutcome)
      .catch(() => { /* aborted on unmount */ });
    return () => controller.abort();
  }, []);

  const state = outcome === null ? 'loading' : outcome.kind === 'ok' ? 'ready' : 'error';
  const manifest = outcome?.kind === 'ok' ? outcome.manifest : null;
  const byId = useMemo(() => new Map((manifest?.artifacts ?? []).map(a => [a.id, a])), [manifest]);
  const release = manifest?.release ?? null;
  const windowsNode = byId.get(WINDOWS_NODE_ID);
  const windowsPublished = Boolean(windowsNode?.published);
  const facts = (artifactId, extra) => (
    <ReleaseFacts state={state} release={release} artifact={byId.get(artifactId)} label={artifactId} {...extra} />
  );

  const cards = [
    {
      id: 'sync-node', platforms: ['linux', 'macos', 'windows'], icon: 'bi-hdd-network', title: 'Sync node',
      badge: <Badge status="active" label={windowsPublished ? 'Linux, macOS · Windows preview' : 'Linux and macOS'} dot />,
      body: (
        <>
          <p className="dl-secondary">Run a full copy of the testnet chain, verify blocks yourself and serve the API locally{windowsPublished ? ': in Docker on Linux and macOS, or as a native install on Windows.' : ' in Docker.'}</p>
          <PlatformRows rows={nodePlatforms(windowsPublished)} />
          <h3 className="dl-sub">On Linux and macOS</h3>
          <p className="dl-req"><strong>Needs</strong> git and Docker with Compose v2. Follow the join guide for current build requirements.</p>
          <CommandLine text={JOIN_COMMAND} />
          {facts('node-source', { verifyHint: { command: 'git verify-commit <commit>', text: 'after cloning; check the expected source revision in the join guide' } })}
          <p className="dl-rel-note">Release identifiers appear below when they are available in the manifest.</p>
          <WindowsNode state={state} artifact={windowsNode} />
        </>
      ),
      footer: (
        <>
          <WrfButton variant="primary" component="a" href={LINKS.joinGuide} target="_blank" rel="noopener noreferrer">Join guide</WrfButton>
          <ExternalLink className="dl-link" href={LINKS.nodeSource}>Source on GitHub</ExternalLink>
        </>
      ),
    },
    {
      id: 'node-status', platforms: ['linux', 'macos', 'windows', 'web'], icon: 'bi-speedometer2', title: 'Node dashboard',
      badge: <Badge status="info" label="Runs on your node" dot />,
      body: (
        <>
          <p className="dl-secondary">Your node serves its own dashboard: chain height, sync, peers, host load and version, refreshed every few seconds.</p>
          <p className="dl-req">Open <span className="dl-mono">{STATUS_PAGE_URL}</span> in a browser on the same machine. The Windows preview installer opens it for you from the Start menu. A Docker node serves it once its node build includes the dashboard (core4 main does).</p>
          <WrfAlert severity="info" role="note" className="dl-alert">
            The dashboard only reads your own node. It is not a public status page for the network.
          </WrfAlert>
        </>
      ),
      footer: (
        <WrfButton variant="outline" component="a" href={LINKS.statusPageWork} target="_blank" rel="noopener noreferrer">Node dashboard guide</WrfButton>
      ),
    },
    {
      id: 'android-app', platforms: ['android', 'ios'], icon: 'bi-phone', title: 'Android app',
      badge: <Badge status={byId.get('android-apk')?.published ? 'active' : 'warning'} label={byId.get('android-apk')?.published ? 'Published' : 'Not yet published'} dot />,
      body: (
        <>
          <p className="dl-secondary">{byId.get('android-apk')?.published ? 'Download details are reported by the release manifest below.' : 'Signed Android downloads are not yet published. Signing is scheduled after launch without a promised release date.'}</p>
          <PlatformRows rows={ANDROID_PLATFORMS.map((row, i) => i === 0 && byId.get('android-apk')?.published ? { ...row, status: 'active', label: 'Published' } : row)} />
          <p className="dl-req"><strong>Until then</strong> use the web wallet and the public quickstart.</p>
          {facts('android-apk')}
          <p className="dl-rel-note">Compare the SHA-256 before installing; Android also verifies the signature.</p>
        </>
      ),
      footer: (
        <>
          {byId.get('android-apk')?.published ? (
            <WrfButton variant="primary" component="a" href={byId.get('android-apk').url} download>Download APK</WrfButton>
          ) : (
            <WrfButton variant="primary" disabled>Download APK</WrfButton>
          )}
          <ExternalLink className="dl-link" href={LINKS.androidReleases}>Release notes</ExternalLink>
        </>
      ),
    },
    {
      id: 'cli-wallet', platforms: ['linux', 'macos', 'windows'], icon: 'bi-terminal', title: 'Command-line wallet',
      badge: <Badge status="neutral" label="Source only" dot className="dl-badge-purple" />,
      body: (
        <>
          <p className="dl-secondary">The <span className="dl-mono">wrfcoin</span> CLI for scripted sends, address inspection and node operators. Built with Rust from the core4 repository; prebuilt binaries are not published yet.</p>
          <CommandLine text={CLI_BUILD_COMMAND} />
          <p className="dl-req"><strong>Needs</strong> a Rust toolchain. Set <span className="dl-mono">WRFCOIN_CHAIN_ID={WRFCOIN_CHAIN_ID ?? '<published-chain-id>'}</span> and <span className="dl-mono">WRFCOIN_NETWORK_ID=testnet</span> before sending. Your node should report this testnet genesis hash:</p>
          <CommandLine text={TESTNET_GENESIS_HASH} label="Copy the genesis hash" />
          {facts('cli-source', { verifyHint: { command: 'sha256sum target/release/wrfcoin', text: 'compare with the manifest entry for your platform' } })}
          {byId.has('cli-linux-x86_64') ? facts('cli-linux-x86_64') : null}
          <p className="dl-rel-note">Release hashes appear only when they are available in the manifest.</p>
        </>
      ),
      footer: (
        <>
          <WrfButton variant="outline" component="a" href={LINKS.cliGuide} target="_blank" rel="noopener noreferrer">CLI guide</WrfButton>
          <ExternalLink className="dl-link" href={LINKS.nodeSource}>Source on GitHub</ExternalLink>
        </>
      ),
    },
    {
      id: 'weather-stations', platforms: ['web', 'android'], icon: 'bi-thermometer-half', title: 'Weather stations',
      badge: <Badge status="active" label="No install" />,
      body: (
        <>
          <p className="dl-secondary">Put your station's readings on the chain and on the map. Nothing to download: connect it from the website with your wallet.</p>
          <PlatformRows rows={STATION_PLATFORMS} />
          <p className="dl-req"><strong>Privacy</strong> Station locations are published at 0.1° only. Use the quickstart for current station setup guidance.</p>
        </>
      ),
      footer: <WrfButton variant="primary" component={Link} to={LINKS.connectStation}>Connect a station</WrfButton>,
    },
    {
      id: 'developers', platforms: ALL_PLATFORMS, icon: 'bi-code-slash', title: 'For developers',
      badge: <Badge status="neutral" label="Source" dot className="dl-badge-purple" />,
      body: (
        <>
          <p className="dl-secondary">Build on the testnet from the public repositories: the Rust node and SDK, the backend API, the website and the app.</p>
          <ul className="dl-links">
            <li><ExternalLink href={LINKS.apiReference}>API reference</ExternalLink> <span className="dl-muted">node and backend routes</span></li>
            <li><ExternalLink href={LINKS.rustSdk}>Rust SDK</ExternalLink> <span className="dl-muted">generated from the node's types</span></li>
            <li><span className="dl-strong">Prometheus metrics</span> <span className="dl-muted"><span className="dl-mono">GET /metrics</span> on your node</span></li>
            <li><ExternalLink href={LINKS.allRepos}>All repositories</ExternalLink> <span className="dl-muted">github.com/wrfcoin</span></li>
          </ul>
        </>
      ),
      footer: (
        <>
          <WrfButton variant="outline" component="a" href={LINKS.contributing} target="_blank" rel="noopener noreferrer">Contributing guide</WrfButton>
          <ExternalLink className="dl-link" href={LINKS.reportBug}>Report a bug</ExternalLink>
        </>
      ),
    },
  ];

  const visible = cards.filter(card => platform === 'all' || card.platforms.includes(platform));
  const manifestText = manifest ? JSON.stringify(manifest, null, 2) : null;

  return (
    <div className="public-read-page dl-page" data-testid="public-downloads" style={themeVars}>
      <header className="dl-head">
        <h1>Downloads</h1>
        <p className="dl-lede">Source and software availability for the WRFCoin testnet. Testnet WRF has no monetary value; the network may reset and no mainnet migration is promised.</p>
      </header>

      <div className="dl-chips" role="group" aria-label="Filter by platform">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`dl-chip${platform === p.id ? ' dl-chip--on' : ''}`}
            aria-pressed={platform === p.id}
            onClick={() => setPlatform(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="dl-hero" aria-label="Start in the browser">
        <div className="dl-hero-text">
          <Badge status="active" label="No install" />
          <h2>Start in the browser</h2>
          <p className="dl-secondary">The web wallet, faucet, map, explorer and station onboarding run at wrfcoin.com on any device. Your keys stay in your browser's encrypted vault.</p>
        </div>
        <div className="dl-hero-actions">
          <WrfButton variant="primary" size="lg" component={Link} to={LINKS.webWallet}>Open the web wallet</WrfButton>
          <WrfButton variant="outline" size="lg" component="a" href={LINKS.quickstart} target="_blank" rel="noopener noreferrer">Read the quickstart</WrfButton>
        </div>
      </section>

      {state === 'error' ? (
        <WrfAlert severity="warning" role="alert" className="dl-alert dl-alert--top">
          The release manifest could not be read. Versions, hashes and download buttons stay unavailable until it loads again.
        </WrfAlert>
      ) : null}

      <p className="dl-count" role="status">
        {platform === 'all' ? `${cards.length} items` : `${visible.length} of ${cards.length} items for ${PLATFORMS.find(p => p.id === platform).label}`}
      </p>

      <div className="dl-grid">
        {visible.map(card => (
          <SoftwareCard key={card.id} id={card.id} platforms={card.platforms} icon={card.icon} title={card.title} badge={card.badge} footer={card.footer}>
            {card.body}
          </SoftwareCard>
        ))}
      </div>

      <WrfCard
        component="section"
        className="dl-verify"
        aria-label="Verify what you download"
        header={<><h2>Verify what you download</h2><Badge status="info" label="Also for your agents" /></>}
      >
        <div className="dl-verify-grid">
          <div>
            <h3>1 · Read the manifest</h3>
            <p className="dl-secondary">One machine-readable file lists every artifact, its version, size, SHA-256, source commit and download URL. Humans and agents check the same file.</p>
            <CommandLine text={`curl -s ${MANIFEST_URL}`} />
          </div>
          <div>
            <h3>2 · Compare the hash</h3>
            <p className="dl-secondary">After downloading, hash the file and compare with the manifest entry. One line, no account, no network:</p>
            <dl className="dl-verify-cmds" data-testid="verify-commands">
              {VERIFY_COMMANDS.map(({ os, command }) => (
                <div key={os}>
                  <dt className="dl-small">{os}</dt>
                  <dd><CommandLine text={command} label={`Copy the ${os} command`} nowrap /></dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3>3 · Trust the source</h3>
            <p className="dl-secondary">Releases are GitHub Releases under the wrfcoin organization with their source commit. Check the join guide for the node build procedure. Mismatch or doubt: <span className="dl-mono">security@wrfcoin.com</span>.</p>
            <WrfButton variant="outline" size="sm" component={Link} to={LINKS.securityPolicy}>Security policy</WrfButton>
          </div>
        </div>
        <div className="dl-manifest">
          <div className="dl-manifest-head">
            <span className="dl-mono">manifest.json</span>
            <span className="dl-muted dl-small">served by this site at {DOWNLOADS_MANIFEST_PATH}; lists every artifact on this page</span>
            {manifestText ? <CopyButton value={manifestText} label="Copy the manifest" /> : null}
          </div>
          {state === 'loading' ? <p className="dl-rel-note dl-manifest-body" role="status">Reading the release manifest…</p> : null}
          {state === 'error' ? <p className="dl-rel-note dl-manifest-body">Unavailable right now.</p> : null}
          {manifestText ? <pre className="dl-mono" data-testid="manifest-json" tabIndex={0} aria-label="Release manifest">{manifestText}</pre> : null}
        </div>
      </WrfCard>
    </div>
  );
}
