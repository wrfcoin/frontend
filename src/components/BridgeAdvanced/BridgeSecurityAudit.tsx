import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import SecurityIcon from '@mui/icons-material/Security';
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppBadIcon from '@mui/icons-material/GppBad';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BugReportIcon from '@mui/icons-material/BugReport';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfBadge from '../ui/WrfBadge';
import WrfButton from '../ui/WrfButton';
import { colors, borderRadius, spacing } from '../ui/tokens';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

interface ProtocolSecurity {
  name: string;
  score: number;
  validators: number;
  tvl: number;
  incidents: number;
  lastAudit: string;
  auditor: string;
  bugBounty: number;
  insuranceCoverage: number;
  uptime: number;
  openVulnerabilities: number;
}

const PROTOCOLS: ProtocolSecurity[] = [
  { name: 'Axelar', score: 95, validators: 75, tvl: 420000000, incidents: 0, lastAudit: '2026-01-15', auditor: 'Trail of Bits', bugBounty: 2000000, insuranceCoverage: 50000000, uptime: 99.98, openVulnerabilities: 0 },
  { name: 'LayerZero', score: 92, validators: 0, tvl: 380000000, incidents: 1, lastAudit: '2025-12-20', auditor: 'Zellic', bugBounty: 5000000, insuranceCoverage: 40000000, uptime: 99.95, openVulnerabilities: 1 },
  { name: 'Wormhole', score: 88, validators: 19, tvl: 550000000, incidents: 2, lastAudit: '2026-01-28', auditor: 'Neodyme', bugBounty: 10000000, insuranceCoverage: 100000000, uptime: 99.90, openVulnerabilities: 0 },
  { name: 'Stargate', score: 90, validators: 0, tvl: 620000000, incidents: 0, lastAudit: '2025-11-30', auditor: 'Quantstamp', bugBounty: 1500000, insuranceCoverage: 30000000, uptime: 99.97, openVulnerabilities: 0 },
  { name: 'Synapse', score: 85, validators: 0, tvl: 280000000, incidents: 1, lastAudit: '2025-10-15', auditor: 'PeckShield', bugBounty: 500000, insuranceCoverage: 15000000, uptime: 99.88, openVulnerabilities: 2 },
  { name: 'Hop', score: 91, validators: 1, tvl: 350000000, incidents: 0, lastAudit: '2025-12-05', auditor: 'Spearbit', bugBounty: 1000000, insuranceCoverage: 25000000, uptime: 99.94, openVulnerabilities: 0 },
  { name: 'IBC', score: 96, validators: 180, tvl: 800000000, incidents: 0, lastAudit: '2026-02-01', auditor: 'Informal Systems', bugBounty: 3000000, insuranceCoverage: 80000000, uptime: 99.99, openVulnerabilities: 0 },
  { name: 'XCMP', score: 93, validators: 297, tvl: 450000000, incidents: 0, lastAudit: '2026-01-10', auditor: 'SRLabs', bugBounty: 2500000, insuranceCoverage: 60000000, uptime: 99.96, openVulnerabilities: 0 },
];

interface SecurityIncident {
  id: number;
  date: string;
  protocol: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  impact: string;
  resolved: boolean;
  lossAmount: number;
  recoveredAmount: number;
}

const INCIDENTS: SecurityIncident[] = [
  { id: 1, date: '2025-02-03', protocol: 'Wormhole', severity: 'critical', title: 'Guardian signature bypass exploit', impact: '$320M unauthorized minting', resolved: true, lossAmount: 320000000, recoveredAmount: 320000000 },
  { id: 2, date: '2025-08-12', protocol: 'LayerZero', severity: 'medium', title: 'Oracle manipulation in price feed', impact: 'Brief price discrepancy on minor pairs', resolved: true, lossAmount: 450000, recoveredAmount: 450000 },
  { id: 3, date: '2025-04-28', protocol: 'Synapse', severity: 'high', title: 'Flash loan attack on AMM pool', impact: '$2.8M drained from USDC-USDT pool', resolved: true, lossAmount: 2800000, recoveredAmount: 1900000 },
  { id: 4, date: '2025-09-15', protocol: 'Wormhole', severity: 'low', title: 'Rate limiting bypass on relayer', impact: 'No funds lost, spam transactions', resolved: true, lossAmount: 0, recoveredAmount: 0 },
];

interface InsurancePolicy {
  provider: string;
  coverage: number;
  premium: number;
  protocols: string[];
  claimsProcess: string;
  deductible: number;
}

const INSURANCE: InsurancePolicy[] = [
  { provider: 'Nexus Mutual', coverage: 50000000, premium: 2.5, protocols: ['Axelar', 'LayerZero', 'Wormhole'], claimsProcess: '72h review', deductible: 5 },
  { provider: 'InsurAce', coverage: 30000000, premium: 1.8, protocols: ['Stargate', 'Synapse', 'Hop'], claimsProcess: '48h review', deductible: 3 },
  { provider: 'Sherlock', coverage: 20000000, premium: 3.2, protocols: ['IBC', 'XCMP'], claimsProcess: '24h review', deductible: 2 },
];

interface SecurityRecommendation {
  id: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  protocol: string;
  action: string;
}

const RECOMMENDATIONS: SecurityRecommendation[] = [
  { id: 1, priority: 'critical', title: 'Update Synapse integration', description: '2 open vulnerabilities detected in the latest audit. Upgrade to v3.2.1 which patches CVE-2026-0142.', protocol: 'Synapse', action: 'Upgrade Now' },
  { id: 2, priority: 'high', title: 'Increase multisig threshold', description: 'Current 3/5 threshold for bridge operations is below recommended 5/7 for TVL above $100M.', protocol: 'Wormhole', action: 'Review Config' },
  { id: 3, priority: 'medium', title: 'Add circuit breaker limits', description: 'LayerZero integration lacks per-block transfer limits. Add 500 WRF max per block.', protocol: 'LayerZero', action: 'Add Limits' },
  { id: 4, priority: 'low', title: 'Rotate oracle keys', description: 'Axelar oracle signing keys have not been rotated in 180 days. Recommended rotation: 90 days.', protocol: 'Axelar', action: 'Rotate Keys' },
];

// ---------------------------------------------------------------------------
// Security Gauge (SVG)
// ---------------------------------------------------------------------------

const SecurityGauge: React.FC<{ score: number; size?: number }> = ({ score, size = 220 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 16;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const filledLength = (score / 100) * arcLength;
  const startAngle = 135; // degrees

  const gaugeColor =
    score >= 90 ? colors.success.main :
      score >= 80 ? colors.warning.main :
        colors.error.main;

  const gradientId = `gauge-grad-${score}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.error.main} />
          <stop offset="50%" stopColor={colors.warning.main} />
          <stop offset="100%" stopColor={colors.success.main} />
        </linearGradient>
      </defs>

      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={colors.bg.tertiary}
        strokeWidth={12}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={-circumference * 0.125}
        strokeLinecap="round"
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />

      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={12}
        strokeDasharray={`${filledLength} ${circumference - filledLength}`}
        strokeDashoffset={-circumference * 0.125}
        strokeLinecap="round"
        transform={`rotate(${startAngle} ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />

      {/* Score text */}
      <text x={cx} y={cy - 8} fill={gaugeColor} fontSize={36} fontWeight={800} textAnchor="middle" dominantBaseline="central">
        {score}
      </text>
      <text x={cx} y={cy + 18} fill={colors.text.secondary} fontSize={12} textAnchor="middle">
        / 100
      </text>
      <text x={cx} y={cy + 36} fill={colors.text.muted} fontSize={10} textAnchor="middle">
        Overall Security Score
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Score Badge Inline
// ---------------------------------------------------------------------------

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const badgeColor =
    score >= 90 ? colors.success.main :
      score >= 80 ? colors.warning.main :
        colors.error.main;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: `${badgeColor}22`,
        border: `2px solid ${badgeColor}`,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: badgeColor }}>
        {score}
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BridgeSecurityAuditSample: React.FC = () => {
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const overallScore = useMemo(() => {
    const totalTvl = PROTOCOLS.reduce((sum, p) => sum + p.tvl, 0);
    const weightedScore = PROTOCOLS.reduce((sum, p) => sum + p.score * (p.tvl / totalTvl), 0);
    return Math.round(weightedScore);
  }, []);

  const totalTvl = useMemo(() => PROTOCOLS.reduce((sum, p) => sum + p.tvl, 0), []);
  const totalInsurance = useMemo(() => INSURANCE.reduce((sum, i) => sum + i.coverage, 0), []);
  const totalBugBounty = useMemo(() => PROTOCOLS.reduce((sum, p) => sum + p.bugBounty, 0), []);
  const openVulns = useMemo(() => PROTOCOLS.reduce((sum, p) => sum + p.openVulnerabilities, 0), []);

  const severityColor: Record<string, string> = {
    critical: colors.error.main,
    high: '#F97316',
    medium: colors.warning.main,
    low: colors.brand.primary,
  };

  const priorityColor: Record<string, string> = {
    critical: colors.error.main,
    high: '#F97316',
    medium: colors.warning.main,
    low: colors.brand.primary,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SecurityIcon sx={{ color: colors.success.main, fontSize: 32 }} />
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
            Bridge Security Audit
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            Security scores, incident history, insurance coverage, and vulnerability tracking
          </Typography>
        </Box>
      </Box>

      {/* Top Row: Gauge + Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <WrfCard variant="elevated" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <SecurityGauge score={overallScore} />
          </WrfCard>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <WrfStatCard
                label="Total TVL Secured"
                value={`$${(totalTvl / 1000000000).toFixed(2)}B`}
                trend={8.4}
                trendLabel="30d"
                icon={LocalAtmIcon}
                color={colors.brand.primary}
                sparklineData={[3.2, 3.3, 3.4, 3.5, 3.4, 3.6, 3.7, 3.6, 3.8, 3.85, 3.8, 3.85]}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <WrfStatCard
                label="Insurance Coverage"
                value={`$${(totalInsurance / 1000000).toFixed(0)}M`}
                trend={12}
                trendLabel="increase"
                icon={HealthAndSafetyIcon}
                color={colors.success.main}
                sparklineData={[75, 78, 80, 82, 85, 88, 90, 92, 95, 97, 98, 100]}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <WrfStatCard
                label="Bug Bounties"
                value={`$${(totalBugBounty / 1000000).toFixed(1)}M`}
                trend={5.2}
                trendLabel="allocated"
                icon={BugReportIcon}
                color={colors.warning.main}
                sparklineData={[20, 21, 22, 22.5, 23, 23.5, 24, 24, 24.5, 25, 25.5, 25.5]}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <WrfStatCard
                label="Open Vulnerabilities"
                value={openVulns.toString()}
                trend={openVulns > 0 ? openVulns : 0}
                trendLabel={openVulns > 0 ? 'need attention' : 'none'}
                icon={openVulns > 0 ? GppBadIcon : GppGoodIcon}
                color={openVulns > 0 ? colors.error.main : colors.success.main}
                sparklineData={[5, 4, 3, 4, 3, 2, 3, 2, 3, 2, 3, 3]}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Protocol Security Cards */}
      <WrfCard title="Protocol Security Scores" subtitle="Detailed security assessment for each bridge protocol" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {PROTOCOLS.map((protocol) => {
            const isExpanded = expandedProtocol === protocol.name;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={protocol.name}>
                <Box
                  onClick={() => setExpandedProtocol(isExpanded ? null : protocol.name)}
                  sx={{
                    bgcolor: colors.bg.primary,
                    borderRadius: `${borderRadius.lg}px`,
                    border: `1px solid ${colors.border.default}`,
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: colors.brand.primary },
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.primary }}>
                      {protocol.name}
                    </Typography>
                    <ScoreBadge score={protocol.score} />
                  </Box>

                  {/* Key metrics */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Validators</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary, fontWeight: 500 }}>
                      {protocol.validators > 0 ? protocol.validators : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>TVL</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary, fontWeight: 500 }}>
                      ${(protocol.tvl / 1000000).toFixed(0)}M
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Incidents</Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: protocol.incidents === 0 ? colors.success.main : colors.warning.main,
                      }}
                    >
                      {protocol.incidents}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Uptime</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.success.main, fontWeight: 500 }}>
                      {protocol.uptime}%
                    </Typography>
                  </Box>

                  {/* Open vulns indicator */}
                  {protocol.openVulnerabilities > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        py: 0.5,
                        px: 1,
                        borderRadius: `${borderRadius.sm}px`,
                        bgcolor: `${colors.error.main}15`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <WarningAmberIcon sx={{ fontSize: 12, color: colors.error.main }} />
                      <Typography sx={{ fontSize: '0.65rem', color: colors.error.main, fontWeight: 600 }}>
                        {protocol.openVulnerabilities} open vulnerabilit{protocol.openVulnerabilities > 1 ? 'ies' : 'y'}
                      </Typography>
                    </Box>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.border.default}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Last Audit</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary }}>{protocol.lastAudit}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Auditor</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.brand.primary }}>{protocol.auditor}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Bug Bounty</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.warning.main, fontWeight: 600 }}>
                          ${(protocol.bugBounty / 1000000).toFixed(1)}M
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Insurance</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.success.main, fontWeight: 600 }}>
                          ${(protocol.insuranceCoverage / 1000000).toFixed(0)}M
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </WrfCard>

      {/* Incident Timeline + Insurance + Recommendations */}
      <Grid container spacing={2}>
        {/* Incident Timeline */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <WrfCard title="Incident Timeline" subtitle="Historical security incidents across bridge protocols">
            {INCIDENTS.length === 0 ? (
              <Typography sx={{ color: colors.text.muted, textAlign: 'center', py: 4 }}>
                No incidents recorded
              </Typography>
            ) : (
              <Box sx={{ position: 'relative' }}>
                {/* Timeline line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: colors.border.default,
                  }}
                />

                {INCIDENTS.map((incident, idx) => (
                  <Box key={incident.id} sx={{ position: 'relative', pl: 5, pb: idx < INCIDENTS.length - 1 ? 3 : 0 }}>
                    {/* Timeline dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: 4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: `${severityColor[incident.severity]}22`,
                        border: `2px solid ${severityColor[incident.severity]}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: severityColor[incident.severity] }} />
                    </Box>

                    {/* Content */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>{incident.date}</Typography>
                        <Chip
                          size="small"
                          label={incident.severity.toUpperCase()}
                          sx={{
                            height: 18,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            bgcolor: `${severityColor[incident.severity]}22`,
                            color: severityColor[incident.severity],
                          }}
                        />
                        <Chip
                          size="small"
                          label={incident.protocol}
                          sx={{
                            height: 18,
                            fontSize: '0.55rem',
                            fontWeight: 600,
                            bgcolor: `${colors.brand.primary}22`,
                            color: colors.brand.primary,
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text.primary, mb: 0.3 }}>
                        {incident.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, mb: 0.5 }}>
                        {incident.impact}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {incident.lossAmount > 0 && (
                          <Typography sx={{ fontSize: '0.7rem', color: colors.error.main }}>
                            Loss: ${(incident.lossAmount / 1000000).toFixed(1)}M
                          </Typography>
                        )}
                        {incident.recoveredAmount > 0 && (
                          <Typography sx={{ fontSize: '0.7rem', color: colors.success.main }}>
                            Recovered: ${(incident.recoveredAmount / 1000000).toFixed(1)}M
                          </Typography>
                        )}
                        <WrfBadge
                          status={incident.resolved ? 'online' : 'degraded'}
                          label={incident.resolved ? 'Resolved' : 'Open'}
                          size="sm"
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </WrfCard>
        </Grid>

        {/* Insurance Overview + Recommendations */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Grid container spacing={2}>
            {/* Insurance */}
            <Grid size={12}>
              <WrfCard title="Insurance Coverage" subtitle="Bridge protocol insurance policies and coverage limits">
                <Grid container spacing={2}>
                  {INSURANCE.map((policy) => (
                    <Grid size={{ xs: 12, md: 4 }} key={policy.provider}>
                      <Box
                        sx={{
                          bgcolor: colors.bg.primary,
                          borderRadius: `${borderRadius.lg}px`,
                          border: `1px solid ${colors.border.default}`,
                          p: 2,
                        }}
                      >
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.primary, mb: 1 }}>
                          {policy.provider}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Coverage</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.success.main, fontWeight: 700 }}>
                            ${(policy.coverage / 1000000).toFixed(0)}M
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Premium</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary }}>{policy.premium}%/yr</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Deductible</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary }}>{policy.deductible}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>Claims</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: colors.text.primary }}>{policy.claimsProcess}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {policy.protocols.map((p) => (
                            <Chip
                              key={p}
                              size="small"
                              label={p}
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                bgcolor: `${colors.brand.primary}15`,
                                color: colors.brand.primary,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </WrfCard>
            </Grid>

            {/* Recommendations */}
            <Grid size={12}>
              <WrfCard title="Security Recommendations" subtitle="Actionable items to improve bridge security posture">
                {RECOMMENDATIONS.map((rec) => (
                  <Box
                    key={rec.id}
                    sx={{
                      bgcolor: colors.bg.primary,
                      borderRadius: `${borderRadius.lg}px`,
                      border: `1px solid ${colors.border.default}`,
                      borderLeft: `3px solid ${priorityColor[rec.priority]}`,
                      p: 2,
                      mb: 1.5,
                      '&:last-child': { mb: 0 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={rec.priority.toUpperCase()}
                          sx={{
                            height: 18,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            bgcolor: `${priorityColor[rec.priority]}22`,
                            color: priorityColor[rec.priority],
                          }}
                        />
                        <Chip
                          size="small"
                          label={rec.protocol}
                          sx={{
                            height: 18,
                            fontSize: '0.55rem',
                            fontWeight: 600,
                            bgcolor: `${colors.bg.tertiary}`,
                            color: colors.text.secondary,
                          }}
                        />
                      </Box>
                      <WrfButton variant="secondary" size="sm">
                        {rec.action}
                      </WrfButton>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text.primary, mb: 0.3 }}>
                      {rec.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, lineHeight: 1.5 }}>
                      {rec.description}
                    </Typography>
                  </Box>
                ))}
              </WrfCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

const BridgeSecurityAudit: React.FC = () => (
  <DemoSurfaceGate
    title="Bridge security evidence is not live on the testnet yet"
    description="No verified bridge audit or insurance evidence is available."
    testId="bridge-security"
  >
    <BridgeSecurityAuditSample />
  </DemoSurfaceGate>
);

export default BridgeSecurityAudit;
