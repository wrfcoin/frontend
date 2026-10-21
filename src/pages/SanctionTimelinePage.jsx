import { useEffect, useState } from 'react';
import { fetchSanctionTimeline, submitAppeal } from '../services/governanceService';

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

const severityColor = {
  low: '#15803d',
  medium: '#b45309',
  high: '#c2410c',
  critical: '#7f1d1d',
};

const severityBg = {
  low: '#dcfce7',
  medium: '#fef3c7',
  high: '#ffedd5',
  critical: '#fee2e2',
};

const appealStateLabel = {
  none: 'No appeal filed',
  pending: 'Appeal pending review',
  under_review: 'Appeal under review',
  approved: 'Appeal approved',
  rejected: 'Appeal rejected',
};

const appealStateColor = {
  none: '#6b7280',
  pending: '#b45309',
  under_review: '#1d4ed8',
  approved: '#15803d',
  rejected: '#b91c1c',
};

const sanctionReasonExplanations = {
  DATA_QUALITY: 'Submitted data that failed quality thresholds repeatedly.',
  INACTIVITY: 'Extended period of inactivity without valid exemption.',
  POLICY_VIOLATION: 'Action that violated network participation policy.',
  FRAUD: 'Detected attempt to manipulate rewards or data.',
  SPAM: 'Excessive low-quality or duplicate submissions.',
};

function SanctionTimelinePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const payload = await fetchSanctionTimeline();
        if (mounted) {
          setData(payload);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load sanction timeline');
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

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const result = await submitAppeal(appealReason, appealEvidence);
      setSubmitSuccess(`Appeal submitted successfully. Appeal ID: ${result.appealId}`);
      setAppealReason('');
      setAppealEvidence('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 6 }}>Sanction Timeline &amp; Appeal Flow</h2>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Chronological sanction events, plain-language explanations, and appeal submission.
      </p>

      {loading && <div>Loading sanction timeline...</div>}

      {!loading && error && (
        <div style={errorCardStyle}>{error}</div>
      )}

      {!loading && data && data.events.length === 0 && data.appealStatus.state === 'none' && (
        <section
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              lineHeight: 1,
              marginBottom: 12,
              color: '#d1d5db',
            }}
            aria-hidden="true"
          >
            &#x2714;
          </div>
          <h3 style={{ marginTop: 0, color: '#15803d' }}>No Sanctions Found</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Your account has a clean record. There are no sanction events or pending appeals.
          </p>
        </section>
      )}

      {!loading && data && (data.events.length > 0 || data.appealStatus.state !== 'none') && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Sanction Event Timeline */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Sanction Events</h3>
            {data.events.length === 0 ? (
              <p style={{ color: '#6b7280', margin: 0 }}>No sanction events on record.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                {data.events.map(event => (
                  <li
                    key={event.id}
                    style={{
                      borderLeft: `4px solid ${severityColor[event.severity] ?? '#6b7280'}`,
                      paddingLeft: 14,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: severityBg[event.severity] ?? '#f3f4f6',
                          color: severityColor[event.severity] ?? '#6b7280',
                          borderRadius: 999,
                          padding: '2px 9px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {event.severity}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{event.reason}</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          color: '#6b7280',
                        }}
                      >
                        {new Date(event.date).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, color: '#374151', fontSize: 13 }}>
                      Actor: <span style={{ fontFamily: 'monospace' }}>{event.actorId}</span>
                      {' — Status: '}
                      <strong>{event.status}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Reason Explanation Cards */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Sanction Reason Explanations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
              {Object.entries(sanctionReasonExplanations).map(([code, desc]) => (
                <div
                  key={code}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    background: '#f9fafb',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: '#374151', marginBottom: 4 }}>
                    {code}
                  </div>
                  <div style={{ fontSize: 13, color: '#4b5563' }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Appeal Status Tracker */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Appeal Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  background: appealStateColor[data.appealStatus.state] ?? '#6b7280',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {appealStateLabel[data.appealStatus.state] ?? data.appealStatus.state}
              </span>
              {data.appealStatus.id && (
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  ID: <span style={{ fontFamily: 'monospace' }}>{data.appealStatus.id}</span>
                </span>
              )}
              {data.appealStatus.submittedAt && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  Submitted: {new Date(data.appealStatus.submittedAt).toLocaleString()}
                </span>
              )}
              {data.appealStatus.updatedAt && (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  Updated: {new Date(data.appealStatus.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
            {data.availableActions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 13 }}>Available actions:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: 20 }}>
                  {data.availableActions.map((action, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: '#374151' }}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Appeal Submission Form */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Submit an Appeal</h3>
            {submitSuccess && (
              <div
                style={{
                  ...cardStyle,
                  borderColor: '#bbf7d0',
                  background: '#f0fdf4',
                  color: '#15803d',
                  marginBottom: 12,
                }}
              >
                {submitSuccess}
              </div>
            )}
            {submitError && (
              <div style={{ ...errorCardStyle, marginBottom: 12 }}>{submitError}</div>
            )}
            <form onSubmit={handleAppealSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Reason for Appeal
                </label>
                <textarea
                  value={appealReason}
                  onChange={e => setAppealReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="Explain why this sanction should be reviewed or reversed..."
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Evidence (optional)
                </label>
                <textarea
                  value={appealEvidence}
                  onChange={e => setAppealEvidence(e.target.value)}
                  rows={3}
                  placeholder="Transaction IDs, timestamps, or other supporting evidence..."
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: '#6b7280',
                    border: '2px dashed #d1d5db',
                    borderRadius: 6,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  File upload area — drag &amp; drop supporting documents here (not yet wired)
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={submitting || !appealReason.trim()}
                  style={{
                    padding: '8px 20px',
                    background: submitting || !appealReason.trim() ? '#9ca3af' : '#1d4ed8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting || !appealReason.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SanctionTimelinePage;
