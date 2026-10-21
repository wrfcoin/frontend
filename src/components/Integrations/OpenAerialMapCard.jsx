import { useState, useEffect } from 'react';
import '../Integrations/IntegrationCards.css';

const OpenAerialMapCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [oamStatus, setOamStatus] = useState({
    status: 'connected',
    availableImages: 0,
    datasetCount: 0,
    providersCount: 0,
    totalCoverage: 0,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchParams, setSearchParams] = useState({
    location: '',
    dateFrom: '',
    dateTo: '',
    provider: 'all',
    resolution: 'all',
    sensor: 'all',
  });

  useEffect(() => {
    // Initialize with mock data
    fetchOamStatus();
    loadSampleImageryData();
  }, []);

  const fetchOamStatus = () => {
    setIsRefreshing(true);

    // Simulate API call to OpenAerialMap
    setTimeout(() => {
      setOamStatus({
        status: 'connected',
        availableImages: Math.floor(Math.random() * 500) + 2000,
        datasetCount: Math.floor(Math.random() * 20) + 80,
        providersCount: Math.floor(Math.random() * 5) + 15,
        totalCoverage: Math.floor(Math.random() * 500000) + 1000000,
      });
      setIsRefreshing(false);
    }, 1000);
  };

  const loadSampleImageryData = () => {
    // Simulate loading imagery data from OAM API
    const mockResults = [
      {
        id: 'oam-satellite-20250423-001',
        title: 'Northern Pacific Weather Pattern Satellite Imagery',
        provider: 'NASA Earth Observatory',
        acquisition_date: '2025-04-23',
        sensor_type: 'Satellite',
        resolution: '10m',
        coverage_km2: 125000,
        preview_url:
          'https://eoimages.gsfc.nasa.gov/images/imagerecords/150000/150216/globalanomalies_gis_2023_lrg.jpg',
        license: 'CC-BY-4.0',
        weather_related: true,
      },
      {
        id: 'oam-uav-20250510-002',
        title: 'Coastal Storm Damage Assessment',
        provider: 'HOTOSM',
        acquisition_date: '2025-05-10',
        sensor_type: 'UAV/Drone',
        resolution: '0.05m',
        coverage_km2: 28,
        preview_url:
          'https://api.planet.com/basemaps/v1/mosaics/70cf33f0-e1d4-4826-bf5b-9486d1613127/thumbs/560',
        license: 'CC-BY-4.0',
        weather_related: true,
      },
      {
        id: 'oam-aerial-20250501-003',
        title: 'Urban Heat Island Thermal Mapping',
        provider: 'OpenAerialMap Contributors',
        acquisition_date: '2025-05-01',
        sensor_type: 'Aerial - Thermal',
        resolution: '0.3m',
        coverage_km2: 45,
        preview_url:
          'https://iserv.jsc.nasa.gov/wp-content/uploads/sites/116/2019/09/ISS047E009282.jpg',
        license: 'CC0',
        weather_related: true,
      },
      {
        id: 'oam-satellite-20250415-004',
        title: 'Hurricane Path Prediction Overlay',
        provider: 'NOAA',
        acquisition_date: '2025-04-15',
        sensor_type: 'Satellite - Multispectral',
        resolution: '5m',
        coverage_km2: 98000,
        preview_url:
          'https://static.scientificamerican.com/blogs/cache/file/D8142958-3D49-454B-A033C0952A741D7D_source.jpg',
        license: 'CC-BY-4.0',
        weather_related: true,
      },
      {
        id: 'oam-uav-20250508-005',
        title: 'Flood Risk Zone Mapping',
        provider: 'Disaster Tech Coalition',
        acquisition_date: '2025-05-08',
        sensor_type: 'UAV/Drone',
        resolution: '0.1m',
        coverage_km2: 18,
        preview_url:
          'https://global.jaxa.jp/projects/sat/gcom_c/img/gcom_c_main_001.jpg',
        license: 'CC-BY-SA-4.0',
        weather_related: true,
      },
    ];

    setSearchResults(mockResults);
  };

  const handleRefresh = () => {
    fetchOamStatus();
    loadSampleImageryData();
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    // In a real implementation, this would search the OAM API
    setIsRefreshing(true);

    setTimeout(() => {
      // Filter existing results based on search parameters
      // In a real implementation, this would be a server request
      loadSampleImageryData();
      setIsRefreshing(false);
    }, 1500);
  };

  const handleSearchParamChange = (param, value) => {
    setSearchParams({
      ...searchParams,
      [param]: value,
    });
  };

  const handleCreateNFT = imageData => {
    // In a real implementation, this would initiate the process of creating an NFT from the imagery
    alert(
      `Creating Computational NFT from imagery: ${imageData.title}. This would use the image data as input for weather/climate computational models.`,
    );
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          OpenAerialMap (OAM) is the largest public repository of openly
          licensed high-resolution satellite and drone imagery, fostering a
          community dedicated to improving access to critical geospatial data.
          Integration with Wrfcoin enables computational analysis of weather and
          climate patterns using this imagery.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="fas fa-image"></i>
          <div className="stat-info">
            <span className="stat-value">
              {oamStatus.availableImages.toLocaleString()}
            </span>
            <span className="stat-label">Available Images</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-database"></i>
          <div className="stat-info">
            <span className="stat-value">{oamStatus.datasetCount}</span>
            <span className="stat-label">Datasets</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-user-friends"></i>
          <div className="stat-info">
            <span className="stat-value">{oamStatus.providersCount}</span>
            <span className="stat-label">Providers</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-globe-americas"></i>
          <div className="stat-info">
            <span className="stat-value">
              {(oamStatus.totalCoverage / 1000000).toFixed(2)}M km²
            </span>
            <span className="stat-label">Coverage Area</span>
          </div>
        </div>
      </div>

      <div className="protocol-info">
        <h4>
          <i className="fas fa-info-circle"></i> OpenAerialMap Features
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Satellite Imagery</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">Drone Imagery</span>
            <span className="info-value">Supported</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tiling Services</span>
            <span className="info-value">Available</span>
          </div>
          <div className="info-item">
            <span className="info-label">API Access</span>
            <span className="info-value">REST API</span>
          </div>
          <div className="info-item">
            <span className="info-label">Licensing</span>
            <span className="info-value">Open Licenses</span>
          </div>
          <div className="info-item">
            <span className="info-label">Weather Data</span>
            <span className="info-value">Compatible</span>
          </div>
        </div>
      </div>

      <div className="integration-note">
        <h4>
          <i className="fas fa-lightbulb"></i> Wrfcoin Integration Benefits
        </h4>
        <p>
          The OpenAerialMap integration enables Wrfcoin to access and analyze
          high-resolution satellite and drone imagery for weather pattern
          recognition, climate modeling, and creation of computational NFTs
          backed by geospatial data. This integration strengthens Wrfcoin's
          weather forecasting and environmental monitoring capabilities.
        </p>
      </div>
    </div>
  );

  const renderBrowseTab = () => (
    <div className="integration-card-content">
      <div className="browser-header">
        <h4>
          <i className="fas fa-search"></i> Search Imagery
        </h4>
        <div className="browser-actions">
          <WrfButton
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={handleRefresh}
          >
            <i
              className={`fas fa-sync-alt ${isRefreshing ? 'spinning' : ''}`}
            ></i>{' '}
            Refresh
          </WrfButton>
        </div>
      </div>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <div className="search-row">
          <div className="form-group">
            <label>Location</label>
            <WrfInput
              placeholder="e.g., San Francisco"
              value={searchParams.location}
              onChange={e =>
                handleSearchParamChange('location', e.target.value)
              }
            />
          </div>
          <div className="form-group">
            <label>Date Range</label>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="date-inputs">
              <WrfInput
                type="date"
                value={searchParams.dateFrom}
                onChange={e =>
                  handleSearchParamChange('dateFrom', e.target.value)
                }
              />
              <span>to</span>
              <WrfInput
                type="date"
                value={searchParams.dateTo}
                onChange={e =>
                  handleSearchParamChange('dateTo', e.target.value)
                }
              />
            </Box>
          </div>
        </div>

        <div className="search-row">
          <div className="form-group">
            <label>Provider</label>
            <WrfSelect
              value={searchParams.provider}
              onChange={e =>
                handleSearchParamChange('provider', e.target.value)
              }
              options={[
                { value: 'all', label: 'All Providers' },
                { value: 'nasa', label: 'NASA' },
                { value: 'noaa', label: 'NOAA' },
                { value: 'hotosm', label: 'HOTOSM' },
                { value: 'planet', label: 'Planet' },
                { value: 'other', label: 'Other Contributors' },
              ]}
            />
          </div>
          <div className="form-group">
            <label>Resolution</label>
            <WrfSelect
              value={searchParams.resolution}
              onChange={e =>
                handleSearchParamChange('resolution', e.target.value)
              }
              options={[
                { value: 'all', label: 'All Resolutions' },
                { value: 'high', label: 'High (< 1m)' },
                { value: 'medium', label: 'Medium (1-10m)' },
                { value: 'low', label: 'Low (> 10m)' },
              ]}
            />
          </div>
          <div className="form-group">
            <label>Sensor Type</label>
            <WrfSelect
              value={searchParams.sensor}
              onChange={e => handleSearchParamChange('sensor', e.target.value)}
              options={[
                { value: 'all', label: 'All Sensors' },
                { value: 'satellite', label: 'Satellite' },
                { value: 'drone', label: 'UAV/Drone' },
                { value: 'aerial', label: 'Aerial' },
                { value: 'thermal', label: 'Thermal' },
                { value: 'multispectral', label: 'Multispectral' },
              ]}
            />
          </div>
        </div>

        <div className="search-actions">
          <WrfButton
            type="submit"
            variant="primary"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}{' '}
            Search
          </WrfButton>
        </div>
      </form>

      <div className="search-results">
        <h4>Available Imagery</h4>
        <div className="results-list">
          {searchResults.map(image => (
            <div key={image.id} className="result-item">
              <div className="result-preview">
                <img src={image.preview_url} alt={image.title} />
              </div>
              <div className="result-info">
                <h5>{image.title}</h5>
                <div className="result-meta">
                  <span>
                    <i className="fas fa-calendar-alt"></i>{' '}
                    {image.acquisition_date}
                  </span>
                  <span>
                    <i className="fas fa-camera"></i> {image.sensor_type}
                  </span>
                  <span>
                    <i className="fas fa-ruler"></i> {image.resolution}
                  </span>
                  <span>
                    <i className="fas fa-globe"></i>{' '}
                    {image.coverage_km2.toLocaleString()} km²
                  </span>
                </div>
                <p className="result-provider">
                  <i className="fas fa-user"></i> Provider: {image.provider}
                </p>
                <Box sx={{ display: 'flex', gap: 1 }} className="result-actions">
                  <WrfButton variant="outline" size="sm">
                    <i className="fas fa-eye"></i> View
                  </WrfButton>
                  <WrfButton variant="secondary" size="sm">
                    <i className="fas fa-download"></i> Download
                  </WrfButton>
                  <WrfButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateNFT(image)}
                  >
                    <i className="fas fa-cube"></i> Create NFT
                  </WrfButton>
                </Box>
              </div>
            </div>
          ))}
        </div>

        {searchResults.length === 0 && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>
              No imagery found matching your criteria. Try adjusting your search
              parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUploadTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-upload"></i> Upload Aerial Imagery
      </h4>
      <p>
        Contribute your own aerial imagery to OpenAerialMap and Wrfcoin's
        computational network.
      </p>

      <form>
        <div className="form-group">
          <label>Title</label>
          <WrfInput
            placeholder="e.g., Coastal Storm Front Imagery - Oregon"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <WrfInput
            multiline
            minRows={3}
            placeholder="Describe the imagery, including location, weather conditions, and relevant details"
          />
        </div>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="form-group">
              <label>Acquisition Date</label>
              <WrfInput type="date" />
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="form-group">
              <label>Sensor Type</label>
              <WrfSelect
                options={[
                  { value: 'satellite', label: 'Satellite' },
                  { value: 'uav', label: 'UAV/Drone' },
                  { value: 'aerial', label: 'Aerial' },
                  { value: 'thermal', label: 'Thermal' },
                  { value: 'multispectral', label: 'Multispectral' },
                ]}
                defaultValue="satellite"
              />
            </div>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="form-group">
              <label>Resolution (m/pixel)</label>
              <WrfInput
                type="number"
                slotProps={{ htmlInput: { step: 0.01 } }}
                placeholder="e.g., 0.5"
              />
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="form-group">
              <label>License</label>
              <WrfSelect
                options={[
                  { value: 'CC-BY-4.0', label: 'CC-BY-4.0' },
                  { value: 'CC-BY-SA-4.0', label: 'CC-BY-SA-4.0' },
                  { value: 'CC0', label: 'CC0' },
                  { value: 'public-domain', label: 'Public Domain' },
                ]}
                defaultValue="CC-BY-4.0"
              />
            </div>
          </Grid>
        </Grid>

        <div className="form-group">
          <label>Weather Related?</label>
          <Box
            sx={{ display: 'flex', alignItems: 'center', mt: '5px' }}
          >
            <input
              type="checkbox"
              id="weatherRelated"
              style={{ marginRight: '10px' }}
              defaultChecked
            />
            <label htmlFor="weatherRelated" style={{ margin: 0 }}>
              This imagery is related to weather phenomena or useful for climate
              modeling
            </label>
          </Box>
        </div>

        <div className="form-group">
          <label>Upload Method</label>
          <WrfSelect
            options={[
              { value: 'direct', label: 'Direct Upload' },
              { value: 'cloud', label: 'Cloud Storage URL' },
              { value: 'api', label: 'API Integration' },
            ]}
            defaultValue="direct"
          />
        </div>

        <div className="form-group">
          <label>Upload Files</label>
          <div className="file-upload-area">
            <i className="fas fa-cloud-upload-alt"></i>
            <p>Drag and drop GeoTIFF files here, or click to browse</p>
            <input type="file" multiple />
          </div>
        </div>

        <div className="form-group">
          <label>Storage Options</label>
          <Box sx={{ display: 'flex', gap: '10px', mt: '5px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="storeOAM"
                style={{ marginRight: '5px' }}
                defaultChecked
              />
              <label htmlFor="storeOAM" style={{ margin: 0 }}>
                Store in OAM
              </label>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="storeIPFS"
                style={{ marginRight: '5px' }}
                defaultChecked
              />
              <label htmlFor="storeIPFS" style={{ margin: 0 }}>
                Store in IPFS
              </label>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="storeArweave"
                style={{ marginRight: '5px' }}
              />
              <label htmlFor="storeArweave" style={{ margin: 0 }}>
                Store in Arweave
              </label>
            </Box>
          </Box>
        </div>

        <div className="form-actions">
          <WrfButton type="submit" variant="primary">
            <i className="fas fa-upload"></i> Upload & Process
          </WrfButton>
        </div>
      </form>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-chart-bar"></i> Computational Analysis
      </h4>
      <p>
        Run computational weather analysis on OpenAerialMap imagery using
        Wrfcoin's network.
      </p>

      <div className="analysis-options">
        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-wind"></i>
          </div>
          <h5>Weather Pattern Recognition</h5>
          <p>
            Analyze aerial imagery for weather patterns like fronts, cyclones,
            and storm formations.
          </p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>

        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-temperature-high"></i>
          </div>
          <h5>Urban Heat Island Detection</h5>
          <p>
            Identify and map urban heat islands for climate impact assessment.
          </p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>

        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-water"></i>
          </div>
          <h5>Flood Risk Modeling</h5>
          <p>Create flood risk models from terrain and weather data.</p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>

        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-cloud-showers-heavy"></i>
          </div>
          <h5>Precipitation Analysis</h5>
          <p>
            Extract precipitation patterns and forecast models from imagery.
          </p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>

        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-snowflake"></i>
          </div>
          <h5>Snow Cover Assessment</h5>
          <p>Measure snow cover and depth for hydrological modeling.</p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>

        <div className="analysis-option-card">
          <div className="option-icon">
            <i className="fas fa-fire"></i>
          </div>
          <h5>Wildfire Risk Assessment</h5>
          <p>
            Evaluate wildfire risk based on vegetation, climate, and terrain.
          </p>
          <WrfButton variant="outline" size="sm">
            Start Analysis
          </WrfButton>
        </div>
      </div>

      <div className="analysis-custom">
        <h4>Custom Analysis Pipeline</h4>
        <p>
          Create a custom analysis workflow using Wrfcoin's computational
          blocks.
        </p>

        <div className="pipeline-builder">
          <div className="pipeline-steps">
            <div className="pipeline-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h6>Data Source</h6>
                <WrfSelect
                  options={[
                    { value: 'oam-satellite', label: 'OAM Satellite Imagery' },
                    { value: 'oam-drone', label: 'OAM Drone Imagery' },
                    { value: 'noaa', label: 'NOAA Weather Data' },
                    { value: 'custom', label: 'Custom Upload' },
                  ]}
                  defaultValue="oam-satellite"
                />
              </div>
            </div>

            <div className="pipeline-connector">
              <i className="fas fa-arrow-down"></i>
            </div>

            <div className="pipeline-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h6>Pre-processing</h6>
                <WrfSelect
                  options={[
                    { value: 'calibration', label: 'Image Calibration' },
                    { value: 'atmospheric', label: 'Atmospheric Correction' },
                    { value: 'enhancement', label: 'Image Enhancement' },
                    { value: 'skip', label: 'Skip Pre-processing' },
                  ]}
                  defaultValue="calibration"
                />
              </div>
            </div>

            <div className="pipeline-connector">
              <i className="fas fa-arrow-down"></i>
            </div>

            <div className="pipeline-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h6>Analysis Model</h6>
                <WrfSelect
                  options={[
                    { value: 'weather-pattern', label: 'Weather Pattern Recognition' },
                    { value: 'heat-map', label: 'Heat Map Generation' },
                    { value: 'flood-risk', label: 'Flood Risk Assessment' },
                    { value: 'custom-ml', label: 'Custom ML Model' },
                  ]}
                  defaultValue="weather-pattern"
                />
              </div>
            </div>

            <div className="pipeline-connector">
              <i className="fas fa-arrow-down"></i>
            </div>

            <div className="pipeline-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h6>Output Format</h6>
                <WrfSelect
                  options={[
                    { value: 'nft', label: 'Computational NFT' },
                    { value: 'dashboard', label: 'Interactive Dashboard' },
                    { value: 'export', label: 'Data Export (CSV/JSON)' },
                    { value: 'report', label: 'Scientific Report' },
                  ]}
                  defaultValue="nft"
                />
              </div>
            </div>
          </div>

          <div className="pipeline-actions">
            <WrfButton variant="primary">
              <i className="fas fa-play"></i> Run Pipeline
            </WrfButton>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="integration-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="fas fa-satellite"></i>
        </div>
        <div className="integration-title">
          <h3>OpenAerialMap</h3>
          <p>Open aerial imagery for weather and climate analysis</p>
        </div>
        <div className="integration-status">
          <span className={`status-badge ${oamStatus.status}`}>
            {oamStatus.status === 'connected'
              ? 'Connected'
              : oamStatus.status === 'testnet'
                ? 'Testnet'
                : 'Disconnected'}
          </span>
          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="integration-card-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i> Overview
        </div>
        <div
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <i className="fas fa-search"></i> Browse
        </div>
        <div
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fas fa-upload"></i> Upload
        </div>
        <div
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <i className="fas fa-chart-bar"></i> Analysis
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'browse' && renderBrowseTab()}
      {activeTab === 'upload' && renderUploadTab()}
      {activeTab === 'analysis' && renderAnalysisTab()}

      <div className="integration-card-footer">
        <span>OpenAerialMap Integration • Powered by Wrfcoin</span>
      </div>
    </div>
  );
};

export default OpenAerialMapCard;
