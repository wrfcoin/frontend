import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import {
  WrfCard,
  WrfStatCard,
  WrfBadge,
  WrfTabs,
  WrfDataTable,
  WrfSkeleton,
  WrfAlert,
  WrfEmptyState,
} from '../components/DesignSystem';
import { fetchForecastCoverage } from '../services/governanceService';

const ALL_DOMAINS = ['Weather', 'AQ', 'Water', 'Wildfire'];

const domainColor = {
  Weather: '#1d4ed8',
  AQ: '#7c3aed',
  Water: '#0369a1',
  Wildfire: '#c2410c',
};

const trendIcon = { improving: '\u2191', declining: '\u2193', stable: '\u2192' };

const tabItems = [
  { label: 'All', value: 'All' },
  ...ALL_DOMAINS.map((d) => ({ label: d, value: d })),
];

const severityStatusMap = { low: 'active', medium: 'warning', high: 'error' };
const domainStatusMap = {
  Weather: 'info',
  AQ: 'warning',
  Water: 'info',
  Wildfire: 'error',
};

const gapColumns = [
  { key: 'region', label: 'Region' },
  {
    key: 'domain',
    label: 'Domain',
    render: (val) => (
      <WrfBadge label={val} status={domainStatusMap[val] ?? 'neutral'} />
    ),
  },
  {
    key: 'missingHours',
    label: 'Missing Hours',
    sortable: true,
    render: (val) => `${val}h`,
  },
  {
    key: 'severity',
    label: 'Severity',
    render: (val) => (
      <WrfBadge
        label={val}
        status={severityStatusMap[val] ?? 'neutral'}
      />
    ),
  },
];

function ForecastCoverageDashboardPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('All');

  const { data, isLoading, error } = useQuery({
    queryKey: ['forecast-coverage'],
    queryFn: fetchForecastCoverage,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfSkeleton variant="card" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfAlert severity="error">{error.message}</WrfAlert>
      </Box>
    );
  }

  const filteredDomains =
    activeTab === 'All'
      ? data.domains
      : data.domains.filter((d) => d.name === activeTab);

  const filteredGaps =
    activeTab === 'All'
      ? data.gaps
      : data.gaps.filter((g) => g.domain === activeTab);

  const filteredTrends =
    activeTab === 'All'
      ? data.trends
      : data.trends.filter((t) => t.domain === activeTab);

  return (
    <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Forecast Coverage Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Spatial and temporal coverage KPIs, domain breakdown, data gaps, and
        trend indicators.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {/* KPIs */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 1.5,
          }}
        >
          <WrfStatCard
            label="Spatial Coverage"
            value={`${data.overallCoverage.spatialPercent.toFixed(1)}%`}
          />
          <WrfStatCard
            label="Temporal Coverage"
            value={`${data.overallCoverage.temporalPercent.toFixed(1)}%`}
          />
          <WrfStatCard
            label="Active Domains"
            value={data.overallCoverage.domainCount}
          />
          <WrfStatCard
            label="Data Gaps"
            value={data.gaps.length}
            color={data.gaps.length > 0 ? '#EF4444' : undefined}
          />
        </Box>

        {/* Domain Tabs */}
        <WrfTabs
          items={tabItems}
          value={activeTab}
          onChange={setActiveTab}
          aria-label="Domain filter"
        />

        {/* Coverage by Domain */}
        <WrfCard headerTitle="Coverage by Domain">
          {filteredDomains.length === 0 ? (
            <WrfEmptyState
              variant="no-data"
              title="No data"
              description="No data for selected domain."
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 1.75,
              }}
            >
              {filteredDomains.map((domain) => {
                const color = domainColor[domain.name] ?? '#1d4ed8';
                const trend = data.trends.find(
                  (t) => t.domain === domain.name,
                );
                const trendColor =
                  trend?.direction === 'improving'
                    ? 'success.main'
                    : trend?.direction === 'declining'
                      ? 'error.main'
                      : 'text.secondary';

                return (
                  <WrfCard key={domain.name} variant="outlined" sx={{ p: 1.75 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{ fontWeight: 700, color, fontSize: 14 }}
                      >
                        {domain.name}
                      </Typography>
                      {trend && (
                        <Typography
                          sx={{
                            color: trendColor,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {trendIcon[trend.direction]}{' '}
                          {trend.changePercent > 0 ? '+' : ''}
                          {trend.changePercent.toFixed(1)}%
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          Spatial
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {domain.spatialCoveragePercent.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.max(0, domain.spatialCoveragePercent),
                        )}
                        sx={{
                          mt: 0.5,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color,
                            borderRadius: 1,
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          Temporal
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {domain.temporalCoveragePercent.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.max(0, domain.temporalCoveragePercent),
                        )}
                        sx={{
                          mt: 0.5,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color,
                            borderRadius: 1,
                          },
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mt: 1.25, display: 'block' }}
                    >
                      {domain.regionCount} region
                      {domain.regionCount !== 1 ? 's' : ''} covered
                    </Typography>
                  </WrfCard>
                );
              })}
            </Box>
          )}
        </WrfCard>

        {/* Trend Indicators */}
        <WrfCard headerTitle="Trend Indicators">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {filteredTrends.map((trend) => {
              const trendColor =
                trend.direction === 'improving'
                  ? 'success.main'
                  : trend.direction === 'declining'
                    ? 'error.main'
                    : 'text.secondary';

              return (
                <WrfCard
                  key={trend.domain}
                  variant="outlined"
                  sx={{ px: 2, py: 1.25, minWidth: 200, display: 'flex', alignItems: 'center', gap: 1.25 }}
                >
                  <Typography
                    sx={{ fontSize: 22, color: trendColor, fontWeight: 700 }}
                  >
                    {trendIcon[trend.direction]}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: domainColor[trend.domain] ?? 'text.primary',
                      }}
                    >
                      {trend.domain}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: trendColor, textTransform: 'capitalize' }}
                    >
                      {trend.direction}
                      {trend.changePercent !== 0 && (
                        <>
                          {' '}
                          ({trend.changePercent > 0 ? '+' : ''}
                          {trend.changePercent.toFixed(1)}%)
                        </>
                      )}
                    </Typography>
                  </Box>
                </WrfCard>
              );
            })}
          </Box>
        </WrfCard>

        {/* Data Gaps */}
        <WrfCard headerTitle="Data Gaps">
          {filteredGaps.length === 0 ? (
            <WrfEmptyState
              variant="no-data"
              title="No gaps detected"
              description="No data gaps detected for this domain."
            />
          ) : (
            <WrfDataTable
              columns={gapColumns}
              data={filteredGaps}
              searchable
              pagination
              pageSize={10}
            />
          )}
        </WrfCard>
      </Box>
    </Box>
  );
}

export default ForecastCoverageDashboardPage;
