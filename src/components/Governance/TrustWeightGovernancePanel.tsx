import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  governanceService,
  type TrustProposalBuildResponse,
  type TrustRewardImpactPoint,
  type TrustRewardImpactSummaryResponse,
  type TrustRewardImpactTimelineResponse,
  type TrustWeightsResponse,
} from '../../services/governanceService';

const TARGET_OPTIONS = [
  { value: 'unverified_weight', label: 'Unverified Weight' },
  { value: 'verified_station_weight', label: 'Verified Station Weight' },
  { value: 'trusted_provider_weight', label: 'Trusted Provider Weight' },
];

function safeNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function estimateEffectiveMultiplier(point: TrustRewardImpactPoint): number | null {
  const trust = point.trust_weights;
  const quality = point.quality_reward_multipliers;
  if (!trust || !quality) {
    return null;
  }

  const trustTotal =
    point.trust_class_counts.unverified +
    point.trust_class_counts.verified_station +
    point.trust_class_counts.trusted_provider;
  if (trustTotal === 0) {
    return 0;
  }
  const qualityTotal =
    point.quality_band_counts.high +
    point.quality_band_counts.borderline +
    point.quality_band_counts.warning_only +
    point.quality_band_counts.low;
  if (qualityTotal === 0) {
    return 0;
  }

  const weightedTrust =
    (point.trust_class_counts.unverified * trust.unverified_weight +
      point.trust_class_counts.verified_station * trust.verified_station_weight +
      point.trust_class_counts.trusted_provider * trust.trusted_provider_weight) /
    trustTotal;
  const weightedQuality =
    (point.quality_band_counts.high * quality.high +
      point.quality_band_counts.borderline * quality.borderline +
      point.quality_band_counts.warning_only * quality.warning_only +
      point.quality_band_counts.low * quality.low) /
    qualityTotal;

  return weightedTrust * weightedQuality;
}

const TrustWeightGovernancePanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<TrustWeightsResponse | null>(null);
  const [timeline, setTimeline] = useState<TrustRewardImpactTimelineResponse | null>(null);
  const [summary, setSummary] = useState<TrustRewardImpactSummaryResponse | null>(null);

  const [target, setTarget] = useState('unverified_weight');
  const [value, setValue] = useState('0.90');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TrustProposalBuildResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [weightsData, timelineData, summaryData] = await Promise.all([
          governanceService.getTrustWeights(),
          governanceService.getTrustRewardImpactTimeline({ limit: 20 }),
          governanceService.getTrustRewardImpactSummary(),
        ]);
        setWeights(weightsData);
        setTimeline(timelineData);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trust-weight governance data');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const classDistribution = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      { class: 'Unverified', count: summary.trust_class_counts.unverified },
      { class: 'Verified', count: summary.trust_class_counts.verified_station },
      { class: 'Trusted', count: summary.trust_class_counts.trusted_provider },
    ];
  }, [summary]);

  const multiplierTrend = useMemo(() => {
    if (!timeline) {
      return [];
    }
    return [...timeline.items]
      .sort((a, b) => a.block_height - b.block_height)
      .map(item => ({
        block: item.block_height,
        effective: estimateEffectiveMultiplier(item),
      }));
  }, [timeline]);

  const handlePreview = async () => {
    const parsed = safeNumber(value);
    if (parsed === null) {
      setPreviewError('Value must be a valid numeric trust weight.');
      return;
    }
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      const response = await governanceService.buildTrustWeightProposalPreview(target, parsed);
      setPreview(response);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to build proposal preview');
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Trust-Weight Governance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Guardrail-first parameter preview plus trust-class and reward-multiplier observability.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Trust Weights
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Unverified: ${weights?.current_policy.unverified_weight ?? '-'}`}
                  color="default"
                />
                <Chip
                  label={`Verified: ${weights?.current_policy.verified_station_weight ?? '-'}`}
                  color="primary"
                />
                <Chip
                  label={`Trusted: ${weights?.current_policy.trusted_provider_weight ?? '-'}`}
                  color="success"
                />
              </Stack>
              {weights?.ordering_hints.map(hint => (
                <Alert
                  key={hint.rule}
                  severity={hint.satisfied ? 'success' : 'warning'}
                  sx={{ mb: 1 }}
                >
                  {hint.rule}
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proposal Guardrails
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="trust-target-label">Target</InputLabel>
                  <Select
                    labelId="trust-target-label"
                    value={target}
                    label="Target"
                    onChange={event => setTarget(event.target.value)}
                  >
                    {TARGET_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={`Value (${weights?.bounds.min ?? 0} to ${weights?.bounds.max ?? 1})`}
                  value={value}
                  onChange={event => setValue(event.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  Build Preview
                </Button>
              </Stack>
              {previewError && <Alert severity="error" sx={{ mt: 2 }}>{previewError}</Alert>}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Proposal Payload Preview
            </Typography>
            {!preview && (
              <Typography variant="body2" color="text.secondary">
                Build a preview to validate bounds and ordering before submitting a governance proposal.
              </Typography>
            )}
            {preview && (
              <>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={`parameter: ${preview.proposal_payload.parameter}`} />
                  <Chip label={`value: ${preview.proposal_payload.value}`} color="primary" />
                </Stack>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Resulting trust multipliers:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  {preview.preview.class_multipliers.map(multiplier => (
                    <Chip
                      key={multiplier.contributor_class}
                      label={`${multiplier.contributor_class}: ${multiplier.trust_weight}`}
                    />
                  ))}
                </Stack>
                {preview.preview.ordering_hints.map(hint => (
                  <Alert key={hint.rule} severity={hint.satisfied ? 'success' : 'warning'} sx={{ mb: 1 }}>
                    {hint.rule}
                  </Alert>
                ))}
              </>
            )}
          </Paper>
        </Box>

        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trust-Class Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Blocks observed: {summary?.block_count ?? 0}
              </Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={classDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Reveal count" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Effective Multiplier Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Weighted trust x quality multiplier by block.
              </Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={multiplierTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="block" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="effective"
                      name="Estimated effective multiplier"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quality-Band x Trust-Class Joint Multiplier Matrix
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quality Band</TableCell>
                  <TableCell align="right">Quality Reward</TableCell>
                  <TableCell align="right">Unverified</TableCell>
                  <TableCell align="right">Verified</TableCell>
                  <TableCell align="right">Trusted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(summary?.joint_multiplier_preview || []).map(row => (
                  <TableRow key={row.quality_band}>
                    <TableCell>{row.quality_band}</TableCell>
                    <TableCell align="right">{row.quality_reward_multiplier.toFixed(3)}</TableCell>
                    <TableCell align="right">{row.unverified.toFixed(3)}</TableCell>
                    <TableCell align="right">{row.verified_station.toFixed(3)}</TableCell>
                    <TableCell align="right">{row.trusted_provider.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default TrustWeightGovernancePanel;
