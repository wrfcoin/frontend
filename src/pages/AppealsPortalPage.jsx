import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import {
  WrfCard,
  WrfStatCard,
  WrfBadge,
  WrfButton,
  WrfSkeleton,
  WrfAlert,
  WrfEmptyState,
} from '../components/DesignSystem';
import { fetchAppeals } from '../services/governanceService';

const statusBadgeMap = {
  filed: 'info',
  under_review: 'warning',
  decided: 'active',
  dismissed: 'neutral',
};

const timelineSteps = ['filed', 'under_review', 'decided'];
const timelineLabels = {
  filed: 'Filed',
  under_review: 'Under Review',
  decided: 'Decision',
};

function AppealTimeline({ status }) {
  const theme = useTheme();
  const activeIndex = timelineSteps.indexOf(status);
  const activeColor = theme.palette.primary.main;
  const inactiveColor = theme.palette.action.disabled;

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', mt: 1.25 }}
      role="progressbar"
      aria-label="Appeal progress"
      aria-valuenow={activeIndex + 1}
      aria-valuemin={1}
      aria-valuemax={timelineSteps.length}
    >
      {timelineSteps.map((step, idx) => {
        const isPast = idx <= activeIndex;
        const isActive = idx === activeIndex;
        return (
          <Box
            key={step}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: idx < timelineSteps.length - 1 ? 1 : 'none',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: isPast ? activeColor : inactiveColor,
                  border: isActive
                    ? `2px solid ${activeColor}`
                    : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: isPast ? '#fff' : 'text.disabled',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              >
                {isPast ? '\u2713' : idx + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: isPast ? activeColor : 'text.disabled',
                  mt: 0.25,
                  whiteSpace: 'nowrap',
                  fontSize: 10,
                }}
              >
                {timelineLabels[step]}
              </Typography>
            </Box>
            {idx < timelineSteps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: idx < activeIndex ? activeColor : inactiveColor,
                  mx: 0.25,
                  mb: 1.75,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function AppealsPortalPage() {
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['appeals'],
    queryFn: fetchAppeals,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfSkeleton variant="card" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfAlert severity="error">{error.message}</WrfAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Appeals Portal
        </Typography>
        <WrfButton variant="primary" component={Link} to="/governance/sanctions">
          + New Appeal
        </WrfButton>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Track active appeals, evidence packs, timeline progress, and decisions
        for all submitted governance appeals.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {/* Summary KPIs */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 1.5,
          }}
        >
          <WrfStatCard label="Total Appeals" value={data.summary.total} />
          <WrfStatCard label="Active" value={data.summary.active} />
          <WrfStatCard label="Under Review" value={data.summary.underReview} />
          <WrfStatCard label="Decided" value={data.summary.decided} />
        </Box>

        {/* Active Appeals */}
        <WrfCard headerTitle="Active Appeals">
          {data.appeals.length === 0 ? (
            <WrfEmptyState
              variant="no-data"
              title="No active appeals"
              description="No active appeals found."
            />
          ) : (
            <Box sx={{ display: 'grid', gap: 1.75 }}>
              {data.appeals.map((appeal) => (
                <WrfCard key={appeal.id} variant="outlined" sx={{ p: 1.75 }}>
                  {/* Appeal header */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1.25,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                    >
                      #{appeal.id}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }}>
                      {appeal.type}
                    </Typography>
                    <WrfBadge
                      label={appeal.status.replace(/_/g, ' ')}
                      status={statusBadgeMap[appeal.status] ?? 'neutral'}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Filed {new Date(appeal.filingDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <AppealTimeline status={appeal.status} />

                  <WrfButton
                    variant="outline"
                    size="sm"
                    sx={{ mt: 1.25 }}
                    onClick={() =>
                      setExpandedId(expandedId === appeal.id ? null : appeal.id)
                    }
                    aria-expanded={expandedId === appeal.id}
                    aria-controls={`appeal-details-${appeal.id}`}
                  >
                    {expandedId === appeal.id ? 'Hide details' : 'Show details'}
                  </WrfButton>

                  {expandedId === appeal.id && (
                    <Box
                      id={`appeal-details-${appeal.id}`}
                      sx={{ mt: 1.75, display: 'grid', gap: 1.5 }}
                    >
                      {/* Evidence pack */}
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, color: 'text.primary' }}
                        >
                          Evidence Pack
                        </Typography>
                        {appeal.evidencePack && appeal.evidencePack.length > 0 ? (
                          <List dense disablePadding>
                            {appeal.evidencePack.map((item, idx) => (
                              <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                                <ListItemText
                                  primary={
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {item.label}
                                      </Typography>
                                      {item.timestamp && (
                                        <Typography
                                          variant="caption"
                                          sx={{ color: 'text.disabled' }}
                                        >
                                          {new Date(
                                            item.timestamp,
                                          ).toLocaleString()}
                                        </Typography>
                                      )}
                                      {item.url && (
                                        <Typography
                                          component="a"
                                          href={item.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          variant="caption"
                                          sx={{ color: 'primary.main' }}
                                        >
                                          View document
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            No evidence submitted.
                          </Typography>
                        )}
                      </Box>

                      {/* Decision */}
                      {appeal.decision && (
                        <WrfAlert
                          severity={
                            appeal.decision.outcome === 'approved'
                              ? 'success'
                              : 'error'
                          }
                          title={`Decision: ${appeal.decision.outcome.charAt(0).toUpperCase() + appeal.decision.outcome.slice(1)}`}
                        >
                          <Typography variant="body2">
                            {appeal.decision.explanation}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
                          >
                            Decided{' '}
                            {new Date(
                              appeal.decision.decidedAt,
                            ).toLocaleDateString()}
                          </Typography>
                        </WrfAlert>
                      )}
                    </Box>
                  )}
                </WrfCard>
              ))}
            </Box>
          )}
        </WrfCard>
      </Box>
    </Box>
  );
}

export default AppealsPortalPage;
