/**
 * Release manifest for the public Downloads page (frontend#574).
 *
 * The page renders every version, file name, size, hash and source commit from
 * `GET /downloads/manifest.json` on this origin (a static file until the release
 * step publishes a signed one, see infra#1341). The parser is the only way an
 * artifact becomes "published": an entry counts as published when it says so
 * AND carries the fields a visitor can verify (a full SHA-256 for a file, a
 * commit for a source tree). Anything else is shown as "not yet published", so
 * a placeholder hash can never reach the screen.
 */

export const DOWNLOADS_MANIFEST_PATH = '/downloads/manifest.json';

export type ArtifactKind = 'git' | 'file';

export interface DownloadArtifact {
  id: string;
  kind: ArtifactKind;
  /** Download URL (file) or repository URL (git); null until published. */
  url: string | null;
  /** Size in bytes (file). */
  size: number | null;
  /** Lowercase hex SHA-256 of the file; present only when published and well-formed. */
  sha256: string | null;
  /** Source commit (git, or the commit a file was built from). */
  commit: string | null;
  tag: string | null;
  /** owner/name of the source repository (git). */
  repo: string | null;
  /** Who signed the release (file), as published next to the manifest. */
  signedBy: string | null;
  published: boolean;
}

export interface DownloadsManifest {
  generated: string | null;
  release: string | null;
  artifacts: DownloadArtifact[];
}

export type ManifestOutcome =
  | { kind: 'ok'; manifest: DownloadsManifest }
  | { kind: 'error' };

export const SHA256_RE = /^[0-9a-f]{64}$/;
const COMMIT_RE = /^[0-9a-f]{7,40}$/;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function int(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One manifest entry, normalised; null when it has no usable id or kind. */
export function parseArtifact(raw: unknown): DownloadArtifact | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const kind = raw.kind === 'git' || raw.kind === 'file' ? raw.kind : null;
  if (!id || !kind) return null;

  const url = str(raw.url);
  const sha256Raw = str(raw.sha256)?.toLowerCase() ?? null;
  const sha256 = sha256Raw && SHA256_RE.test(sha256Raw) ? sha256Raw : null;
  const commitRaw = str(raw.commit)?.toLowerCase() ?? null;
  const commit = commitRaw && COMMIT_RE.test(commitRaw) ? commitRaw : null;

  const claimsPublished = raw.published === true;
  const verifiable = kind === 'file' ? Boolean(url && sha256) : Boolean(commit);
  const published = claimsPublished && verifiable;

  return {
    id,
    kind,
    url: published ? url : kind === 'git' ? url : null,
    size: published ? int(raw.size) : null,
    sha256: published ? sha256 : null,
    commit: published ? commit : null,
    tag: published ? str(raw.tag) : null,
    repo: str(raw.repo),
    signedBy: published ? str(raw.signedBy) : null,
    published,
  };
}

/** Whole manifest; tolerant of missing fields, strict about what counts as published. */
export function parseManifest(raw: unknown): DownloadsManifest {
  const record = isRecord(raw) ? raw : {};
  const list = Array.isArray(record.artifacts) ? record.artifacts : [];
  const artifacts: DownloadArtifact[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    const artifact = parseArtifact(entry);
    if (artifact && !seen.has(artifact.id)) {
      seen.add(artifact.id);
      artifacts.push(artifact);
    }
  }
  return { generated: str(record.generated), release: str(record.release), artifacts };
}

export async function loadDownloadsManifest(signal?: globalThis.AbortSignal): Promise<ManifestOutcome> {
  try {
    const response = await fetch(DOWNLOADS_MANIFEST_PATH, {
      signal,
      cache: 'no-cache',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return { kind: 'error' };
    const body: unknown = await response.json();
    return { kind: 'ok', manifest: parseManifest(body) };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { kind: 'error' };
  }
}

/** "48.2 MB" / "612 KB" / "900 B"; null when unknown. */
export function formatBytes(size: number | null): string | null {
  if (size === null) return null;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

/** Last path segment of a download URL, for display next to the size. */
export function fileNameOf(url: string | null): string | null {
  if (!url) return null;
  try {
    const name = new URL(url, 'https://wrfcoin.com').pathname.split('/').filter(Boolean).pop();
    return name ? decodeURIComponent(name) : null;
  } catch {
    return null;
  }
}
