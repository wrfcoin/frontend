/**
 * WeatherStreakPage — full-page streak dashboard.
 *
 * Features:
 *  - Prominent flame icon with current streak count
 *  - Milestone timeline (7 / 30 / 90 days) with locked/unlocked states
 *  - StreakBadgeStatus inline in each unlocked milestone card (badges are
 *    oracle-minted; there is no user claim — frontend#305)
 *  - Streak NFT gallery (soulbound, on-chain SVG, read via streakData)
 *  - Social share links (Twitter/X + Farcaster)
 *  - StormChaserNFT read-only gallery (minting is oracle-triggered on-chain)
 *
 * Route: /streak  (added in communityRoutes.jsx)
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeatherStreak, STREAK_MILESTONES } from '../hooks/useWeatherStreak';
import { WeatherStreakBadge, StreakBadgeStatus, MyStreakNFTs } from '../components/nft/WeatherStreakNFT';
import {
  STORM_CHASER_NFT_ADDRESS,
  STORM_CHASER_NFT_ABI,
  isContractConfigured,
} from '../config/contracts';
import { useWallet } from '../contexts/WalletContext';
import './WeatherStreakPage.css';

// ---------------------------------------------------------------------------
// StormChaserGallery — read-only display, minting is oracle-triggered
// ---------------------------------------------------------------------------

function StormChaserGallery({ walletAddress }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const configured = isContractConfigured(STORM_CHASER_NFT_ADDRESS);

  useEffect(() => {
    if (!configured || !walletAddress || !window.ethereum) return;

    const load = async () => {
      setLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          STORM_CHASER_NFT_ADDRESS,
          STORM_CHASER_NFT_ABI,
          provider,
        );

        const balance = await contract.balanceOf(walletAddress);
        const count = Number(balance);

        const items = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            contract.tokenOfOwnerByIndex(walletAddress, i).then(async tokenId => {
              const uri = await contract.tokenURI(tokenId);
              return { tokenId: tokenId.toString(), uri };
            }),
          ),
        );
        setTokens(items);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [walletAddress, configured]);

  if (!configured) {
    return (
      <div className="streak-empty" data-testid="storm-chaser-not-deployed">
        Storm Chaser badges are not deployed on the testnet yet.
      </div>
    );
  }

  return (
    <div className="storm-chaser-section">
      <h3 className="my-streak-nfts-title">⛈️ Storm Chaser Badges</h3>
      <p className="storm-chaser-note">
        Awarded automatically by the oracle when you contribute data during extreme weather events.
        Minting is triggered on-chain — no action required.
      </p>

      {loading && <div className="streak-loading">Loading Storm Chaser badges…</div>}
      {error && <div className="streak-error">Error: {error}</div>}

      {!loading && tokens.length === 0 && !error && (
        <div className="streak-empty">
          No Storm Chaser badges yet. Keep contributing weather data during extreme events!
        </div>
      )}

      <div className="streak-nft-grid">
        {tokens.map(({ tokenId, uri }) => (
          <div key={tokenId} className="streak-nft-card">
            <img
              src={uri}
              alt={`Storm Chaser NFT #${tokenId}`}
              className="nft-image"
            />
            <div className="streak-nft-id">#{tokenId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WeatherStreakPage
// ---------------------------------------------------------------------------

export default function WeatherStreakPage() {
  const { account: walletAddress } = useWallet();

  const { currentStreak, longestStreak, milestoneReached, loading } =
    useWeatherStreak(walletAddress);

  const shareText = encodeURIComponent(
    `I've been contributing weather data for ${currentStreak} days on #WRFCoin 🌡️🔥`,
  );
  const shareUrl = encodeURIComponent(`https://wrfcoin.io/streak/${walletAddress}`);
  const twitterHref = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const farcasterHref = `https://warpcast.com/~/compose?text=${shareText}%20${shareUrl}`;

  if (!walletAddress) {
    return (
      <div className="streak-page">
        <div className="streak-empty-state">
          <p>Connect your wallet to view your weather streak.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="streak-page">
      {/* ── Hero ── */}
      <div className="streak-hero">
        <div className="streak-hero-flame" aria-hidden="true">🔥</div>
        <div>
          <div className="streak-hero-count">{loading ? '—' : currentStreak}</div>
          <div className="streak-hero-label">day weather streak</div>
        </div>
        {longestStreak > 0 && (
          <div className="streak-hero-best">
            <span>Personal best</span>
            <strong>{longestStreak}d</strong>
          </div>
        )}
      </div>

      {/* ── Milestone Timeline ── */}
      <div className="streak-section-title">Milestone Timeline</div>
      <div className="streak-milestones-grid">
        {STREAK_MILESTONES.map(milestone => {
          const pct = Math.min(100, Math.round((currentStreak / milestone) * 100));
          const unlocked = currentStreak >= milestone;
          return (
            <div key={milestone} className={`streak-milestone-card ${unlocked ? 'unlocked' : ''}`}>
              <div className="streak-milestone-card-header">
                <span className="milestone-icon">{unlocked ? '🏅' : '🔒'}</span>
                {milestone}-Day Milestone
              </div>

              <div className="streak-progress-track">
                <div className="streak-progress-fill" style={{ width: `${pct}%` }} />
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
                {unlocked
                  ? 'Milestone reached!'
                  : `${pct}% — ${milestone - currentStreak} day${milestone - currentStreak !== 1 ? 's' : ''} remaining`}
              </div>

              {unlocked && (
                <StreakBadgeStatus walletAddress={walletAddress} milestoneLevel={milestone} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Claimed Streak NFTs ── */}
      <div className="streak-section-title">My Weather Streak NFTs</div>
      <MyStreakNFTs walletAddress={walletAddress} />

      {/* ── Social Share ── */}
      <div className="streak-section-title">Share Your Streak</div>
      <div className="streak-share-cards">
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="streak-share-btn streak-share-btn--twitter"
          aria-label="Share on Twitter/X"
        >
          𝕏 Share on Twitter/X
        </a>
        <a
          href={farcasterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="streak-share-btn streak-share-btn--farcaster"
          aria-label="Share on Farcaster"
        >
          🟣 Share on Farcaster
        </a>
      </div>

      {/* ── Storm Chaser Badges ── */}
      <div className="streak-section-title">Storm Chaser NFTs</div>
      <StormChaserGallery walletAddress={walletAddress} />
    </div>
  );
}
