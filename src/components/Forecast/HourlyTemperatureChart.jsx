import React, { useLayoutEffect, useRef, useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from 'recharts';
import { info as infoColor, infoLight, bgPrimary, textMuted, textPrimary, fontFamily } from '../DesignSystem/tokens';
import WeatherIcon from './WeatherIcon';

// SVG text and dots take their colours from the design-system theme variables (dark tokens as the
// fallback), so the chart stays legible on the light card; the `fill` attributes remain for renderers
// without CSS. Axis ticks read the secondary text variable: in dark it equals the muted token, in light
// it holds 4.5:1 over the pale area fill where muted slate-500 does not.
const themedFill = (name, dark) => ({ fill: `var(--wrf-ds-${name}, ${dark})` });

const GRID = 'rgba(51, 65, 85, 0.6)';

/** Measures its own width with a resize listener (no ResizeObserver); zero width renders nothing. */
function useMeasuredWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const read = () => setWidth(ref.current ? ref.current.clientWidth : 0);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  return [ref, width];
}

function HourTick({ x, y, payload, rows, step }) {
  const row = rows[payload.index];
  if (!row || payload.index % step !== 0) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      {row.icon ? (
        <g transform="translate(-10,6)" style={{ color: 'var(--wrf-ds-info-soft, #BAE6FD)' }}>
          <WeatherIcon name={row.icon} size={20} />
        </g>
      ) : null}
      <text x={0} y={42} textAnchor="middle" fill={textMuted} style={themedFill('text-secondary', textMuted)} fontSize={11} fontFamily={fontFamily.display}>
        {row.label}
      </text>
    </g>
  );
}

function TempLabel({ x, y, index, value, step }) {
  if (index % step !== 0 || value === null || value === undefined) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={bgPrimary} style={themedFill('bg-primary', bgPrimary)} stroke={infoLight} strokeWidth={2} />
      <text x={x} y={y - 12} textAnchor="middle" fill={textPrimary} style={themedFill('text-primary', textPrimary)} fontSize={12} fontWeight={600} fontFamily={fontFamily.display}>
        {value}°
      </text>
    </g>
  );
}

function HourTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="pf-tip">
      <div className="pf-tip__t">{row.label === 'Now' ? 'Now' : row.label}</div>
      <div>{row.temperature === null ? '—' : `${row.temperature}°${row.temperatureUnit ?? ''}`}{row.shortForecast ? ` · ${row.shortForecast}` : ''}</div>
      {row.precipitation !== null ? <div className="pf-tip__m">Rain chance {row.precipitation}%</div> : null}
    </div>
  );
}

/**
 * 24-hour temperature chart (Recharts ComposedChart): precipitation-probability bars under a
 * temperature area/line, condition icons on the axis. Width comes from the container; in an
 * environment without layout (jsdom) nothing is drawn and a text summary stands in.
 */
export default function HourlyTemperatureChart({ rows }) {
  const [ref, width] = useMeasuredWidth();
  const step = width < 520 ? 6 : 3;
  const temps = rows.map(r => r.temperature).filter(t => t !== null);
  const min = temps.length ? Math.floor((Math.min(...temps) - 4) / 5) * 5 : 0;
  const max = temps.length ? Math.ceil((Math.max(...temps) + 6) / 5) * 5 : 100;
  const ticks = [];
  for (let t = min; t <= max; t += 5) ticks.push(t);
  // A zero or unreported chance draws no bar at all (a 0-height bar still paints its rounded cap).
  const data = rows.map(r => ({ ...r, pop: r.precipitation ? r.precipitation : null }));
  const height = width < 520 ? 220 : 280;

  return (
    <div ref={ref} className="pf-chart" data-testid="hourly-chart">
      {width > 0 && temps.length > 1 ? (
        <ComposedChart width={width} height={height} data={data} margin={{ top: 28, right: 12, bottom: 44, left: 0 }}>
          <defs>
            <linearGradient id="pf-temp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={infoLight} stopOpacity={0.35} />
              <stop offset="100%" stopColor={infoLight} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="key" interval={0} axisLine={false} tickLine={false} height={48} tick={<HourTick rows={rows} step={step} />} />
          <YAxis
            domain={[min, max]}
            ticks={ticks}
            width={36}
            axisLine={false}
            tickLine={false}
            tick={{ fill: textMuted, style: themedFill('text-secondary', textMuted), fontSize: 11, fontFamily: fontFamily.display }}
            tickFormatter={v => `${v}°`}
          />
          <YAxis yAxisId="pop" orientation="right" domain={[0, 100]} hide />
          <Tooltip content={<HourTooltip />} cursor={{ stroke: GRID }} />
          <Bar yAxisId="pop" dataKey="pop" fill={infoColor} fillOpacity={0.35} radius={[2, 2, 0, 0]} maxBarSize={10} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={infoLight}
            strokeWidth={2.5}
            fill="url(#pf-temp-fill)"
            connectNulls
            dot={false}
            activeDot={{ r: 5, fill: infoLight, stroke: bgPrimary, style: { stroke: `var(--wrf-ds-bg-primary, ${bgPrimary})` } }}
            isAnimationActive={false}
            label={<TempLabel step={step} />}
          />
        </ComposedChart>
      ) : (
        <ul className="pf-chart__fallback">
          {rows.map(r => (
            <li key={r.key}>{r.label}: {r.temperature === null ? '—' : `${r.temperature}°${r.temperatureUnit ?? ''}`} {r.shortForecast ?? ''}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
