import React, { useState, useEffect } from 'react';
import PageTitle from '../common/PageTitle';
import { WrfCard, WrfButton, WrfBadge, WrfInput, WrfSelect, WrfAlert, WrfTabs, WrfTabPanel } from '../DesignSystem';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#353: no backend route executes computational NFTs, takes bids,
// sells, or mints from this form. The NFTs, mining stats, executed jobs and
// the "350 WRF reward" notification are samples. The former handlers popped
// "Purchase successful!" and "created and minted successfully!" with nothing
// behind them. The default build shows an honest not-live state; in the demo
// build every action is disabled.
const SAMPLE_ACTION = 'Sample only: nothing is executed, bid on, bought or minted.';

// NFT Card Component
const NFTCard = ({ nft }) => {
  return (
    <WrfCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {nft.image && (
        <div style={{ position: 'relative', height: '200px' }}>
          <img
            src={nft.image}
            alt={nft.name}
            onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-nft.svg'; }}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{nft.name}</div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.54)' }}>
          by {nft.creator}
        </div>
      </div>
      <div style={{ padding: '16px', flex: 1 }}>
        <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {nft.tags.map((tag, index) => (
            <WrfBadge
              key={index}
              label={tag}
              status={
                tag === 'AI Model'
                  ? 'info'
                  : tag === 'Weather Data'
                    ? 'active'
                    : tag === 'Computational'
                      ? 'warning'
                      : 'neutral'
              }
            />
          ))}
        </div>
        <div style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>{nft.description}</div>
        <div style={{ margin: '12px 0' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Compute Requirements:</span>
            <span>{nft.computeRequirements}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Data Size:</span>
            <span>{nft.dataSize}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Duration:</span>
            <span>{nft.duration}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Reward:</span>
            <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
              {nft.reward}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {nft.type === 'executable' && (
          <WrfButton variant="primary" disabled title={SAMPLE_ACTION}>
            Execute
          </WrfButton>
        )}
        {nft.type === 'auction' && (
          <WrfButton variant="secondary" disabled title={SAMPLE_ACTION}>
            Place Bid
          </WrfButton>
        )}
        {nft.type === 'buyNow' && (
          <WrfButton variant="primary" disabled title={SAMPLE_ACTION}>
            Buy Now
          </WrfButton>
        )}
      </div>
    </WrfCard>
  );
};

// Mock Charts for StatCard
const StatCard = ({ title, value, change }) => (
  <WrfCard headerTitle={title}>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '16px 0' }}>
      {value}
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        color: change >= 0 ? '#4caf50' : '#f44336',
        fontSize: '0.875rem',
      }}
    >
      {change >= 0 ? '\u2191' : '\u2193'} {Math.abs(change)}% from last period
    </div>
    <div
      style={{
        height: '40px',
        marginTop: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            change >= 0
              ? 'linear-gradient(to top right, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.3))'
              : 'linear-gradient(to top right, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.3))',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '2px',
            backgroundColor: change >= 0 ? '#4caf50' : '#f44336',
          }}
        ></div>
      </div>
    </div>
  </WrfCard>
);

const ComputationalNFTMarketplaceSample = () => {
  const [tabValue, setTabValue] = useState('browse');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Mock NFT data with focus on mining/computational resources
  const [nfts, setNfts] = useState([
    {
      id: 'nft001',
      name: 'Weather Prediction Model v1.2',
      creator: 'MeteoLab',
      description:
        'Advanced ML model for predicting weather patterns using historical meteorological data.',
      image: 'https://picsum.photos/seed/weather/400/300',
      tags: ['AI Model', 'Weather Data', 'Computational'],
      type: 'executable',
      computeRequirements: 'High (8 cores, 16GB RAM)',
      dataSize: '2.5 GB',
      duration: '~4 hours',
      reward: '150 WRF',
      date: '2025-05-10T10:30:00Z',
      status: 'active',
    },
    {
      id: 'nft002',
      name: 'Hurricane Trajectory Analysis',
      creator: 'ClimateAI',
      description:
        'Computational model analyzing hurricane trajectories from satellite imagery.',
      image: 'https://picsum.photos/seed/hurricane/400/300',
      tags: ['Computational', 'Forecast'],
      type: 'buyNow',
      computeRequirements: 'Medium (4 cores, 8GB RAM)',
      dataSize: '1.1 GB',
      duration: '~2 hours',
      reward: '75 WRF',
      price: '250 WRF',
      date: '2025-05-11T14:20:00Z',
      status: 'active',
    },
    {
      id: 'nft003',
      name: 'Climate Change Impact Simulator',
      creator: 'EcoData',
      description:
        'High-resolution simulation model for climate change impacts on regional weather patterns.',
      image: 'https://picsum.photos/seed/climate/400/300',
      tags: ['Simulation', 'Computational', 'Climate'],
      type: 'auction',
      computeRequirements: 'Very High (16 cores, 32GB RAM, GPU)',
      dataSize: '8.2 GB',
      duration: '~12 hours',
      reward: '350 WRF',
      currentBid: '500 WRF',
      endTime: '2025-05-20T23:59:59Z',
      date: '2025-05-08T11:15:00Z',
      status: 'active',
    },
    {
      id: 'nft004',
      name: 'Air Quality Neural Network',
      creator: 'UrbanAir',
      description:
        'Neural network for air quality prediction in urban environments.',
      image: 'https://picsum.photos/seed/air/400/300',
      tags: ['AI Model', 'Smart City'],
      type: 'executable',
      computeRequirements: 'Medium (4 cores, 8GB RAM)',
      dataSize: '1.8 GB',
      duration: '~3 hours',
      reward: '90 WRF',
      date: '2025-05-15T09:45:00Z',
      status: 'active',
    },
    {
      id: 'nft005',
      name: 'Solar Radiation Forecasting',
      creator: 'SolarTech',
      description:
        'Machine learning model to predict solar radiation levels for renewable energy planning.',
      image: 'https://picsum.photos/seed/solar/400/300',
      tags: ['Renewable Energy', 'Computational'],
      type: 'buyNow',
      computeRequirements: 'Low (2 cores, 4GB RAM)',
      dataSize: '0.7 GB',
      duration: '~1 hour',
      reward: '45 WRF',
      price: '120 WRF',
      date: '2025-05-17T15:30:00Z',
      status: 'active',
    },
    {
      id: 'nft006',
      name: 'Severe Storm Prediction Engine',
      creator: 'StormTrack',
      description:
        'Advanced algorithm for predicting severe storm formation with high accuracy.',
      image: 'https://picsum.photos/seed/storm/400/300',
      tags: ['Weather Data', 'Computational', 'Emergency'],
      type: 'auction',
      computeRequirements: 'High (8 cores, 16GB RAM)',
      dataSize: '3.2 GB',
      duration: '~6 hours',
      reward: '200 WRF',
      currentBid: '650 WRF',
      endTime: '2025-05-25T23:59:59Z',
      date: '2025-05-16T10:00:00Z',
      status: 'active',
    },
  ]);

  // Mock mining stats
  const miningStats = {
    activeJobs: 3,
    completedJobs: 24,
    totalEarned: '2,450 WRF',
    avgComputeTime: '3.2 hours',
    resourceUtilization: '78%',
    successRate: '96%',
  };

  // Mock executed NFTs
  const [myExecutedNfts, setMyExecutedNfts] = useState([
    {
      id: 'exec001',
      name: 'Weather Prediction Model v1.0',
      computeTime: '3.5 hours',
      reward: '120 WRF',
      date: '2025-05-05T14:20:00Z',
      status: 'completed',
    },
    {
      id: 'exec002',
      name: 'Flood Risk Assessment',
      computeTime: '2.1 hours',
      reward: '65 WRF',
      date: '2025-05-10T11:30:00Z',
      status: 'completed',
    },
    {
      id: 'exec003',
      name: 'Wind Pattern Analysis',
      computeTime: '1.8 hours',
      reward: '55 WRF',
      date: '2025-05-15T09:45:00Z',
      status: 'completed',
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif001',
      title: 'New high-reward job available',
      message:
        'A new climate simulation job with 350 WRF reward is now available.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 'notif002',
      title: 'Computation completed',
      message:
        'Your execution of "Wind Pattern Analysis" is complete. You earned 55 WRF.',
      time: '1 day ago',
      read: false,
    },
    {
      id: 'notif003',
      title: 'Resource optimization suggestions',
      message:
        'Based on your mining patterns, we suggest optimizing GPU usage for higher rewards.',
      time: '3 days ago',
      read: true,
    },
  ]);

  const [createNftForm, setCreateNftForm] = useState({
    name: '',
    description: '',
    computeRequirements: 'Medium (4 cores, 8GB RAM)',
    dataSize: '',
    duration: '',
    reward: '',
    tags: [],
  });

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = event => {
    setFilter(event.target.value);
  };

  const handleSortChange = event => {
    setSortBy(event.target.value);
  };

  const handleSearchChange = event => {
    setSearchTerm(event.target.value);
  };

  const handleCreateNftChange = field => event => {
    setCreateNftForm({
      ...createNftForm,
      [field]: event.target.value,
    });
  };

  // Filter and sort NFTs
  const filteredNfts = nfts.filter(nft => {
    if (filter !== 'all' && !nft.tags.includes(filter)) {
      return false;
    }
    if (
      searchTerm &&
      !nft.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !nft.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const sortedNfts = [...filteredNfts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'oldest') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'reward') {
      return parseInt(b.reward) - parseInt(a.reward);
    } else if (sortBy === 'duration') {
      return parseInt(a.duration) - parseInt(b.duration);
    }
    return 0;
  });

  const unreadNotifications = notifications.filter(notif => !notif.read).length;

  const tabItems = [
    { label: 'Browse NFTs', value: 'browse' },
    { label: 'Miner Dashboard', value: 'dashboard' },
    { label: 'Create NFT', value: 'create' },
    { label: 'My Executions', value: 'executions' },
  ];

  return (
    <div>
      <PageTitle
        title="Computational NFT Marketplace"
        subtitle="Create, trade, and execute computational NFTs for weather data processing"
        stats={{
          'Active NFTs': filteredNfts.length,
          'My Executions': myExecutedNfts.length,
          'Success Rate': miningStats.successRate,
          'Total Earned': miningStats.totalEarned,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <WrfButton variant="outline">Notifications</WrfButton>
          {unreadNotifications > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {unreadNotifications}
            </span>
          )}
        </div>
      </div>

      <WrfTabs
        items={tabItems}
        value={tabValue}
        onChange={handleTabChange}
      />

      {tabValue === 'browse' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '20px 0',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ margin: '8px 0' }}>
                <label
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0,0,0,0.54)',
                    marginBottom: '4px',
                    display: 'block',
                  }}
                >
                  Filter By
                </label>
                <WrfSelect
                  value={filter}
                  onChange={handleFilterChange}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'AI Model', label: 'AI Models' },
                    { value: 'Weather Data', label: 'Weather Data' },
                    { value: 'Computational', label: 'Computational' },
                    { value: 'Climate', label: 'Climate Analysis' },
                  ]}
                  sx={{ minWidth: 150 }}
                />
              </div>

              <div style={{ margin: '8px 0' }}>
                <label
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0,0,0,0.54)',
                    marginBottom: '4px',
                    display: 'block',
                  }}
                >
                  Sort By
                </label>
                <WrfSelect
                  value={sortBy}
                  onChange={handleSortChange}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'reward', label: 'Highest Reward' },
                    { value: 'duration', label: 'Shortest Duration' },
                  ]}
                  sx={{ minWidth: 150 }}
                />
              </div>
            </div>

            <WrfInput
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ minWidth: '250px' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            {sortedNfts.map(nft => (
              <div key={nft.id} style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '280px' }}>
                <NFTCard
                  nft={nft}
                />
              </div>
            ))}

            {sortedNfts.length === 0 && (
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '40px 0',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                  No NFTs found matching your criteria
                </div>
                <div style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>
                  Try adjusting your filters or search term
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tabValue === 'dashboard' && (
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '20px 0 10px' }}>
            Miner Performance Dashboard
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '280px' }}>
              <StatCard
                title="Active Jobs"
                value={miningStats.activeJobs}
                change={20}
              />
            </div>
            <div style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '280px' }}>
              <StatCard
                title="Total WRF Earned"
                value={miningStats.totalEarned}
                change={15}
              />
            </div>
            <div style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '280px' }}>
              <StatCard
                title="Resource Utilization"
                value={miningStats.resourceUtilization}
                change={5}
              />
            </div>
          </div>

          <WrfCard headerTitle="Optimization Recommendations" sx={{ margin: '20px 0' }}>
            <div style={{ padding: '16px' }}>
              <WrfAlert severity="info" title="Increase GPU Allocation">
                Your success rate for AI model computation is high. Consider
                allocating more GPU resources for higher rewards.
              </WrfAlert>

              <WrfAlert severity="warning" title="Optimize Network Configuration" sx={{ mt: 1 }}>
                Data transfer is causing delays in your computational tasks.
                Consider optimizing your network configuration.
              </WrfAlert>

              <WrfAlert severity="success" title="Consider Specialized Weather Computation" sx={{ mt: 1 }}>
                Your hardware is well-suited for specialized weather
                computations, which currently have the highest rewards.
              </WrfAlert>
            </div>
          </WrfCard>

          <WrfCard headerTitle="Computational Resources">
            <div style={{ padding: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>CPU Usage</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '200px',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginRight: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '65%',
                          height: '100%',
                          backgroundColor: '#2196f3',
                          borderRadius: '4px',
                        }}
                      ></div>
                    </div>
                    <span>65%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>Memory Usage</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '200px',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginRight: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '82%',
                          height: '100%',
                          backgroundColor: '#ff9800',
                          borderRadius: '4px',
                        }}
                      ></div>
                    </div>
                    <span>82%</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>GPU Usage</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '200px',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginRight: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '93%',
                          height: '100%',
                          backgroundColor: '#f44336',
                          borderRadius: '4px',
                        }}
                      ></div>
                    </div>
                    <span>93%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>Hardware Configuration</div>
                <div
                  style={{
                    margin: '12px 0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <WrfBadge label="CPU: AMD Ryzen 9 5950X" status="info" />
                  <WrfBadge label="RAM: 64GB DDR4" status="info" />
                  <WrfBadge label="GPU: NVIDIA RTX 3090" status="info" />
                  <WrfBadge label="Storage: 2TB NVMe SSD" status="info" />
                  <WrfBadge label="Network: 1Gbps Fiber" status="info" />
                </div>

                <WrfButton
                  variant="outline"
                  sx={{ marginTop: '8px' }}
                >
                  Optimize Resources
                </WrfButton>
              </div>
            </div>
          </WrfCard>

          <WrfCard headerTitle="Upcoming Jobs" sx={{ margin: '20px 0' }}>
            <div style={{ padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      NFT Name
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Start Time
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Est. Duration
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Reward
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 8px' }}>
                      Weather Prediction Model v1.2
                    </td>
                    <td style={{ padding: '12px 8px' }}>In Progress</td>
                    <td style={{ padding: '12px 8px' }}>
                      ~4 hours (38% complete)
                    </td>
                    <td style={{ padding: '12px 8px' }}>150 WRF</td>
                    <td style={{ padding: '12px 8px' }}>
                      <WrfBadge label="In Progress" status="warning" />
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 8px' }}>
                      Air Quality Neural Network
                    </td>
                    <td style={{ padding: '12px 8px' }}>In Progress</td>
                    <td style={{ padding: '12px 8px' }}>
                      ~3 hours (12% complete)
                    </td>
                    <td style={{ padding: '12px 8px' }}>90 WRF</td>
                    <td style={{ padding: '12px 8px' }}>
                      <WrfBadge label="In Progress" status="warning" />
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 8px' }}>
                      Solar Radiation Forecasting
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      Scheduled (2025-05-18 08:00)
                    </td>
                    <td style={{ padding: '12px 8px' }}>~1 hour</td>
                    <td style={{ padding: '12px 8px' }}>45 WRF</td>
                    <td style={{ padding: '12px 8px' }}>
                      <WrfBadge label="Queued" status="info" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </WrfCard>
        </div>
      )}

      {tabValue === 'create' && (
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '20px 0 10px' }}>
            Create Computational NFT
          </div>

          <WrfCard>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <WrfInput
                label="NFT Name"
                placeholder="Enter a name for your computational NFT"
                value={createNftForm.name}
                onChange={handleCreateNftChange('name')}
                sx={{ mb: 2 }}
              />

              <WrfInput
                label="Description"
                placeholder="Describe what your computational model does"
                multiline
                rows={4}
                value={createNftForm.description}
                onChange={handleCreateNftChange('description')}
                sx={{ mb: 2 }}
              />

              <WrfSelect
                label="Compute Requirements"
                value={createNftForm.computeRequirements}
                onChange={handleCreateNftChange('computeRequirements')}
                options={[
                  { value: 'Low (2 cores, 4GB RAM)', label: 'Low (2 cores, 4GB RAM)' },
                  { value: 'Medium (4 cores, 8GB RAM)', label: 'Medium (4 cores, 8GB RAM)' },
                  { value: 'High (8 cores, 16GB RAM)', label: 'High (8 cores, 16GB RAM)' },
                  { value: 'Very High (16 cores, 32GB RAM, GPU)', label: 'Very High (16 cores, 32GB RAM, GPU)' },
                ]}
                sx={{ mb: 2 }}
              />

              <WrfInput
                label="Data Size"
                placeholder="e.g., 2.5 GB"
                value={createNftForm.dataSize}
                onChange={handleCreateNftChange('dataSize')}
                sx={{ mb: 2 }}
              />

              <WrfInput
                label="Estimated Duration"
                placeholder="e.g., ~4 hours"
                value={createNftForm.duration}
                onChange={handleCreateNftChange('duration')}
                sx={{ mb: 2 }}
              />

              <WrfInput
                label="Reward (WRF)"
                placeholder="Enter reward amount in WRF"
                value={createNftForm.reward}
                onChange={handleCreateNftChange('reward')}
                sx={{ mb: 2 }}
              />

              <div style={{ marginTop: '16px' }}>
                <label
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0,0,0,0.54)',
                    marginBottom: '4px',
                    display: 'block',
                  }}
                >
                  Tags (Select all that apply)
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  {['AI Model', 'Weather Data', 'Computational', 'Climate', 'Forecast'].map(tag => (
                    <WrfBadge
                      key={tag}
                      label={tag}
                      status={createNftForm.tags.includes(tag) ? 'info' : 'neutral'}
                      onClick={() => {
                        const tags = createNftForm.tags.includes(tag)
                          ? createNftForm.tags.filter(t => t !== tag)
                          : [...createNftForm.tags, tag];
                        setCreateNftForm({ ...createNftForm, tags });
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <WrfButton
                  variant="primary"
                  disabled
                  title={SAMPLE_ACTION}
                >
                  Create & Mint NFT
                </WrfButton>
              </div>
            </div>
          </WrfCard>
        </div>
      )}

      {tabValue === 'executions' && (
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '20px 0 10px' }}>
            My Executed NFTs
          </div>

          <WrfCard>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      NFT Name
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Compute Time
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Reward
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myExecutedNfts.map(nft => (
                    <tr
                      key={nft.id}
                      style={{ borderBottom: '1px solid #e0e0e0' }}
                    >
                      <td style={{ padding: '12px 8px' }}>{nft.name}</td>
                      <td style={{ padding: '12px 8px' }}>{nft.computeTime}</td>
                      <td style={{ padding: '12px 8px' }}>{nft.reward}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(nft.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <WrfBadge
                          label={nft.status}
                          status={
                            nft.status === 'completed'
                              ? 'active'
                              : nft.status === 'in-progress'
                                ? 'warning'
                                : 'error'
                          }
                        />
                      </td>
                    </tr>
                  ))}

                  {myExecutedNfts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: '24px', textAlign: 'center' }}
                      >
                        <div style={{ fontSize: '1rem', margin: '0.5rem 0' }}>
                          You haven't executed any computational NFTs yet
                        </div>
                        <div
                          style={{ fontSize: '0.875rem', marginTop: '8px' }}
                        >
                          Browse the marketplace to find computational tasks to
                          run
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </WrfCard>

          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <WrfButton
              variant="primary"
              onClick={() => setTabValue('browse')}
            >
              Browse Marketplace
            </WrfButton>
          </div>
        </div>
      )}
    </div>
  );
};

const ComputationalNFTMarketplace = () => (
  <DemoSurfaceGate
    title="The computational NFT marketplace is not live on the testnet"
    description="No testnet endpoint executes, auctions, sells or mints computational NFTs yet."
    testId="nft-marketplace"
  >
    <ComputationalNFTMarketplaceSample />
  </DemoSurfaceGate>
);

export default ComputationalNFTMarketplace;
