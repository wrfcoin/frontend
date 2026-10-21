/**
 * WeatherRecapPage — /impact
 *
 * Personalized "Your Weather Impact" page (#150).
 * Surfaces GET /api/operators/:walletAddress/profile data in a shareable card layout.
 * Also supports viewing any contributor's profile via /impact/:address.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useOperatorProfile } from '../hooks/useOperatorProfile';
import './WeatherRecapPage.css';
import { downloadOrShareEarnCard } from '../utils/earnShareCard';
import { defaultNodeName, isFullAddress, profileSegment, sameWallet, shortAddr } from '../utils/publicAddress';
import { RoleEarningsSummary } from '../components/Leaderboard/RoleEarnings';

const APP_DOMAIN = 'https://wrfcoin.io';

function displayName(profile) {
  if (!profile) return '';
  return profile.displayName ?? defaultNodeName(profile.walletAddress);
}

/**
 * The operator profile withholds `totalRewardsEarned` (null) from callers who
 * are not authorized to see it (backend#1222). Withheld, blank or non-numeric
 * totals return null so no caller can render them as "0 WRF"; a real 0 stays 0.
 */
export function visibleRewardTotal(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;
  const total = Number(value);
  return Number.isFinite(total) ? total : null;
}

function StatCard({ label, value, accent, delay }) {
  return (
    <div
      className={`recap-stat-card ${accent ? `recap-stat-card--${accent}` : ''}`}
      style={{ animationDelay: `${delay ?? 0}ms` }}
    >
      <div className="recap-stat-value">{value ?? '—'}</div>
      <div className="recap-stat-label">{label}</div>
    </div>
  );
}

function BadgeList({ badges }) {
  if (!badges || badges.length === 0) return null;
  const BADGE_LABELS = {
    storm_chaser: '⛈ Storm Chaser',
    early_adopter: '🌟 Early Adopter',
    streak_7: '🔥 7-Day Streak',
    streak_30: '🔥 30-Day Streak',
    streak_90: '🔥 90-Day Streak',
  };
  return (
    <div className="recap-badges">
      {badges.map(b => (
        <span key={b} className="recap-badge">
          {BADGE_LABELS[b] ?? b}
        </span>
      ))}
    </div>
  );
}

function ShareCard({ profile }) {
  const [shareStatus, setShareStatus] = useState('');
  const name = displayName(profile);
  const shareText = useMemo(() => {
    const parts = [
      `${name} on #WRFCoin:`,
      `📡 ${profile.totalSubmissions.toLocaleString()} weather readings`,
      `🔥 ${profile.currentStreak}-day streak`,
      `⭐ Quality score ${profile.qualityScore}%`,
    ];
    if (profile.rank) parts.push(`🏆 Rank #${profile.rank} globally`);
    // The link uses the opaque profile key (backend#1361); a short address is never a link target.
    const segment = profileSegment(profile);
    if (segment) parts.push(`See my impact → ${APP_DOMAIN}/impact/${segment}`);
    return parts.join('\n');
  }, [profile, name]);

  const encodedText = encodeURIComponent(shareText);
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedText}`;
  const farcasterHref = `https://warpcast.com/~/compose?text=${encodedText}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleCardShare = async () => {
    try {
      const outcome = await downloadOrShareEarnCard({
        heading: `${name}'s weather impact`,
        amount: visibleRewardTotal(profile.totalRewardsEarned),
        readings: profile.totalSubmissions,
        streakDays: profile.currentStreak,
        walletAddress: profile.walletAddress,
      });
      setShareStatus(outcome === 'shared' ? 'Card shared' : 'PNG downloaded');
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : 'Could not create card');
    }
  };

  return (
    <div className="recap-share-section">
      <div className="recap-share-card" aria-label="Impact share card">
        <div className="recap-share-card-name">{name}</div>
        <div className="recap-share-card-stats">
          <span>📡 {profile.totalSubmissions.toLocaleString()} readings</span>
          <span>🔥 {profile.currentStreak}d streak</span>
          <span>⭐ {profile.qualityScore}% quality</span>
          {profile.rank && <span>🏆 Rank #{profile.rank}</span>}
        </div>
        <div className="recap-share-card-footer">wrfcoin.io · Your Weather Impact</div>
      </div>
      <div className="recap-share-actions">
        <button className="recap-copy-btn" onClick={handleCopy}>
          Copy stats
        </button>
        <button className="recap-copy-btn" onClick={() => { void handleCardShare(); }}>
          Download / share PNG
        </button>
        <a
          className="recap-share-btn recap-share-btn--twitter"
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share on X
        </a>
        <a
          className="recap-share-btn recap-share-btn--farcaster"
          href={farcasterHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share on Farcaster
        </a>
      </div>
      {shareStatus && <div role="status" className="recap-share-status">{shareStatus}</div>}
    </div>
  );
}

export default function WeatherRecapPage() {
  const { address: paramAddress } = useParams();
  const { account } = useWalletConnection();

  // Show param address if present (public profile), else own profile
  const walletAddress = paramAddress ?? account;
  const isOwnProfile = !paramAddress || paramAddress === account;

  const { profile, loading, error, refetch } = useOperatorProfile(walletAddress);

  // Useful for in-app share previews. Crawlers still need #230's server/edge
  // document response because they do not execute this SPA effect.
  useEffect(() => {
    if (!profile) return undefined;
    const title = `${displayName(profile)} | WRFCoin Weather Impact`;
    document.title = title;
    const description = profile.weatherStatisticsAvailable === false ? 'Confirmed canonical role payments' :
      `${profile.totalSubmissions.toLocaleString()} verified readings · ${profile.currentStreak}-day streak`;
    const setMeta = (name, content) => {
      let tag = document.head.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(name.startsWith('og:') ? 'property' : 'name', name); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('twitter:card', 'summary');
    return undefined;
  }, [profile]);

  if (!walletAddress) {
    return (
      <div className="recap-page">
        <div className="recap-empty">
          <p>Connect your wallet to see your weather impact.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="recap-page">
        <div className="recap-loading">Loading your impact…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recap-page">
        <div className="recap-error">Impact unavailable. <button type="button" onClick={refetch}>Retry</button></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="recap-page">
        <div className="recap-empty">
          <p>No contribution data found for {paramAddress && !isFullAddress(paramAddress) ? 'this contributor' : shortAddr(walletAddress)}.</p>
          <p>Submit your first weather reading to start building your impact!</p>
        </div>
      </div>
    );
  }

  const rewardTotal = visibleRewardTotal(profile.totalRewardsEarned);
  const joinedYear = profile.joinedAt
    ? new Date(profile.joinedAt).getFullYear()
    : null;

  return (
    <div className="recap-page">
      {/* Hero */}
      <div className="recap-hero">
        <div className="recap-avatar" aria-hidden="true">🌡</div>
        <div className="recap-hero-info">
          <h1 className="recap-hero-name">{displayName(profile)}</h1>
          <div className="recap-hero-addr">{shortAddr(profile.walletAddress)}</div>
          {joinedYear && (
            <div className="recap-hero-since">Contributing since {joinedYear}</div>
          )}
        </div>
        {profile.rank && (
          <div className="recap-rank-badge">
            <span className="recap-rank-label">Global rank</span>
            <span className="recap-rank-value">#{profile.rank}</span>
          </div>
        )}
      </div>

      {!isOwnProfile && !sameWallet(account, profile.walletAddress) && profile.isYou !== true && (
        <div className="recap-viewing-banner">
          Viewing {displayName(profile)}'s public impact page
        </div>
      )}

      {/* Stats grid */}
      <RoleEarningsSummary earnings={profile.roleEarnings} onRetry={refetch} />
      {profile.weatherStatisticsAvailable === false ? <p>Weather statistics are unavailable for this operator.</p> : <section className="recap-section">
        <div className="recap-stats-grid">
          <StatCard label="Readings submitted" value={profile.totalSubmissions.toLocaleString()} delay={0} />
          <StatCard label="Stations covered" value={profile.stationCount} delay={60} />
          <StatCard label="Current streak" value={`${profile.currentStreak}d`} accent="fire" delay={120} />
          <StatCard label="Longest streak" value={`${profile.longestStreak}d`} delay={180} />
          <StatCard label="Quality score" value={`${profile.qualityScore}%`} accent="green" delay={240} />
          {rewardTotal != null && (
            <StatCard label="WRF earned" value={`${rewardTotal.toLocaleString()} WRF`} accent="gold" delay={300} />
          )}
        </div>
        {profile.legacyRewardSource === 'weather-submissions-db' && rewardTotal !== null &&
          <p>Weather reward statistic from the submissions database; separate from canonical role payments.</p>}
      </section>}

      {/* Badges */}
      {(profile.badges ?? []).length > 0 && (
        <section className="recap-section">
          <h2 className="recap-section-title">Badges earned</h2>
          <BadgeList badges={profile.badges} />
        </section>
      )}

      {/* Share */}
      {profile.weatherStatisticsAvailable !== false && <section className="recap-section">
        <h2 className="recap-section-title">Share your impact</h2>
        <ShareCard profile={profile} />
      </section>}
    </div>
  );
}
