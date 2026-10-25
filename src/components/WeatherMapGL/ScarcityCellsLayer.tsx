import React from 'react';
import { Rectangle, Tooltip } from 'react-leaflet';
import type { ScarcityRuleState } from '../../hooks/useScarcityRule';

/** Paid bonus (amber) and baseline (blue) fills; shared with the legend so they cannot drift. */
export const SCARCITY_BONUS_COLOR = '#F59E0B';
export const SCARCITY_BASE_COLOR = '#3B82F6';

/**
 * The cells the chain counts, at their true size, shaded by what the chain pays there
 * (core4#28, ADR 2026-10-23-3563, answer A1). Draws nothing until the rule has been read.
 */
const ScarcityCellsLayer: React.FC<{ scarcity: ScarcityRuleState }> = ({ scarcity }) => {
  if (scarcity.state !== 'ready') return null;
  const { rule, zones } = scarcity;
  const half = rule.cellSizeDegrees / 2;
  return (
    <>
      {zones.map(z => {
        const bonus = z.rewardMultiplier > rule.baselineMultiplier;
        const color = bonus ? SCARCITY_BONUS_COLOR : SCARCITY_BASE_COLOR;
        return (
          <Rectangle
            key={`${z.lat}_${z.lng}`}
            bounds={[
              [z.lat - half, z.lng - half],
              [z.lat + half, z.lng + half],
            ]}
            pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: bonus ? 0.3 : 0.15 }}
          >
            <Tooltip sticky>
              {`×${Number(z.rewardMultiplier.toFixed(2))} paid · ${z.stationCount} active registered station${z.stationCount === 1 ? '' : 's'} in this cell`}
            </Tooltip>
          </Rectangle>
        );
      })}
    </>
  );
};

export default ScarcityCellsLayer;
