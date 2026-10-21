/**
 * ReferralsPage — /referrals
 *
 * Surfaces the existing backend referral-codes API (#148).
 * Users can generate a shareable invite link and track unpaid referral activations.
 */

import React, { useState, useCallback } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useReferrals } from '../hooks/useReferrals';
import './ReferralsPage.css';

const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || window.location.origin;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button className="referrals-copy-btn" onClick={handleCopy} title="Copy to clipboard">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`referrals-stat-card ${accent ? `referrals-stat-card--${accent}` : ''}`}>
      <div className="referrals-stat-value">{value ?? '—'}</div>
      <div className="referrals-stat-label">{label}</div>
    </div>
  );
}

function ShareButtons({ shareText, shareUrl }) {
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const farcasterHref = `https://warpcast.com/~/compose?text=${encodedText}%20${encodedUrl}`;

  return (
    <div className="referrals-share-buttons">
      <a
        className="referrals-share-btn referrals-share-btn--twitter"
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on X
      </a>
      <a
        className="referrals-share-btn referrals-share-btn--farcaster"
        href={farcasterHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on Farcaster
      </a>
    </div>
  );
}

function ReferralCodeBox({ code, walletAddress, generating, onGenerate }) {
  if (!walletAddress) {
    return (
      <div className="referrals-empty">
        <p>Connect your wallet to generate a referral code.</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="referrals-generate-cta">
        <p>You don't have a referral code yet.</p>
        <button
          className="referrals-generate-btn"
          onClick={onGenerate}
          disabled={generating}
        >
          {generating ? 'Generating…' : 'Generate my referral code'}
        </button>
      </div>
    );
  }

  const inviteUrl = `${APP_DOMAIN}/?ref=${code}`;
  const shareText = `Join me on #WRFCoin — contribute weather data with my invite link.`;

  return (
    <>
      <div className="referrals-invite-box">
        <div className="referrals-invite-label">Your invite link</div>
        <div className="referrals-invite-row">
          <span className="referrals-invite-url">{inviteUrl}</span>
          <CopyButton text={inviteUrl} />
        </div>
        <div className="referrals-code-row">
          <span className="referrals-code-label">Code:</span>
          <code className="referrals-code">{code}</code>
          <CopyButton text={code} />
        </div>
      </div>
      <ShareButtons shareText={shareText} shareUrl={inviteUrl} />
    </>
  );
}

export default function ReferralsPage() {
  const { account: walletAddress } = useWalletConnection();
  const { referralCode, stats, loading, generating, error, generateCode, pendingReferral } =
    useReferrals(walletAddress);

  const pending = stats?.byStatus?.pending ?? 0;
  const activated = stats?.byStatus?.activated ?? 0;
  const totalReferrals = stats?.totalReferrals ?? 0;

  return (
    <div className="referrals-page">
      <div className="referrals-hero">
        <h1 className="referrals-title">Invite Contributors</h1>
        <p className="referrals-subtitle">
          Invite weather contributors and track their activations.
          Referral rewards are not paid; no on-chain referral payout exists.
        </p>
      </div>

      {error && <div className="referrals-error">{error}</div>}
      {pendingReferral && (
        <div className="referrals-empty" role="status">
          Referral code <code>{pendingReferral}</code> saved. It will be applied after your first confirmed reading.
        </div>
      )}

      <section className="referrals-section">
        {loading ? (
          <div className="referrals-loading">Loading…</div>
        ) : (
          <ReferralCodeBox
            code={referralCode}
            walletAddress={walletAddress}
            generating={generating}
            onGenerate={generateCode}
          />
        )}
      </section>

      {walletAddress && (
        <section className="referrals-section">
          <h2 className="referrals-section-title">Your Stats</h2>
          <div className="referrals-stats-grid">
            <StatCard label="Total Invites" value={totalReferrals} />
            <StatCard label="Pending" value={pending} />
            <StatCard label="Activated" value={activated} accent="green" />
            <StatCard
              label="Referral rewards"
              value="Not paid"
              accent="gold"
            />
          </div>

          {totalReferrals === 0 && !loading && (
            <div className="referrals-empty-stats">
              <p>No referrals yet — share your link to get started!</p>
            </div>
          )}
        </section>
      )}

      <section className="referrals-section referrals-how-it-works">
        <h2 className="referrals-section-title">How it works</h2>
        <ol className="referrals-steps">
          <li>Share your invite link with a friend.</li>
          <li>They sign up and submit their first weather reading.</li>
          <li>The referral is recorded as activated. No referral reward is paid.</li>
        </ol>
      </section>
    </div>
  );
}
