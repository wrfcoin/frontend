import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Alert, Box, Typography, Paper, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { earningsService } from '../../services/apiClient';
import type { EarningsBreakdownEntry } from '../../services/apiClient';
import { formatExactAmount, sumExactBaseUnits } from '../../services/apiClient/amountPrecision';
import { toBaseUnits } from '../../services/apiClient/number';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RewardCategory {
  type: string;
  percentage: number;
  color: string;
  amount: string | null;
  description: string;
  recentEntries: RewardHistoryEntry[];
}

interface RewardHistoryEntry {
  date: string;
  amount: string | null;
  note: string;
}

interface MultiplierInfo {
  name: string;
  current: number;
  max: number;
  description: string;
  color: string;
}

interface RewardBreakdownProps {
  stationId: string;
}

// ---------------------------------------------------------------------------
// Static category definitions (percentages/descriptions are product-defined)
// ---------------------------------------------------------------------------

interface CategoryDef {
  type: string;
  percentage: number;
  color: string;
  description: string;
  earningsField: 'dataQualityBonus' | 'uptimeBonus' | 'accuracyBonus' | 'baseReward' | 'totalEarned';
}

const CATEGORY_DEFS: CategoryDef[] = [
  { type: 'Data Quality Bonus', percentage: 40, color: '#3B82F6', description: 'Rewards for high-accuracy weather data submissions that pass physics-based validation checks.', earningsField: 'dataQualityBonus' },
  { type: 'Consistency Streak', percentage: 25, color: '#10B981', description: 'Bonus for maintaining uninterrupted daily data submissions. Longer streaks unlock higher tiers.', earningsField: 'uptimeBonus' },
  { type: 'Spatial Coverage', percentage: 15, color: '#8B5CF6', description: 'Extra rewards for stations in underserved geographic areas that improve network coverage.', earningsField: 'accuracyBonus' },
  { type: 'Network Participation', percentage: 15, color: '#F59E0B', description: 'Base participation reward for keeping your station online and contributing to the network.', earningsField: 'baseReward' },
  { type: 'Referral Rewards', percentage: 5, color: '#EC4899', description: 'Earnings from users who joined the network through your referral link.', earningsField: 'totalEarned' },
];

const NOTE_FOR_STATUS: Record<string, string> = {
  confirmed: 'Confirmed payout',
  pending: 'Pending confirmation',
  failed: 'Failed — retrying',
};

function normalizeRewardAmount(value: unknown): string | null {
  return toBaseUnits(value)?.toString() ?? null;
}

function isPositiveReward(value: string | null): boolean {
  const units = toBaseUnits(value);
  return units !== null && units > 0n;
}

export function buildRewardCategories(earningsHistory: EarningsBreakdownEntry[]): RewardCategory[] {
  return CATEGORY_DEFS.map((def) => {
    const amounts = earningsHistory.map((entry) => normalizeRewardAmount(entry[def.earningsField]));
    const recentEntries: RewardHistoryEntry[] = earningsHistory
      .map((entry, index) => ({
        date: Number.isFinite(entry.timestamp) ? new Date(entry.timestamp).toISOString() : 'Unavailable',
        amount: amounts[index],
        note: NOTE_FOR_STATUS[entry.status] ?? 'Payout',
      }))
      .filter((entry) => entry.amount === null || isPositiveReward(entry.amount));

    return {
      type: def.type,
      percentage: def.percentage,
      color: def.color,
      amount: sumExactBaseUnits(amounts),
      description: def.description,
      recentEntries,
    };
  });
}

function buildMultipliers(stationId: string): MultiplierInfo[] {
  return [
    {
      name: 'Streak Multiplier',
      current: 1.35,
      max: 2.0,
      description: '43-day streak active. Reach 90 days for 1.5x.',
      color: '#10B981',
    },
    {
      name: 'Quality Multiplier',
      current: 1.2,
      max: 1.5,
      description: 'Quality score 94/100. Reach 97 for next tier.',
      color: '#3B82F6',
    },
    {
      name: 'Coverage Multiplier',
      current: 1.15,
      max: 1.3,
      description: 'Station in moderate-demand area. Relocating to an underserved region could boost this.',
      color: '#8B5CF6',
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RewardBreakdown: React.FC<RewardBreakdownProps> = ({ stationId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsBreakdownEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    earningsService.getStationEarnings(stationId, { period: 'daily', limit: 8 })
      .then(data => setEarningsHistory(data))
      .catch((error: unknown) => {
        setEarningsHistory([]);
        setLoadError(
          error instanceof Error ? `Reward breakdown unavailable: ${error.message}` : 'Reward breakdown unavailable',
        );
      })
      .finally(() => setLoading(false));
  }, [stationId]);

  const categories = useMemo(() => buildRewardCategories(earningsHistory), [earningsHistory]);

  const multipliers = useMemo(() => buildMultipliers(stationId), [stationId]);

  const totalMonthly = useMemo(
    () => sumExactBaseUnits(categories.map((category) => category.amount)),
    [categories],
  );

  const activeCategory = useMemo(
    () => (selectedCategory ? categories.find((c) => c.type === selectedCategory) : null),
    [selectedCategory, categories],
  );

  const handleSegmentClick = useCallback(
    (_: React.MouseEvent<HTMLCanvasElement>, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const cat = categories[index];
        setSelectedCategory((prev) => (prev === cat.type ? null : cat.type));
      }
    },
    [categories],
  );

  // Doughnut chart data
  const doughnutData = useMemo(
    () => ({
      labels: categories.map((c) => c.type),
      datasets: [
        {
          data: categories.map((c) => c.percentage),
          backgroundColor: categories.map((c) =>
            selectedCategory && selectedCategory !== c.type ? `${c.color}40` : c.color,
          ),
          borderColor: '#1E293B',
          borderWidth: 3,
          hoverBorderColor: '#0F172A',
          hoverBorderWidth: 4,
          cutout: '65%',
        },
      ],
    }),
    [categories, selectedCategory],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      onClick: handleSegmentClick,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#E2E8F0',
          bodyColor: '#94A3B8',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx: { label: string; parsed: number }) =>
              `${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    }),
    [handleSegmentClick],
  );

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress size={32} sx={{ color: '#3B82F6' }} />
      </Paper>
    );
  }

  if (loadError) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
          Reward Breakdown
        </Typography>
        <Alert severity="error">{loadError}</Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
        Reward Breakdown
      </Typography>

      {/* Doughnut Chart with center label */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 220, mx: 'auto', mb: 3 }}>
        <Doughnut data={doughnutData} options={doughnutOptions as any} />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
            Monthly
          </Typography>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, lineHeight: 1.2, fontSize: '1rem' }}>
            {formatExactAmount(totalMonthly, 1)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#10B981', fontSize: '0.6rem' }}>
            WRF
          </Typography>
        </Box>
      </Box>

      {/* Category Legend / List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {categories.map((cat) => (
          <Box
            key={cat.type}
            onClick={() => setSelectedCategory((prev) => (prev === cat.type ? null : cat.type))}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: selectedCategory === cat.type ? 'rgba(59,130,246,0.08)' : 'transparent',
              border: selectedCategory === cat.type ? `1px solid ${cat.color}40` : '1px solid transparent',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(59,130,246,0.06)' },
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cat.type}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, flexShrink: 0 }}>
              {cat.percentage}%
            </Typography>
            <Typography variant="caption" sx={{ color: cat.color, fontWeight: 600, flexShrink: 0 }}>
              {formatExactAmount(cat.amount, 1)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Selected category detail */}
      {activeCategory && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 1.5, bgcolor: '#0F172A', border: '1px solid #334155', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activeCategory.color }} />
            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
              {activeCategory.type}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
            {activeCategory.description}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
            Recent History
          </Typography>
          {activeCategory.recentEntries.length === 0 && (
            <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
              No history yet
            </Typography>
          )}
          {activeCategory.recentEntries.slice(0, 5).map((entry, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: i < 4 ? '1px solid #1E293B' : 'none' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                  {entry.note}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.6rem' }}>
                  {new Date(entry.date).toLocaleDateString()}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                +{formatExactAmount(entry.amount, 4)}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Multipliers */}
      <Box>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
          Active Multipliers
        </Typography>
        {multipliers.map((m) => {
          const progress = ((m.current - 1) / (m.max - 1)) * 100;
          return (
            <Box key={m.name} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
                  {m.name}
                </Typography>
                <Chip
                  label={`${m.current.toFixed(2)}x`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: `${m.color}20`,
                    color: m.color,
                    border: `1px solid ${m.color}40`,
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: '#334155',
                  '.MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 2 },
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.6rem', mt: 0.25, display: 'block' }}>
                {m.description}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default RewardBreakdown;
