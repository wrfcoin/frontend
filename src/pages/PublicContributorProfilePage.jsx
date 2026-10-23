import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography } from '@mui/material';
import './ContributorLeaderboardPage.css';
import { useRoleEarningsEnabled } from '../hooks/useRoleEarnings';
import { RoleEarningsSummary } from '../components/Leaderboard/RoleEarnings';
import { contributorProfilePath, publicGet } from '../services/publicReadonlyApi';
import { defaultNodeName, shortAddr } from '../utils/publicAddress';

/**
 * Public contributor profile (S6), addressed ONLY by the opaque `c_` key from the leaderboard. A raw wallet
 * address is never looked up here: it renders the same "not found" as an unknown key and makes no request
 * (the edge admits only `c_` + 24 hex, and own-profile-by-address is a pending owner decision). No auth
 * header is sent. Amounts come only from the exact role-payment summary; the legacy
 * `totalRewardsEarned` number is deliberately not rendered (Number() would lose base units).
 */
export default function PublicContributorProfilePage() {
  const { key } = useParams();
  const roleEarningsEnabled = useRoleEarningsEnabled();
  const path = contributorProfilePath(String(key ?? ''));
  const [state, setState] = useState({ loading: Boolean(path), result: null });

  const load = useCallback(() => {
    if (!path) return undefined;
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(path, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [path]);
  useEffect(() => load(), [load]);

  const { loading, result } = state;
  const profile = result?.kind === 'ok' ? result.data?.profile ?? null : null;
  const notFound = !path || result?.kind === 'not_found' || (result?.kind === 'ok' && !profile);

  if (notFound) {
    return (
      <div className="lb-page" data-testid="public-profile">
        <p role="alert">Contributor not found.</p>
        <p><Link to="/leaderboard/contributors">Back to the leaderboard</Link></p>
      </div>
    );
  }
  if (loading || !result) {
    return <div className="lb-page" data-testid="public-profile"><p role="status">Loading profile…</p></div>;
  }
  if (result.kind !== 'ok') {
    return (
      <div className="lb-page" data-testid="public-profile">
        <p role="alert">
          {result.kind === 'rate_limited' ? 'Too many requests. Please wait a moment and try again.' : 'Profile unavailable right now.'}
        </p>
        <button className="lb-tab" type="button" onClick={() => load()}>Retry</button>
      </div>
    );
  }

  const name = profile.displayName ?? defaultNodeName(profile.walletAddress);
  const metric = (value, suffix = '') => value == null ? 'Not yet available' : `${value.toLocaleString()}${suffix}`;
  const statistics = [
    ['Readings submitted', metric(profile.totalSubmissions)],
    ['Stations covered', metric(profile.stationCount)],
    ['Current streak', metric(profile.currentStreak, 'd')],
    ['Longest streak', metric(profile.longestStreak, 'd')],
    ['Quality score', metric(profile.qualityScore, '%')],
  ];
  return (
    <div className="lb-page" data-testid="public-profile">
      <p><Link className="lb-link" to="/leaderboard/contributors">Back to the leaderboard</Link></p>
      <header className="lb-hero">
        <p className="lb-subtitle">Contributor profile</p>
        <h1 className="lb-title">{name}</h1>
        {profile.walletAddress ? <p className="lb-subtitle">{shortAddr(profile.walletAddress)}</p> : null}
        <p className="lb-subtitle">{profile.rank ? `Global rank #${profile.rank}` : 'Global rank not yet available'}</p>
      </header>
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Weather contributions</Typography>
          {profile.weatherStatisticsAvailable === false ? (
            <Typography color="text.secondary">Weather statistics are unavailable for this contributor.</Typography>
          ) : (
            <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, m: 0 }}>
              {statistics.map(([label, value]) => (
                <Box key={label}>
                  <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
                  <Typography component="dd" variant="h6" sx={{ m: 0, fontWeight: 700 }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      {roleEarningsEnabled && <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <RoleEarningsSummary earnings={profile.roleEarnings} onRetry={() => load()} />
        </CardContent>
      </Card>}
    </div>
  );
}
