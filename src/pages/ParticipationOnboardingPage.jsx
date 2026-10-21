import { useEffect, useState } from 'react';
import { fetchOnboarding } from '../services/governanceService';

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

const sectionIconMap = {
  rights: '✓',
  duties: '●',
  penalties: '!',
};

const sectionColorMap = {
  rights: '#15803d',
  duties: '#1d4ed8',
  penalties: '#b91c1c',
};

function getSectionKey(title) {
  const t = title.toLowerCase();
  if (t.includes('right')) return 'rights';
  if (t.includes('dut') || t.includes('responsib') || t.includes('expect')) return 'duties';
  if (t.includes('penalt') || t.includes('violation') || t.includes('sanction')) return 'penalties';
  return 'rights';
}

const ONBOARDING_STORAGE_KEY = 'wrfcoin_onboarding_complete';

function ParticipationOnboardingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState([]);
  const [complete, setComplete] = useState(false);
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true') {
        setPreviouslyCompleted(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const payload = await fetchOnboarding();
        if (mounted) {
          setData(payload);
          setError('');
          setAcknowledged(new Array(payload.sections.length).fill(false));
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load onboarding content');
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

  const handleAcknowledge = () => {
    const next = acknowledged.map((v, i) => (i === currentStep ? true : v));
    setAcknowledged(next);
    if (currentStep < (data?.sections.length ?? 0) - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setComplete(true);
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch {
        // localStorage unavailable
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  };

  const handleRestart = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    setPreviouslyCompleted(false);
    setDismissed(false);
    setComplete(false);
    setCurrentStep(0);
    if (data) {
      setAcknowledged(new Array(data.sections.length).fill(false));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 6 }}>Participation Onboarding</h2>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Step through your rights, duties, and the consequences of policy violations before participating in governance.
      </p>

      {loading && <div>Loading onboarding content...</div>}

      {!loading && error && (
        <div style={errorCardStyle}>{error}</div>
      )}

      {!loading && !error && (previouslyCompleted || dismissed) && !complete && (
        <section
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: 32,
            borderColor: '#bbf7d0',
            background: '#f0fdf4',
          }}
        >
          <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 10, color: '#15803d' }} aria-hidden="true">
            &#x1F44B;
          </div>
          <h3 style={{ marginTop: 0, color: '#15803d' }}>Welcome Back</h3>
          <p style={{ color: '#166534', marginBottom: 16 }}>
            You have already completed the participation onboarding.
          </p>
          <button
            onClick={handleRestart}
            style={{
              padding: '8px 20px',
              background: '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            Review Again
          </button>
        </section>
      )}

      {!loading && data && !(previouslyCompleted || dismissed) && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {data.sections.map((section, idx) => {
              const key = getSectionKey(section.title);
              const isActive = idx === currentStep;
              const isDone = acknowledged[idx];
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isDone
                        ? '#15803d'
                        : isActive
                          ? sectionColorMap[key] ?? '#1d4ed8'
                          : '#e5e7eb',
                      color: isDone || isActive ? '#fff' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: isActive ? `2px solid ${sectionColorMap[key] ?? '#1d4ed8'}` : '2px solid transparent',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setCurrentStep(idx)}
                    title={section.title}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#111827' : '#6b7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {section.title}
                  </div>
                  {idx < data.sections.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: isDone ? '#15803d' : '#e5e7eb',
                        margin: '0 4px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Section */}
          {!complete && data.sections[currentStep] && (() => {
            const section = data.sections[currentStep];
            const key = getSectionKey(section.title);
            const color = sectionColorMap[key] ?? '#1d4ed8';
            return (
              <section
                style={{
                  ...cardStyle,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <h3 style={{ marginTop: 0, color }}>
                  {sectionIconMap[key] ?? '→'} {section.title}
                </h3>
                <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                  {section.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 8, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handleAcknowledge}
                    style={{
                      padding: '8px 20px',
                      background: color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {currentStep < data.sections.length - 1
                      ? 'I understand — Next section'
                      : 'I understand — Complete onboarding'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    style={{
                      padding: '8px 20px',
                      background: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Skip
                  </button>
                </div>
              </section>
            );
          })()}

          {/* Completion state */}
          {complete && (
            <section
              style={{
                ...cardStyle,
                borderColor: '#bbf7d0',
                background: '#f0fdf4',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#15803d' }}>Onboarding Complete</h3>
              <p style={{ color: '#166534', marginBottom: 0 }}>
                You have acknowledged all sections. You are now ready to participate in governance. Your acknowledgments
                have been recorded.
              </p>
            </section>
          )}

          {/* All sections summary (read-only overview) */}
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Full Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 }}>
              {data.sections.map((section, idx) => {
                const key = getSectionKey(section.title);
                const color = sectionColorMap[key] ?? '#1d4ed8';
                return (
                  <div
                    key={idx}
                    style={{
                      border: `1px solid ${acknowledged[idx] ? '#bbf7d0' : '#e5e7eb'}`,
                      borderRadius: 8,
                      padding: 12,
                      background: acknowledged[idx] ? '#f0fdf4' : '#f9fafb',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {acknowledged[idx] && (
                        <span style={{ color: '#15803d' }}>✓</span>
                      )}
                      {section.title}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {section.items.slice(0, 3).map((item, i) => (
                        <li key={i} style={{ fontSize: 12, color: '#4b5563', marginBottom: 3 }}>
                          {item}
                        </li>
                      ))}
                      {section.items.length > 3 && (
                        <li style={{ fontSize: 12, color: '#9ca3af' }}>
                          +{section.items.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ParticipationOnboardingPage;
