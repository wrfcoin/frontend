import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FEATURES from '../config/features';

// Weather Hub
const WeatherContributorHome = lazy(() => import('../pages/WeatherContributorHome'));
const WeatherContributorDashboard = lazy(() => import('../components/WeatherDashboard/WeatherContributorDashboard'));
const SensorOnboardingWizard = lazy(() => import('../components/Onboarding/SensorOnboardingWizard'));
const StationReportPage = lazy(() => import('../components/Weather/StationReportPage'));

// Proof of Publishing
const PopDashboard = lazy(() => import('../components/PoP/PopDashboard'));
const EnhancedEnvironmentalDataForm = lazy(() => import('../components/PoP/EnhancedEnvironmentalDataForm'));
const FairLaunchStatusPage = lazy(() => import('../pages/FairLaunchStatusPage'));

// Data & Climate
const BatchUploadPage = lazy(() => import('../components/DataUpload'));
const ClimateReportDashboard = lazy(() => import('../components/ClimateReports'));
const DataQualityDashboard = lazy(() => import('../components/DataQuality'));
const EarningsDashboard = lazy(() => import('../components/WeatherEarnings'));
const EnhancedWeatherMap = lazy(() => import('../components/WeatherMapGL'));

// Fleet & Forecast
const FleetDashboard = lazy(() => import('../components/FleetManagement'));
const ForecastViewer = lazy(() => import('../components/ForecastViewer/ForecastViewer'));
const ForecastStudio = lazy(() => import('../components/ForecastStudio'));
const ForecastCoverageDashboardPage = lazy(() => import('../pages/ForecastCoverageDashboardPage'));

// Advanced Onboarding
const QRScannerSetup = lazy(() => import('../components/AdvancedOnboarding'));
const AutoDetectWizard = lazy(() => import('../components/AdvancedOnboarding/AutoDetectWizard'));
const StreakShieldManager = lazy(() => import('../components/AdvancedOnboarding/StreakShieldManager'));

// Carbon & Pipelines
const CarbonReportDashboard = lazy(() => import('../components/CarbonReporting'));
const PipelineBuilder = lazy(() => import('../components/PipelineBuilder'));
const CollaborativeAnalysis = lazy(() => import('../components/CollaborativeAnalysis'));
const AIMarketplace = lazy(() => import('../components/AIMarketplace'));

// Globe
const WeatherGlobe = lazy(() => import('../components/WeatherGlobe'));
const PublicForecastPage = lazy(() => import('../pages/PublicForecastPage'));

// Environmental

export default function weatherRoutes({ isFeatureEnabled = () => false } = {}) {
  return <>
    {/* Weather Hub */}
    <Route path="/weather/home" element={<Navigate to="/" replace />} />
    <Route path="/weather/dashboard" element={<PageWrapper tabType="weather"><WeatherContributorDashboard /></PageWrapper>} />
    <Route path="/weather/onboarding" element={<PageWrapper tabType="weather"><SensorOnboardingWizard /></PageWrapper>} />
    <Route path="/weather/station/:stationId" element={<PageWrapper tabType="weather"><StationReportPage /></PageWrapper>} />

    {/* Proof of Publishing */}
    <Route path="/pop" element={<PageWrapper tabType="pop"><PopDashboard /></PageWrapper>} />
    <Route path="/pop/submit" element={<PageWrapper tabType="pop"><EnhancedEnvironmentalDataForm /></PageWrapper>} />
    <Route path="/fair-launch" element={<PageWrapper tabType="pop"><FairLaunchStatusPage /></PageWrapper>} />

    {/* Data & Climate */}
    <Route path="/data/upload" element={<PageWrapper tabType="weather"><BatchUploadPage /></PageWrapper>} />
    <Route path="/climate/reports" element={<PageWrapper tabType="weather"><ClimateReportDashboard /></PageWrapper>} />
    <Route path="/quality" element={<PageWrapper tabType="weather"><DataQualityDashboard /></PageWrapper>} />
    <Route path="/earnings" element={<PageWrapper tabType="weather"><EarningsDashboard /></PageWrapper>} />
    <Route path="/map" element={<PageWrapper tabType="weather"><EnhancedWeatherMap /></PageWrapper>} />

    {/* Fleet & Forecast */}
    <Route path="/weather/forecast" element={<PageWrapper tabType="weather"><PublicForecastPage /></PageWrapper>} />
    {isFeatureEnabled('fleet') && <Route path="/fleet" element={<PageWrapper tabType="weather"><FleetDashboard /></PageWrapper>} />}
    {FEATURES.forecast && <Route path="/forecast" element={<PageWrapper tabType="weather"><ForecastViewer /></PageWrapper>} />}
    {FEATURES.forecastStudio && <Route path="/forecast/studio" element={<PageWrapper tabType="weather"><ForecastStudio /></PageWrapper>} />}
    <Route path="/weather/forecast-coverage" element={<PageWrapper tabType="weather"><ForecastCoverageDashboardPage /></PageWrapper>} />


    {/* Advanced Onboarding */}
    {FEATURES.advancedOnboarding && <>
      <Route path="/onboarding/qr" element={<PageWrapper tabType="weather"><QRScannerSetup /></PageWrapper>} />
      <Route path="/onboarding/auto-detect" element={<PageWrapper tabType="weather"><AutoDetectWizard /></PageWrapper>} />
      <Route path="/onboarding/streak-shield" element={<PageWrapper tabType="weather"><StreakShieldManager /></PageWrapper>} />
    </>}

    {/* Carbon & Pipelines */}
    {FEATURES.carbonReporting && <Route path="/carbon/reporting" element={<PageWrapper tabType="weather"><CarbonReportDashboard /></PageWrapper>} />}
    {FEATURES.pipelines && <Route path="/pipelines" element={<PageWrapper tabType="weather"><PipelineBuilder /></PageWrapper>} />}
    {FEATURES.collaboration && <Route path="/collaboration" element={<PageWrapper tabType="weather"><CollaborativeAnalysis /></PageWrapper>} />}
    {FEATURES.aiMarketplace && <Route path="/ai-marketplace" element={<PageWrapper tabType="weather"><AIMarketplace /></PageWrapper>} />}

    {/* Globe */}
    {FEATURES.weatherGlobe && <Route path="/globe" element={<PageWrapper tabType="weather"><WeatherGlobe /></PageWrapper>} />}
  </>;
}
