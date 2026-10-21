import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfButton, WrfAlert, WrfDataTable } from '../DesignSystem';

/**
 * WeatherProtocolsCard Component
 *
 * Integration with major weather data standards from WMO, NOAA, and ECMWF.
 * This component provides an interface for accessing and utilizing standardized
 * weather data from major meteorological organizations.
 */
const WeatherProtocolsCard = () => {
  const [status, setStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('wmo');
  const [protocolData, setProtocolData] = useState({
    wmo: {
      datasets: [],
      lastSync: null,
      formats: [],
    },
    noaa: {
      datasets: [],
      lastSync: null,
      formats: [],
    },
    ecmwf: {
      datasets: [],
      lastSync: null,
      formats: [],
    },
  });

  // Mock function to simulate connection to weather protocols
  const connectToProtocols = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.weatherProtocols.connect();

      setTimeout(() => {
        setStatus('connected');
        setProtocolData({
          wmo: {
            datasets: [
              {
                id: 'wmo-1',
                name: 'Global Temperature Data',
                format: 'BUFR',
                size: '6.2GB',
                lastUpdate: '2025-05-14',
              },
              {
                id: 'wmo-2',
                name: 'Precipitation Observations',
                format: 'GRIB2',
                size: '4.8GB',
                lastUpdate: '2025-05-15',
              },
              {
                id: 'wmo-3',
                name: 'Synoptic Surface Observations',
                format: 'BUFR',
                size: '2.1GB',
                lastUpdate: '2025-05-16',
              },
            ],
            lastSync: new Date().toISOString(),
            formats: ['BUFR', 'GRIB2', 'NetCDF', 'CSV'],
          },
          noaa: {
            datasets: [
              {
                id: 'noaa-1',
                name: 'GFS Forecast Model Data',
                format: 'GRIB2',
                size: '12.7GB',
                lastUpdate: '2025-05-15',
              },
              {
                id: 'noaa-2',
                name: 'NEXRAD Radar Observations',
                format: 'NetCDF',
                size: '8.4GB',
                lastUpdate: '2025-05-16',
              },
            ],
            lastSync: new Date().toISOString(),
            formats: ['GRIB2', 'NetCDF', 'HDF5', 'CSV'],
          },
          ecmwf: {
            datasets: [
              {
                id: 'ecmwf-1',
                name: 'IFS Model Output',
                format: 'GRIB',
                size: '18.5GB',
                lastUpdate: '2025-05-15',
              },
              {
                id: 'ecmwf-2',
                name: 'ERA5 Reanalysis Data',
                format: 'GRIB',
                size: '24.3GB',
                lastUpdate: '2025-05-14',
              },
              {
                id: 'ecmwf-3',
                name: 'Seasonal Forecast System',
                format: 'GRIB',
                size: '7.6GB',
                lastUpdate: '2025-05-01',
              },
            ],
            lastSync: new Date().toISOString(),
            formats: ['GRIB', 'GRIB2', 'NetCDF'],
          },
        });
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      setError(`Failed to connect to weather protocols: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate disconnection from weather protocols
  const disconnectFromProtocols = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.weatherProtocols.disconnect();

      setTimeout(() => {
        setStatus('disconnected');
        setProtocolData({
          wmo: {
            datasets: [],
            lastSync: null,
            formats: [],
          },
          noaa: {
            datasets: [],
            lastSync: null,
            formats: [],
          },
          ecmwf: {
            datasets: [],
            lastSync: null,
            formats: [],
          },
        });
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to disconnect from weather protocols: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Mock function to simulate synchronizing with selected protocol
  const syncWithProtocol = async protocol => {
    setIsLoading(true);
    setError(null);

    try {
      // This would be an actual API call in production
      // await api.weatherProtocols.sync(protocol);

      setTimeout(() => {
        setProtocolData({
          ...protocolData,
          [protocol]: {
            ...protocolData[protocol],
            lastSync: new Date().toISOString(),
          },
        });
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError(`Failed to sync with ${protocol.toUpperCase()}: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Format the last sync time
  const formatLastSync = isoString => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <WrfCard headerTitle={
      <span>
        <i className="bi bi-cloud-lightning-rain me-2"></i>
        Weather Data Protocol Integration
      </span>
    } className="mb-4 integration-card" headerAction={
      <WrfBadge color={status === 'connected' ? 'success' : 'default'}>
        {status === 'connected' ? 'Connected' : 'Disconnected'}
      </WrfBadge>
    }>
      {error && <WrfAlert severity="error">{error}</WrfAlert>}

      <p className="mb-3">
        Connect to standard weather data protocols from WMO, NOAA, and ECMWF
        to access standardized meteorological data for climate modeling,
        forecasting, and analysis.
      </p>

      {status === 'connected' ? (
        <>
          <div className="mb-3">
            <div className="protocol-tabs" role="tablist">
              <div
                className={`protocol-tab ${activeTab === 'wmo' ? 'active' : ''}`}
                role="presentation"
              >
                <button
                  className={`protocol-tab-link ${activeTab === 'wmo' ? 'active' : ''}`}
                  onClick={() => setActiveTab('wmo')}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'wmo'}
                >
                  WMO
                </button>
              </div>
              <div
                className={`protocol-tab ${activeTab === 'noaa' ? 'active' : ''}`}
                role="presentation"
              >
                <button
                  className={`protocol-tab-link ${activeTab === 'noaa' ? 'active' : ''}`}
                  onClick={() => setActiveTab('noaa')}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'noaa'}
                >
                  NOAA
                </button>
              </div>
              <div
                className={`protocol-tab ${activeTab === 'ecmwf' ? 'active' : ''}`}
                role="presentation"
              >
                <button
                  className={`protocol-tab-link ${activeTab === 'ecmwf' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ecmwf')}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'ecmwf'}
                >
                  ECMWF
                </button>
              </div>
            </div>

            <div className="tab-content mt-3">
              {/* WMO Tab */}
              <div
                className={`tab-pane fade ${activeTab === 'wmo' ? 'show active' : ''}`}
                role="tabpanel"
              >
                <div className="mb-3">
                  <h5>World Meteorological Organization Data</h5>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <span className="text-muted">Last Sync:</span>{' '}
                      {formatLastSync(protocolData.wmo.lastSync)}
                    </div>
                    <div>
                      <span className="text-muted">Supported Formats:</span>{' '}
                      {protocolData.wmo.formats.join(', ')}
                    </div>
                  </div>
                  <WrfDataTable
                    data={protocolData.wmo.datasets}
                    columns={[
                      { key: 'name', label: 'Dataset Name' },
                      { key: 'format', label: 'Format' },
                      { key: 'size', label: 'Size' },
                      { key: 'lastUpdate', label: 'Last Update' },
                    ]}
                  />
                  <WrfButton
                    variant="outline"
                    size="sm"
                    onClick={() => syncWithProtocol('wmo')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Syncing...
                      </>
                    ) : (
                      'Sync WMO Data'
                    )}
                  </WrfButton>
                </div>
              </div>

              {/* NOAA Tab */}
              <div
                className={`tab-pane fade ${activeTab === 'noaa' ? 'show active' : ''}`}
                role="tabpanel"
              >
                <div className="mb-3">
                  <h5>
                    National Oceanic and Atmospheric Administration Data
                  </h5>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <span className="text-muted">Last Sync:</span>{' '}
                      {formatLastSync(protocolData.noaa.lastSync)}
                    </div>
                    <div>
                      <span className="text-muted">Supported Formats:</span>{' '}
                      {protocolData.noaa.formats.join(', ')}
                    </div>
                  </div>
                  <WrfDataTable
                    data={protocolData.noaa.datasets}
                    columns={[
                      { key: 'name', label: 'Dataset Name' },
                      { key: 'format', label: 'Format' },
                      { key: 'size', label: 'Size' },
                      { key: 'lastUpdate', label: 'Last Update' },
                    ]}
                  />
                  <WrfButton
                    variant="outline"
                    size="sm"
                    onClick={() => syncWithProtocol('noaa')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Syncing...
                      </>
                    ) : (
                      'Sync NOAA Data'
                    )}
                  </WrfButton>
                </div>
              </div>

              {/* ECMWF Tab */}
              <div
                className={`tab-pane fade ${activeTab === 'ecmwf' ? 'show active' : ''}`}
                role="tabpanel"
              >
                <div className="mb-3">
                  <h5>
                    European Centre for Medium-Range Weather Forecasts Data
                  </h5>
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <span className="text-muted">Last Sync:</span>{' '}
                      {formatLastSync(protocolData.ecmwf.lastSync)}
                    </div>
                    <div>
                      <span className="text-muted">Supported Formats:</span>{' '}
                      {protocolData.ecmwf.formats.join(', ')}
                    </div>
                  </div>
                  <WrfDataTable
                    data={protocolData.ecmwf.datasets}
                    columns={[
                      { key: 'name', label: 'Dataset Name' },
                      { key: 'format', label: 'Format' },
                      { key: 'size', label: 'Size' },
                      { key: 'lastUpdate', label: 'Last Update' },
                    ]}
                  />
                  <WrfButton
                    variant="outline"
                    size="sm"
                    onClick={() => syncWithProtocol('ecmwf')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Syncing...
                      </>
                    ) : (
                      'Sync ECMWF Data'
                    )}
                  </WrfButton>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <WrfButton
              variant="outline"
              onClick={disconnectFromProtocols}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </WrfButton>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <div className="mb-3">
            <i className="bi bi-cloud-lightning-rain fs-1"></i>
          </div>
          <p>
            Connect to standardized weather data protocols to access
            meteorological data from major organizations.
          </p>
          <WrfButton
            variant="primary"
            onClick={connectToProtocols}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Connecting...
              </>
            ) : (
              'Connect to Weather Protocols'
            )}
          </WrfButton>
        </div>
      )}
      <div className="text-muted small" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color, #e0e0e0)', paddingTop: '0.75rem' }}>
        <i className="bi bi-info-circle me-1"></i>
        Standardized access to WMO, NOAA and ECMWF weather data formats and
        protocols
      </div>
    </WrfCard>
  );
};

export default WeatherProtocolsCard;
