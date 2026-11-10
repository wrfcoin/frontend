import React from 'react';
import { Box, Typography } from '@mui/material';
import { deriveFromReading, formatTemperatureBoth } from '../../utils/derivedWeather';

/**
 * Dew point, heat index and wind chill, calculated in the browser from the station's newest
 * reading (utils/derivedWeather.ts). A value is shown only when the reading is inside the range
 * its formula was made for; otherwise the tile is left out and the note below says when it appears.
 * Renders nothing at all when the reading has no temperature.
 */

const text = 'var(--wrf-ds-text-primary, #F8FAFC)';
const textSecondary = 'var(--wrf-ds-text-secondary, #94A3B8)';
const border = 'var(--wrf-ds-border, #334155)';
const inset = 'var(--wrf-ds-bg-inset, rgba(15, 23, 42, 0.5647))';

interface Reading {
  timestamp?: string;
  temperatureC?: number;
  humidityPct?: number;
  windSpeedMs?: number;
}

function Tile({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <Box data-testid={testId} sx={{ bgcolor: inset, border: `1px solid ${border}`, borderRadius: 2, p: 2, minWidth: 0 }}>
      <Typography variant="body2" sx={{ color: textSecondary }}>{label}</Typography>
      <Typography variant="h6" component="p" sx={{ color: text, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

const timeOf = (iso: string | undefined) => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(ms)
    ? new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
};

export default function StationDerivedCard({ reading }: { reading: Reading | null | undefined }) {
  if (!reading || typeof reading.temperatureC !== 'number' || !Number.isFinite(reading.temperatureC)) return null;
  const derived = deriveFromReading(reading);
  const tiles = [
    derived.dewPointC !== null && { label: 'Dew point', value: formatTemperatureBoth(derived.dewPointC), testId: 'station-derived-dew-point' },
    derived.heatIndexC !== null && { label: 'Heat index', value: formatTemperatureBoth(derived.heatIndexC), testId: 'station-derived-heat-index' },
    derived.windChillC !== null && { label: 'Wind chill', value: formatTemperatureBoth(derived.windChillC), testId: 'station-derived-wind-chill' },
  ].filter(Boolean) as Array<{ label: string; value: string; testId: string }>;
  const when = timeOf(reading.timestamp);
  return (
    <Box data-testid="station-derived" sx={{ mb: 3 }}>
      <Typography variant="subtitle2" component="h2" sx={{ color: textSecondary, mb: 1 }}>
        Calculated from the newest reading{when ? ` (${when})` : ''}
      </Typography>
      {tiles.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: `repeat(${tiles.length}, minmax(0, 1fr))` },
            gap: 2,
            mb: 1,
          }}
        >
          {tiles.map(tile => <Tile key={tile.testId} {...tile} />)}
        </Box>
      )}
      <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }} data-testid="station-derived-note">
        {derived.heatIndexC === null && derived.windChillC === null
          ? 'Heat index appears from 80°F (26.7°C) with humidity of 40% or more, up to the top of the National Weather Service chart. Wind chill appears at 50°F (10°C) or colder with wind over 3 mph (4.8 km/h). '
          : derived.heatIndexC === null
            ? 'Heat index appears from 80°F (26.7°C) with humidity of 40% or more, up to the top of the National Weather Service chart. '
            : 'Wind chill appears at 50°F (10°C) or colder with wind over 3 mph (4.8 km/h). '}
        Standard formulas (Magnus dew point, US National Weather Service heat index and wind chill), worked out in your
        browser from this station&apos;s temperature, humidity and wind. A guide only, not medical or safety advice.
      </Typography>
    </Box>
  );
}
