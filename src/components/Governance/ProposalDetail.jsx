import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

import DOMPurify from 'dompurify';

import { governanceService } from '../../services/governanceService';

/**
 * Proposal Detail Component
 * Displays detailed information about a governance proposal
 */
const ProposalDetail = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteType, setVoteType] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingError, setVotingError] = useState(null);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeError, setFinalizeError] = useState(null);

  // Fetch proposal data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const proposalData =
          await governanceService.getProposalById(proposalId);
        setProposal(proposalData);

        // Also fetch votes if the proposal exists
        if (proposalData && proposalData.id) {
          const votesData = await governanceService.getVotesByProposal(
            proposalData.id,
          );
          setVotes(votesData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [proposalId]);

  // Handle vote submission
  const handleVoteSubmit = async e => {
    e.preventDefault();
    setVotingError(null);

    if (!voteType) {
      setVotingError('Please select a vote option.');
      return;
    }

    if (!voterAddress || voterAddress.trim() === '') {
      setVotingError('Please enter your wallet address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await governanceService.castVote(proposalId, voterAddress, voteType);

      // Reload data after successful vote
      const proposalData = await governanceService.getProposalById(proposalId);
      setProposal(proposalData);

      const votesData = await governanceService.getVotesByProposal(
        proposalData.id,
      );
      setVotes(votesData);

      // Reset form
      setVoteType('');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error submitting vote:', err);
      setVotingError(err.message || 'Failed to submit vote. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle proposal finalization
  const handleFinalize = async () => {
    try {
      setFinalizeLoading(true);
      setFinalizeError(null);

      const finalizedProposal =
        await governanceService.finalizeProposal(proposalId);
      setProposal(finalizedProposal);

      setFinalizeLoading(false);
    } catch (err) {
      console.error('Error finalizing proposal:', err);
      setFinalizeError(
        err.message || 'Failed to finalize proposal. Please try again.',
      );
      setFinalizeLoading(false);
    }
  };

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to get status badge styling
  const getStatusBadge = status => {
    const statusColors = {
      ACTIVE: 'bg-blue-100 text-blue-800',
      PASSED: 'bg-green-100 text-green-800',
      EXECUTED: 'bg-purple-100 text-purple-800',
      REJECTED: 'bg-red-100 text-red-800',
      FAILED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Format proposal content based on type
  const renderProposalContent = proposal => {
    if (!proposal) return null;

    let content = proposal.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (err) {
        // If not valid JSON, use as is
      }
    }

    switch (proposal.proposalType) {
    case 'ParameterChange':
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Parameter Change</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Parameter Name:</span>
              <p className="font-medium">{content.parameter}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">New Value:</span>
              <p className="font-medium">{content.value}</p>
            </div>
          </div>
        </div>
      );

    case 'ProtocolUpgrade':
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Protocol Upgrade</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Version:</span>
              <p className="font-medium">{content.version}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">
                  Activation Height:
              </span>
              <p className="font-medium">{content.activationHeight}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 text-sm">Code Hash:</span>
              <p className="font-mono text-sm overflow-x-auto">
                {content.codeHash}
              </p>
            </div>
          </div>
        </div>
      );

    case 'FundingProposal':
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Funding Proposal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Recipient:</span>
              <p className="font-medium font-mono text-sm">
                {content.recipient}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Amount:</span>
              <p className="font-medium">{content.amount} WRF</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 text-sm">Purpose:</span>
              <p>{content.purpose}</p>
            </div>
          </div>
        </div>
      );

    case 'Text':
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Text Proposal</h3>
          <div>
            <p className="whitespace-pre-wrap">
              {DOMPurify.sanitize(content.content)}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Loading proposal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/governance')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Return to Governance Dashboard
        </button>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Proposal Not Found</h2>
        <p className="mb-6">
          The requested proposal doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/governance')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Return to Governance Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/governance')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Governance Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <p className="text-gray-600 text-sm mt-1">
                Proposal ID: {proposal.proposalId} • Submitted by{' '}
                {proposal.proposer}
              </p>
            </div>
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(proposal.status)}`}
              >
                {proposal.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-gray-600">Created:</span>{' '}
              <span>{formatDate(proposal.creationTime)}</span>
            </div>
            <div>
              <span className="text-gray-600">Voting End:</span>{' '}
              <span>{formatDate(proposal.endTime)}</span>
            </div>
            <div>
              <span className="text-gray-600">Deposit:</span>{' '}
              <span>{proposal.deposit} WRF</span>
            </div>
            <div>
              <span className="text-gray-600">Total Votes:</span>{' '}
              <span>{proposal.totalVotes || 0}</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Description</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="whitespace-pre-wrap">
                {DOMPurify.sanitize(proposal.description)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Proposal Content</h2>
            {renderProposalContent(proposal)}
          </div>

          {proposal.status === 'ACTIVE' && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Current Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800">Yes</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {proposal.yesVotes || 0}
                  </p>
                  <p className="text-sm text-green-700">
                    {proposal.totalVotes
                      ? `${Math.round((proposal.yesVotes / proposal.totalVotes) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800">No</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {proposal.noVotes || 0}
                  </p>
                  <p className="text-sm text-red-700">
                    {proposal.totalVotes
                      ? `${Math.round((proposal.noVotes / proposal.totalVotes) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-800">Abstain</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {proposal.abstainVotes || 0}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {proposal.totalVotes
                      ? `${Math.round((proposal.abstainVotes / proposal.totalVotes) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-800">Veto</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {proposal.vetoVotes || 0}
                  </p>
                  <p className="text-sm text-purple-700">
                    {proposal.totalVotes
                      ? `${Math.round((proposal.vetoVotes / proposal.totalVotes) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-4 w-full bg-gray-200 rounded-full">
                  <div className="flex h-full rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${proposal.totalVotes ? (proposal.yesVotes / proposal.totalVotes) * 100 : 0}%`,
                      }}
                    ></div>
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${proposal.totalVotes ? (proposal.noVotes / proposal.totalVotes) * 100 : 0}%`,
                      }}
                    ></div>
                    <div
                      className="bg-yellow-500"
                      style={{
                        width: `${proposal.totalVotes ? (proposal.abstainVotes / proposal.totalVotes) * 100 : 0}%`,
                      }}
                    ></div>
                    <div
                      className="bg-purple-500"
                      style={{
                        width: `${proposal.totalVotes ? (proposal.vetoVotes / proposal.totalVotes) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {proposal.status === 'ACTIVE' && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Cast Your Vote</h2>
              <form
                onSubmit={handleVoteSubmit}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                {votingError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {votingError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Your Wallet Address
                  </label>
                  <input
                    type="text"
                    value={voterAddress}
                    onChange={e => setVoterAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Your Vote
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="vote"
                        value="YES"
                        checked={voteType === 'YES'}
                        onChange={() => setVoteType('YES')}
                      />
                      <span className="ml-2">Yes</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="vote"
                        value="NO"
                        checked={voteType === 'NO'}
                        onChange={() => setVoteType('NO')}
                      />
                      <span className="ml-2">No</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="vote"
                        value="ABSTAIN"
                        checked={voteType === 'ABSTAIN'}
                        onChange={() => setVoteType('ABSTAIN')}
                      />
                      <span className="ml-2">Abstain</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="vote"
                        value="VETO"
                        checked={voteType === 'VETO'}
                        onChange={() => setVoteType('VETO')}
                      />
                      <span className="ml-2">Veto</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </button>
              </form>
            </div>
          )}

          {proposal.status === 'ACTIVE' &&
            new Date() > new Date(proposal.endTime) && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Finalize Proposal</h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="mb-4">
                    The voting period for this proposal has ended. You can now
                    finalize the proposal to execute its results.
                </p>

                {finalizeError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {finalizeError}
                  </div>
                )}

                <button
                  onClick={handleFinalize}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={finalizeLoading}
                >
                  {finalizeLoading ? 'Finalizing...' : 'Finalize Proposal'}
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold mb-3">Recent Votes</h2>
            {votes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Voter</th>
                      <th className="py-2 px-4 border-b text-left">Vote</th>
                      <th className="py-2 px-4 border-b text-left">
                        Voting Power
                      </th>
                      <th className="py-2 px-4 border-b text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map(vote => (
                      <tr key={vote.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          <span className="font-mono">
                            {vote.voter.substring(0, 10)}...
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b">
                          <span
                            className={`py-1 px-2 rounded-full text-xs font-semibold 
                            ${
                      vote.vote === 'YES'
                        ? 'bg-green-100 text-green-800'
                        : vote.vote === 'NO'
                          ? 'bg-red-100 text-red-800'
                          : vote.vote === 'ABSTAIN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}
                          >
                            {vote.vote}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {vote.votingPower}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {formatDate(vote.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No votes have been cast yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;
