import { useEffect, useState } from 'react';
import { fetchTransparencyLedger } from '../services/resilienceService';

const panel = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  padding: 16,
  background: '#fff',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
};

function TransparencyLedgerDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const payload = await fetchTransparencyLedger();
        if (mounted) {
          setData(payload);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load transparency ledger');
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
      <h2 style={{ marginBottom: 6 }}>Transparency Ledger Dashboard</h2>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Public integrity aggregates for sanctions, appeals, and parity trends. Personal identifiers are excluded.
      </p>

      {loading && <div>Loading transparency ledger...</div>}
      {!loading && error && (
        <div style={{ ...panel, borderColor: '#f5c2c7', background: '#fff5f5', color: '#842029' }}>{error}</div>
      )}

      {!loading && data && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              ['Sanctions', data.sanctions.total],
              ['Disclosed', data.sanctions.disclosed],
              ['Appeals', data.appeals.total],
              ['Appeals Cleared', data.appeals.cleared],
              ['Freshness (s)', data.dataFreshnessSeconds],
            ].map(([label, value]) => (
              <div key={label} style={{ ...panel, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: 26, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ ...panel, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Parity Trends (Actor-Neutral View)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
              <div>Human actors: <strong>{data.parity.human}</strong></div>
              <div>AI agents: <strong>{data.parity.aiAgent}</strong></div>
              <div>Robots: <strong>{data.parity.robot}</strong></div>
              <div>Unknown class: <strong>{data.parity.unknown}</strong></div>
            </div>
          </div>

          <div style={{ ...panel, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Disclosure Notes</h3>
            <ul style={{ marginBottom: 0 }}>
              <li>Only aggregate metrics are exposed publicly.</li>
              <li>No raw identifiers, IP data, or personally sensitive telemetry is shown.</li>
              <li>Freshness SLO is displayed as seconds since latest ledger update.</li>
              <li>Equal-liability outcomes are summarized across actor classes.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default TransparencyLedgerDashboardPage;
