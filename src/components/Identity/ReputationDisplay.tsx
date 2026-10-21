import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as TipIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// --- Types ---

type ReputationTier = 'Untrusted' | 'Neutral' | 'Trusted' | 'HighlyTrusted';

interface TrustBreakdown {
  dataQuality: number;
  consistency: number;
  communityParticipation: number;
  governance: number;
}

interface ReputationEvent {
  id: string;
  timestamp: string;
  description: string;
  scoreChange: number;
  category: keyof TrustBreakdown;
}

// --- Constants ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  border: '#334155',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

const TIER_CONFIG: Record<ReputationTier, { color: string; glow: string; icon: string; min: number; max: number; desc: string }> = {
  Untrusted: { color: '#6B7280', glow: 'none', icon: '🛡', min: 0, max: 249, desc: 'New or flagged account' },
  Neutral: { color: '#94A3B8', glow: '0 0 12px rgba(148,163,184,0.4)', icon: '🛡', min: 250, max: 499, desc: 'Building trust history' },
  Trusted: { color: '#3B82F6', glow: '0 0 20px rgba(59,130,246,0.5)', icon: '🛡', min: 500, max: 749, desc: 'Active trusted participant' },
  HighlyTrusted: { color: '#F59E0B', glow: '0 0 30px rgba(245,158,11,0.6)', icon: '🏆', min: 750, max: 1000, desc: 'Top-tier community leader' },
};

const TIER_THRESHOLDS = [
  { label: 'Untrusted', position: 0 },
  { label: 'Neutral', position: 25 },
  { label: 'Trusted', position: 50 },
  { label: 'Highly Trusted', position: 75 },
];

// MOCK_SCORE, MOCK_BREAKDOWN, MOCK_EVENTS removed — data fetched from /api/identity/reputation

const IMPROVEMENT_TIPS = [
  'Submit weather data consistently for 7+ consecutive days to boost your consistency score.',
  'Calibrate your sensors regularly to maintain high data quality ratings.',
  'Participate in at least one governance vote per month to improve your governance score.',
  'Help verify other contributors\' data in the community review queue.',
  'Maintain station uptime above 95% for bonus reputation multipliers.',
];

// --- Helpers ---

function getTier(score: number): ReputationTier {
  if (score >= 750) return 'HighlyTrusted';
  if (score >= 500) return 'Trusted';
  if (score >= 250) return 'Neutral';
  return 'Untrusted';
}

const CATEGORY_LABELS: Record<keyof TrustBreakdown, { label: string; color: string }> = {
  dataQuality: { label: 'Data Quality', color: '#3B82F6' },
  consistency: { label: 'Consistency', color: '#22C55E' },
  communityParticipation: { label: 'Community', color: '#8B5CF6' },
  governance: { label: 'Governance', color: '#F59E0B' },
};

const EMPTY_BREAKDOWN: TrustBreakdown = { dataQuality: 0, consistency: 0, communityParticipation: 0, governance: 0 };

// --- Component ---

const ReputationDisplay: React.FC = () => {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<TrustBreakdown>(EMPTY_BREAKDOWN);
  const [events, setEvents] = useState<ReputationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: confirm endpoint path with backend team
      const res = await fetch('/api/identity/reputation', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Reputation fetch failed: ${res.status}`);
      const data = await res.json();
      const raw = data.data ?? data;
      setScore(Number(raw.score ?? raw.trustScore ?? raw.trust_score ?? 0));
      const bd = raw.breakdown ?? raw.breakdown_scores ?? {};
      setBreakdown({
        dataQuality: Number(bd.dataQuality ?? bd.data_quality ?? 0),
        consistency: Number(bd.consistency ?? 0),
        communityParticipation: Number(bd.communityParticipation ?? bd.community_participation ?? 0),
        governance: Number(bd.governance ?? 0),
      });
      const evts = Array.isArray(raw.events ?? raw.history) ? (raw.events ?? raw.history) : [];
      setEvents(evts.map((e: any, i: number) => ({
        id: String(e.id ?? i),
        timestamp: e.timestamp ?? e.createdAt ?? e.created_at ?? '',
        description: e.description ?? e.message ?? '',
        scoreChange: Number(e.scoreChange ?? e.score_change ?? e.delta ?? 0),
        category: e.category ?? 'dataQuality',
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reputation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReputation(); }, [fetchReputation]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: palette.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={fetchReputation}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  const tier = useMemo(() => getTier(score), [score]);
  const tierConfig = TIER_CONFIG[tier];
  const scorePercent = (score / 1000) * 100;

  const chartData = {
    labels: Object.values(CATEGORY_LABELS).map(c => c.label),
    datasets: [
      {
        data: [breakdown.dataQuality, breakdown.consistency, breakdown.communityParticipation, breakdown.governance],
        backgroundColor: Object.values(CATEGORY_LABELS).map(c => `${c.color}33`),
        borderColor: Object.values(CATEGORY_LABELS).map(c => c.color),
        borderWidth: 2,
        hoverBackgroundColor: Object.values(CATEGORY_LABELS).map(c => `${c.color}55`),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: palette.textSecondary,
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: palette.card,
        titleColor: palette.text,
        bodyColor: palette.textSecondary,
        borderColor: palette.border,
        borderWidth: 1,
        callbacks: {
          label: (ctx: { label?: string; raw?: unknown }) => ` ${ctx.label}: ${ctx.raw}/100`,
        },
      },
    },
  };

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <ShieldIcon sx={{ color: tierConfig.color, fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700 }}>
            Reputation Score
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Your on-chain reputation determines trust level and earning multipliers
        </Typography>
      </Box>

      {/* Tier Badge + Score */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
            {/* Large Tier Badge */}
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${tierConfig.color}15`,
                border: `3px solid ${tierConfig.color}`,
                boxShadow: tierConfig.glow,
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontSize: 36, lineHeight: 1 }}>
                {tierConfig.icon}
              </Typography>
              <Typography sx={{ color: tierConfig.color, fontWeight: 800, fontSize: '0.85rem', mt: 0.5 }}>
                {tier === 'HighlyTrusted' ? 'HIGHLY TRUSTED' : tier.toUpperCase()}
              </Typography>
            </Box>

            {/* Score + Progress */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
                <Typography sx={{ color: palette.text, fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {score}
                </Typography>
                <Typography sx={{ color: palette.textSecondary, fontSize: '1rem' }}>
                  / 1,000
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                {tierConfig.desc}
              </Typography>

              {/* Progress bar with tier markers */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={scorePercent}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: `${palette.border}80`,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: `linear-gradient(90deg, ${TIER_CONFIG.Untrusted.color}, ${TIER_CONFIG.Neutral.color}, ${TIER_CONFIG.Trusted.color}, ${TIER_CONFIG.HighlyTrusted.color})`,
                    },
                  }}
                />
                {/* Tier threshold markers */}
                {TIER_THRESHOLDS.map((t) => (
                  <Box key={t.label} sx={{ position: 'absolute', top: '100%', left: `${t.position}%`, transform: 'translateX(-50%)', mt: 0.5 }}>
                    <Box sx={{ width: 1, height: 6, bgcolor: palette.textSecondary, mx: 'auto', mb: 0.25 }} />
                    <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {t.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Breakdown + Events Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {/* Trust Score Breakdown (Doughnut) */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TrendingUpIcon sx={{ color: palette.primary }} />
              <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
                Trust Breakdown
              </Typography>
            </Stack>
            <Box sx={{ height: 260, mx: 'auto', maxWidth: 300 }}>
              <Doughnut data={chartData} options={chartOptions} />
            </Box>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {(Object.entries(breakdown) as [keyof TrustBreakdown, number][]).map(([key, val]) => {
                const cat = CATEGORY_LABELS[key];
                return (
                  <Box key={key}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: '0.8rem' }}>
                        {cat.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: cat.color, fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {val}/100
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={val}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: `${palette.border}60`,
                        '& .MuiLinearProgress-bar': { bgcolor: cat.color, borderRadius: 3 },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Reputation Events */}
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TimelineIcon sx={{ color: palette.primary }} />
              <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
                Recent Events
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {events.map((ev) => {
                const cat = CATEGORY_LABELS[ev.category];
                const isPositive = ev.scoreChange > 0;
                return (
                  <Paper
                    key={ev.id}
                    sx={{
                      bgcolor: `${palette.bg}80`,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 2,
                      p: 2,
                      borderLeft: `3px solid ${isPositive ? palette.success : palette.error}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: palette.text, fontWeight: 600, fontSize: '0.85rem' }}>
                          {ev.description}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            label={cat.label}
                            size="small"
                            sx={{ bgcolor: `${cat.color}1a`, color: cat.color, fontSize: '0.65rem', height: 20 }}
                          />
                          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                            {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Stack>
                      </Box>
                      <Chip
                        label={`${isPositive ? '+' : ''}${ev.scoreChange}`}
                        size="small"
                        sx={{
                          bgcolor: isPositive ? `${palette.success}1a` : `${palette.error}1a`,
                          color: isPositive ? palette.success : palette.error,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          ml: 1,
                        }}
                      />
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Improvement Tips */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <TipIcon sx={{ color: '#F59E0B' }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              How to Improve Your Reputation
            </Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            {IMPROVEMENT_TIPS.map((tip, idx) => (
              <Paper
                key={idx}
                sx={{
                  bgcolor: `${palette.bg}80`,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: `${palette.primary}20`,
                    color: palette.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  {idx + 1}
                </Box>
                <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: '0.85rem' }}>
                  {tip}
                </Typography>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReputationDisplay;
