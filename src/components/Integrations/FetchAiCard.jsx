import React, { useState, useEffect } from 'react';
import { WrfModal, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const FetchAiCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [agents, setAgents] = useState([]);
  const [services, setServices] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    capability: 'weather',
    agentType: 'autonomous',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentDetails, setDeploymentDetails] = useState({
    agentId: '',
    resourceAllocation: 'standard',
    networkConfig: 'testnet',
  });

  // Mock data retrieval
  useEffect(() => {
    // Simulate API call to fetch agents
    setTimeout(() => {
      setAgents([
        {
          id: 'agent-wx-001',
          name: 'Weather Forecaster',
          description:
            'Autonomous agent for collecting and analyzing weather data',
          capability: 'weather',
          status: 'active',
          deployedAt: '2025-04-28T12:00:00Z',
          agentType: 'autonomous',
          resourceUsage: {
            computeHours: 24.5,
            dataProcessed: '1.2 GB',
            apiCalls: 1089,
          },
          fee: 0.0025,
        },
        {
          id: 'agent-air-002',
          name: 'Air Quality Monitor',
          description: 'Agent tracking air quality metrics across urban areas',
          capability: 'air-quality',
          status: 'active',
          deployedAt: '2025-05-01T09:30:00Z',
          agentType: 'autonomous',
          resourceUsage: {
            computeHours: 18.3,
            dataProcessed: '0.9 GB',
            apiCalls: 876,
          },
          fee: 0.0018,
        },
        {
          id: 'agent-climate-003',
          name: 'Climate Model Assistant',
          description: 'Agent for optimizing climate simulation parameters',
          capability: 'climate',
          status: 'paused',
          deployedAt: '2025-04-15T15:45:00Z',
          agentType: 'semi-autonomous',
          resourceUsage: {
            computeHours: 42.7,
            dataProcessed: '3.4 GB',
            apiCalls: 453,
          },
          fee: 0.0035,
        },
      ]);

      setServices([
        {
          id: 'service-wx-prediction',
          name: 'Predictive Weather API',
          description: 'Decentralized weather prediction service',
          category: 'data',
          consumers: 48,
          status: 'active',
          tokenEarned: 2.34,
        },
        {
          id: 'service-climate-data',
          name: 'Climate Data Exchange',
          description: 'Service for sharing and validating climate data',
          category: 'marketplace',
          consumers: 31,
          status: 'active',
          tokenEarned: 1.87,
        },
        {
          id: 'service-sensor-network',
          name: 'IoT Sensor Coordinator',
          description: 'Coordination service for decentralized weather sensors',
          category: 'infrastructure',
          consumers: 15,
          status: 'active',
          tokenEarned: 0.95,
        },
      ]);

      setMarketData({
        totalAgents: 1452,
        activeAgents: 1089,
        totalServices: 437,
        dailyTransactions: 28743,
        avgFee: 0.0024,
        tvl: 5283947,
      });

      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateAgent = e => {
    e.preventDefault();
    const newAgentData = {
      id: `agent-${newAgent.capability}-${Math.floor(Math.random() * 1000)}`,
      name: newAgent.name,
      description: newAgent.description,
      capability: newAgent.capability,
      status: 'initializing',
      deployedAt: new Date().toISOString(),
      agentType: newAgent.agentType,
      resourceUsage: {
        computeHours: 0,
        dataProcessed: '0 GB',
        apiCalls: 0,
      },
      fee: 0.002,
    };

    setAgents([...agents, newAgentData]);

    // Reset form
    setNewAgent({
      name: '',
      description: '',
      capability: 'weather',
      agentType: 'autonomous',
    });

    // Simulate agent initialization
    setTimeout(() => {
      setAgents(prev =>
        prev.map(agent =>
          agent.id === newAgentData.id ? { ...agent, status: 'active' } : agent,
        ),
      );
    }, 3000);
  };

  const handleDeployAgent = agentId => {
    setDeploymentDetails({
      ...deploymentDetails,
      agentId,
    });
    setShowDeployModal(true);
  };

  const confirmDeployment = () => {
    // Update agent status to 'deploying'
    setAgents(prev =>
      prev.map(agent =>
        agent.id === deploymentDetails.agentId
          ? { ...agent, status: 'deploying' }
          : agent,
      ),
    );

    setShowDeployModal(false);

    // Simulate deployment completion
    setTimeout(() => {
      setAgents(prev =>
        prev.map(agent =>
          agent.id === deploymentDetails.agentId
            ? { ...agent, status: 'active' }
            : agent,
        ),
      );
    }, 5000);
  };

  const toggleAgentStatus = agentId => {
    setAgents(prev =>
      prev.map(agent => {
        if (agent.id === agentId) {
          const newStatus = agent.status === 'active' ? 'paused' : 'active';
          return { ...agent, status: newStatus };
        }
        return agent;
      }),
    );
  };

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capability.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="integration-card">
      <div className="integration-header">
        <img
          src="https://cryptologos.cc/logos/fetch-ai-fet-logo.png"
          alt="Fetch.ai Logo"
          className="integration-logo"
        />
        <div>
          <h2>Fetch.ai Integration</h2>
          <p>
            Decentralized machine learning and AI agents for climate and weather
            data processing
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="integration-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'agents' ? 'active' : ''}
          onClick={() => setActiveTab('agents')}
        >
          Agents
        </button>
        <button
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button
          className={activeTab === 'market' ? 'active' : ''}
          onClick={() => setActiveTab('market')}
        >
          Marketplace
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Agent
        </button>
      </div>

      {/* Tab Content */}
      <div className="integration-content">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Fetch.ai data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="overview-stats">
                  <div className="stat-card">
                    <h3>Agents</h3>
                    <p className="stat-value">{agents.length}</p>
                    <p className="stat-detail">
                      {agents.filter(a => a.status === 'active').length} active
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Services</h3>
                    <p className="stat-value">{services.length}</p>
                    <p className="stat-detail">
                      Processing weather & climate data
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>FET Earned</h3>
                    <p className="stat-value">
                      {services
                        .reduce((sum, s) => sum + s.tokenEarned, 0)
                        .toFixed(2)}{' '}
                      FET
                    </p>
                    <p className="stat-detail">From all services</p>
                  </div>
                </div>

                <div className="overview-description">
                  <h3>About Fetch.ai Integration</h3>
                  <p>
                    The Fetch.ai integration for Wrfcoin provides autonomous AI
                    agents capable of collecting, analyzing, and trading weather
                    and climate data. These agents can autonomously negotiate
                    and execute transactions related to computational resources
                    and data.
                  </p>

                  <h4>Key Features</h4>
                  <ul>
                    <li>
                      <strong>Autonomous Agents:</strong> Self-operating AI
                      entities that can perform complex tasks without direct
                      supervision
                    </li>
                    <li>
                      <strong>Decentralized Machine Learning:</strong> ML models
                      that can be trained and operated across the network
                    </li>
                    <li>
                      <strong>Weather Data Processing:</strong> Specialized
                      agents for meteorological data analysis
                    </li>
                    <li>
                      <strong>Climate Modeling:</strong> Agents that support and
                      optimize complex climate simulations
                    </li>
                    <li>
                      <strong>Air Quality Monitoring:</strong> Specialized
                      agents for tracking and analyzing air quality metrics
                    </li>
                  </ul>

                  <h4>How Fetch.ai Enhances Wrfcoin</h4>
                  <p>
                    Fetch.ai's autonomous agent technology provides valuable
                    capabilities to Wrfcoin's computational NFT ecosystem. By
                    deploying these agents, Wrfcoin nodes can automatically
                    optimize data collection, validation, and processing
                    workflows for meteorological applications.
                  </p>
                </div>

                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon">
                        <i className="bi bi-arrow-up-circle"></i>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">Agent Deployed</p>
                        <p className="activity-desc">
                          Weather Forecaster agent deployed to network
                        </p>
                        <p className="activity-time">10 minutes ago</p>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">
                        <i className="bi bi-cash-coin"></i>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">Service Revenue</p>
                        <p className="activity-desc">
                          Climate Data Exchange earned 0.25 FET
                        </p>
                        <p className="activity-time">2 hours ago</p>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">
                        <i className="bi bi-graph-up"></i>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">Resource Optimization</p>
                        <p className="activity-desc">
                          Agent optimized compute resources, saving 15%
                        </p>
                        <p className="activity-time">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div className="agents-tab">
                <div className="agents-header">
                  <h3>Deployed Agents</h3>
                  <div className="agents-actions">
                    <div className="search-box">
                      <i className="bi bi-search"></i>
                      <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => setActiveTab('create')}
                    >
                      <i className="bi bi-plus"></i> Create Agent
                    </button>
                  </div>
                </div>

                <div className="agents-list">
                  {filteredAgents.length === 0 ? (
                    <div className="no-results">
                      <i className="bi bi-search"></i>
                      <p>No agents found matching your search.</p>
                    </div>
                  ) : (
                    filteredAgents.map(agent => (
                      <div className="agent-card" key={agent.id}>
                        <div className="agent-header">
                          <h4>{agent.name}</h4>
                          <div className={`status-pill ${agent.status}`}>
                            {agent.status === 'active' && (
                              <i className="bi bi-play-fill"></i>
                            )}
                            {agent.status === 'paused' && (
                              <i className="bi bi-pause-fill"></i>
                            )}
                            {agent.status === 'initializing' && (
                              <i className="bi bi-arrow-clockwise"></i>
                            )}
                            {agent.status === 'deploying' && (
                              <i className="bi bi-arrow-repeat spin"></i>
                            )}
                            {agent.status}
                          </div>
                        </div>
                        <p className="agent-desc">{agent.description}</p>
                        <div className="agent-tags">
                          <span className="tag">{agent.capability}</span>
                          <span className="tag">{agent.agentType}</span>
                        </div>
                        <div className="agent-metrics">
                          <div className="metric">
                            <span className="metric-label">Compute</span>
                            <span className="metric-value">
                              {agent.resourceUsage.computeHours} h
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Data</span>
                            <span className="metric-value">
                              {agent.resourceUsage.dataProcessed}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">API Calls</span>
                            <span className="metric-value">
                              {agent.resourceUsage.apiCalls}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Fee</span>
                            <span className="metric-value">
                              {agent.fee} FET
                            </span>
                          </div>
                        </div>
                        <div className="agent-actions">
                          <button
                            className={`action-button ${agent.status !== 'initializing' && agent.status !== 'deploying' ? '' : 'disabled'}`}
                            onClick={() => toggleAgentStatus(agent.id)}
                            disabled={
                              agent.status === 'initializing' ||
                              agent.status === 'deploying'
                            }
                          >
                            {agent.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button className="action-button">Logs</button>
                          <button className="action-button">Settings</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="services-tab">
                <h3>Available Services</h3>
                <p className="tab-description">
                  Services are decentralized applications powered by Fetch.ai
                  agents that provide specific capabilities to the Wrfcoin
                  ecosystem.
                </p>

                <div className="services-list">
                  {services.map(service => (
                    <div className="service-card" key={service.id}>
                      <div className="service-header">
                        <h4>{service.name}</h4>
                        <div className={`status-pill ${service.status}`}>
                          {service.status}
                        </div>
                      </div>
                      <p className="service-desc">{service.description}</p>
                      <div className="service-metrics">
                        <div className="metric">
                          <span className="metric-label">Category</span>
                          <span className="metric-value">
                            {service.category}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Consumers</span>
                          <span className="metric-value">
                            {service.consumers}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">FET Earned</span>
                          <span className="metric-value">
                            {service.tokenEarned.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="service-actions">
                        <button className="action-button">Connect</button>
                        <button className="action-button">Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace Tab */}
            {activeTab === 'market' && (
              <div className="market-tab">
                <h3>Fetch.ai Marketplace</h3>
                <p className="tab-description">
                  The marketplace enables Wrfcoin nodes to discover, deploy, and
                  monetize Fetch.ai agents and services for weather and climate
                  applications.
                </p>

                <div className="market-stats">
                  <div className="stat-card">
                    <h3>Total Agents</h3>
                    <p className="stat-value">
                      {marketData.totalAgents.toLocaleString()}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Active Agents</h3>
                    <p className="stat-value">
                      {marketData.activeAgents.toLocaleString()}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Services</h3>
                    <p className="stat-value">
                      {marketData.totalServices.toLocaleString()}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Daily Transactions</h3>
                    <p className="stat-value">
                      {marketData.dailyTransactions.toLocaleString()}
                    </p>
                  </div>
                  <div className="stat-card">
                    <h3>Average Fee</h3>
                    <p className="stat-value">{marketData.avgFee} FET</p>
                  </div>
                  <div className="stat-card">
                    <h3>TVL</h3>
                    <p className="stat-value">
                      {marketData.tvl.toLocaleString()} FET
                    </p>
                  </div>
                </div>

                <div className="market-categories">
                  <h3>Featured Categories</h3>
                  <div className="category-cards">
                    <div className="category-card">
                      <div className="category-icon">
                        <i className="bi bi-cloud-sun"></i>
                      </div>
                      <h4>Weather Forecasting</h4>
                      <p>
                        Agents specialized in weather prediction and analysis
                      </p>
                      <span className="agent-count">483 Agents</span>
                    </div>
                    <div className="category-card">
                      <div className="category-icon">
                        <i className="bi bi-globe"></i>
                      </div>
                      <h4>Climate Modeling</h4>
                      <p>
                        Agents for complex climate simulations and scenario
                        analysis
                      </p>
                      <span className="agent-count">295 Agents</span>
                    </div>
                    <div className="category-card">
                      <div className="category-icon">
                        <i className="bi bi-wind"></i>
                      </div>
                      <h4>Air Quality</h4>
                      <p>
                        Agents for monitoring and forecasting air quality
                        metrics
                      </p>
                      <span className="agent-count">178 Agents</span>
                    </div>
                    <div className="category-card">
                      <div className="category-icon">
                        <i className="bi bi-database"></i>
                      </div>
                      <h4>Data Exchange</h4>
                      <p>Marketplace for weather and climate data trading</p>
                      <span className="agent-count">134 Agents</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Agent Tab */}
            {activeTab === 'create' && (
              <div className="create-tab">
                <h3>Create New Agent</h3>
                <p className="tab-description">
                  Deploy a new autonomous agent to collect, process, or analyze
                  weather and climate data.
                </p>

                <form onSubmit={handleCreateAgent} className="create-form">
                  <div className="form-group">
                    <label htmlFor="agent-name">Agent Name</label>
                    <input
                      type="text"
                      id="agent-name"
                      placeholder="Enter agent name"
                      value={newAgent.name}
                      onChange={e =>
                        setNewAgent({ ...newAgent, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="agent-description">Description</label>
                    <textarea
                      id="agent-description"
                      placeholder="Describe what this agent will do"
                      value={newAgent.description}
                      onChange={e =>
                        setNewAgent({
                          ...newAgent,
                          description: e.target.value,
                        })
                      }
                      required
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="agent-capability">Capability</label>
                    <select
                      id="agent-capability"
                      value={newAgent.capability}
                      onChange={e =>
                        setNewAgent({ ...newAgent, capability: e.target.value })
                      }
                    >
                      <option value="weather">Weather Forecasting</option>
                      <option value="climate">Climate Modeling</option>
                      <option value="air-quality">
                        Air Quality Monitoring
                      </option>
                      <option value="data-exchange">Data Exchange</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="agent-type">Agent Type</label>
                    <select
                      id="agent-type"
                      value={newAgent.agentType}
                      onChange={e =>
                        setNewAgent({ ...newAgent, agentType: e.target.value })
                      }
                    >
                      <option value="autonomous">Fully Autonomous</option>
                      <option value="semi-autonomous">Semi-Autonomous</option>
                      <option value="supervised">Supervised</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setActiveTab('agents')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={!newAgent.name || !newAgent.description}
                    >
                      Create Agent
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deployment Modal */}
      <WrfModal
        open={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        title="Deploy Agent"
        actions={
          <>
            <WrfButton variant="outlined" onClick={() => setShowDeployModal(false)}>Cancel</WrfButton>
            <WrfButton variant="contained" onClick={confirmDeployment}>Deploy Agent</WrfButton>
          </>
        }
      >
        <p>Configure deployment settings for your agent:</p>
        <div className="form-group">
          <label>Resource Allocation</label>
          <select
            value={deploymentDetails.resourceAllocation}
            onChange={e =>
              setDeploymentDetails({
                ...deploymentDetails,
                resourceAllocation: e.target.value,
              })
            }
          >
            <option value="minimal">Minimal (1 vCPU, 2GB RAM)</option>
            <option value="standard">Standard (2 vCPU, 4GB RAM)</option>
            <option value="enhanced">Enhanced (4 vCPU, 8GB RAM)</option>
            <option value="performance">Performance (8 vCPU, 16GB RAM)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Network Configuration</label>
          <select
            value={deploymentDetails.networkConfig}
            onChange={e =>
              setDeploymentDetails({
                ...deploymentDetails,
                networkConfig: e.target.value,
              })
            }
          >
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </div>
        <div className="deployment-cost">
          <p>
            Estimated Cost: <strong>0.15 FET / hour</strong>
          </p>
        </div>
      </WrfModal>
    </div>
  );
};

export default FetchAiCard;
