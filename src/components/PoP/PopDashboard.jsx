import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import { consensusService } from '../../services/consensusService';
import { WrfAlert, WrfCard } from '../DesignSystem';
import { WrfTabs, WrfTabPanel } from '../DesignSystem/WrfTabs';
import usePageNavigation from '../../hooks/usePageNavigation';
import PageTitle from '../common/PageTitle';
import EnvironmentalDataForm from './EnvironmentalDataForm';
import {
  PopAlgorithmDevelopersPanel,
  PopEnvironmentalForecastingPanel,
  PopOverviewPanel,
  PopWeatherStationsPanel,
} from './PopDashboardSamples';
import ValidationForm from './ValidationForm';
import './PopDashboard.css';

/**
 * Dashboard for the Proof of Publishing (PoP) consensus mechanism
 *
 * PoP combines four proof types into a single environmental consensus:
 * - Proof of Usefulness (35%): Environmental forecasting with WRF models
 * - Proof of Information (25%): Weather data quality validation
 * - Proof of Location (20%): Geographic verification and regional coverage
 * - Proof of Publishing (20%): Environmental report publication
 *
 * Features weather station integration with enhanced rewards for data quality.
 */
const PopDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [consensusSettings, setConsensusSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { prevPage, nextPage, goToPrev, goToNext } = usePageNavigation();

  useEffect(() => {
    const fetchConsensusSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const settings = await consensusService.getCurrentConsensusSettings();
        setConsensusSettings(settings);
      } catch (err) {
        // frontend#354: no invented defaults. The deployed API does not serve
        // /api/consensus/settings, so this is the usual testnet outcome.
        console.error('Error fetching consensus settings:', err);
        setConsensusSettings(null);
        setError('Consensus settings are not available from the testnet API yet.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsensusSettings();
  }, []);

  // Block time only as the API states it; there is no per-mechanism constant
  // table any more (it printed "60 seconds" for any PoP response).
  const blockTime = consensusSettings?.blockTime;
  const shownBlockTime =
    typeof blockTime === 'string' && blockTime.trim() !== ''
      ? blockTime.trim()
      : typeof blockTime === 'number' && Number.isFinite(blockTime) && blockTime > 0
        ? `${blockTime} seconds`
        : '—';
  const parameters = consensusSettings?.parameters ?? {};
  const shown = value => (value === undefined || value === null ? '—' : value);

  const tabItems = [
    { label: 'Overview', value: 'overview' },
    { label: 'Weather Stations', value: 'weatherStations' },
    { label: 'Environmental Forecasting', value: 'environmentalForecasting' },
    { label: 'Algorithm Developers', value: 'algorithmDevelopers' },
    { label: 'Submit Data', value: 'submit' },
    { label: 'Validate Data', value: 'validate' },
  ];

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 3 }} className="pop-dashboard">
      <PageTitle
        title="Proof of Publishing (PoP) Dashboard"
        subtitle="Unified environmental consensus combining Usefulness + Information + Location + Publishing for enhanced weather station rewards"
        showNavigation={true}
        onPrev={goToPrev}
        onNext={goToNext}
        prevLabel={prevPage?.title}
        nextLabel={nextPage?.title}
      />

      {error && (
        <WrfAlert severity="info" sx={{ mb: 4 }} data-testid="pop-consensus-unavailable">
          {error}
        </WrfAlert>
      )}

      {!isLoading && consensusSettings && (
        <div className="consensus-info-cards">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, p: 2 }} className="consensus-card">
                <h4>Block Time</h4>
                <div className="value">
                  {shownBlockTime}
                </div>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 1, p: 2 }} className="consensus-card">
                <h4>Min. Publishers</h4>
                <div className="value">
                  {shown(parameters.minPublishers)}
                </div>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1, p: 2 }} className="consensus-card">
                <h4>Validation Threshold</h4>
                <div className="value">
                  {typeof parameters.dataValidityThreshold === 'number'
                    ? `${parameters.dataValidityThreshold * 100}%`
                    : '—'}
                </div>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 1, p: 2 }} className="consensus-card">
                <h4>Review Period</h4>
                <div className="value">
                  {typeof parameters.reviewPeriod === 'number' ? `${parameters.reviewPeriod} hours` : '—'}
                </div>
              </Box>
            </Grid>
          </Grid>
        </div>
      )}

      <WrfCard>
        <WrfTabs
          items={tabItems}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
        />

        <div className="pop-content">
          {/* Overview Tab */}
          <WrfTabPanel value="overview" activeValue={activeTab}>
            <PopOverviewPanel />
          </WrfTabPanel>

          {/* Weather Stations Tab */}
          <WrfTabPanel value="weatherStations" activeValue={activeTab}>
            <PopWeatherStationsPanel />
          </WrfTabPanel>

          {/* Environmental Forecasting Tab */}
          <WrfTabPanel value="environmentalForecasting" activeValue={activeTab}>
            <PopEnvironmentalForecastingPanel />
          </WrfTabPanel>

          {/* Algorithm Developers Tab */}
          <WrfTabPanel value="algorithmDevelopers" activeValue={activeTab}>
            <PopAlgorithmDevelopersPanel />
          </WrfTabPanel>

          {/* Submit Data Tab */}
          <WrfTabPanel value="submit" activeValue={activeTab}>
            <div className="submit-tab">
              <EnvironmentalDataForm />
            </div>
          </WrfTabPanel>

          {/* Validate Data Tab */}
          <WrfTabPanel value="validate" activeValue={activeTab}>
            <div className="validate-tab">
              <ValidationForm />
            </div>
          </WrfTabPanel>
        </div>
      </WrfCard>
    </Box>
  );
};

export default PopDashboard;
