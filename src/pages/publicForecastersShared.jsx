import React from 'react';
import { Link } from 'react-router-dom';
import { WrfAlert } from '../components/DesignSystem';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import {
  bgPrimary, bgSecondary, borders, errorLight, fontFamily, infoDark, infoLight, primaryLight, radii, shadows, successLight,
  textMuted, textPrimary, textSecondary, warningLight,
} from '../components/DesignSystem/tokens';

/**
 * Shared pieces of the public forecaster pages (/forecasters, /forecasters/:profileKey; core4#3604 A4).
 * Design-system tokens are injected as CSS custom properties for PublicForecastersPage.css, the same way
 * the Governance page does it; no colour is hard-coded here.
 */
export const TOKEN_VARS = {
  '--fc-bg-primary': bgPrimary,
  '--fc-bg-secondary': bgSecondary,
  '--fc-text': textPrimary,
  '--fc-text-secondary': textSecondary,
  '--fc-text-muted': textMuted,
  '--fc-border': borders.default,
  '--fc-primary-light': primaryLight,
  '--fc-info-light': infoLight,
  '--fc-success-light': successLight,
  '--fc-error-light': errorLight,
  '--fc-warning-light': warningLight,
  '--fc-r-lg': `${radii.lg}px`,
  '--fc-r-md': `${radii.md}px`,
  '--fc-shadow-md': shadows.md,
  '--fc-font': fontFamily.display,
  '--fc-mono': fontFamily.mono,
};

/**
 * TOKEN_VARS for the current theme: the surface, text, border and accent variables follow the body theme
 * through the shared public-page helper (as the forecast, governance and downloads pages do), so the light
 * theme draws dark text on light surfaces instead of the dark map's slate-50 text on a white card.
 */
export function useForecasterThemeVars() {
  const isDark = useIsDarkTheme();
  const surface = publicPageSurfaceVars('fc', isDark);
  return { ...TOKEN_VARS, ...surface, ...(isDark ? {} : { '--fc-info-light': surface['--fc-info'], '--fc-warning-light': '#92400E' }) };
}

/**
 * Colours for the Recharts forecasts-per-day chart. Recharts takes colours as props, not CSS, so they come
 * from the same publicPageSurfaceVars map the page's stylesheet uses: gridlines in the border token,
 * ticks in the muted text token, the tooltip on the card surface with the page's text colours, and the
 * hover band in the row tint. The bars keep sky-400 in the dark theme and use sky-600 in the light theme,
 * where sky-400 is too faint against white.
 */
export function forecasterChartColors(isDark) {
  const v = publicPageSurfaceVars('fc', isDark);
  return {
    grid: v['--fc-border'],
    tick: v['--fc-text-muted'],
    cursor: v['--fc-row-bg'],
    bar: isDark ? infoLight : infoDark,
    tooltip: {
      background: v['--fc-bg-secondary'],
      border: v['--fc-border'],
      shadow: v['--fc-shadow-md'],
      label: v['--fc-text-secondary'],
      item: v['--fc-text'],
    },
  };
}

/** The forecaster kit and guide (docs repo `testnet/forecasting.md`, written by the forecast lane). */
export const FORECASTING_GUIDE_HREF = 'https://github.com/wrfcoin/docs/blob/main/testnet/forecasting.md';

export const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

export const NOT_YET_LABEL = 'Not yet available';

const WRF_UNITS_PER_COIN = 100000000n;
/** Exact base units -> { whole: "1,250", frac: ".00000305" }; null when the input is not a digit string. */
export function splitBaseUnits(raw) {
  if (typeof raw !== 'string' || !/^\d{1,39}$/.test(raw)) return null;
  const units = BigInt(raw);
  const whole = (units / WRF_UNITS_PER_COIN).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (units % WRF_UNITS_PER_COIN).toString().padStart(8, '0');
  return { whole, frac: `.${frac}` };
}

/** Digit-string counts from the API, grouped; "—" for anything else. */
export function count(value) {
  return typeof value === 'string' && /^\d{1,39}$/.test(value) ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—';
}

/** "Oct 25" (year when it differs) or "—"; `withTime` adds the clock time. */
export function When({ value, withTime = false }) {
  if (value === null || value === undefined || value === '') return <>—</>;
  const ms = Date.parse(String(value));
  if (!Number.isFinite(ms)) return <>{String(value)}</>;
  const date = new Date(ms);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const label = withTime
    ? date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
  return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{label}</time>;
}

/** 7 / 30 / all segmented control (same affordance as the leaderboard tab bar). */
export function PeriodTabs({ value, onChange }) {
  return (
    <div className="fc-tabbar" role="tablist" aria-label="Window">
      {PERIODS.map(opt => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={value === opt.key}
          className={`fc-tab${value === opt.key ? ' fc-tab--active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The read failed. A 503 is the backend saying the forecast index is off or not current on this network,
 * which is a fact about the network, not a transient error, so it gets its own wording.
 */
export function Unavailable({ result, what, onRetry }) {
  const limited = result?.kind === 'rate_limited';
  const notOnNetwork = result?.kind === 'error' && result.status === 503;
  return (
    <WrfAlert
      severity={limited ? 'warning' : 'info'}
      role="alert"
      className="fc-unavailable"
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    >
      {limited
        ? 'Too many requests. Please wait a moment and try again.'
        : notOnNetwork
          ? `${what} are not available on this network yet: the chain-reward index that feeds them is not running.`
          : `${what} unavailable right now.`}
    </WrfAlert>
  );
}

/** Copy-to-clipboard for an address; silent when the clipboard API is missing. */
export function CopyButton({ text, label }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await globalThis.navigator?.clipboard?.writeText?.(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable: nothing to show */ }
  };
  return (
    <button type="button" className="fc-copy" onClick={copy} aria-label={label} title={label}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function GuideLink({ children = 'Learn how to forecast' }) {
  return <a className="fc-guide" href={FORECASTING_GUIDE_HREF} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function BackLink() {
  return <Link className="fc-back" to="/forecasters">← All forecasters</Link>;
}
