import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  Tooltip,
  Button,
} from '@mui/material';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import Forest from '@mui/icons-material/Forest';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// ---------------------------------------------------------------------------
// Mock Credit Data
// ---------------------------------------------------------------------------

const CREDITS = [
  {
    id: 'VCS-2847-BR',
    project: 'Amazon Reforestation Initiative',
    type: 'VCS',
    vintage: 2024,
    status: 'Verified',
    tonnes: 1250,
    verifier: 'Verra',
    location: 'Para, Brazil',
    methodology: 'VM0007 REDD+ Methodology',
    additionality: 'High',
    permanenceRisk: 'Low',
    qualityScore: 92,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-03-15', actor: 'Verra Registry', txHash: '0x1a2b3c...4d5e6f' },
      { stage: 'Transfer', date: '2024-06-22', actor: 'Carbon Trading Desk', txHash: '0x7g8h9i...0j1k2l' },
      { stage: 'Retirement', date: '2025-01-10', actor: 'WRFCoin Platform', txHash: '0x3m4n5o...6p7q8r' },
    ],
  },
  {
    id: 'GS-9183-IN',
    project: 'Gujarat Wind Farm Expansion',
    type: 'Gold Standard',
    vintage: 2024,
    status: 'Verified',
    tonnes: 890,
    verifier: 'Gold Standard Foundation',
    location: 'Gujarat, India',
    methodology: 'AMS-I.D. Grid Connected RE',
    additionality: 'High',
    permanenceRisk: 'Very Low',
    qualityScore: 96,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-05-01', actor: 'Gold Standard Registry', txHash: '0xab12cd...ef34gh' },
      { stage: 'Transfer', date: '2024-08-14', actor: 'ClimatePartner', txHash: '0xij56kl...mn78op' },
      { stage: 'Retirement', date: '2025-02-01', actor: 'WRFCoin Platform', txHash: '0xqr90st...uv12wx' },
    ],
  },
  {
    id: 'CDM-4521-KE',
    project: 'Kenya Cookstove Distribution',
    type: 'CDM',
    vintage: 2023,
    status: 'Verified',
    tonnes: 640,
    verifier: 'UNFCCC',
    location: 'Nairobi, Kenya',
    methodology: 'AMS-II.G. Energy Efficiency',
    additionality: 'Medium',
    permanenceRisk: 'Low',
    qualityScore: 84,
    provenanceChain: [
      { stage: 'Issuance', date: '2023-11-20', actor: 'UNFCCC CDM Registry', txHash: '0xcd34ef...gh56ij' },
      { stage: 'Transfer', date: '2024-03-10', actor: 'South Pole', txHash: '0xkl78mn...op90qr' },
      { stage: 'Retirement', date: '2024-09-15', actor: 'WRFCoin Platform', txHash: '0xst12uv...wx34yz' },
    ],
  },
  {
    id: 'VCS-6729-IS',
    project: 'Orca DAC Facility Iceland',
    type: 'VCS',
    vintage: 2025,
    status: 'Pending',
    tonnes: 420,
    verifier: 'Verra',
    location: 'Hellisheidi, Iceland',
    methodology: 'VM0044 Direct Air Capture',
    additionality: 'Very High',
    permanenceRisk: 'Very Low',
    qualityScore: 98,
    provenanceChain: [
      { stage: 'Issuance', date: '2025-01-28', actor: 'Verra Registry', txHash: '0xab56cd...ef78gh' },
      { stage: 'Transfer', date: '2025-02-05', actor: 'Climeworks AG', txHash: '0xij90kl...mn12op' },
    ],
  },
  {
    id: 'GS-3341-CO',
    project: 'Colombian Mangrove Restoration',
    type: 'Gold Standard',
    vintage: 2024,
    status: 'Verified',
    tonnes: 780,
    verifier: 'Gold Standard Foundation',
    location: 'Cartagena, Colombia',
    methodology: 'A/R Methodology Blue Carbon',
    additionality: 'High',
    permanenceRisk: 'Medium',
    qualityScore: 88,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-07-10', actor: 'Gold Standard Registry', txHash: '0xqr34st...uv56wx' },
      { stage: 'Transfer', date: '2024-10-20', actor: 'Ecosystem Marketplace', txHash: '0xyz78ab...cd90ef' },
      { stage: 'Retirement', date: '2025-01-25', actor: 'WRFCoin Platform', txHash: '0xgh12ij...kl34mn' },
    ],
  },
  {
    id: 'VCS-8104-ID',
    project: 'Borneo Peatland Conservation',
    type: 'VCS',
    vintage: 2024,
    status: 'Under Review',
    tonnes: 1680,
    verifier: 'Verra',
    location: 'Kalimantan, Indonesia',
    methodology: 'VM0007 REDD+ Peatland',
    additionality: 'Medium',
    permanenceRisk: 'Medium',
    qualityScore: 79,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-09-15', actor: 'Verra Registry', txHash: '0xop56qr...st78uv' },
    ],
  },
  {
    id: 'GS-1287-ET',
    project: 'Ethiopian Solar Microgrid',
    type: 'Gold Standard',
    vintage: 2025,
    status: 'Pending',
    tonnes: 310,
    verifier: 'Gold Standard Foundation',
    location: 'Addis Ababa, Ethiopia',
    methodology: 'AMS-I.L. Solar PV',
    additionality: 'High',
    permanenceRisk: 'Very Low',
    qualityScore: 91,
    provenanceChain: [
      { stage: 'Issuance', date: '2025-02-01', actor: 'Gold Standard Registry', txHash: '0xwx90yz...ab12cd' },
    ],
  },
  {
    id: 'CDM-7756-CN',
    project: 'Sichuan Hydropower Station',
    type: 'CDM',
    vintage: 2022,
    status: 'Expired',
    tonnes: 2100,
    verifier: 'UNFCCC',
    location: 'Sichuan, China',
    methodology: 'ACM0002 Grid Connected',
    additionality: 'Low',
    permanenceRisk: 'Very Low',
    qualityScore: 62,
    provenanceChain: [
      { stage: 'Issuance', date: '2022-06-01', actor: 'UNFCCC CDM Registry', txHash: '0xef34gh...ij56kl' },
      { stage: 'Expired', date: '2024-06-01', actor: 'Registry Auto-Expiry', txHash: 'N/A' },
    ],
  },
  {
    id: 'VCS-5590-MX',
    project: 'Oaxaca Forest Conservation',
    type: 'VCS',
    vintage: 2024,
    status: 'Verified',
    tonnes: 560,
    verifier: 'Verra',
    location: 'Oaxaca, Mexico',
    methodology: 'VM0015 Avoided Deforestation',
    additionality: 'Medium',
    permanenceRisk: 'Low',
    qualityScore: 85,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-04-12', actor: 'Verra Registry', txHash: '0xmn78op...qr90st' },
      { stage: 'Transfer', date: '2024-07-30', actor: 'Pachama', txHash: '0xuv12wx...yz34ab' },
      { stage: 'Retirement', date: '2025-01-05', actor: 'WRFCoin Platform', txHash: '0xcd56ef...gh78ij' },
    ],
  },
  {
    id: 'GS-4418-BD',
    project: 'Bangladesh Biogas Program',
    type: 'Gold Standard',
    vintage: 2023,
    status: 'Verified',
    tonnes: 280,
    verifier: 'Gold Standard Foundation',
    location: 'Dhaka, Bangladesh',
    methodology: 'AMS-I.C. Thermal Energy',
    additionality: 'High',
    permanenceRisk: 'Low',
    qualityScore: 87,
    provenanceChain: [
      { stage: 'Issuance', date: '2023-08-18', actor: 'Gold Standard Registry', txHash: '0xkl90mn...op12qr' },
      { stage: 'Transfer', date: '2024-01-10', actor: 'myclimate', txHash: '0xst34uv...wx56yz' },
      { stage: 'Retirement', date: '2024-11-20', actor: 'WRFCoin Platform', txHash: '0xab78cd...ef90gh' },
    ],
  },
  {
    id: 'VCS-3912-NO',
    project: 'Norwegian Kelp Blue Carbon',
    type: 'VCS',
    vintage: 2025,
    status: 'Pending',
    tonnes: 95,
    verifier: 'Verra',
    location: 'Tromso, Norway',
    methodology: 'VM0033 Blue Carbon Tidal',
    additionality: 'Very High',
    permanenceRisk: 'Medium',
    qualityScore: 89,
    provenanceChain: [
      { stage: 'Issuance', date: '2025-01-15', actor: 'Verra Registry', txHash: '0xij12kl...mn34op' },
    ],
  },
  {
    id: 'WRF-0042-US',
    project: 'WRFCoin Weather Data Offset',
    type: 'WRFCoin',
    vintage: 2025,
    status: 'Verified',
    tonnes: 1842,
    verifier: 'WRFCoin Validator Network',
    location: 'Distributed (Global)',
    methodology: 'WRF-CC-001 Weather Data Credits',
    additionality: 'High',
    permanenceRisk: 'Very Low',
    qualityScore: 94,
    provenanceChain: [
      { stage: 'Issuance', date: '2025-01-01', actor: 'WRFCoin Protocol', txHash: '0xqr56st...uv78wx' },
      { stage: 'Verified', date: '2025-01-20', actor: 'Validator Consensus', txHash: '0xyz90ab...cd12ef' },
      { stage: 'Retirement', date: '2025-02-10', actor: 'Auto-Retirement', txHash: '0xgh34ij...kl56mn' },
    ],
  },
  {
    id: 'VCS-7103-AU',
    project: 'Great Barrier Reef Protection',
    type: 'VCS',
    vintage: 2024,
    status: 'Under Review',
    tonnes: 450,
    verifier: 'Verra',
    location: 'Queensland, Australia',
    methodology: 'VM0033 Marine Ecosystem',
    additionality: 'High',
    permanenceRisk: 'High',
    qualityScore: 74,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-11-01', actor: 'Verra Registry', txHash: '0xop78qr...st90uv' },
      { stage: 'Review Started', date: '2025-01-15', actor: 'Third-Party Auditor', txHash: '0xwx12yz...ab34cd' },
    ],
  },
  {
    id: 'GS-6645-TZ',
    project: 'Tanzania Agroforestry',
    type: 'Gold Standard',
    vintage: 2024,
    status: 'Verified',
    tonnes: 370,
    verifier: 'Gold Standard Foundation',
    location: 'Arusha, Tanzania',
    methodology: 'A/R Agroforestry CDM',
    additionality: 'Medium',
    permanenceRisk: 'Low',
    qualityScore: 82,
    provenanceChain: [
      { stage: 'Issuance', date: '2024-06-15', actor: 'Gold Standard Registry', txHash: '0xef56gh...ij78kl' },
      { stage: 'Transfer', date: '2024-09-28', actor: 'ClimateCare', txHash: '0xmn90op...qr12st' },
      { stage: 'Retirement', date: '2025-01-18', actor: 'WRFCoin Platform', txHash: '0xuv34wx...yz56ab' },
    ],
  },
  {
    id: 'CDM-2290-VN',
    project: 'Vietnam Landfill Gas Capture',
    type: 'CDM',
    vintage: 2023,
    status: 'Verified',
    tonnes: 520,
    verifier: 'UNFCCC',
    location: 'Ho Chi Minh City, Vietnam',
    methodology: 'ACM0001 Methane Capture',
    additionality: 'Medium',
    permanenceRisk: 'Very Low',
    qualityScore: 80,
    provenanceChain: [
      { stage: 'Issuance', date: '2023-12-05', actor: 'UNFCCC CDM Registry', txHash: '0xcd78ef...gh90ij' },
      { stage: 'Transfer', date: '2024-04-18', actor: 'First Climate', txHash: '0xkl12mn...op34qr' },
      { stage: 'Retirement', date: '2024-10-30', actor: 'WRFCoin Platform', txHash: '0xst56uv...wx78yz' },
    ],
  },
];

const STATUS_CONFIG = {
  Verified: { color: '#10B981', bg: '#10B9811A' },
  Pending: { color: '#F59E0B', bg: '#F59E0B1A' },
  'Under Review': { color: '#3B82F6', bg: '#3B82F61A' },
  Expired: { color: '#EF4444', bg: '#EF44441A' },
};

const TYPE_COLORS = {
  VCS: '#8B5CF6',
  'Gold Standard': '#F59E0B',
  CDM: '#3B82F6',
  WRFCoin: '#10B981',
};

// ---------------------------------------------------------------------------
// Quality Score Badge
// ---------------------------------------------------------------------------

function QualityBadge({ score }) {
  let color = '#EF4444';
  let label = 'Poor';
  if (score >= 90) {
    color = '#10B981';
    label = 'Excellent';
  } else if (score >= 80) {
    color = '#3B82F6';
    label = 'Good';
  } else if (score >= 70) {
    color = '#F59E0B';
    label = 'Fair';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: 60 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: '#334155',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color, fontWeight: 600, minWidth: 24 }}>
        {score}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CreditVerificationSample = () => {
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredCredits = useMemo(() => {
    if (statusFilter === 'All') return CREDITS;
    return CREDITS.filter((c) => c.status === statusFilter);
  }, [statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { All: CREDITS.length };
    CREDITS.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, []);

  const totalTonnes = useMemo(
    () => filteredCredits.reduce((s, c) => s + c.tonnes, 0),
    [filteredCredits],
  );

  const detail = selectedCredit ? CREDITS.find((c) => c.id === selectedCredit) : null;

  return (
    <Paper sx={{ bgcolor: '#1E293B', border: '1px solid #334155', borderRadius: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUser sx={{ color: '#10B981', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
            Credit Verification & Provenance
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          {filteredCredits.length} credits | {totalTonnes.toLocaleString()} tCO&#8322;e
        </Typography>
      </Box>

      {/* Status filter chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {['All', 'Verified', 'Pending', 'Under Review', 'Expired'].map((status) => {
          const config = STATUS_CONFIG[status] || { color: '#94A3B8', bg: '#94A3B81A' };
          return (
            <Chip
              key={status}
              label={`${status} (${statusCounts[status] || 0})`}
              size="small"
              onClick={() => setStatusFilter(status)}
              sx={{
                bgcolor: statusFilter === status ? config.bg || '#3B82F61A' : '#0F172A',
                color: statusFilter === status ? config.color || '#3B82F6' : '#64748B',
                border: statusFilter === status ? `1px solid ${config.color || '#3B82F6'}44` : '1px solid #334155',
                fontWeight: statusFilter === status ? 600 : 400,
                cursor: 'pointer',
                '&:hover': { bgcolor: config.bg || '#3B82F61A' },
              }}
            />
          );
        })}
      </Box>

      <Grid container spacing={3}>
        {/* Credits table */}
        <Grid item xs={12} md={detail ? 7 : 12}>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 2,
              maxHeight: 480,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Credit ID', 'Project', 'Registry', 'Vintage', 'Status', 'tCO\u2082e', 'Quality'].map(
                    (h) => (
                      <TableCell
                        key={h}
                        sx={{
                          bgcolor: '#0F172A',
                          color: '#64748B',
                          borderBottom: '1px solid #334155',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCredits.map((credit) => {
                  const statusCfg = STATUS_CONFIG[credit.status] || {};
                  return (
                    <TableRow
                      key={credit.id}
                      hover
                      onClick={() => setSelectedCredit(credit.id === selectedCredit ? null : credit.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: credit.id === selectedCredit ? '#1E293B' : 'transparent',
                        '&:hover': { bgcolor: '#1E293B' },
                      }}
                    >
                      <TableCell sx={{ color: '#3B82F6', borderBottom: '1px solid #1E293B', fontWeight: 600, fontSize: '0.75rem' }}>
                        {credit.id}
                      </TableCell>
                      <TableCell sx={{ color: '#CBD5E1', borderBottom: '1px solid #1E293B', fontSize: '0.75rem', maxWidth: 160 }}>
                        <Tooltip title={credit.project}>
                          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#CBD5E1' }}>
                            {credit.project}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #1E293B' }}>
                        <Chip
                          label={credit.type}
                          size="small"
                          sx={{
                            bgcolor: `${TYPE_COLORS[credit.type] || '#3B82F6'}1A`,
                            color: TYPE_COLORS[credit.type] || '#3B82F6',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', borderBottom: '1px solid #1E293B', fontSize: '0.75rem' }}>
                        {credit.vintage}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #1E293B' }}>
                        <Chip
                          label={credit.status}
                          size="small"
                          sx={{
                            bgcolor: statusCfg.bg || '#94A3B81A',
                            color: statusCfg.color || '#94A3B8',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#F1F5F9', borderBottom: '1px solid #1E293B', fontWeight: 600, fontSize: '0.75rem' }}>
                        {credit.tonnes.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #1E293B' }}>
                        <QualityBadge score={credit.qualityScore} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Detail panel */}
        {detail && (
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                bgcolor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 2,
                p: 2,
              }}
            >
              {/* Project header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Forest sx={{ color: '#10B981', fontSize: 24 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600, lineHeight: 1.2 }}>
                    {detail.project}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {detail.id}
                  </Typography>
                </Box>
              </Box>

              {/* Project details grid */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {[
                  { label: 'Location', value: detail.location },
                  { label: 'Methodology', value: detail.methodology },
                  { label: 'Verification Body', value: detail.verifier },
                  { label: 'Additionality', value: detail.additionality },
                  { label: 'Permanence Risk', value: detail.permanenceRisk },
                  { label: 'Quality Score', value: `${detail.qualityScore}/100` },
                ].map((field) => (
                  <Grid item xs={6} key={field.label}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      {field.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 500, fontSize: '0.8rem' }}>
                      {field.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Map placeholder */}
              <Paper
                sx={{
                  bgcolor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 80,
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Map: {detail.location}
                </Typography>
              </Paper>

              <Divider sx={{ borderColor: '#334155', mb: 2 }} />

              {/* Blockchain provenance timeline */}
              <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5 }}>
                Blockchain Provenance Chain
              </Typography>
              <Box sx={{ position: 'relative', pl: 3 }}>
                {/* Vertical line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: 4,
                    bottom: 4,
                    width: 2,
                    bgcolor: '#334155',
                  }}
                />
                {detail.provenanceChain.map((step, idx) => (
                  <Box key={idx} sx={{ position: 'relative', mb: 2 }}>
                    {/* Dot on timeline */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -21,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: idx === detail.provenanceChain.length - 1 ? '#10B981' : '#3B82F6',
                        border: '2px solid #0F172A',
                      }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.8rem' }}>
                          {step.stage}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {step.date}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                        {step.actor}
                      </Typography>
                      {step.txHash !== 'N/A' && (
                        <Typography variant="caption" sx={{ color: '#3B82F6', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                          tx: {step.txHash}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const CreditVerification = () => (
  <DemoSurfaceGate
    title="Carbon credit verification is not live on the testnet"
    description="No testnet endpoint serves carbon credits or their verification status yet."
    testId="carbon-credit-verification"
  >
    <CreditVerificationSample />
  </DemoSurfaceGate>
);

export default CreditVerification;
