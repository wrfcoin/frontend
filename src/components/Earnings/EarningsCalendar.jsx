/**
 * EarningsCalendar Component
 *
 * GitHub contribution-style heatmap backed by station earnings history from
 * the WRFCoin backend.
 */

import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import {
  Calendar,
} from 'lucide-react';
import { useWeatherStations } from '../../hooks/api/useWeatherQueries';
import { earningsService } from '../../services/apiClient';
import { queryKeys } from '../../lib/queryClient';
import 'react-calendar-heatmap/dist/styles.css';
import './EarningsCalendar.css';

const DAY_MS = 24 * 60 * 60 * 1000;

const getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const buildDailyEarnings = (entries) => {
  const byDate = new Map();

  entries.forEach((entry) => {
    const timestamp = new Date(entry.timestamp);
    if (!Number.isFinite(timestamp.getTime())) {
      return;
    }
    const date = timestamp.toISOString().split('T')[0];
    const current = byDate.get(date) || {
      date,
      count: 0,
      details: {},
    };
    const source = entry.rewardType || 'Reward';
    current.count += entry.amount;
    current.details[source] = (current.details[source] || 0) + entry.amount;
    byDate.set(date, current);
  });

  return Array.from(byDate.values()).map((entry) => ({
    ...entry,
    count: Math.round(entry.count * 100) / 100,
    details: Object.fromEntries(
      Object.entries(entry.details).map(([source, amount]) => [
        source,
        Math.round(amount * 100) / 100,
      ]),
    ),
  }));
};

const EarningsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const stationsQuery = useWeatherStations();
  const stationIds = useMemo(
    () => (stationsQuery.data || []).map((station) => station.id),
    [stationsQuery.data],
  );

  const historyQueries = useQueries({
    queries: stationIds.map((stationId) => ({
      queryKey: queryKeys.earnings.history(stationId),
      queryFn: () => earningsService.getStationHistory(stationId),
      staleTime: 30_000,
      enabled: stationIds.length > 0,
    })),
  });

  const historyEntries = useMemo(
    () => historyQueries.flatMap((query) => query.data || []),
    [historyQueries],
  );
  const data = useMemo(() => buildDailyEarnings(historyEntries), [historyEntries]);
  const today = new Date();
  const startDate = new Date(today.getTime() - 365 * DAY_MS);
  const totalEarnings = data.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = totalEarnings / 365;
  const maxDaily = Math.max(0, ...data.map(d => d.count));
  const activeDays = data.length;
  const historyError = historyQueries.find((query) => query.isError)?.error || null;
  const isLoading = stationsQuery.isLoading || historyQueries.some((query) => query.isLoading);

  const getIntensityLevel = (value) => {
    if (!value || value.count === 0 || maxDaily === 0) return 0;
    const ratio = value.count / maxDaily;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const getTooltipData = (value) => {
    if (!value || !value.date) {
      return { content: 'No earnings' };
    }

    const date = new Date(value.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!value.count) {
      return { content: `${formattedDate}: No earnings` };
    }

    return {
      content: `${formattedDate}: ${value.count.toFixed(2)} WRF`,
      details: value.details,
    };
  };

  const classForValue = (value) => `color-scale-${getIntensityLevel(value)}`;

  const renderState = () => {
    if (stationsQuery.isError) {
      return (
        <Alert severity="error">
          {getErrorMessage(stationsQuery.error, 'Unable to load weather stations.')}
        </Alert>
      );
    }

    if (historyError) {
      return (
        <Alert severity="error">
          {getErrorMessage(historyError, 'Unable to load earnings history.')}
        </Alert>
      );
    }

    if (isLoading) {
      return <Alert severity="info">Loading live earnings history...</Alert>;
    }

    if (stationIds.length === 0) {
      return <Alert severity="info">No weather stations are available for earnings history.</Alert>;
    }

    if (data.length === 0) {
      return <Alert severity="info">No earnings history has been reported by the backend yet.</Alert>;
    }

    return null;
  };

  const state = renderState();

  return (
    <div className="earnings-calendar dashboard-card">
      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar size={18} />
          <h3>Earnings History</h3>
        </div>

        <div className="calendar-stats">
          <div className="stat-item">
            <span className="stat-value font-mono">{totalEarnings.toFixed(0)}</span>
            <span className="stat-label">Total WRF</span>
          </div>
          <div className="stat-item">
            <span className="stat-value font-mono">{avgDaily.toFixed(1)}</span>
            <span className="stat-label">Avg/Day</span>
          </div>
          <div className="stat-item">
            <span className="stat-value font-mono">{activeDays}</span>
            <span className="stat-label">Active Days</span>
          </div>
        </div>
      </div>

      {state ? (
        <div className="heatmap-container">{state}</div>
      ) : (
        <>
          <div className="heatmap-container">
            <CalendarHeatmap
              startDate={startDate}
              endDate={today}
              values={data}
              classForValue={classForValue}
              tooltipDataAttrs={(value) => ({
                'data-tooltip-id': 'earnings-tooltip',
                'data-tooltip-content': getTooltipData(value).content,
              })}
              onClick={(value) => {
                if (value && value.date) {
                  setSelectedDate(value);
                }
              }}
              showWeekdayLabels
              gutterSize={3}
            />
            <Tooltip id="earnings-tooltip" className="earnings-tooltip" />
          </div>

          <div className="heatmap-legend">
            <span className="legend-label">Less</span>
            <div className="legend-scale">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`legend-box color-scale-${level}`}
                  title={`Level ${level}`}
                />
              ))}
            </div>
            <span className="legend-label">More</span>
          </div>

          {selectedDate && selectedDate.count > 0 && (
            <div className="selected-date-details">
              <div className="details-header">
                <span className="details-date">
                  {new Date(selectedDate.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="details-total font-mono">
                  {selectedDate.count.toFixed(2)} WRF
                </span>
              </div>

              <div className="details-breakdown">
                {Object.entries(selectedDate.details).map(([source, amount]) => (
                  <div key={source} className="breakdown-item">
                    <span className="breakdown-source">{source}</span>
                    <span className="breakdown-amount font-mono">{amount.toFixed(2)} WRF</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EarningsCalendar;
