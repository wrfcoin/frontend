/**
 * Weather Streak NFT components.
 *
 * WeatherStreakBadge — current streak + milestone progress bars (backend
 *                      /api/weather/streak, real).
 * StreakBadgeStatus  — honest status of the on-chain badge for a milestone.
 *                      frontend#305: the contract has no claim function —
 *                      badges are minted by the oracle via recordSubmission()
 *                      — so there is nothing for a user to "claim"; and until
 *                      VITE_WEATHER_STREAK_NFT_ADDRESS is a real deployment the
 *                      component says so instead of calling address(0).
 * MyStreakNFTs       — the wallet's soulbound streak badge, read via
 *                      streakData() (the contract is not ERC721Enumerable).
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeatherStreak, STREAK_MILESTONES } from '../../hooks/useWeatherStreak';
import {
  WEATHER_STREAK_NFT_ADDRESS,
  WEATHER_STREAK_NFT_ABI,
  WEATHER_STREAK_TIER_LABELS,
  isContractConfigured,
} from '../../config/contracts';

// ---------------------------------------------------------------------------
// WeatherStreakBadge
// ---------------------------------------------------------------------------

/**
 * Shows the current streak count with a flame icon and milestone progress bars.
 *
 * @param {{ walletAddress: string }} props
 */
export function WeatherStreakBadge({ walletAddress }) {
  const { currentStreak, longestStreak, nextMilestone, milestoneReached, loading, error } =
    useWeatherStreak(walletAddress);

  return (
    <div className="streak-badge-card">
      <div className="streak-badge-header">
        <span className="streak-flame" aria-label="streak flame">🔥</span>
        <div>
          <div className="streak-count">{loading ? '—' : currentStreak}</div>
          <div className="streak-label">day streak</div>
        </div>
        {longestStreak > 0 && (
          <div className="streak-longest">
            <span className="streak-longest-label">Best</span>
            <span className="streak-longest-value">{longestStreak}d</span>
          </div>
        )}
      </div>

      {error && <div className="streak-error">Could not load streak: {error}</div>}

      <div className="streak-milestones">
        {STREAK_MILESTONES.map(milestone => {
          const pct = Math.min(100, Math.round((currentStreak / milestone) * 100));
          const reached = currentStreak >= milestone;
          return (
            <div key={milestone} className={`streak-milestone ${reached ? 'reached' : ''}`}>
              <div className="streak-milestone-label">
                {reached ? '✅' : '🔒'} {milestone}-day
              </div>
              <div className="streak-progress-track">
                <div className="streak-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="streak-milestone-pct">{pct}%</div>
            </div>
          );
        })}
      </div>

      {nextMilestone && !loading && (
        <div className="streak-next">
          {nextMilestone - currentStreak} more day{nextMilestone - currentStreak !== 1 ? 's' : ''} to {nextMilestone}-day milestone
        </div>
      )}

      {milestoneReached && (
        <div className="streak-milestone-reached-banner">
          🎉 {milestoneReached}-day milestone reached — your badge is minted by the oracle.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StreakBadgeStatus
// ---------------------------------------------------------------------------

export const STREAK_NFT_NOT_DEPLOYED_MESSAGE =
  'Streak badges are not deployed on the testnet yet.';

/**
 * Honest status for a reached milestone. No transaction is sent from here:
 * WeatherStreakNFT mints and upgrades badges from the oracle side when a
 * submission is recorded (recordSubmission, ORACLE_ROLE), so a user cannot
 * claim one, and the previous claim call targeted a function the contract
 * does not have.
 *
 * @param {{ walletAddress: string, milestoneLevel: number|null }} props
 */
export function StreakBadgeStatus({ walletAddress, milestoneLevel }) {
  if (!walletAddress || !milestoneLevel) return null;

  if (!isContractConfigured(WEATHER_STREAK_NFT_ADDRESS)) {
    return (
      <div className="claim-streak-nft" data-testid="streak-badge-not-deployed">
        <div className="streak-empty">{STREAK_NFT_NOT_DEPLOYED_MESSAGE}</div>
      </div>
    );
  }

  return (
    <div className="claim-streak-nft" data-testid="streak-badge-auto-minted">
      <div className="streak-empty">
        Your {milestoneLevel}-day badge is minted automatically by the oracle when your
        submissions are recorded — no claim needed. It appears under “My Weather Streak NFTs”.
      </div>
    </div>
  );
}

/** @deprecated frontend#305 — kept as an alias so older imports keep compiling. */
export const ClaimStreakNFT = StreakBadgeStatus;

// ---------------------------------------------------------------------------
// MyStreakNFTs
// ---------------------------------------------------------------------------

/**
 * The wallet's soulbound Weather Streak badge (one per wallet), read via
 * streakData() then tokenURI() (on-chain SVG).
 *
 * @param {{ walletAddress: string }} props
 */
export function MyStreakNFTs({ walletAddress }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const configured = isContractConfigured(WEATHER_STREAK_NFT_ADDRESS);

  useEffect(() => {
    if (!configured || !walletAddress || !window.ethereum) return;

    const load = async () => {
      setLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          WEATHER_STREAK_NFT_ADDRESS,
          WEATHER_STREAK_NFT_ABI,
          provider,
        );

        // One soulbound badge per wallet; streakData() returns tokenId 0 when none.
        const record = await contract.streakData(walletAddress);
        const tokenId = record.tokenId ?? record[0];
        if (!tokenId || Number(tokenId) === 0) {
          setTokens([]);
        } else {
          const uri = await contract.tokenURI(tokenId);
          const tierIndex = Number(record.tier ?? record[4]);
          setTokens([
            {
              tokenId: tokenId.toString(),
              uri,
              streakDays: Number(record.streakDays ?? record[1]),
              tier: WEATHER_STREAK_TIER_LABELS[tierIndex] ?? 'Bronze',
              active: Boolean(record.active ?? record[5]),
            },
          ]);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [walletAddress, configured]);

  if (!walletAddress) return null;

  if (!configured) {
    return (
      <div className="my-streak-nfts" data-testid="my-streak-nfts-not-deployed">
        <h3 className="my-streak-nfts-title">My Streak NFTs</h3>
        <div className="streak-empty">{STREAK_NFT_NOT_DEPLOYED_MESSAGE}</div>
      </div>
    );
  }

  return (
    <div className="my-streak-nfts">
      <h3 className="my-streak-nfts-title">My Streak NFTs</h3>

      {loading && <div className="streak-loading">Loading your badge…</div>}
      {error && <div className="streak-error">Error loading badge: {error}</div>}

      {!loading && tokens.length === 0 && !error && (
        <div className="streak-empty">
          No streak badge yet. Keep submitting — the oracle mints your badge once your streak is recorded.
        </div>
      )}

      <div className="streak-nft-grid">
        {tokens.map(({ tokenId, uri, streakDays, tier, active }) => (
          <div key={tokenId} className="streak-nft-card">
            <img
              src={uri}
              alt={`Weather Streak NFT #${tokenId}`}
              className="nft-image"
            />
            <div className="streak-nft-id">
              #{tokenId} · {tier} · {streakDays}d{active ? '' : ' (inactive)'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
