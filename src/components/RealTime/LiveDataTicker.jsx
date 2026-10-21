import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import FEATURES from '../../config/features';
import { usePublicTestnetStats } from '../../hooks/usePublicTestnetStats';
import {
  ThermostatAuto as TempIcon,
  Cloud as WeatherIcon,
  CurrencyBitcoin as TokenIcon,
  Speed as GasIcon,
  Dns as NetworkIcon,
  WaterDrop as HumidityIcon,
  Air as WindIcon,
  Compress as PressureIcon,
  People as ValidatorsIcon,
  Storage as BlockIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  SwapHoriz as TxIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
};

const ICON_MAP = {
  temperature: TempIcon,
  weather: WeatherIcon,
  token: TokenIcon,
  gas: GasIcon,
  network: NetworkIcon,
  humidity: HumidityIcon,
  wind: WindIcon,
  pressure: PressureIcon,
  validators: ValidatorsIcon,
  block: BlockIcon,
  transactions: TxIcon,
};

// ---------------------------------------------------------------------------
// Ticker items (frontend#295)
// ---------------------------------------------------------------------------
//
// Every value the ticker shows is read from the three public testnet routes
// (usePublicTestnetStats: block height, latest block time, coverage zones).
// There is no price, gas, validator, TPS, station or carbon feed on the
// testnet, so no such item is shown — the previous hard-coded literals
// ("$2.847 WRF", "1,247 validators", "8,421 stations online"…) were
// fabricated. A number that cannot be read renders as "unavailable", never as
// a remembered or estimated figure, and no item carries a change arrow because
// no source reports a delta. Sample items render only under demo mode, each
// labelled as a sample.

const SAMPLE_TICKER_ITEMS = [
  { id: 'sample-temp', icon: 'temperature', label: 'Sample · Avg Temp', value: '22.4', unit: 'C', change: 0, prefix: '' },
  { id: 'sample-humidity', icon: 'humidity', label: 'Sample · Humidity', value: '67', unit: '%', change: 0, prefix: '' },
  { id: 'sample-wind', icon: 'wind', label: 'Sample · Wind', value: '14.2', unit: 'km/h', change: 0, prefix: '' },
  { id: 'sample-pressure', icon: 'pressure', label: 'Sample · Pressure', value: '1013', unit: 'hPa', change: 0, prefix: '' },
];

export const formatBlockAge = (isoTime, now = Date.now()) => {
  const then = new Date(isoTime).getTime();
  if (!Number.isFinite(then)) return null;
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

export const buildTickerItems = (stats, { demoSurfaces = false, now = Date.now() } = {}) => {
  if (stats.state === 'loading') {
    return [{ id: 'loading', icon: 'network', label: 'Testnet', value: 'connecting…', unit: '', change: 0, prefix: '' }];
  }

  const age = stats.latestBlockTime ? formatBlockAge(stats.latestBlockTime, now) : null;
  const live = [
    {
      id: 'block',
      icon: 'block',
      label: 'Block',
      value: stats.blockHeight === null ? 'unavailable' : stats.blockHeight.toLocaleString(),
      unit: '',
      change: 0,
      prefix: stats.blockHeight === null ? '' : '#',
    },
    {
      id: 'last-block',
      icon: 'transactions',
      label: 'Last block',
      value: age ?? 'unavailable',
      unit: '',
      change: 0,
      prefix: '',
    },
    {
      id: 'coverage',
      icon: 'network',
      label: 'Coverage zones',
      value: stats.coverageZoneCount === null ? 'unavailable' : stats.coverageZoneCount.toLocaleString(),
      unit: '',
      change: 0,
      prefix: '',
    },
  ];

  if (stats.blockHeight === null && stats.latestBlockTime === null && stats.coverageZoneCount === null) {
    live.unshift({ id: 'feed', icon: 'network', label: 'Testnet', value: 'live feed unavailable', unit: '', change: 0, prefix: '' });
  }

  return demoSurfaces ? [...live, ...SAMPLE_TICKER_ITEMS] : live;
};

// ---------------------------------------------------------------------------
// Keyframes (injected once)
// ---------------------------------------------------------------------------

const TICKER_KEYFRAMES = `
@keyframes wrfcoin-ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

// ---------------------------------------------------------------------------
// LiveDataTicker Component
// ---------------------------------------------------------------------------

const LiveDataTicker = () => {
  const stats = usePublicTestnetStats();
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef(null);
  const items = useMemo(
    () => buildTickerItems(stats, { demoSurfaces: FEATURES.demoSurfaces }),
    [stats],
  );

  const renderTickerItem = useCallback((item, keyIdx) => {
    const IconComp = ICON_MAP[item.icon] || NetworkIcon;
    const isPositive = item.change > 0;
    const isNeutral = item.change === 0;
    const changeColor = isNeutral ? colors.textSecondary : isPositive ? colors.success : colors.error;
    const ChangeArrow = isPositive ? UpIcon : DownIcon;

    return (
      <Box
        key={`${item.id}-${keyIdx}`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          px: '16px',
          whiteSpace: 'nowrap',
          borderRight: `1px solid ${colors.border}`,
          height: '100%',
        }}
      >
        <IconComp sx={{ fontSize: 14, color: colors.primary }} />
        <Typography
          component="span"
          sx={{ fontSize: 11, color: colors.textSecondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {item.label}
        </Typography>
        <Typography
          component="span"
          sx={{ fontSize: 12, color: colors.text, fontWeight: 600 }}
        >
          {item.prefix}{item.value}
          {item.unit ? (
            <Typography component="span" sx={{ fontSize: 10, color: colors.textSecondary, ml: '2px' }}>
              {item.unit}
            </Typography>
          ) : null}
        </Typography>
        {!isNeutral && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
            <ChangeArrow sx={{ fontSize: 12, color: changeColor }} />
            <Typography component="span" sx={{ fontSize: 10, color: changeColor, fontWeight: 600 }}>
              {Math.abs(item.change).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  }, []);

  return (
    <>
      <style>{TICKER_KEYFRAMES}</style>
      <Box
        sx={{
          width: '100%',
          height: 36,
          bgcolor: colors.card,
          borderBottom: `1px solid ${colors.border}`,
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1050,
          cursor: 'default',
          userSelect: 'none',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left fade */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: `linear-gradient(to right, ${colors.card}, transparent)`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Right fade */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: `linear-gradient(to left, ${colors.card}, transparent)`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Scrolling content (duplicated for seamless loop) */}
        <Box
          ref={tickerRef}
          data-testid="live-data-ticker"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '100%',
            animation: 'wrfcoin-ticker-scroll 60s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {items.map((item, i) => renderTickerItem(item, i))}
          {/* Duplicate for seamless loop */}
          {items.map((item, i) => renderTickerItem(item, i + items.length))}
        </Box>
      </Box>
    </>
  );
};

export default LiveDataTicker;
