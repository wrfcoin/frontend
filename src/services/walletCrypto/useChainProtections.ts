import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchSecurityKeyStatus,
  fetchSendAllowlist,
  protectionsBuildEnabled,
  type SecurityKeyStatus,
  type SendAllowlistRead,
} from './protections';
import { SECONDS_PER_BLOCK } from './chainProtections';

export interface ChainProtections {
  /** Null when the build flag is off, the read failed, or the node says the feature is not active. */
  securityKey: SecurityKeyStatus | null;
  allowlist: SendAllowlistRead | null;
  /** When the reads came back (ms since epoch); countdowns run from here. */
  fetchedAt: number;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * The node's view of `owner`'s chain protections, refreshed once a block. Fail closed: a feature is
 * exposed only when this build has the flag on AND the node reports it active at the next block.
 */
export function useChainProtections(owner: string | null | undefined): ChainProtections {
  const enabled = protectionsBuildEnabled() && !!owner;
  const [securityKey, setSecurityKey] = useState<SecurityKeyStatus | null>(null);
  const [allowlist, setAllowlist] = useState<SendAllowlistRead | null>(null);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(enabled);
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled || !owner) return;
    const mine = ++latest.current;
    const [sk, al] = await Promise.all([
      fetchSecurityKeyStatus(owner).catch(() => null),
      fetchSendAllowlist(owner).catch(() => null),
    ]);
    if (latest.current !== mine) return;
    setSecurityKey(sk?.feature_active_at_next_height ? sk : null);
    setAllowlist(al?.feature_active_next_height ? al : null);
    setFetchedAt(Date.now());
    setLoading(false);
  }, [enabled, owner]);

  useEffect(() => {
    if (!enabled) { setSecurityKey(null); setAllowlist(null); setLoading(false); return undefined; }
    setLoading(true);
    void reload();
    const timer = setInterval(() => { void reload(); }, SECONDS_PER_BLOCK * 1000);
    return () => { latest.current += 1; clearInterval(timer); };
  }, [enabled, reload]);

  return { securityKey, allowlist, fetchedAt, loading, reload };
}

/** A clock that ticks once a second while `active`, for live countdowns. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}
