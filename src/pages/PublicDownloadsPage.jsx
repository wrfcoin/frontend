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
import { DOWNLOADS_MANIFEST_PATH, loadDownloadsManifest } from '../services/downloadsManifest';
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
export const STATUS_PAGE_URL = 'http://localhost:8556/dashboard';
export const CLI_BUILD_COMMAND = 'cargo build --release -p wrfcoin_cli';
export const MANIFEST_URL = `https://wrfcoin.com${DOWNLOADS_MANIFEST_PATH}`;

/** Per-platform rows as documented in infra/testnet/JOIN_TESTNET.md (validation status, not a promise). */
const NODE_PLATFORMS = [
  { os: 'Linux x86_64', status: 'active', label: 'Validated' },
  { os: 'macOS, Intel', status: 'active', label: 'Supported' },
  { os: 'macOS, Apple Silicon', status: 'warning', label: 'Native build, join not yet validated' },
  { os: 'Windows 11 (WSL2 + Docker Desktop)', status: 'warning', label: 'Not yet validated' },
];

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
  const facts = (artifactId, extra) => (
    <ReleaseFacts state={state} release={release} artifact={byId.get(artifactId)} label={artifactId} {...extra} />
  );

  const cards = [
    {
      id: 'sync-node', platforms: ['linux', 'macos', 'windows'], icon: 'bi-hdd-network', title: 'Sync node',
      badge: <Badge status="active" label="Available" dot />,
      body: (
        <>
          <p className="dl-secondary">Run a full copy of the testnet chain in Docker, verify blocks yourself and serve the API locally.</p>
          <PlatformRows rows={NODE_PLATFORMS} />
          <p className="dl-req"><strong>Needs</strong> git and Docker with Compose v2. Follow the join guide for current build requirements.</p>
          <CommandLine text={JOIN_COMMAND} />
          {facts('node-source', { verifyHint: { command: 'git verify-commit <commit>', text: 'after cloning; check the expected source revision in the join guide' } })}
          <p className="dl-rel-note">Release identifiers appear below when they are available in the manifest.</p>
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
      id: 'node-status', platforms: ['linux', 'macos', 'windows', 'web'], icon: 'bi-speedometer2', title: 'Node status page',
      badge: <Badge status="info" label="Not yet available" dot />,
      body: (
        <>
          <p className="dl-secondary">The proposed node status page is still under review. It is not yet available in the launch source.</p>

          <p className="dl-req">See the node-status guide for current availability.</p>
          <WrfAlert severity="info" role="note" className="dl-alert">
            Source presence does not establish deployed availability.
          </WrfAlert>
        </>
      ),
      footer: (
        <WrfButton variant="outline" component="a" href={LINKS.statusPageWork} target="_blank" rel="noopener noreferrer">Follow the status page work</WrfButton>
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
          <p className="dl-req"><strong>Needs</strong> a Rust toolchain. Set <span className="dl-mono">WRFCOIN_CHAIN_ID={WRFCOIN_CHAIN_ID ?? '<published-chain-id>'}</span> and <span className="dl-mono">WRFCOIN_NETWORK_ID=testnet</span> before sending. Verify the published genesis hash <span className="dl-mono">&lt;888-genesis-hash&gt;</span>; this placeholder is not a usable hash.</p>
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
            <CommandLine text="sha256sum -c SHA256SUMS" />
            <p className="dl-secondary dl-small">macOS: <span className="dl-mono">shasum -a 256 -c SHA256SUMS</span>. Windows: <span className="dl-mono">certutil -hashfile &lt;file&gt; SHA256</span>.</p>
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
