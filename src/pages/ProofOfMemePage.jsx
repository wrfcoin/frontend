/**
 * ProofOfMemePage — /meme route.
 *
 * Sections:
 *  1. Hero: "Earn More by Going Viral" + large multiplier display
 *  2. Full ProofOfMemeDashboard
 *  3. Recent Viral Posts: 4 mock cards
 *  4. FAQ accordion (MUI)
 */

import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ProofOfMemeDashboard } from '../components/social/ProofOfMemeDashboard';
import { useSocialAuthContext } from '../contexts/SocialAuthContext';
import FEATURES from '../config/features';
import './ProofOfMemePage.css';

// ---------------------------------------------------------------------------
// Sample viral posts — rendered ONLY under FEATURES.demoSurfaces (frontend#328).
// No social feed is wired to the testnet API; these are illustrative.
// ---------------------------------------------------------------------------

const SAMPLE_VIRAL_POSTS = [
  {
    id: 1,
    emoji: '⛈️',
    text: 'Just submitted my backyard weather station data to #WRFCoin — earning while the storm rolls in! 🌩️ #WeatherData',
    engagement: '4.2k engagements',
  },
  {
    id: 2,
    emoji: '🌡️',
    text: 'Record heat today. Contributing hyper-local temperature readings to @WRFCoin to help improve your forecasts! #ClimateData',
    engagement: '2.8k engagements',
  },
  {
    id: 3,
    emoji: '🌬️',
    text: 'Wind speeds hitting 45mph here. Uploaded my anemometer data to #WRFCoin. Getting a 1.4x meme multiplier this week! 💸',
    engagement: '6.1k engagements',
  },
  {
    id: 4,
    emoji: '🌈',
    text: 'Post-storm rainbow confirmed! Submitted UV index and humidity readings. #WRFCoin keeps paying me to observe nature 🌿',
    engagement: '3.5k engagements',
  },
];

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    question: 'How does the multiplier work?',
    answer:
      'Posting about WRFCoin on Twitter/X with the #WRFCoin hashtag earns you an engagement-based multiplier that boosts your weather mining rewards. The more likes, retweets, and replies your posts receive, the higher your multiplier.',
  },
  {
    question: 'What counts as engagement?',
    answer:
      'Likes, retweets (including quote-tweets), and replies on posts tagged #WRFCoin are all counted. Engagement must come from real accounts — bot-generated engagement is filtered out by the oracle.',
  },
  {
    question: 'When is it applied to my rewards?',
    answer:
      'Your Proof-of-Meme multiplier is applied at each block reward distribution. The oracle refreshes your multiplier every 5 minutes, reflecting recent social activity.',
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProofOfMemePage() {
  const { walletAddress } = useSocialAuthContext();

  return (
    <div className="meme-page">
      {/* 1. Hero */}
      <section className="meme-hero">
        <h1>Earn More by Going Viral</h1>
        <p>
          Share your WRFCoin weather contributions on Twitter/X and earn an engagement
          multiplier on your mining rewards. The more your posts resonate, the more
          WRF you earn — Proof-of-Meme in action.
        </p>

        {/* Large multiplier display in hero */}
        <div
          className="meme-multiplier-hero"
          aria-label="Current Proof-of-Meme multiplier"
        >
          🎭
        </div>
      </section>

      {/* 2. Full dashboard */}
      <ProofOfMemeDashboard walletAddress={walletAddress} />

      {/* 3. Recent viral posts */}
      <h2 className="meme-section-title">
        Recent Viral Posts
        {FEATURES.demoSurfaces && (
          <span className="meme-sample-badge" data-testid="meme-posts-sample-badge"> (sample data)</span>
        )}
      </h2>
      {!FEATURES.demoSurfaces && (
        <p className="meme-feed-not-live" data-testid="meme-posts-not-live">
          Not available yet — no social feed is wired to the testnet API, so no posts or engagement counts
          are shown in their place.
        </p>
      )}
      <div className="meme-feed-grid">
        {(FEATURES.demoSurfaces ? SAMPLE_VIRAL_POSTS : []).map(post => (
          <div key={post.id} className="meme-feed-card">
            <div className="meme-feed-emoji">{post.emoji}</div>
            <div className="meme-feed-text">{post.text}</div>
            <div className="meme-feed-engagement">🔥 {post.engagement}</div>
          </div>
        ))}
      </div>

      {/* 4. FAQ */}
      <h2 className="meme-section-title">FAQ</h2>
      <div className="meme-faq">
        {FAQ_ITEMS.map((item, i) => (
          <Accordion key={i} disableGutters elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#e0e0e0' }} />}>
              <Typography fontWeight={600}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
