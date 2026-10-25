import React from 'react';
import { useScarcityRule, type ScarcityRuleView } from '../../hooks/useScarcityRule';

/** Minimum map span so a lone cell is not blown up to fill the frame. */
const MIN_SPAN_LNG = 24;
const MIN_SPAN_LAT = 12;
const PAD_DEG = 4;

const fmtMultiplier = (m: number) => `×${Number(m.toFixed(2))}`;
const fmtInt = (n: number) => n.toLocaleString('en-US');

function frameFor(view: ScarcityRuleView) {
  const half = view.rule.cellSizeDegrees / 2;
  const lats = view.zones.map(z => z.lat);
  const lngs = view.zones.map(z => z.lng);
  const minLat = Math.min(...lats) - half - PAD_DEG;
  const maxLat = Math.max(...lats) + half + PAD_DEG;
  const minLng = Math.min(...lngs) - half - PAD_DEG;
  const maxLng = Math.max(...lngs) + half + PAD_DEG;
  const lngSpan = Math.max(maxLng - minLng, MIN_SPAN_LNG);
  const latSpan = Math.max(maxLat - minLat, MIN_SPAN_LAT);
  const cLng = (minLng + maxLng) / 2;
  const cLat = (minLat + maxLat) / 2;
  return { x: cLng - lngSpan / 2, y: -(cLat + latSpan / 2), w: lngSpan, h: latSpan };
}

function ScarcityMap({ view }: { view: ScarcityRuleView }) {
  const { rule, zones } = view;
  const frame = frameFor(view);
  const step = rule.cellSizeDegrees;
  const half = step / 2;
  // Cell edges are on multiples of the cell size offset from -90 / -180 by half a step.
  const firstLng = Math.floor((frame.x + 180) / step) * step - 180;
  const firstLat = Math.floor((-(frame.y + frame.h) + 90) / step) * step - 90;
  const vLines: number[] = [];
  for (let x = firstLng; x <= frame.x + frame.w; x += step) vLines.push(x);
  const hLines: number[] = [];
  for (let y = firstLat; y <= -frame.y; y += step) hLines.push(y);

  return (
    <svg
      className="scarcity-map"
      viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Map of ${zones.length} grid cells that contain active registered stations, each shaded by the bonus the chain pays`}
      data-testid="scarcity-map"
    >
      <rect className="scarcity-map-bg" x={frame.x} y={frame.y} width={frame.w} height={frame.h} />
      {vLines.map(x => (
        <line key={`v${x}`} className="scarcity-grid" x1={x} x2={x} y1={frame.y} y2={frame.y + frame.h} />
      ))}
      {hLines.map(y => (
        <line key={`h${y}`} className="scarcity-grid" y1={-y} y2={-y} x1={frame.x} x2={frame.x + frame.w} />
      ))}
      {zones.map(z => {
        const bonus = z.rewardMultiplier > rule.baselineMultiplier;
        return (
          <g key={`${z.lat}_${z.lng}`}>
            <rect
              data-testid={`scarcity-cell-${z.lat}_${z.lng}`}
              data-multiplier={String(z.rewardMultiplier)}
              className={bonus ? 'scarcity-cell scarcity-cell-bonus' : 'scarcity-cell scarcity-cell-base'}
              x={z.lng - half}
              y={-(z.lat + half)}
              width={step}
              height={step}
            />
            <text className="scarcity-cell-label" x={z.lng} y={-z.lat} textAnchor="middle" dominantBaseline="central">
              {fmtMultiplier(z.rewardMultiplier)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The data-scarcity bonus as the chain pays it (core4#28, ADR 2026-10-23-3563, answer A1).
 * Every figure comes from the response; when it cannot be read the panel says so.
 */
export default function ScarcityRulePanel() {
  const result = useScarcityRule();

  if (result.state === 'loading') {
    return (
      <div className="scarcity-panel" data-testid="scarcity-loading" role="status">
        Reading the scarcity rule from the chain…
      </div>
    );
  }
  if (result.state === 'unavailable') {
    return (
      <div className="scarcity-panel" data-testid="scarcity-unavailable" role="status">
        <h3>Data scarcity bonus</h3>
        <p>
          The scarcity rule is unavailable right now: the node did not report it. No rule is shown rather than a
          guessed one. Try again shortly.
        </p>
      </div>
    );
  }

  const { rule, zones, observedAtHeight } = result;
  return (
    <div className="scarcity-panel">
      <div className="section-header">
        <h3>Data scarcity bonus</h3>
      </div>
      <p className="scarcity-rule" data-testid="scarcity-rule">
        A station in a ~{rule.cellSizeDegrees}° cell ({rule.gridKm} km) with fewer than {rule.minStationDensity}{' '}
        active registered stations is paid {fmtMultiplier(rule.desertBonusMultiplier)} on each reward; otherwise{' '}
        {fmtMultiplier(rule.baselineMultiplier)}. Stations are counted from the on-chain registry, and this bonus
        combines with the accuracy bonus up to a ×2 cap. Read from the chain at block {fmtInt(observedAtHeight)}
        {rule.active ? '.' : `; the bonus is not active until block ${fmtInt(rule.activationHeight)}.`}
      </p>

      {zones.length === 0 ? (
        <p data-testid="scarcity-empty">
          No cell has an active registered station yet, so the next station in any cell would be paid{' '}
          {fmtMultiplier(rule.desertBonusMultiplier)}.
        </p>
      ) : (
        <>
          <ScarcityMap view={result} />
          <ul className="scarcity-legend" aria-label="Legend">
            <li><span className="scarcity-swatch scarcity-cell-bonus" aria-hidden="true" /> {fmtMultiplier(rule.desertBonusMultiplier)} paid (fewer than {rule.minStationDensity} stations)</li>
            <li><span className="scarcity-swatch scarcity-cell-base" aria-hidden="true" /> {fmtMultiplier(rule.baselineMultiplier)} paid</li>
          </ul>
          <table className="scarcity-table">
            <thead>
              <tr><th scope="col">Cell centre</th><th scope="col">Active stations</th><th scope="col">Paid</th></tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={`${z.lat}_${z.lng}`}>
                  <td>{z.lat}°, {z.lng}°</td>
                  <td>{z.stationCount}</td>
                  <td>{fmtMultiplier(z.rewardMultiplier)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
