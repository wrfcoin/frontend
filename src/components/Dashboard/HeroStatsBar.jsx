/**
 * HeroStatsBar Component
 *
 * Fixed position ticker bar displaying key platform metrics
 * with animated number updates and real-time data.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CountUp from 'react-countup';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Box,
  Zap,
  Server,
  Wallet,
  Cloud,
  BarChart2,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import './HeroStatsBar.css';

const NULL_STATS = {
  wrfPrice: null,
  priceChange24h: null,
  blockHeight: null,
  tps: null,
  activeNodes: null,
  userBalance: null,
  weatherStations: null,
  networkHashrate: null,
};

const StatItem = ({ icon: Icon, label, value, suffix = '', prefix = '', change, changeType, decimals = 0, isPrice = false }) => {
  const [prevValue, setPrevValue] = useState(value ?? 0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (value !== null && value !== prevValue) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsUpdating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className={`stat-item ${isUpdating ? 'updating' : ''}`}>
      <div className="stat-icon">
        <Icon size={16} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
          <span className="stat-value font-mono">
            {value === null ? '--' : (
              <>
                {prefix}
                <CountUp
                  start={prevValue}
                  end={value}
                  duration={0.5}
                  decimals={decimals}
                  separator=","
                  preserveValue
                />
                {suffix}
              </>
            )}
          </span>
          {change !== undefined && change !== null && (
            <span className={`stat-change ${changeType}`}>
              {changeType === 'positive' ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {Math.abs(change).toFixed(2)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Separator = () => <div className="stat-separator" />;

const toNumberOrNull = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readRows = (value, key) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value[key])) return value[key];
  if (value && Array.isArray(value.items)) return value.items;
  return [];
};

const firstNumber = (...values) => {
  for (const value of values) {
    const parsed = toNumberOrNull(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const fetchOptional = async paths => {
  try {
    return await apiClient.getWithFallback(paths);
  } catch {
    return null;
  }
};

const fetchHeroStats = async () => {
  const [dashboard, blockchain, validators, stations] = await Promise.all([
    fetchOptional(['/dashboard/stats', '/stats/dashboard']),
    fetchOptional(['/blockchain/status', '/chain/status', '/status']),
    fetchOptional(['/validators', '/governance/validators']),
    fetchOptional(['/weather/stations', '/stations']),
  ]);

  const validatorRows = readRows(validators, 'validators');
  const stationRows = readRows(stations, 'stations');
  const activeValidators = validatorRows.filter(
    validator => ['online', 'active', 'syncing'].includes(String(validator.status || '').toLowerCase()),
  );
  const activeStations = stationRows.filter(
    station => ['online', 'active'].includes(String(station.status || '').toLowerCase()),
  );

  return {
    wrfPrice: firstNumber(dashboard?.wrfPrice, dashboard?.price?.wrf, dashboard?.market?.wrfPrice),
    priceChange24h: firstNumber(dashboard?.priceChange24h, dashboard?.market?.priceChange24h),
    blockHeight: firstNumber(
      dashboard?.blockHeight ??
        blockchain?.height ??
        blockchain?.blockHeight ??
        blockchain?.latestBlock?.height,
    ),
    tps: firstNumber(
      dashboard?.tps ??
        blockchain?.tps ??
        blockchain?.transactionsPerSecond ??
        blockchain?.metrics?.tps,
    ),
    activeNodes: firstNumber(dashboard?.activeNodes) ?? (activeValidators.length || null),
    userBalance: firstNumber(dashboard?.userBalance),
    weatherStations: firstNumber(dashboard?.weatherStations) ?? (activeStations.length || null),
    networkHashrate: firstNumber(
      dashboard?.networkHashrate ??
        dashboard?.hashRate ??
        blockchain?.networkHashRate ??
        blockchain?.hashrate,
    ),
  };
};

const HeroStatsBar = () => {
  const heroStatsQuery = useQuery({
    queryKey: ['dashboard', 'hero-stats'],
    queryFn: fetchHeroStats,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const stats = useMemo(
    () => ({ ...NULL_STATS, ...(heroStatsQuery.data || {}) }),
    [heroStatsQuery.data],
  );
  const isConnected = heroStatsQuery.isSuccess;
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const checkConnection = () => {
      setIsBrowserOnline(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const backendConnected = isConnected && isBrowserOnline;
  const priceChangeType = (stats.priceChange24h ?? 0) >= 0 ? 'positive' : 'negative';

  return (
    <header className="hero-stats-bar">
      <div className="hero-stats-container">
        {/* Connection Status Indicator */}
        <div className={`connection-indicator ${backendConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
        </div>

        {/* Stats Items */}
        <div className="stats-scroll">
          <StatItem
            icon={TrendingUp}
            label="WRF Price"
            value={stats.wrfPrice}
            prefix="$"
            decimals={3}
            change={stats.priceChange24h}
            changeType={priceChangeType}
            isPrice
          />

          <Separator />

          <StatItem
            icon={Box}
            label="Block Height"
            value={stats.blockHeight}
            decimals={0}
          />

          <Separator />

          <StatItem
            icon={Zap}
            label="TPS"
            value={stats.tps}
            decimals={0}
          />

          <Separator />

          <StatItem
            icon={Server}
            label="Active Nodes"
            value={stats.activeNodes}
            decimals={0}
          />

          <Separator />

          <StatItem
            icon={Wallet}
            label="Your Balance"
            value={stats.userBalance}
            suffix=" WRF"
            decimals={2}
          />

          <Separator />

          <StatItem
            icon={Cloud}
            label="Weather Stations"
            value={stats.weatherStations}
            decimals={0}
          />

          <Separator />

          <StatItem
            icon={BarChart2}
            label="Network Hash"
            value={stats.networkHashrate}
            suffix=" TH/s"
            decimals={1}
          />
        </div>

        {/* Live indicator */}
        <div className="live-indicator">
          <span className="live-dot" />
          <span className="live-text">{backendConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};

export default HeroStatsBar;
