import React, { useState } from 'react';
import { WrfBadge } from '../DesignSystem';
import { fileNameOf, formatBytes } from '../../services/downloadsManifest';

/** Copies `value` to the clipboard; announces the result for screen readers. */
export function CopyButton({ value, label }) {
  const [state, setState] = useState('idle');
  return (
    <button
      type="button"
      className={`dl-copy${state === 'copied' ? ' dl-copy--done' : ''}`}
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState('copied');
        } catch {
          setState('failed');
        }
        setTimeout(() => setState('idle'), 1500);
      }}
    >
      <i className={`bi ${state === 'copied' ? 'bi-check2' : 'bi-clipboard'}`} aria-hidden="true" />
      <span className="dl-sr" role="status" aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </button>
  );
}

/**
 * One line of a command or address with a copy button. Long commands wrap rather than clip; `nowrap`
 * keeps a short command on one line (scrolling sideways if it must) so no word lands on its own line.
 */
export function CommandLine({ text, label = 'Copy command', nowrap = false }) {
  return (
    <div className={`dl-cmd${nowrap ? ' dl-cmd--nowrap' : ''}`}>
      <code>{text}</code>
      <CopyButton value={text} label={label} />
    </div>
  );
}

const shortCommit = commit => (commit.length > 10 ? `${commit.slice(0, 10)}…` : commit);

function Row({ term, children }) {
  return (
    <div className="dl-rel-row">
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Release facts for one manifest artifact: release, source commit, file + size, SHA-256, signed-by.
 * Everything shown comes from the parsed manifest; an artifact that is not published renders the
 * "Not yet published" state and never a hash.
 *
 * `state`: 'loading' | 'error' | 'ready'.
 */
export default function ReleaseFacts({ state, release, artifact, label, verifyHint }) {
  if (state === 'loading') {
    return <p className="dl-rel-note" role="status">Reading the release manifest…</p>;
  }
  if (state === 'error') {
    return (
      <div className="dl-rel dl-rel--off" data-testid={`release-${label}`}>
        <WrfBadge status="warning" variant="count" label="Release manifest unavailable" />
        <p className="dl-rel-note">Nothing can be verified or downloaded until the manifest loads again.</p>
      </div>
    );
  }
  if (!artifact || !artifact.published) {
    return (
      <div className="dl-rel dl-rel--off" data-testid={`release-${label}`}>
        <WrfBadge status="warning" variant="count" label="Not yet published" />
        <p className="dl-rel-note">
          No release of this artifact has been published yet: nothing to download and no hash to compare.
          It appears here, with its SHA-256, the moment the release manifest lists it.
        </p>
      </div>
    );
  }

  const size = formatBytes(artifact.size);
  const file = fileNameOf(artifact.url);
  return (
    <dl className="dl-rel" data-testid={`release-${label}`}>
      {release ? <Row term="Release">{release}{artifact.tag && artifact.tag !== release ? ` · ${artifact.tag}` : ''}</Row> : null}
      {artifact.commit ? (
        <Row term="Source commit">
          <span className="dl-mono">{shortCommit(artifact.commit)}</span>
          <CopyButton value={artifact.commit} label="Copy the full commit" />
        </Row>
      ) : null}
      {artifact.kind === 'file' && (file || size) ? (
        <Row term="File">
          <span className="dl-mono">{[file, size].filter(Boolean).join(' · ')}</span>
        </Row>
      ) : null}
      {artifact.sha256 ? (
        <Row term="SHA-256">
          <span className="dl-mono dl-hash">{artifact.sha256}</span>
          <CopyButton value={artifact.sha256} label="Copy the SHA-256" />
        </Row>
      ) : null}
      {artifact.signedBy ? <Row term="Signed by">{artifact.signedBy}</Row> : null}
      {verifyHint ? (
        <Row term="Verify">
          <span className="dl-mono dl-cmdline">{verifyHint.command}</span>
          <span className="dl-rel-hint">{verifyHint.text}</span>
        </Row>
      ) : null}
    </dl>
  );
}
