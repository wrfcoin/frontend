// frontend#354 — the PoP dashboard's statistics tabs. No backend route serves
// PoP participant counts, reward totals, validation rates or top contributors
// (the deployed API mounts no /api/pop or /api/consensus), so every figure
// below is an illustrative sample. Each tab goes through DemoSurfaceGate: the
// default build shows an honest not-live state and never mounts the sample.
import React from 'react';
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

const DESCRIPTION =
  'No testnet endpoint reports PoP participants or rewards yet; these figures are illustrative.';

const SAMPLE_REWARD_STATS = {
  dataContributors: {
    totalRewards: 1.8,
    participants: 1,
    averageReward: 0.105,
    topContributor: {
      address: 'wrf717d72395303fcb2aed4df368f32f1078d18e9cc',
      submissions: 18,
      rewards: 1.8,
      stationName: 'Bryan\'s AcuRite Iris\u00ae 2025',
    },
    enhancementRate: 5.6,
    dataQuality: 0.89,
    locationVerified: true,
    region: 'north_america',
    recentRewards: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  },
  dataAnalyzers: {
    totalRewards: 145.3,
    participants: 3,
    averageReward: 48.43,
    validationAccuracy: 78.2,
    recentRewards: [52.1, 48.8, 44.4, 0, 0, 0, 0],
    topForecaster: {
      nodeId: 'amazon_forecaster',
      region: 'Amazon Rainforest',
      scarcityMultiplier: 3.0,
      accuracy: 78.0,
    },
  },
  algorithmDevelopers: {
    totalRewards: 138.29,
    participants: 18,
    averageReward: 7.68,
    adoptionRate: 73.6,
    recentRewards: [8.1, 7.3, 8.5, 7.8, 8.3, 7.6, 8.9],
    proofTypeWeights: {
      usefulness: 35,
      information: 25,
      location: 20,
      publishing: 20,
    },
  },
};

function OverviewSample({ rewardStats }) {
  return (
    <div className="overview-tab">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <div className="overview-card total-contributors">
            <div className="card-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="card-content">
              <div className="card-title">Total Participants</div>
              <div className="card-value">
                {rewardStats.dataContributors.participants +
                  rewardStats.dataAnalyzers.participants +
                  rewardStats.algorithmDevelopers.participants}
              </div>
              <div className="card-subvalues">
                <span className="contributors">
                  {rewardStats.dataContributors.participants}{' '}
                  contributors
                </span>
                <span className="separator">{'\u2022'}</span>
                <span className="analyzers">
                  {rewardStats.dataAnalyzers.participants} analyzers
                </span>
                <span className="separator">{'\u2022'}</span>
                <span className="developers">
                  {rewardStats.algorithmDevelopers.participants}{' '}
                  developers
                </span>
              </div>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className="overview-card total-rewards">
            <div className="card-icon">
              <i className="bi bi-coin"></i>
            </div>
            <div className="card-content">
              <div className="card-title">Total Rewards</div>
              <div className="card-value">
                {(
                  rewardStats.dataContributors.totalRewards +
                  rewardStats.dataAnalyzers.totalRewards +
                  rewardStats.algorithmDevelopers.totalRewards
                ).toFixed(2)}{' '}
                WRF
              </div>
              <div className="card-subvalues">
                <span className="last-period">
                  Last 24 hours: 75.23 WRF
                </span>
              </div>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className="overview-card validation-rate">
            <div className="card-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="card-content">
              <div className="card-title">Validation Rate</div>
              <div className="card-value">94.3%</div>
              <div className="card-subvalues">
                <span className="positive">+2.7% from last week</span>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>

      <div className="reward-distribution-chart">
        <h4>Reward Distribution</h4>
        <div className="chart-placeholder">
          <div className="distribution-bars">
            <div className="distribution-bar">
              <div className="bar-label">Data Contributors</div>
              <div className="bar-container">
                <div
                  className="bar contributors-bar"
                  style={{
                    width:
                      (rewardStats.dataContributors.totalRewards /
                        (rewardStats.dataContributors.totalRewards +
                          rewardStats.dataAnalyzers.totalRewards +
                          rewardStats.algorithmDevelopers
                            .totalRewards)) *
                        100 +
                      '%',
                  }}
                >
                  {Math.round(
                    (rewardStats.dataContributors.totalRewards /
                      (rewardStats.dataContributors.totalRewards +
                        rewardStats.dataAnalyzers.totalRewards +
                        rewardStats.algorithmDevelopers.totalRewards)) *
                      100,
                  )}
                  %
                </div>
              </div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Data Analyzers</div>
              <div className="bar-container">
                <div
                  className="bar analyzers-bar"
                  style={{
                    width:
                      (rewardStats.dataAnalyzers.totalRewards /
                        (rewardStats.dataContributors.totalRewards +
                          rewardStats.dataAnalyzers.totalRewards +
                          rewardStats.algorithmDevelopers
                            .totalRewards)) *
                        100 +
                      '%',
                  }}
                >
                  {Math.round(
                    (rewardStats.dataAnalyzers.totalRewards /
                      (rewardStats.dataContributors.totalRewards +
                        rewardStats.dataAnalyzers.totalRewards +
                        rewardStats.algorithmDevelopers.totalRewards)) *
                      100,
                  )}
                  %
                </div>
              </div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Algorithm Developers</div>
              <div className="bar-container">
                <div
                  className="bar developers-bar"
                  style={{
                    width:
                      (rewardStats.algorithmDevelopers.totalRewards /
                        (rewardStats.dataContributors.totalRewards +
                          rewardStats.dataAnalyzers.totalRewards +
                          rewardStats.algorithmDevelopers
                            .totalRewards)) *
                        100 +
                      '%',
                  }}
                >
                  {Math.round(
                    (rewardStats.algorithmDevelopers.totalRewards /
                      (rewardStats.dataContributors.totalRewards +
                        rewardStats.dataAnalyzers.totalRewards +
                        rewardStats.algorithmDevelopers.totalRewards)) *
                      100,
                  )}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PopOverviewPanel() {
  return (
    <DemoSurfaceGate title="PoP network totals are not live on the testnet yet" description={DESCRIPTION} testId="pop-overview">
      <OverviewSample rewardStats={SAMPLE_REWARD_STATS} />
    </DemoSurfaceGate>
  );
}

function WeatherStationsSample({ rewardStats }) {
  return (
    <div className="weather-stations-tab">
      <div className="section-header">
        <h3>Weather Station Rewards</h3>
        <p>
          Enhanced rewards for authenticated weather stations with
          quality and location bonuses
        </p>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>Weather Station Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Active Stations</div>
                <div className="stat-value">
                  {rewardStats.dataContributors.participants}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Earnings</div>
                <div className="stat-value">
                  {rewardStats.dataContributors.totalRewards.toFixed(2)}{' '}
                  WRF
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Enhanced Reward Rate</div>
                <div className="stat-value">
                  {rewardStats.dataContributors.averageReward.toFixed(
                    3,
                  )}{' '}
                  WRF
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Data Quality</div>
                <div className="stat-value">
                  {(
                    rewardStats.dataContributors.dataQuality * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>Bryan's AcuRite Iris{'\u00ae'} 2025</h4>
            <div className="top-contributor">
              <div className="contributor-address">
                {rewardStats.dataContributors.topContributor.address}
              </div>
              <div className="contributor-stats">
                <div className="stat-row">
                  <div className="stat-name">Total Readings:</div>
                  <div className="stat-figure">
                    {rewardStats.dataContributors.topContributor.submissions}
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">WRF Earned:</div>
                  <div className="stat-figure">
                    {rewardStats.dataContributors.topContributor.rewards.toFixed(2)}{' '}
                    WRF
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">Location Verified:</div>
                  <div className="stat-figure">
                    {rewardStats.dataContributors.locationVerified ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">Enhancement Rate:</div>
                  <div className="stat-figure">
                    +{rewardStats.dataContributors.enhancementRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>

      <div className="reward-enhancements">
        <h4>Weather Station Enhancement Features</h4>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Enhancement Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Bonus Rate</TableCell>
                <TableCell>Current Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Data Quality</TableCell>
                <TableCell>High-precision sensor readings with low error rates</TableCell>
                <TableCell>+{rewardStats.dataContributors.enhancementRate}%</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Location Verification</TableCell>
                <TableCell>GPS-verified station location with geographic context</TableCell>
                <TableCell>+2.5%</TableCell>
                <TableCell>Verified</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Multi-Sensor Array</TableCell>
                <TableCell>Complete weather parameter coverage (temp, humidity, wind, pressure)</TableCell>
                <TableCell>+1.5%</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Continuous Operation</TableCell>
                <TableCell>24/7 data collection with minimal downtime</TableCell>
                <TableCell>+1.0%</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}

export function PopWeatherStationsPanel() {
  return (
    <DemoSurfaceGate title="Weather-station PoP rewards are not live on the testnet yet" description={DESCRIPTION} testId="pop-weather-stations">
      <WeatherStationsSample rewardStats={SAMPLE_REWARD_STATS} />
    </DemoSurfaceGate>
  );
}

function EnvironmentalForecastingSample({ rewardStats }) {
  return (
    <div className="environmental-forecasting-tab">
      <div className="section-header">
        <h3>Environmental Forecasting Rewards</h3>
        <p>
          High-value rewards for WRF model forecasting with geographic
          scarcity bonuses
        </p>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>Forecasting Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Active Forecasters</div>
                <div className="stat-value">
                  {rewardStats.dataAnalyzers.participants}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Rewards</div>
                <div className="stat-value">
                  {rewardStats.dataAnalyzers.totalRewards.toFixed(2)}{' '}
                  WRF
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Avg. Forecast Reward</div>
                <div className="stat-value">
                  {rewardStats.dataAnalyzers.averageReward.toFixed(2)}{' '}
                  WRF
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Accuracy Rate</div>
                <div className="stat-value">
                  {rewardStats.dataAnalyzers.validationAccuracy.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>Top Forecasting Node</h4>
            <div className="top-contributor">
              <div className="contributor-address">
                {rewardStats.dataAnalyzers.topForecaster.nodeId}
              </div>
              <div className="contributor-stats">
                <div className="stat-row">
                  <div className="stat-name">Region:</div>
                  <div className="stat-figure">
                    {rewardStats.dataAnalyzers.topForecaster.region}
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">Scarcity Multiplier:</div>
                  <div className="stat-figure">
                    {rewardStats.dataAnalyzers.topForecaster.scarcityMultiplier}x
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">Forecast Accuracy:</div>
                  <div className="stat-figure">
                    {rewardStats.dataAnalyzers.topForecaster.accuracy.toFixed(1)}%
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-name">Status:</div>
                  <div className="stat-figure">Active</div>
                </div>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>

      <div className="geographic-bonuses">
        <h4>Geographic Scarcity Bonuses</h4>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Region</TableCell>
                <TableCell>Scarcity Multiplier</TableCell>
                <TableCell>Active Nodes</TableCell>
                <TableCell>Base Reward (WRF)</TableCell>
                <TableCell>Enhanced Reward (WRF)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell>Amazon Rainforest</TableCell><TableCell>3.0x</TableCell><TableCell>1</TableCell><TableCell>15.0</TableCell><TableCell>45.0</TableCell></TableRow>
              <TableRow><TableCell>Arctic Circle</TableCell><TableCell>2.5x</TableCell><TableCell>1</TableCell><TableCell>15.0</TableCell><TableCell>37.5</TableCell></TableRow>
              <TableRow><TableCell>Sahara Desert</TableCell><TableCell>2.0x</TableCell><TableCell>1</TableCell><TableCell>15.0</TableCell><TableCell>30.0</TableCell></TableRow>
              <TableRow><TableCell>North America</TableCell><TableCell>1.0x</TableCell><TableCell>0</TableCell><TableCell>15.0</TableCell><TableCell>15.0</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}

export function PopEnvironmentalForecastingPanel() {
  return (
    <DemoSurfaceGate title="Forecasting rewards are not live on the testnet yet" description={DESCRIPTION} testId="pop-forecasting">
      <EnvironmentalForecastingSample rewardStats={SAMPLE_REWARD_STATS} />
    </DemoSurfaceGate>
  );
}

function AlgorithmDevelopersSample({ rewardStats }) {
  return (
    <div className="algorithm-developers-tab">
      <div className="section-header">
        <h3>Algorithm Developers Rewards</h3>
        <p>Statistics for algorithm developers contributing to the PoP ecosystem</p>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>Developer Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Developers</div>
                <div className="stat-value">{rewardStats.algorithmDevelopers.participants}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Rewards</div>
                <div className="stat-value">{rewardStats.algorithmDevelopers.totalRewards.toFixed(2)} WRF</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Avg. Reward</div>
                <div className="stat-value">{rewardStats.algorithmDevelopers.averageReward.toFixed(2)} WRF</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Algorithm Adoption</div>
                <div className="stat-value">{rewardStats.algorithmDevelopers.adoptionRate}%</div>
              </div>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <div className="stats-card">
            <h4>PoP Proof Type Weights</h4>
            <div className="proof-weights">
              <div className="weight-item">
                <div className="weight-label">Proof of Usefulness</div>
                <div className="weight-value">{rewardStats.algorithmDevelopers.proofTypeWeights.usefulness}%</div>
                <div className="weight-description">Environmental forecasting algorithms</div>
              </div>
              <div className="weight-item">
                <div className="weight-label">Proof of Information</div>
                <div className="weight-value">{rewardStats.algorithmDevelopers.proofTypeWeights.information}%</div>
                <div className="weight-description">Data quality validation systems</div>
              </div>
              <div className="weight-item">
                <div className="weight-label">Proof of Location</div>
                <div className="weight-value">{rewardStats.algorithmDevelopers.proofTypeWeights.location}%</div>
                <div className="weight-description">Geographic verification protocols</div>
              </div>
              <div className="weight-item">
                <div className="weight-label">Proof of Publishing</div>
                <div className="weight-value">{rewardStats.algorithmDevelopers.proofTypeWeights.publishing}%</div>
                <div className="weight-description">Environmental report publication</div>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>

      <div className="algorithm-categories">
        <h4>PoP Algorithm Categories & Rewards</h4>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Proof Type</TableCell>
                <TableCell>Algorithm Category</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Base Reward (WRF)</TableCell>
                <TableCell>Active Developers</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell>Usefulness</TableCell><TableCell>WRF Model Forecasting</TableCell><TableCell>35%</TableCell><TableCell>15.0</TableCell><TableCell>6</TableCell></TableRow>
              <TableRow><TableCell>Information</TableCell><TableCell>Weather Data Quality Validation</TableCell><TableCell>25%</TableCell><TableCell>10.0</TableCell><TableCell>5</TableCell></TableRow>
              <TableRow><TableCell>Location</TableCell><TableCell>Geographic Verification Systems</TableCell><TableCell>20%</TableCell><TableCell>8.0</TableCell><TableCell>4</TableCell></TableRow>
              <TableRow><TableCell>Publishing</TableCell><TableCell>Environmental Report Generation</TableCell><TableCell>20%</TableCell><TableCell>8.0</TableCell><TableCell>3</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <div className="algorithm-development-info">
          <h5>Algorithm Development Focus Areas</h5>
          <div className="development-areas">
            <div className="area-item">
              <strong>Enhanced Weather Models:</strong> Improving WRF
              computational accuracy and regional adaptation
            </div>
            <div className="area-item">
              <strong>Data Quality Algorithms:</strong> Advanced sensor
              validation and error detection systems
            </div>
            <div className="area-item">
              <strong>Geographic Verification:</strong> GPS and spatial
              analysis for location authenticity
            </div>
            <div className="area-item">
              <strong>Automated Reporting:</strong> Environmental impact
              and climate analysis publication systems
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PopAlgorithmDevelopersPanel() {
  return (
    <DemoSurfaceGate title="Algorithm-developer rewards are not live on the testnet yet" description={DESCRIPTION} testId="pop-algorithm-developers">
      <AlgorithmDevelopersSample rewardStats={SAMPLE_REWARD_STATS} />
    </DemoSurfaceGate>
  );
}
