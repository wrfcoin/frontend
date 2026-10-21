import React from 'react';
import { Link } from 'react-router';
import { WrfBadge } from '../DesignSystem';

/**
 * Optimized Proposal List Component
 * Displays a list of governance proposals with better handling of different data formats
 */
const OptimizedProposalList = ({ proposals }) => {
  // Function to get status badge styling mapped to WrfBadge status values
  const getStatusBadgeStatus = status => {
    const normalizedStatus = status.toUpperCase();

    const statusMap = {
      ACTIVE: 'info',
      VOTING: 'info',
      PASSED: 'active',
      EXECUTED: 'info',
      REJECTED: 'error',
      FAILED: 'warning',
      CANCELLED: 'neutral',
      DRAFT: 'neutral',
      PENDING: 'warning',
    };

    return statusMap[normalizedStatus] || 'neutral';
  };

  // Function to format proposal type for display
  const formatProposalType = type => {
    if (
      type === 'Parameter Change' ||
      type === 'Protocol Upgrade' ||
      type === 'Funding Request' ||
      type === 'Text Proposal' ||
      type === 'Treasury Management'
    ) {
      return type;
    }

    // API format types that need formatting
    switch (type) {
    case 'ParameterChange':
      return 'Parameter Change';
    case 'ProtocolUpgrade':
      return 'Protocol Upgrade';
    case 'FundingProposal':
      return 'Funding Request';
    case 'TextProposal':
      return 'Text Proposal';
    case 'CommunityPoolSpend':
      return 'Community Pool Spend';
    default:
      return type;
    }
  };

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // return original if parsing fails
    }
  };

  // Handle empty proposals list
  if (!proposals || proposals.length === 0) {
    return (
      <div className="proposals-empty">
        <p>No proposals found.</p>
      </div>
    );
  }

  return (
    <div className="proposals-list-container">
      <ul className="proposals-list">
        {proposals.map(proposal => {
          // For votes display
          const votes = proposal.votes || {};
          const yesVotes = votes.yes || 0;
          const noVotes = votes.no || 0;
          const abstainVotes = votes.abstain || 0;
          const vetoVotes = votes.veto || 0;

          // For turnout display
          const turnout = proposal.turnout || 0;

          return (
            <li key={proposal.id} className="proposal-item">
              <Link
                to={`/governance/proposals/${proposal.id}`}
                className="proposal-link"
              >
                <div className="proposal-content">
                  <div className="proposal-header">
                    <h3 className="proposal-title">{proposal.title}</h3>
                    <div className="proposal-meta">
                      <WrfBadge
                        className="proposal-status"
                        status={getStatusBadgeStatus(proposal.status)}
                        label={proposal.status}
                      />
                      <WrfBadge
                        className="proposal-type"
                        status="neutral"
                        label={formatProposalType(proposal.type)}
                      />
                    </div>
                  </div>

                  <div className="proposal-details">
                    <div className="proposal-info-row">
                      <span className="info-label">Submitter:</span>
                      <span className="info-value">{proposal.submitter}</span>
                    </div>
                    <div className="proposal-info-row">
                      <span className="info-label">Submitted:</span>
                      <span className="info-value">
                        {formatDate(proposal.submissionDate)}
                      </span>
                    </div>
                    <div className="proposal-info-row">
                      <span className="info-label">Voting Period:</span>
                      <span className="info-value">
                        {proposal.votingPeriod}
                      </span>
                    </div>
                  </div>

                  <div className="proposal-summary">
                    <p>{proposal.summary}</p>
                  </div>

                  {/* Only show voting info if available */}
                  {votes &&
                    (proposal.status === 'Voting' ||
                      proposal.status === 'ACTIVE') && (
                    <div className="voting-info mt-2">
                      <div className="vote-bars">
                        <div
                          className="vote-bar yes"
                          style={{ width: `${yesVotes}%` }}
                        ></div>
                        <div
                          className="vote-bar no"
                          style={{ width: `${noVotes}%` }}
                        ></div>
                        <div
                          className="vote-bar abstain"
                          style={{ width: `${abstainVotes}%` }}
                        ></div>
                        <div
                          className="vote-bar veto"
                          style={{ width: `${vetoVotes}%` }}
                        ></div>
                      </div>
                      <div className="vote-stats">
                        <span>Yes: {yesVotes}%</span>
                        <span>No: {noVotes}%</span>
                        <span>Abstain: {abstainVotes}%</span>
                        <span>Veto: {vetoVotes}%</span>
                      </div>
                      <div className="turnout">Turnout: {turnout}%</div>
                    </div>
                  )}

                  {/* Show final result for completed proposals */}
                  {votes &&
                    (proposal.status === 'Passed' ||
                      proposal.status === 'Rejected') && (
                    <div className="final-result mt-2">
                      <div className="result-label">Final Result:</div>
                      <div className="result-value">
                        {yesVotes}% Approval ({yesVotes}% Yes / {noVotes}% No
                          / {vetoVotes}% Veto)
                      </div>
                      <div className="turnout">Turnout: {turnout}%</div>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OptimizedProposalList;
