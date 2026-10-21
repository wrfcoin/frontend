import React from 'react';
import { WrfEmptyState } from '../DesignSystem';

export interface ForecastViewerProps {
  stationId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
  onClose?: () => void;
}

const ForecastViewer: React.FC<ForecastViewerProps> = () => (
  <WrfEmptyState
    variant="no-data"
    title="Forecast Unavailable"
    description="Forecast data will be available once live weather models are connected."
  />
);

export default ForecastViewer;
