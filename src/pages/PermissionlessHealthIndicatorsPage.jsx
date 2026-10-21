import { useEffect, useState } from 'react';
import {
  fetchPermissionlessHealth,
} from '../services/resilienceService';

const badgeColor = status => {
  if (status === 'pass' || status === 'healthy') return '#137333';
  if (status === 'warn' || status === 'degraded') return '#995e00';
  return '#a50e0e';
};

const cardStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
};

function PermissionlessHealthIndicatorsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const payload = await fetchPermissionlessHealth();
        if (mounted) {
          setData(payload);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load resilience health');
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
      <h2 style={{ marginBottom: 6 }}>Permissionless Health Indicators</h2>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Real-time borderless participation, anti-censorship relay health, and privacy-safe guidance.
      </p>

      {loading && <div>Loading health signals...</div>}
      {!loading && error && (
        <div style={{ ...cardStyle, borderColor: '#f5c2c7', background: '#fff5f5', color: '#842029' }}>
          {error}
        </div>
      )}

      {!loading && data && (
        <div style={{ display: 'grid', gap: 16 }}>
          <section style={{ ...cardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Participation Compliance</strong>
              <span
                style={{
                  background: badgeColor(data.participation.status),
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 12,
                  textTransform: 'uppercase',
                }}
              >
                {data.participation.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginTop: 12 }}>
              <div>Geoblocking violations: <strong>{data.participation.geoblockingViolations}</strong></div>
              <div>Total events: <strong>{data.participation.totalEvents}</strong></div>
              <div>Throttle events: <strong>{data.participation.throttleEvents}</strong></div>
              <div>Deny events: <strong>{data.participation.denyEvents}</strong></div>
            </div>
            <div style={{ marginTop: 12, color: '#334155' }}>
              Actor neutrality: <strong>{data.participation.actorNeutrality}</strong> | Privacy-safe telemetry: <strong>{String(data.participation.privacySafeTelemetry)}</strong>
            </div>
          </section>

          <section style={{ ...cardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Relay Resilience</strong>
              <span
                style={{
                  background: badgeColor(data.relay.status),
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 12,
                  textTransform: 'uppercase',
                }}
              >
                {data.relay.status}
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              Global availability: <strong>{data.relay.globalAvailabilityPercent}%</strong> | Censorship signals: <strong>{data.relay.censorshipSignalCount}</strong>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Route</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Providers</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Healthy</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Availability</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {data.relay.routes.map(route => (
                    <tr key={route.routeId}>
                      <td style={{ padding: 8 }}>{route.routeId}</td>
                      <td style={{ textAlign: 'right', padding: 8 }}>{route.providers}</td>
                      <td style={{ textAlign: 'right', padding: 8 }}>{route.healthyProviders}</td>
                      <td style={{ textAlign: 'right', padding: 8 }}>{route.availabilityPercent}%</td>
                      <td style={{ textAlign: 'right', padding: 8 }}>{route.censorshipSignals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ ...cardStyle }}>
            <strong>User Guidance</strong>
            <ul style={{ marginBottom: 0 }}>
              {data.guidance.map((line, idx) => <li key={idx}>{line}</li>)}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

export default PermissionlessHealthIndicatorsPage;
