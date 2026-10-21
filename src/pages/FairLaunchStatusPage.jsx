import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fairLaunchService } from '../services/fairLaunchService';
import './FairLaunchStatusPage.css';

const DEFAULT_ADDRESS = '0x0000000000000000000000000000000000000000';

const formatPercent = value => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
};

const formatEpoch = epochSeconds => {
  if (!epochSeconds) {
    return '-';
  }
  try {
    return new Date(epochSeconds * 1000).toLocaleString();
  } catch {
    return '-';
  }
};

const FairLaunchStatusPage = () => {
  const [addressInput, setAddressInput] = useState(DEFAULT_ADDRESS);
  const [activeAddress, setActiveAddress] = useState(DEFAULT_ADDRESS);
  const [commitLookupInput, setCommitLookupInput] = useState('');
  const [stakeStatus, setStakeStatus] = useState(null);
  const [contributionStatuses, setContributionStatuses] = useState([]);
  const [commitStatus, setCommitStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async address => {
    setLoading(true);
    setError('');
    try {
      const [stake, statuses] = await Promise.all([
        fairLaunchService.fetchStakeStatus(address),
        fairLaunchService.fetchContributionStatuses(),
      ]);
      setStakeStatus(stake);
      setContributionStatuses(statuses);
    } catch (err) {
      setError(err.message || 'Failed to load fair-launch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(activeAddress);

    const intervalId = window.setInterval(() => {
      loadDashboard(activeAddress);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [activeAddress, loadDashboard]);

  const contributionSummary = useMemo(() => {
    const summary = {
      committed: 0,
      revealed: 0,
      attested: 0,
    };

    for (const item of contributionStatuses) {
      if (item.status === 'committed_pending_reveal') {
        summary.committed += 1;
      }
      if (item.status === 'revealed_pending_attestation') {
        summary.revealed += 1;
      }
      if (item.status === 'revealed_attested') {
        summary.attested += 1;
      }
    }

    return summary;
  }, [contributionStatuses]);

  const onAddressSubmit = event => {
    event.preventDefault();
    setActiveAddress(addressInput.trim());
  };

  const onCommitLookup = async event => {
    event.preventDefault();
    if (!commitLookupInput.trim()) {
      setCommitStatus(null);
      return;
    }

    try {
      const result = await fairLaunchService.fetchCommitStatus(commitLookupInput.trim());
      setCommitStatus(result);
    } catch (err) {
      setError(err.message || 'Commit status lookup failed');
    }
  };

  return (
    <div className="fair-launch-page">
      <header className="fair-launch-hero">
        <p className="eyebrow">Native Chain Fair Launch</p>
        <h1>Stake Progress and Commit-Reveal Monitor</h1>
        <p>
          Live view of earned-stake maturity and contribution commit/reveal/attestation state.
        </p>
      </header>

      <section className="fair-launch-controls">
        <form onSubmit={onAddressSubmit} className="address-form">
          <label htmlFor="stake-address">Stake Address</label>
          <div className="control-row">
            <input
              id="stake-address"
              type="text"
              value={addressInput}
              onChange={event => setAddressInput(event.target.value)}
              placeholder="0x..."
            />
            <button type="submit">Load Stake</button>
          </div>
        </form>

        <form onSubmit={onCommitLookup} className="address-form">
          <label htmlFor="commit-id">Commit ID Lookup</label>
          <div className="control-row">
            <input
              id="commit-id"
              type="text"
              value={commitLookupInput}
              onChange={event => setCommitLookupInput(event.target.value)}
              placeholder="commit hash"
            />
            <button type="submit">Lookup</button>
          </div>
        </form>
      </section>

      {error && <div className="status-banner error">{error}</div>}
      {loading && <div className="status-banner">Refreshing status data...</div>}

      <section className="stake-panel">
        <h2>Stake Maturity</h2>
        <div className="stake-grid">
          <div className="metric-card">
            <span className="label">Required</span>
            <strong>{stakeStatus?.stake_required ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Locked</span>
            <strong>{stakeStatus?.stake_locked ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Spendable</span>
            <strong>{stakeStatus?.spendable_balance ?? 0}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Earned Total</span>
            <strong>{stakeStatus?.earned_balance_total ?? 0}</strong>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-labels">
            <span>Maturity</span>
            <span>{formatPercent(stakeStatus?.maturity_percent ?? 0)}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(stakeStatus?.maturity_percent ?? 0, 100)}%` }}
            />
          </div>
          <p className="progress-note">{stakeStatus?.note || 'No stake status loaded.'}</p>
        </div>
      </section>

      <section className="commit-panel">
        <h2>Commit-Reveal Queue</h2>
        <div className="stake-grid">
          <div className="metric-card">
            <span className="label">Committed</span>
            <strong>{contributionSummary.committed}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Revealed</span>
            <strong>{contributionSummary.revealed}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Attested</span>
            <strong>{contributionSummary.attested}</strong>
          </div>
          <div className="metric-card">
            <span className="label">Tracked IDs</span>
            <strong>{contributionStatuses.length}</strong>
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Commit ID</th>
                <th>Station</th>
                <th>Reveal</th>
                <th>Approvals</th>
                <th>Quorum</th>
              </tr>
            </thead>
            <tbody>
              {contributionStatuses.slice(0, 20).map(item => (
                <tr key={item.commit_id}>
                  <td>{item.status}</td>
                  <td className="mono-cell">{item.commit_id}</td>
                  <td>{item.station_id || '-'}</td>
                  <td>{formatEpoch(item.revealed_at)}</td>
                  <td>
                    {item.approvals}/{item.approvals + item.rejections}
                  </td>
                  <td>
                    {item.has_quorum ? 'Met' : 'Pending'} ({item.oracle_quorum})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {commitStatus && (
        <section className="commit-panel">
          <h2>Commit Lookup Result</h2>
          <div className="lookup-card">
            <p>
              <strong>Status:</strong> {commitStatus.status}
            </p>
            <p>
              <strong>Commit:</strong> <span className="mono-cell">{commitStatus.commit_id}</span>
            </p>
            <p>
              <strong>Station:</strong> {commitStatus.station_id || '-'}
            </p>
            <p>
              <strong>Contribution Type:</strong> {commitStatus.contribution_type || '-'}
            </p>
            <p>
              <strong>Reveal At:</strong> {formatEpoch(commitStatus.revealed_at)}
            </p>
            <p>
              <strong>Attestation:</strong> {commitStatus.approvals}/{commitStatus.approvals + commitStatus.rejections}
              {' '}approved
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default FairLaunchStatusPage;
