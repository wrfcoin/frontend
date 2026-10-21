import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import {
  WrfCard,
  WrfBadge,
  WrfDataTable,
  WrfSkeleton,
  WrfAlert,
} from '../components/DesignSystem';
import { fetchActorTransparency } from '../services/governanceService';

const actorTypeBadge = { human: 'info', ai: 'warning', robot: 'active' };

function confidenceColor(score) {
  if (score >= 80) return 'success.main';
  if (score >= 50) return 'warning.main';
  return 'error.main';
}

const severityStatusMap = {
  low: 'active',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const sanctionColumns = [
  { key: 'offenseType', label: 'Offense Type', sortable: true },
  {
    key: 'severity',
    label: 'Severity',
    render: (val) => (
      <WrfBadge label={val} status={severityStatusMap[val] ?? 'neutral'} />
    ),
  },
  { key: 'humanPenalty', label: 'Human Penalty' },
  { key: 'aiPenalty', label: 'AI Penalty' },
  { key: 'robotPenalty', label: 'Robot Penalty' },
  { key: 'rationale', label: 'Rationale' },
];

function ActorTransparencyPage() {
  const theme = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ['actor-transparency'],
    queryFn: fetchActorTransparency,
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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Actor Transparency
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Automation confidence scores per actor and sanction parity explanations
        across humans, AI, and robots.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {/* Automation Confidence */}
        <WrfCard headerTitle="Automation Confidence by Actor">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 1.75,
            }}
          >
            {data.actors.map((actor) => (
              <WrfCard key={actor.id} variant="outlined" sx={{ p: 1.75 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <WrfBadge
                    label={actor.type}
                    status={actorTypeBadge[actor.type] ?? 'neutral'}
                  />
                  <Typography sx={{ fontWeight: 700, fontSize: 14, flex: 1 }}>
                    {actor.name}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'monospace',
                    mb: 0.75,
                    display: 'block',
                  }}
                >
                  {actor.id}
                </Typography>

                <Box sx={{ mt: 0.75 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.375,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Automation Confidence
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: confidenceColor(actor.automationConfidence),
                      }}
                    >
                      {actor.automationConfidence}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, actor.automationConfidence))}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: confidenceColor(actor.automationConfidence),
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>
              </WrfCard>
            ))}
          </Box>
        </WrfCard>

        {/* Sanction Parity Principles */}
        <WrfCard headerTitle="Sanction Parity Principles">
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 1.75 }}
          >
            WRFCoin governance enforces equal penalties for the same offense
            regardless of actor class. Below are the guiding principles.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 1.75,
            }}
          >
            {data.parityPrinciples.map((principle, idx) => (
              <WrfCard key={idx} variant="filled" sx={{ p: 1.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.75 }}>
                  {principle.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', lineHeight: 1.5 }}
                >
                  {principle.explanation}
                </Typography>
              </WrfCard>
            ))}
          </Box>
        </WrfCard>

        {/* Severity Comparison Table */}
        <WrfCard headerTitle="Severity Comparison Table">
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 1.75 }}
          >
            Penalties are identical across actor classes for the same offense
            type. Parity is enforced at the protocol level.
          </Typography>
          <WrfDataTable
            columns={sanctionColumns}
            data={data.sanctionComparisons}
            searchable
            pagination
            pageSize={10}
          />
        </WrfCard>

        {/* Sanction Type Rationale */}
        <WrfCard headerTitle="Sanction Type Rationale">
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {data.sanctionRationale.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  pl: 1.75,
                  py: 0.75,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.5 }}>
                  {item.sanctionType}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', lineHeight: 1.5 }}
                >
                  {item.rationale}
                </Typography>
              </Box>
            ))}
          </Box>
        </WrfCard>
      </Box>
    </Box>
  );
}

export default ActorTransparencyPage;
