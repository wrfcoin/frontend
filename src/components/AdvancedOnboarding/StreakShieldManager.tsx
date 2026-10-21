import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ShieldIcon from '@mui/icons-material/Shield';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DiamondIcon from '@mui/icons-material/Diamond';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShieldHistoryEntry {
  id: string;
  date: string;
  trigger: string;
  result: 'protected' | 'expired';
  streakSaved: number;
}

type FlameSize = 'small' | 'steady' | 'blue' | 'roaring' | 'diamond';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_STREAK = 127;
const LONGEST_STREAK = 182;
const SHIELDS_AVAILABLE = 2;
const TIMES_PROTECTED = 5;

const SHIELD_INVENTORY = [
  { type: 'Monthly Free', count: 1, color: colors.brand.primary, description: 'Resets on the 1st of each month' },
  { type: 'Challenge Earned', count: 3, color: '#FFD700', description: 'Won from weekly data challenges' },
  { type: 'Purchased', count: 0, color: '#8B5CF6', description: 'Bought from the WRF store' },
];

const SHIELD_HISTORY: ShieldHistoryEntry[] = [
  { id: 'sh-001', date: '2026-02-03', trigger: 'Network outage (ISP)', result: 'protected', streakSaved: 118 },
  { id: 'sh-002', date: '2026-01-15', trigger: 'Station firmware update', result: 'protected', streakSaved: 99 },
  { id: 'sh-003', date: '2025-12-24', trigger: 'Holiday travel', result: 'protected', streakSaved: 77 },
  { id: 'sh-004', date: '2025-11-30', trigger: 'Power failure', result: 'expired', streakSaved: 0 },
  { id: 'sh-005', date: '2025-11-02', trigger: 'Sensor maintenance', result: 'protected', streakSaved: 42 },
  { id: 'sh-006', date: '2025-10-10', trigger: 'Cloud sync failure', result: 'protected', streakSaved: 19 },
];

const HISTORY_COLUMNS = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'trigger', label: 'Trigger', sortable: false },
  {
    key: 'result',
    label: 'Result',
    sortable: true,
    render: (val: string) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {val === 'protected' ? (
          <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main }} />
        ) : (
          <CancelIcon sx={{ fontSize: 14, color: colors.error.main }} />
        )}
        <Typography
          component="span"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: val === 'protected' ? colors.success.main : colors.error.main,
          }}
        >
          {val === 'protected' ? 'Protected' : 'Expired'}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'streakSaved',
    label: 'Streak Saved',
    sortable: true,
    render: (val: number) => (
      <Typography sx={{ fontSize: '0.8rem', color: val > 0 ? colors.text.primary : colors.text.muted }}>
        {val > 0 ? `${val} days` : '--'}
      </Typography>
    ),
  },
];

// ---------------------------------------------------------------------------
// Flame sizing helper
// ---------------------------------------------------------------------------

const getFlameSize = (streak: number): FlameSize => {
  if (streak >= 365) return 'diamond';
  if (streak >= 180) return 'roaring';
  if (streak >= 90) return 'blue';
  if (streak >= 30) return 'steady';
  return 'small';
};

const flameSizeConfig: Record<FlameSize, { height: number; label: string; color: string }> = {
  small: { height: 60, label: 'Spark', color: '#F59E0B' },
  steady: { height: 80, label: 'Steady Flame', color: '#EF4444' },
  blue: { height: 100, label: 'Blue Core', color: '#3B82F6' },
  roaring: { height: 120, label: 'Roaring Fire', color: '#EF4444' },
  diamond: { height: 140, label: 'Diamond Flame', color: '#06B6D4' },
};

// ---------------------------------------------------------------------------
// SVG Components
// ---------------------------------------------------------------------------

const FlameIcon: React.FC<{ streak: number }> = ({ streak }) => {
  const size = getFlameSize(streak);
  const config = flameSizeConfig[size];
  const h = config.height;
  const w = h * 0.7;
  const cx = w / 2;

  const outerColor = size === 'diamond' ? '#06B6D4' : size === 'blue' ? '#3B82F6' : '#EF4444';
  const midColor = size === 'diamond' ? '#818CF8' : size === 'blue' ? '#818CF8' : '#F59E0B';
  const innerColor = size === 'diamond' ? '#F0ABFC' : '#FFD700';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <filter id="flameGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer flame */}
      <path
        d={`M${cx} ${h * 0.05} Q${w * 0.1} ${h * 0.45} ${w * 0.15} ${h * 0.65} Q${w * 0.2} ${h * 0.85} ${cx} ${h * 0.95} Q${w * 0.8} ${h * 0.85} ${w * 0.85} ${h * 0.65} Q${w * 0.9} ${h * 0.45} ${cx} ${h * 0.05}`}
        fill={outerColor}
        opacity="0.8"
        filter="url(#flameGlow)"
      >
        <animate attributeName="d"
          values={`M${cx} ${h * 0.05} Q${w * 0.1} ${h * 0.45} ${w * 0.15} ${h * 0.65} Q${w * 0.2} ${h * 0.85} ${cx} ${h * 0.95} Q${w * 0.8} ${h * 0.85} ${w * 0.85} ${h * 0.65} Q${w * 0.9} ${h * 0.45} ${cx} ${h * 0.05};M${cx} ${h * 0.03} Q${w * 0.08} ${h * 0.42} ${w * 0.13} ${h * 0.62} Q${w * 0.18} ${h * 0.82} ${cx} ${h * 0.95} Q${w * 0.82} ${h * 0.82} ${w * 0.87} ${h * 0.62} Q${w * 0.92} ${h * 0.42} ${cx} ${h * 0.03};M${cx} ${h * 0.05} Q${w * 0.1} ${h * 0.45} ${w * 0.15} ${h * 0.65} Q${w * 0.2} ${h * 0.85} ${cx} ${h * 0.95} Q${w * 0.8} ${h * 0.85} ${w * 0.85} ${h * 0.65} Q${w * 0.9} ${h * 0.45} ${cx} ${h * 0.05}`}
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>

      {/* Middle flame */}
      <path
        d={`M${cx} ${h * 0.2} Q${w * 0.22} ${h * 0.5} ${w * 0.25} ${h * 0.68} Q${w * 0.3} ${h * 0.85} ${cx} ${h * 0.93} Q${w * 0.7} ${h * 0.85} ${w * 0.75} ${h * 0.68} Q${w * 0.78} ${h * 0.5} ${cx} ${h * 0.2}`}
        fill={midColor}
        opacity="0.7"
      >
        <animate attributeName="d"
          values={`M${cx} ${h * 0.2} Q${w * 0.22} ${h * 0.5} ${w * 0.25} ${h * 0.68} Q${w * 0.3} ${h * 0.85} ${cx} ${h * 0.93} Q${w * 0.7} ${h * 0.85} ${w * 0.75} ${h * 0.68} Q${w * 0.78} ${h * 0.5} ${cx} ${h * 0.2};M${cx} ${h * 0.18} Q${w * 0.2} ${h * 0.48} ${w * 0.23} ${h * 0.66} Q${w * 0.28} ${h * 0.83} ${cx} ${h * 0.93} Q${w * 0.72} ${h * 0.83} ${w * 0.77} ${h * 0.66} Q${w * 0.8} ${h * 0.48} ${cx} ${h * 0.18};M${cx} ${h * 0.2} Q${w * 0.22} ${h * 0.5} ${w * 0.25} ${h * 0.68} Q${w * 0.3} ${h * 0.85} ${cx} ${h * 0.93} Q${w * 0.7} ${h * 0.85} ${w * 0.75} ${h * 0.68} Q${w * 0.78} ${h * 0.5} ${cx} ${h * 0.2}`}
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>

      {/* Inner core */}
      <ellipse
        cx={cx}
        cy={h * 0.82}
        rx={w * 0.18}
        ry={h * 0.1}
        fill={innerColor}
        opacity="0.9"
      >
        <animate attributeName="ry" values={`${h * 0.1};${h * 0.12};${h * 0.1}`} dur="0.7s" repeatCount="indefinite" />
      </ellipse>

      {/* Diamond sparkle for diamond tier */}
      {size === 'diamond' && (
        <>
          <polygon points={`${cx},${h * 0.12} ${cx + 4},${h * 0.18} ${cx},${h * 0.24} ${cx - 4},${h * 0.18}`} fill="white" opacity="0.8">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
          </polygon>
          <polygon points={`${cx + w * 0.2},${h * 0.3} ${cx + w * 0.2 + 3},${h * 0.35} ${cx + w * 0.2},${h * 0.4} ${cx + w * 0.2 - 3},${h * 0.35}`} fill="white" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
          </polygon>
        </>
      )}
    </svg>
  );
};

const GracePeriodClock: React.FC = () => {
  const totalHours = 24;
  const safeHours = 20;
  const dangerHours = totalHours - safeHours;
  const safeAngle = (safeHours / totalHours) * 360;
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 14;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(endAngle, r);
    const end = polarToCartesian(startAngle, r);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={colors.bg.tertiary} strokeWidth={strokeWidth} />

      {/* Safe zone (green) - 20 hours */}
      <path
        d={describeArc(0, safeAngle, radius)}
        fill="none"
        stroke={colors.success.main}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Danger zone (red) - 4 hours */}
      <path
        d={describeArc(safeAngle, 360, radius)}
        fill="none"
        stroke={colors.error.main}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Hour markers */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360;
        const inner = polarToCartesian(angle, radius - strokeWidth / 2 - 4);
        const outer = polarToCartesian(angle, radius + strokeWidth / 2 + 4);
        const isMajor = i % 6 === 0;
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={colors.text.muted}
            strokeWidth={isMajor ? 2 : 0.75}
            opacity={isMajor ? 0.6 : 0.3}
          />
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={colors.text.primary} fontSize="22" fontWeight="700" fontFamily="sans-serif">
        20h
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={colors.text.muted} fontSize="11" fontFamily="sans-serif">
        minimum
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill={colors.success.main} fontSize="10" fontFamily="sans-serif">
        data required
      </text>

      {/* Danger label */}
      {(() => {
        const dangerMidAngle = safeAngle + ((360 - safeAngle) / 2);
        const labelPos = polarToCartesian(dangerMidAngle, radius + strokeWidth / 2 + 18);
        return (
          <text x={labelPos.x} y={labelPos.y} textAnchor="middle" fill={colors.error.main} fontSize="9" fontWeight="600" fontFamily="sans-serif">
            4h danger
          </text>
        );
      })()}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const StreakShieldManager: React.FC = () => {
  const [autoActivate, setAutoActivate] = useState(true);
  const [threshold, setThreshold] = useState(20);
  const [emailNotify, setEmailNotify] = useState(true);
  const [pushNotify, setPushNotify] = useState(true);

  const flameSize = getFlameSize(CURRENT_STREAK);
  const flameConfig = flameSizeConfig[flameSize];

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: `${colors.error.main}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WhatshotIcon sx={{ color: colors.error.main, fontSize: 28 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Streak Shield Manager
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Protect your data contribution streak with shields
          </Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Current Streak"
            value={`${CURRENT_STREAK}d`}
            trend={3}
            trendLabel="this week"
            icon={WhatshotIcon}
            color={colors.error.main}
            sparklineData={[100, 105, 110, 115, 120, 124, CURRENT_STREAK]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Longest Streak"
            value={`${LONGEST_STREAK}d`}
            trend={0}
            trendLabel="record"
            icon={EmojiEventsIcon}
            color="#FFD700"
            sparklineData={[50, 80, 110, 140, 160, 175, LONGEST_STREAK]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Shields Available"
            value={String(SHIELDS_AVAILABLE)}
            trend={-1}
            trendLabel="used this month"
            icon={ShieldIcon}
            color={colors.brand.primary}
            sparklineData={[3, 3, 3, 2, 2, 2, SHIELDS_AVAILABLE]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Times Protected"
            value={String(TIMES_PROTECTED)}
            trend={25}
            trendLabel="lifetime"
            icon={SecurityIcon}
            color={colors.success.main}
            sparklineData={[1, 2, 2, 3, 4, 4, TIMES_PROTECTED]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Flame Display */}
          <WrfCard variant="elevated" sx={{ textAlign: 'center', py: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <FlameIcon streak={CURRENT_STREAK} />
            </Box>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: colors.text.primary }}>
              {CURRENT_STREAK} Days
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
              <Chip
                icon={flameSize === 'diamond' ? <DiamondIcon sx={{ fontSize: 14, color: `${flameConfig.color} !important` }} /> : undefined}
                label={flameConfig.label}
                size="small"
                sx={{
                  backgroundColor: `${flameConfig.color}20`,
                  color: flameConfig.color,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: `1px solid ${flameConfig.color}40`,
                }}
              />
              <WrfBadge status="online" label="Active" pulse size="sm" />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mt: 2 }}>
              {LONGEST_STREAK - CURRENT_STREAK > 0
                ? `${LONGEST_STREAK - CURRENT_STREAK} days to beat your record`
                : 'You are at your all-time record!'}
            </Typography>
          </WrfCard>

          {/* Grace Period Visualization */}
          <WrfCard title="Grace Period" subtitle="Daily data submission window">
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <GracePeriodClock />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors.success.main }} />
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>Safe (20h)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors.error.main }} />
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>Danger (4h)</Typography>
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Shield Inventory */}
          <WrfCard title="Shield Inventory" subtitle="Available streak protection shields" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {SHIELD_INVENTORY.map((shield) => (
                <Box
                  key={shield.type}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.md}px`,
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: `${shield.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldIcon sx={{ fontSize: 20, color: shield.color }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary }}>
                      {shield.type}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                      {shield.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${shield.count} available`}
                    size="small"
                    sx={{
                      backgroundColor: shield.count > 0 ? `${shield.color}20` : colors.bg.tertiary,
                      color: shield.count > 0 ? shield.color : colors.text.muted,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: `1px solid ${shield.count > 0 ? `${shield.color}40` : colors.border.default}`,
                    }}
                  />
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <WrfButton variant="secondary" size="sm" startIcon={<ShieldIcon sx={{ fontSize: 16 }} />}>
                Get More Shields
              </WrfButton>
            </Box>
          </WrfCard>

          {/* Protection Settings */}
          <WrfCard title="Protection Settings" subtitle="Configure automatic shield behavior" sx={{ mb: 3 }}>
            {/* Auto-activate toggle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                borderBottom: `1px solid ${colors.border.default}`,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                  Auto-Activate Shield
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                  Automatically use a shield when streak is at risk
                </Typography>
              </Box>
              <Switch
                checked={autoActivate}
                onChange={(e) => setAutoActivate(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success.main },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.success.main },
                  '& .MuiSwitch-track': { backgroundColor: colors.bg.tertiary },
                }}
              />
            </Box>

            {/* Threshold slider */}
            <Box sx={{ py: 2, borderBottom: `1px solid ${colors.border.default}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                  Streak-at-Risk Threshold
                </Typography>
                <Chip
                  label={`${threshold}h remaining`}
                  size="small"
                  sx={{
                    backgroundColor: threshold <= 4 ? `${colors.error.main}20` : `${colors.warning.main}20`,
                    color: threshold <= 4 ? colors.error.main : colors.warning.main,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
              <Slider
                value={threshold}
                onChange={(_, val) => setThreshold(val as number)}
                min={1}
                max={24}
                step={1}
                sx={{
                  color: colors.brand.primary,
                  '& .MuiSlider-track': { backgroundColor: colors.brand.primary },
                  '& .MuiSlider-rail': { backgroundColor: colors.bg.tertiary },
                  '& .MuiSlider-thumb': {
                    backgroundColor: colors.brand.primary,
                    '&:hover': { boxShadow: shadows.glow(colors.brand.primary) },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>1h (aggressive)</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>24h (safe)</Typography>
              </Box>
            </Box>

            {/* Notification preferences */}
            <Box sx={{ py: 1.5 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary, mb: 1.5 }}>
                Notification Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 16, color: colors.text.muted }} />
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Email alerts
                    </Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={emailNotify}
                    onChange={(e) => setEmailNotify(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success.main },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.success.main },
                      '& .MuiSwitch-track': { backgroundColor: colors.bg.tertiary },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 16, color: colors.text.muted }} />
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      Push notifications
                    </Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={pushNotify}
                    onChange={(e) => setPushNotify(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.success.main },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.success.main },
                      '& .MuiSwitch-track': { backgroundColor: colors.bg.tertiary },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </WrfCard>

          {/* Shield Activation History */}
          <WrfCard title="Shield Activation History" subtitle="Past shield usage and outcomes">
            <Box sx={{ mt: 1 }}>
              <WrfDataTable
                columns={HISTORY_COLUMNS}
                data={SHIELD_HISTORY}
                searchable
                exportable
                pagination
                pageSize={5}
              />
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StreakShieldManager;
