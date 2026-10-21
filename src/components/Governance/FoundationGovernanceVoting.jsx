import React, { useState, useEffect } from 'react';
import { WrfModal, WrfButton } from '../DesignSystem';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import './FoundationGovernanceVoting.css';

// frontend#356: there is no backend concept of "foundation proposals",
// climate oracles or foundation actions. Everything this tab shows is a sample
// (hard-coded proposals, delegates and amounts). The default build shows an
// honest not-live state. Even in the demo build nothing can be voted on or
// submitted: the former handlers waited a second and pretended to succeed.
const SAMPLE_ACTION_NOTE = 'Sample only: votes and proposals are not submitted anywhere.';

const FoundationGovernanceSample = () => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [loading, setLoading] = useState({
    proposals: true,
    voting: false,
    creating: false,
  });

  const [governanceStatus, setGovernanceStatus] = useState({
    foundationVetoActive: true,
    daysUntilDecentralization: 3652,
    yearsRemaining: 10,
    monthsRemaining: 0,
    currentPhase: 'PHASE_1_CENTRALIZED',
    nextPhase: 'PHASE_2_ADVISORY_DAO',
    phaseProgress: 0.0,
    daysUntilNextPhase: 730,
    governanceMetrics: {
      totalProposals: 0,
      activeProposals: 0,
      proposalsVetoed: 0,
      activeClimateOracles: 4,
      daoParticipationLevel: 'ADVISORY',
      foundationVetoScope: 'FULL',
    },
  });

  const [proposals, setProposals] = useState([]);
  const [climateOracles, setClimateOracles] = useState([]);
  const [foundationActions, setFoundationActions] = useState([]);
  const [actionFilter, setActionFilter] = useState('');

  const [newProposal, setNewProposal] = useState({
    title: '',
    category: 'GENERAL',
    description: '',
    climateDataHash: '',
  });

  // Load governance data
  const loadGovernanceData = async () => {
    try {
      setLoading(prev => ({ ...prev, proposals: true }));

      // Calculate current phase based on days remaining
      const totalDays = 3652; // 10 years
      const daysRemaining = 3652; // Current days remaining
      const phaseData = calculateGovernancePhase(daysRemaining, totalDays);

      setGovernanceStatus({
        foundationVetoActive: phaseData.foundationVetoActive,
        daysUntilDecentralization: daysRemaining,
        yearsRemaining: Math.floor(daysRemaining / 365),
        monthsRemaining: Math.floor((daysRemaining % 365) / 30),
        currentPhase: phaseData.currentPhase,
        nextPhase: phaseData.nextPhase,
        phaseProgress: phaseData.phaseProgress,
        daysUntilNextPhase: phaseData.daysUntilNextPhase,
        governanceMetrics: {
          totalProposals: 12,
          activeProposals: 3,
          proposalsVetoed: 2,
          activeClimateOracles: 4,
          daoParticipationLevel: phaseData.daoParticipationLevel,
          foundationVetoScope: phaseData.foundationVetoScope,
        },
      });

      // Sample proposals data
      setProposals([
        {
          id: 1,
          proposalId: 'WRF-001',
          title: 'Implement Enhanced Climate Data Validation',
          description:
            'Proposal to strengthen climate data validation protocols and add new weather station integrations.',
          category: 'CLIMATE_DATA',
          vetoed: false,
          votingEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          totalVotesFor: 15420000,
          totalVotesAgainst: 3280000,
          climateDataHash: '0x7b2f8e9c4d1a6b5e3f9c8e2d4a7b9f1e5c8d3a6b',
        },
        {
          id: 2,
          proposalId: 'WRF-002',
          title: 'Treasury Allocation for Cross-Chain Infrastructure',
          description:
            'Allocate 500,000 WRF tokens for expanding cross-chain bridge capabilities.',
          category: 'TREASURY',
          vetoed: true,
          vetoReason: 'Insufficient technical specifications provided',
          vetoTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          votingEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          totalVotesFor: 8900000,
          totalVotesAgainst: 12100000,
        },
      ]);

      // Sample climate oracles
      setClimateOracles([
        {
          id: 1,
          oracleAddress: '0xClimate1000000000000000000000000',
          oracleName: 'NOAA Weather Data Oracle',
          organization: 'National Oceanic and Atmospheric Administration',
          active: true,
          dataQualityScore: 0.96,
          totalProposalsSubmitted: 45,
          lastProposalDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          oracleAddress: '0xClimate2000000000000000000000000',
          oracleName: 'ESA Climate Data Oracle',
          organization: 'European Space Agency',
          active: true,
          dataQualityScore: 0.94,
          totalProposalsSubmitted: 38,
          lastProposalDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ]);

      // Sample foundation actions
      setFoundationActions([
        {
          id: 1,
          actionType: 'PROPOSAL_VETOED',
          proposalId: 'WRF-002',
          foundationAddress: '0x1234567890123456789012345678901234567890',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          actionData: {
            reason: 'Insufficient technical specifications provided',
          },
        },
        {
          id: 2,
          actionType: 'ORACLE_AUTHORIZED',
          foundationAddress: '0x1234567890123456789012345678901234567890',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          actionData: { oracleName: 'ESA Climate Data Oracle' },
        },
      ]);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(prev => ({ ...prev, proposals: false }));
    }
  };

  useEffect(() => {
    loadGovernanceData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadGovernanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate governance phase based on stepwise decentralization strategy
  const calculateGovernancePhase = (daysRemaining, totalDays) => {
    const phaseDefinitions = [
      {
        name: 'PHASE_1_CENTRALIZED',
        displayName: 'Centralized Oversight',
        description: 'Foundation retains full veto power',
        yearRange: '0-2',
        startDay: totalDays,
        endDay: totalDays - 2 * 365, // Years 0-2
        daoParticipationLevel: 'NONE',
        foundationVetoScope: 'FULL',
        foundationVetoActive: true,
      },
      {
        name: 'PHASE_2_ADVISORY_DAO',
        displayName: 'Advisory DAO Participation',
        description: 'Token-holder voting with advisory capacity',
        yearRange: '2-3',
        startDay: totalDays - 2 * 365,
        endDay: totalDays - 3 * 365, // Years 2-3
        daoParticipationLevel: 'ADVISORY',
        foundationVetoScope: 'FULL',
        foundationVetoActive: true,
      },
      {
        name: 'PHASE_3_SHARED_GOVERNANCE',
        displayName: 'Shared Governance',
        description: 'Foundation veto with justification and consultation',
        yearRange: '6-7',
        startDay: totalDays - 6 * 365,
        endDay: totalDays - 7 * 365, // Years 6-7
        daoParticipationLevel: 'INFLUENCER',
        foundationVetoScope: 'JUSTIFIED',
        foundationVetoActive: true,
      },
      {
        name: 'PHASE_4_DAO_LED',
        displayName: 'DAO-Led Governance',
        description: 'Limited Foundation veto on security matters only',
        yearRange: '8-9',
        startDay: totalDays - 8 * 365,
        endDay: totalDays - 9 * 365, // Years 8-9
        daoParticipationLevel: 'PRIMARY',
        foundationVetoScope: 'SECURITY_ONLY',
        foundationVetoActive: true,
      },
      {
        name: 'PHASE_5_FULL_DECENTRALIZATION',
        displayName: 'Full Decentralization',
        description: 'Complete DAO control, no Foundation veto',
        yearRange: '10+',
        startDay: totalDays - 10 * 365,
        endDay: 0, // Year 10 onwards
        daoParticipationLevel: 'COMPLETE',
        foundationVetoScope: 'NONE',
        foundationVetoActive: false,
      },
    ];

    // Find current phase
    let currentPhaseIndex = 0;
    for (let i = 0; i < phaseDefinitions.length; i++) {
      const phase = phaseDefinitions[i];
      if (daysRemaining <= phase.startDay && daysRemaining > phase.endDay) {
        currentPhaseIndex = i;
        break;
      }
    }

    const currentPhase = phaseDefinitions[currentPhaseIndex];
    const nextPhase = phaseDefinitions[currentPhaseIndex + 1] || null;

    // Calculate progress within current phase
    const phaseDuration = currentPhase.startDay - currentPhase.endDay;
    const phaseElapsed = currentPhase.startDay - daysRemaining;
    const phaseProgress =
      phaseDuration > 0 ? (phaseElapsed / phaseDuration) * 100 : 100;

    // Calculate days until next phase
    const daysUntilNextPhase = nextPhase
      ? daysRemaining - nextPhase.startDay
      : 0;

    return {
      currentPhase: currentPhase.name,
      currentPhaseDisplay: currentPhase.displayName,
      currentPhaseDescription: currentPhase.description,
      currentPhaseYears: currentPhase.yearRange,
      nextPhase: nextPhase ? nextPhase.name : 'COMPLETE',
      nextPhaseDisplay: nextPhase
        ? nextPhase.displayName
        : 'Governance Complete',
      phaseProgress: Math.max(0, Math.min(100, phaseProgress)),
      daysUntilNextPhase: Math.max(0, daysUntilNextPhase),
      daoParticipationLevel: currentPhase.daoParticipationLevel,
      foundationVetoScope: currentPhase.foundationVetoScope,
      foundationVetoActive: currentPhase.foundationVetoActive,
      allPhases: phaseDefinitions,
    };
  };

  // Utility functions
  const formatTimeRemaining = endTime => {
    const remaining = endTime - new Date();
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    return days > 0 ? `${days} days left` : 'Voting ended';
  };

  const formatDate = timestamp => {
    return timestamp.toLocaleDateString();
  };

  const formatVotes = votes => {
    return (votes / 1000000).toFixed(2) + 'M';
  };

  const getVotePercentage = (proposal, type) => {
    const total = proposal.totalVotesFor + proposal.totalVotesAgainst;
    if (total === 0) return 0;
    const votes =
      type === 'for' ? proposal.totalVotesFor : proposal.totalVotesAgainst;
    return (votes / total) * 100;
  };

  const canVote = proposal => {
    return new Date(proposal.votingEnd) > new Date() && !proposal.vetoed;
  };

  const submitProposal = e => {
    e.preventDefault();
  };

  const getActionIcon = actionType => {
    const icons = {
      PROPOSAL_VETOED: '🚫',
      PROPOSAL_CREATED: '📝',
      ORACLE_AUTHORIZED: '👤',
      TRANSITION_WARNING: '⚠️',
      DECENTRALIZATION_TRANSITION: '✅',
    };
    return icons[actionType] || 'ℹ️';
  };

  const formatActionType = actionType => {
    return actionType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const tabs = [
    {
      id: 'proposals',
      label: 'Proposals',
      icon: '📄',
      count: governanceStatus.governanceMetrics?.activeProposals,
    },
    {
      id: 'oracles',
      label: 'Climate Oracles',
      icon: '☁️',
      count: governanceStatus.governanceMetrics?.activeClimateOracles,
    },
    { id: 'actions', label: 'Foundation Actions', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const filteredActions = actionFilter
    ? foundationActions.filter(action => action.actionType === actionFilter)
    : foundationActions;

  return (
    <div className="foundation-governance">
      {/* Governance Status Header */}
      <div className="governance-header">
        <div className="status-card">
          <div className="foundation-badge">
            <span className="icon">🏛️</span>
            {governanceStatus.foundationVetoActive ? (
              <span>Wrfcoin Foundation Period</span>
            ) : (
              <span className="decentralized">Fully Decentralized DAO</span>
            )}
          </div>

          {governanceStatus.foundationVetoActive ? (
            <div className="transition-countdown">
              <div className="current-phase-info">
                <div className="phase-badge-large">
                  <span className="phase-name">
                    {governanceStatus.currentPhase?.replace(/_/g, ' ')}
                  </span>
                  <span className="phase-years">
                    Years {governanceStatus.currentPhaseYears || '0-2'}
                  </span>
                </div>
                <div className="phase-description">
                  <p>
                    {governanceStatus.currentPhaseDescription ||
                      'Foundation retains full veto power'}
                  </p>
                </div>
              </div>

              <div className="phase-progress-section">
                <div className="progress-header">
                  <span>
                    Next Phase:{' '}
                    {governanceStatus.nextPhaseDisplay || 'Advisory DAO'}
                  </span>
                  <span>{governanceStatus.daysUntilNextPhase || 730} days</span>
                </div>
                <div className="phase-progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${governanceStatus.phaseProgress || 0}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {(governanceStatus.phaseProgress || 0).toFixed(1)}% through
                  current phase
                </div>
              </div>

              <div className="time-remaining">
                <div className="time-unit">
                  <span className="number">
                    {governanceStatus.yearsRemaining || 0}
                  </span>
                  <span className="label">Years to Full</span>
                </div>
                <div className="time-unit">
                  <span className="number">
                    {Math.floor(
                      (governanceStatus.daysUntilNextPhase || 730) / 30,
                    )}
                  </span>
                  <span className="label">Months to Next</span>
                </div>
                <div className="time-unit">
                  <span className="number">
                    {governanceStatus.daysUntilNextPhase || 730}
                  </span>
                  <span className="label">Days to Next</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="decentralized-status">
              <span className="success-icon">✅</span>
              <span>Full DAO Governance Active</span>
            </div>
          )}
        </div>

        {/* Governance Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">
              {governanceStatus.governanceMetrics?.totalProposals || 0}
            </div>
            <div className="metric-label">Total Proposals</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {governanceStatus.governanceMetrics?.activeProposals || 0}
            </div>
            <div className="metric-label">Active Votes</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {governanceStatus.governanceMetrics?.proposalsVetoed || 0}
            </div>
            <div className="metric-label">Foundation Vetoes</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {governanceStatus.governanceMetrics?.activeClimateOracles || 0}
            </div>
            <div className="metric-label">Climate Oracles</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="governance-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
            {tab.count && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Active Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="tab-content">
          <div className="proposals-section">
            <div className="section-header">
              <h3>Active Governance Proposals</h3>
              <button
                className="create-proposal-btn"
                onClick={() => setShowCreateProposal(true)}
              >
                <span>➕</span>
                Create Proposal
              </button>
            </div>

            {loading.proposals ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading proposals...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📄</span>
                <h4>No Active Proposals</h4>
                <p>Create the first governance proposal to get started</p>
              </div>
            ) : (
              <div className="proposals-list">
                {proposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className={`proposal-card ${proposal.vetoed ? 'vetoed' : ''} ${proposal.category === 'EMERGENCY' ? 'urgent' : ''}`}
                  >
                    <div className="proposal-header">
                      <div className="proposal-title">
                        <h4>{proposal.title}</h4>
                        <div className="proposal-badges">
                          <span
                            className={`category-badge ${proposal.category.toLowerCase()}`}
                          >
                            {proposal.category.replace('_', ' ')}
                          </span>
                          {proposal.vetoed && (
                            <span className="veto-badge">VETOED</span>
                          )}
                          {proposal.category === 'EMERGENCY' && (
                            <span className="urgent-badge">URGENT</span>
                          )}
                        </div>
                      </div>
                      <div className="proposal-meta">
                        <span className="proposal-id">
                          #{proposal.proposalId}
                        </span>
                        <span className="voting-ends">
                          {formatTimeRemaining(proposal.votingEnd)}
                        </span>
                      </div>
                    </div>

                    <div className="proposal-description">
                      <p>{proposal.description}</p>
                    </div>

                    {proposal.climateDataHash && (
                      <div className="climate-data-section">
                        <span className="climate-icon">☁️</span>
                        <span>
                          Climate Data Hash:{' '}
                          {proposal.climateDataHash.substring(0, 16)}...
                        </span>
                      </div>
                    )}

                    <div className="voting-section">
                      <div className="vote-progress">
                        <div className="vote-bars">
                          <div
                            className="vote-bar for"
                            style={{
                              width: `${getVotePercentage(proposal, 'for')}%`,
                            }}
                          ></div>
                          <div
                            className="vote-bar against"
                            style={{
                              width: `${getVotePercentage(proposal, 'against')}%`,
                            }}
                          ></div>
                        </div>
                        <div className="vote-counts">
                          <span className="votes-for">
                            {formatVotes(proposal.totalVotesFor)} FOR
                          </span>
                          <span className="votes-against">
                            {formatVotes(proposal.totalVotesAgainst)} AGAINST
                          </span>
                        </div>
                      </div>

                      {canVote(proposal) ? (
                        <div className="voting-actions">
                          <button
                            className="vote-btn vote-for"
                            disabled
                            title={SAMPLE_ACTION_NOTE}
                          >
                            <span>👍</span>
                            Vote For
                          </button>
                          <button
                            className="vote-btn vote-against"
                            disabled
                            title={SAMPLE_ACTION_NOTE}
                          >
                            <span>👎</span>
                            Vote Against
                          </button>
                          <small className="sample-action-note">{SAMPLE_ACTION_NOTE}</small>
                        </div>
                      ) : proposal.vetoed ? (
                        <div className="veto-info">
                          <span className="veto-icon">🚫</span>
                          <div className="veto-details">
                            <strong>Vetoed by Foundation</strong>
                            <p>{proposal.vetoReason}</p>
                            <small>{formatDate(proposal.vetoTimestamp)}</small>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Climate Oracles Tab */}
      {activeTab === 'oracles' && (
        <div className="tab-content">
          <div className="oracles-section">
            <div className="section-header">
              <h3>Authorized Climate Oracles</h3>
            </div>

            <div className="oracles-grid">
              {climateOracles.map(oracle => (
                <div
                  key={oracle.id}
                  className={`oracle-card ${!oracle.active ? 'inactive' : ''}`}
                >
                  <div className="oracle-header">
                    <div className="oracle-info">
                      <h4>{oracle.oracleName}</h4>
                      <p className="organization">{oracle.organization}</p>
                    </div>
                    <div className="oracle-status">
                      <span
                        className={`status-badge ${oracle.active ? 'active' : 'inactive'}`}
                      >
                        {oracle.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="oracle-metrics">
                    <div className="metric">
                      <span className="label">Quality Score</span>
                      <span className="value">
                        {(oracle.dataQualityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="label">Proposals</span>
                      <span className="value">
                        {oracle.totalProposalsSubmitted}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="label">Last Active</span>
                      <span className="value">
                        {formatDate(oracle.lastProposalDate)}
                      </span>
                    </div>
                  </div>

                  <div className="oracle-address">
                    <span className="address-icon">🔑</span>
                    <code>{oracle.oracleAddress}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Foundation Actions Tab */}
      {activeTab === 'actions' && (
        <div className="tab-content">
          <div className="actions-section">
            <div className="section-header">
              <h3>Foundation Actions History</h3>
              <div className="filter-controls">
                <select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Actions</option>
                  <option value="PROPOSAL_VETOED">Vetoes</option>
                  <option value="PROPOSAL_CREATED">Proposals</option>
                  <option value="ORACLE_AUTHORIZED">Oracle Auth</option>
                  <option value="TRANSITION_WARNING">Warnings</option>
                </select>
              </div>
            </div>

            <div className="actions-timeline">
              {filteredActions.map(action => (
                <div
                  key={action.id}
                  className={`action-item ${action.actionType.toLowerCase()}`}
                >
                  <div className="action-icon">
                    <span>{getActionIcon(action.actionType)}</span>
                  </div>
                  <div className="action-content">
                    <div className="action-header">
                      <h4>{formatActionType(action.actionType)}</h4>
                      <span className="action-time">
                        {formatDate(action.timestamp)}
                      </span>
                    </div>
                    <div className="action-details">
                      {action.proposalId && (
                        <p>Proposal: #{action.proposalId}</p>
                      )}
                      {action.actionData && (
                        <p>
                          {action.actionData.reason ||
                            action.actionData.message ||
                            'View details'}
                        </p>
                      )}
                    </div>
                    <div className="action-meta">
                      <code>{action.foundationAddress}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="settings-section">
            <div className="section-header">
              <h3>Governance Parameters</h3>
              <p className="settings-note">
                Current governance settings - changes require Foundation
                approval during veto period
              </p>
            </div>

            <div className="settings-grid">
              <div className="setting-card">
                <h4>Voting Parameters</h4>
                <div className="setting-item">
                  <label>Voting Delay</label>
                  <span>1 day</span>
                </div>
                <div className="setting-item">
                  <label>Voting Period</label>
                  <span>1 week</span>
                </div>
                <div className="setting-item">
                  <label>Quorum Required</label>
                  <span>15%</span>
                </div>
              </div>

              <div className="setting-card">
                <h4>Foundation Settings</h4>
                <div className="setting-item">
                  <label>Veto Period Remaining</label>
                  <span>
                    {governanceStatus.daysUntilDecentralization || 0} days
                  </span>
                </div>
                <div className="setting-item">
                  <label>Transition Phase</label>
                  <span className="phase-badge">
                    {governanceStatus.transitionPhase || 'EARLY_FOUNDATION'}
                  </span>
                </div>
              </div>

              <div className="setting-card">
                <h4>Climate Oracle Settings</h4>
                <div className="setting-item">
                  <label>Authorized Oracles</label>
                  <span>
                    {governanceStatus.governanceMetrics?.activeClimateOracles ||
                      0}
                  </span>
                </div>
                <div className="setting-item">
                  <label>Minimum Quality Score</label>
                  <span>85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      <WrfModal
        open={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        title="Create Governance Proposal"
      >
        <form onSubmit={submitProposal} className="proposal-form">
          <div className="form-group">
            <label>Proposal Title</label>
            <input
              value={newProposal.title}
              onChange={e =>
                setNewProposal({ ...newProposal, title: e.target.value })
              }
              type="text"
              required
              placeholder="Enter proposal title"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={newProposal.category}
              onChange={e =>
                setNewProposal({ ...newProposal, category: e.target.value })
              }
              required
            >
              <option value="GENERAL">General</option>
              <option value="CLIMATE_DATA">Climate Data</option>
              <option value="CROSS_CHAIN">Cross-Chain</option>
              <option value="TREASURY">Treasury</option>
              {governanceStatus.foundationVetoActive && (
                <option value="EMERGENCY">Emergency</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newProposal.description}
              onChange={e =>
                setNewProposal({
                  ...newProposal,
                  description: e.target.value,
                })
              }
              required
              rows="6"
              placeholder="Detailed description of the proposal"
            />
          </div>

          {newProposal.category === 'CLIMATE_DATA' && (
            <div className="form-group">
              <label>Climate Data Hash</label>
              <input
                value={newProposal.climateDataHash}
                onChange={e =>
                  setNewProposal({
                    ...newProposal,
                    climateDataHash: e.target.value,
                  })
                }
                type="text"
                placeholder="0x... (optional climate data verification hash)"
              />
            </div>
          )}

          <div className="form-actions">
            <WrfButton variant="outlined" onClick={() => setShowCreateProposal(false)}>Cancel</WrfButton>
            <WrfButton variant="contained" type="submit" disabled title={SAMPLE_ACTION_NOTE}>
              {loading.creating && <span className="spinner">⏳</span>}
              Create Proposal
            </WrfButton>
          </div>
        </form>
      </WrfModal>
    </div>
  );
};

const FoundationGovernanceVoting = () => (
  <DemoSurfaceGate
    title="Foundation governance is not live on the testnet"
    description="No testnet endpoint serves foundation proposals, climate oracles or foundation actions; nothing here can be voted on."
    testId="governance-foundation"
  >
    <FoundationGovernanceSample />
  </DemoSurfaceGate>
);

export default FoundationGovernanceVoting;
