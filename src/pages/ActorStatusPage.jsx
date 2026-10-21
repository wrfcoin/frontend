import { useEffect, useState } from 'react';
import { fetchActorStatus } from '../services/governanceService';

const cardStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
};

const errorCardStyle = {
  ...cardStyle,
  borderColor: '#f5c2c7',
  background: '#fff5f5',
  color: '#842029',
};

const badgeBase = {
  display: 'inline-block',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#fff',
};

const actorClassColor = {
  human: '#1d4ed8',
  ai: '#7c3aed',
  robot: '#0369a1',
  unknown: '#6b7280',
};

const trustTierColor = {
  trusted: '#15803d',
  standard: '#1d4ed8',
  probation: '#b45309',
  sanctioned: '#b91c1c',
};

const sanctionStatusColor = {
  none: '#15803d',
  active: '#b91c1c',
  resolved: '#15803d',
  appealing: '#b45309',
};

function ActorStatusPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const payload = await fetchActorStatus();
        if (mounted) {
          setData(payload);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load actor status');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    const timer = setInterval(run, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 6 }}>Actor Status</h2>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Actor class, trust tier, and sanction status for all registered network participants.
      </p>

      {loading && <div>Loading actor status...</div>}

      {!loading && error && (
        <div style={errorCardStyle}>{error}</div>
      )}

      {!loading && data && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Summary KPIs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              ['Total Actors', data.summary.total],
              ['Trusted', data.summary.trusted],
              ['Standard', data.summary.standard],
              ['Probation', data.summary.probation],
              ['Sanctioned', data.summary.sanctioned],
            ].map(([label, value]) => (
              <div key={label} style={{ ...cardStyle, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: 26, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Actor Table */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Active Sanctions Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Actor ID', 'Class', 'Trust Tier', 'Sanction Status', 'Last Updated'].map(col => (
                      <th
                        key={col}
                        style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8, fontSize: 13 }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.actors.map(actor => (
                    <tr key={actor.id}>
                      <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 13 }}>
                        {actor.id}
                      </td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            ...badgeBase,
                            background: actorClassColor[actor.actorClass] ?? '#6b7280',
                          }}
                        >
                          {actor.actorClass === 'ai' ? 'AI' : actor.actorClass}
                        </span>
                      </td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            ...badgeBase,
                            background: trustTierColor[actor.trustTier] ?? '#6b7280',
                          }}
                        >
                          {actor.trustTier}
                        </span>
                      </td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            ...badgeBase,
                            background: sanctionStatusColor[actor.sanctionStatus] ?? '#6b7280',
                          }}
                        >
                          {actor.sanctionStatus}
                        </span>
                      </td>
                      <td style={{ padding: 8, color: '#6b7280', fontSize: 13 }}>
                        {new Date(actor.lastUpdated).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {data.actors.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
                        No actors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Status Changes Timeline */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Recent Status Changes</h3>
            {data.recentChanges.length === 0 ? (
              <p style={{ color: '#6b7280', margin: 0 }}>No recent changes.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                {data.recentChanges.map((change, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderLeft: '3px solid #d1d5db',
                      paddingLeft: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        Actor <span style={{ fontFamily: 'monospace' }}>{change.actorId}</span>
                        {' — '}
                        <span style={{ textTransform: 'capitalize' }}>{change.field}</span>
                        {' changed from '}
                        <strong>{change.from}</strong>
                        {' to '}
                        <strong>{change.to}</strong>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                        {new Date(change.changedAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ActorStatusPage;
