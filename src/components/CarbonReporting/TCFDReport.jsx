import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Assessment from '@mui/icons-material/Assessment';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import VerifiedUser from '@mui/icons-material/VerifiedUser';

// ---------------------------------------------------------------------------
// TCFD Pillar Data
// ---------------------------------------------------------------------------

const TCFD_PILLARS = [
  {
    id: 'governance',
    title: 'Governance',
    subtitle: 'The organization\'s governance around climate-related risks and opportunities',
    color: '#3B82F6',
    score: 85,
    items: [
      {
        id: 'gov_a',
        label: 'Board Oversight',
        description:
          'The Board of Directors maintains a dedicated Climate & Sustainability Committee that meets quarterly to review climate-related risks, approve emission reduction targets, and oversee the carbon credit portfolio. The committee includes two members with specific climate expertise.',
        compliant: true,
        data: [
          { metric: 'Committee meetings (annual)', value: '4' },
          { metric: 'Board members with climate expertise', value: '2 of 9' },
          { metric: 'Last climate risk review', value: 'Q4 2025' },
          { metric: 'Climate KPIs in executive compensation', value: 'Yes (15% weight)' },
        ],
      },
      {
        id: 'gov_b',
        label: 'Management\'s Role',
        description:
          'The Chief Sustainability Officer (CSO) reports directly to the CEO and leads a cross-functional Climate Action Team. Monthly progress reviews track emission reduction initiatives, carbon credit purchases, and regulatory compliance. Department heads are accountable for scope-specific targets.',
        compliant: true,
        data: [
          { metric: 'CSO reporting line', value: 'Direct to CEO' },
          { metric: 'Climate Action Team size', value: '12 members' },
          { metric: 'Progress review frequency', value: 'Monthly' },
          { metric: 'Departments with climate KPIs', value: '8 of 10' },
        ],
      },
    ],
  },
  {
    id: 'strategy',
    title: 'Strategy',
    subtitle: 'The actual and potential impacts of climate-related risks and opportunities',
    color: '#10B981',
    score: 72,
    items: [
      {
        id: 'str_a',
        label: 'Climate Risks & Opportunities',
        description:
          'The organization has identified 14 climate-related risks (7 transition, 7 physical) and 8 opportunities through structured scenario analysis. Key transition risks include carbon pricing regulations and technology shifts. Physical risks encompass extreme weather events affecting supply chain and operations.',
        compliant: true,
        data: [
          { metric: 'Transition risks identified', value: '7' },
          { metric: 'Physical risks identified', value: '7' },
          { metric: 'Opportunities identified', value: '8' },
          { metric: 'Risks with mitigation plans', value: '12 of 14' },
        ],
      },
      {
        id: 'str_b',
        label: 'Impact on Business Strategy',
        description:
          'Climate considerations are embedded in the 5-year strategic plan. The organization has committed to net-zero by 2040 and has allocated $24M for climate transition investments. Revenue from climate-positive products is projected to reach 30% of total revenue by 2030.',
        compliant: true,
        data: [
          { metric: 'Net-zero target year', value: '2040' },
          { metric: 'Transition investment budget', value: '$24M' },
          { metric: 'Climate-positive revenue target', value: '30% by 2030' },
          { metric: 'Stranded asset exposure', value: '$4.2M (managed)' },
        ],
      },
      {
        id: 'str_c',
        label: 'Resilience of Strategy',
        description:
          'Strategy resilience has been assessed under three climate scenarios (1.5C, 2C, 4C). Under all scenarios, the organization maintains operational viability. Under the 4C scenario, estimated EBITDA impact is -12% without adaptation measures.',
        compliant: false,
        data: [
          { metric: 'Scenarios analyzed', value: '3 (1.5\u00B0C, 2\u00B0C, 4\u00B0C)' },
          { metric: 'Worst-case EBITDA impact', value: '-12% (4\u00B0C, unadapted)' },
          { metric: 'Adaptation measures costed', value: 'Partial (60%)' },
          { metric: 'Scenario update frequency', value: 'Annual' },
        ],
      },
    ],
  },
  {
    id: 'risk_management',
    title: 'Risk Management',
    subtitle: 'How the organization identifies, assesses, and manages climate-related risks',
    color: '#F59E0B',
    score: 78,
    items: [
      {
        id: 'rm_a',
        label: 'Risk Identification & Assessment',
        description:
          'Climate risks are identified through annual materiality assessments, peer benchmarking, and engagement with scientific advisors. Risks are assessed using a standardized framework considering likelihood, magnitude, and velocity. The WRFCoin weather data network provides real-time physical risk monitoring.',
        compliant: true,
        data: [
          { metric: 'Assessment methodology', value: 'COSO ERM + TCFD' },
          { metric: 'Assessment frequency', value: 'Annual (full), Quarterly (update)' },
          { metric: 'External data sources', value: '6 (incl. WRFCoin IoT)' },
          { metric: 'Peer companies benchmarked', value: '12' },
        ],
      },
      {
        id: 'rm_b',
        label: 'Risk Management Process',
        description:
          'Climate risks are integrated into the enterprise risk management (ERM) framework. Each risk is assigned an owner, mitigation strategy, and monitoring cadence. High-priority risks are escalated to the Board Climate Committee. The risk register is updated quarterly.',
        compliant: true,
        data: [
          { metric: 'Risks in ERM register', value: '14 climate-specific' },
          { metric: 'Risks with assigned owners', value: '14 of 14' },
          { metric: 'High-priority risks', value: '5' },
          { metric: 'Risk register update cycle', value: 'Quarterly' },
        ],
      },
      {
        id: 'rm_c',
        label: 'Integration with Overall Risk',
        description:
          'Climate risk is a standing agenda item in the quarterly ERM review. Climate-related financial exposures are quantified and included in financial planning. Internal audit includes climate risk controls in the annual audit plan.',
        compliant: false,
        data: [
          { metric: 'ERM integration status', value: 'Integrated' },
          { metric: 'Financial quantification', value: '80% of material risks' },
          { metric: 'Internal audit coverage', value: 'Partial' },
          { metric: 'Insurance review for climate', value: 'Annual' },
        ],
      },
    ],
  },
  {
    id: 'metrics_targets',
    title: 'Metrics & Targets',
    subtitle: 'The metrics and targets used to assess and manage climate-related risks',
    color: '#8B5CF6',
    score: 90,
    items: [
      {
        id: 'mt_a',
        label: 'GHG Emissions (Scope 1/2/3)',
        description:
          'The organization reports GHG emissions in accordance with the GHG Protocol Corporate Standard. All three scopes are measured and verified by an independent third-party auditor annually. Scope 3 coverage includes 8 of 15 categories.',
        compliant: true,
        data: [
          { metric: 'Scope 1 emissions', value: '3,420 tCO\u2082e' },
          { metric: 'Scope 2 emissions (market-based)', value: '5,180 tCO\u2082e' },
          { metric: 'Scope 3 emissions (partial)', value: '4,247 tCO\u2082e' },
          { metric: 'Total emissions', value: '12,847 tCO\u2082e' },
          { metric: 'YoY reduction', value: '-8.9%' },
          { metric: 'Verification standard', value: 'ISO 14064-3' },
        ],
      },
      {
        id: 'mt_b',
        label: 'Targets & Performance',
        description:
          'Science-based targets have been validated by the SBTi. The near-term target is a 42% reduction by 2030 (from 2020 baseline). The net-zero commitment covers all scopes by 2040. Current trajectory is on-track for the near-term target.',
        compliant: true,
        data: [
          { metric: 'Near-term target', value: '-42% by 2030 (SBTi validated)' },
          { metric: 'Long-term target', value: 'Net-zero by 2040 (all scopes)' },
          { metric: '2020 baseline', value: '18,240 tCO\u2082e' },
          { metric: 'Progress to 2030 target', value: '29.5% reduction achieved' },
          { metric: 'On-track status', value: 'Yes' },
          { metric: 'Carbon credits retired (FY25)', value: '12,087 tCO\u2082e' },
        ],
      },
    ],
  },
];

const PREVIOUS_REPORTS = [
  { year: 2024, date: '2024-03-15', score: 68, status: 'Published' },
  { year: 2023, date: '2023-03-20', score: 54, status: 'Published' },
  { year: 2022, date: '2022-04-01', score: 41, status: 'Published' },
];

const INDUSTRY_BENCHMARKS = [
  { metric: 'Overall TCFD Score', org: 81, industry: 62, topQuartile: 85 },
  { metric: 'Governance Disclosure', org: 85, industry: 68, topQuartile: 90 },
  { metric: 'Strategy Disclosure', org: 72, industry: 55, topQuartile: 82 },
  { metric: 'Risk Management Disclosure', org: 78, industry: 60, topQuartile: 84 },
  { metric: 'Metrics & Targets Disclosure', org: 90, industry: 65, topQuartile: 92 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TCFDReport = () => {
  const [checkedItems, setCheckedItems] = useState(() => {
    const initial = {};
    TCFD_PILLARS.forEach((p) => {
      p.items.forEach((item) => {
        initial[item.id] = item.compliant;
      });
    });
    return initial;
  });

  const [expandedPillar, setExpandedPillar] = useState('governance');

  const handleCheckToggle = (itemId) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const overallScore = useMemo(() => {
    const totalItems = TCFD_PILLARS.reduce((s, p) => s + p.items.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((checkedCount / totalItems) * 100);
  }, [checkedItems]);

  const pillarScores = useMemo(() => {
    const scores = {};
    TCFD_PILLARS.forEach((p) => {
      const checked = p.items.filter((item) => checkedItems[item.id]).length;
      scores[p.id] = Math.round((checked / p.items.length) * 100);
    });
    return scores;
  }, [checkedItems]);

  return (
    <Paper sx={{ bgcolor: '#1E293B', border: '1px solid #334155', borderRadius: 2, p: 3 }}>
      <Box
        data-testid="tcfd-illustrative-banner"
        sx={{ bgcolor: '#EF444422', border: '1px solid #EF4444', borderRadius: 2, p: 2, mb: 2 }}
      >
        <Typography variant="body1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          Illustrative template — not a TCFD disclosure
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          The pillars, checklist states, scores and benchmarks below are sample content with no data
          behind them. Nothing on this tab may be used for climate-related financial reporting.
        </Typography>
      </Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ color: '#3B82F6', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
              TCFD Compliance Report
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Task Force on Climate-related Financial Disclosures
            </Typography>
          </Box>
        </Box>
        <Button
          disabled
          title="Disabled: sample content, not a TCFD disclosure"
          variant="contained"
          startIcon={<PictureAsPdf />}
          sx={{
            bgcolor: '#3B82F6',
            textTransform: 'none',
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Generate PDF Report (disabled — sample)
        </Button>
      </Box>

      {/* Overall compliance score */}
      <Paper
        sx={{
          bgcolor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: 2,
          p: 2.5,
          mb: 3,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                Overall TCFD Compliance
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  color: overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {overallScore}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              {TCFD_PILLARS.map((pillar) => (
                <Grid item xs={6} sm={3} key={pillar.id}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 1,
                      px: 1.5,
                      borderRadius: 1,
                      bgcolor: '#1E293B',
                      border: `1px solid ${pillar.color}33`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                      {pillar.title}
                    </Typography>
                    <Typography variant="h5" sx={{ color: pillar.color, fontWeight: 700 }}>
                      {pillarScores[pillar.id]}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* TCFD Pillars - expandable sections */}
      <Box sx={{ mb: 3 }}>
        {TCFD_PILLARS.map((pillar) => (
          <Accordion
            key={pillar.id}
            expanded={expandedPillar === pillar.id}
            onChange={(_, isExpanded) => setExpandedPillar(isExpanded ? pillar.id : '')}
            sx={{
              bgcolor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px !important',
              mb: 1.5,
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: '0 0 12px 0' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#94A3B8' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mr: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 36,
                    borderRadius: 3,
                    bgcolor: pillar.color,
                  }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {pillar.subtitle}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${pillarScores[pillar.id]}% Compliant`}
                size="small"
                sx={{
                  bgcolor: `${pillar.color}1A`,
                  color: pillar.color,
                  fontWeight: 600,
                }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {pillar.items.map((item, itemIdx) => (
                <Paper
                  key={item.id}
                  sx={{
                    bgcolor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: 2,
                    p: 2,
                    mb: itemIdx < pillar.items.length - 1 ? 1.5 : 0,
                  }}
                >
                  {/* Item header with compliance checkbox */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Checkbox
                      checked={checkedItems[item.id] || false}
                      onChange={() => handleCheckToggle(item.id)}
                      sx={{
                        color: '#475569',
                        '&.Mui-checked': { color: '#10B981' },
                        p: 0.5,
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ color: '#F1F5F9', fontWeight: 600, flex: 1 }}>
                      {item.label}
                    </Typography>
                    <Chip
                      icon={checkedItems[item.id] ? <VerifiedUser sx={{ fontSize: 14 }} /> : undefined}
                      label={checkedItems[item.id] ? 'Compliant' : 'Incomplete'}
                      size="small"
                      sx={{
                        bgcolor: checkedItems[item.id] ? '#10B9811A' : '#EF44441A',
                        color: checkedItems[item.id] ? '#10B981' : '#EF4444',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        '& .MuiChip-icon': { color: '#10B981' },
                      }}
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, lineHeight: 1.6, fontSize: '0.8rem' }}>
                    {item.description}
                  </Typography>

                  {/* Data table */}
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {item.data.map((row) => (
                          <TableRow key={row.metric}>
                            <TableCell
                              sx={{
                                color: '#64748B',
                                borderBottom: '1px solid #0F172A',
                                py: 0.75,
                                fontSize: '0.75rem',
                                width: '55%',
                              }}
                            >
                              {row.metric}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: '#CBD5E1',
                                borderBottom: '1px solid #0F172A',
                                py: 0.75,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              {row.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Divider sx={{ borderColor: '#334155', mb: 3 }} />

      {/* Industry benchmarks & report history */}
      <Grid container spacing={3}>
        {/* Industry benchmarks */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5 }}>
              Industry Benchmark Comparison
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Metric', 'Your Score', 'Industry Avg', 'Top Quartile'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          color: '#64748B',
                          borderBottom: '1px solid #334155',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INDUSTRY_BENCHMARKS.map((row) => (
                    <TableRow key={row.metric}>
                      <TableCell sx={{ color: '#CBD5E1', borderBottom: '1px solid #1E293B', fontSize: '0.75rem' }}>
                        {row.metric}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #1E293B' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: row.org >= row.topQuartile ? '#10B981' : row.org >= row.industry ? '#3B82F6' : '#F59E0B',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          >
                            {row.org}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={row.org}
                            sx={{
                              width: 50,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: '#334155',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: row.org >= row.topQuartile ? '#10B981' : '#3B82F6',
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', borderBottom: '1px solid #1E293B', fontSize: '0.75rem' }}>
                        {row.industry}%
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', borderBottom: '1px solid #1E293B', fontSize: '0.75rem' }}>
                        {row.topQuartile}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Previous reports timeline */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: '#0F172A', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1.5 }}>
              Report History
            </Typography>
            {/* Current report */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                px: 1.5,
                borderRadius: 1,
                bgcolor: '#3B82F61A',
                border: '1px solid #3B82F633',
                mb: 1.5,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                  FY 2025 Report
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Draft - Due March 15, 2026
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ color: '#3B82F6', fontWeight: 700 }}>
                  {overallScore}%
                </Typography>
                <Chip label="In Progress" size="small" sx={{ bgcolor: '#3B82F61A', color: '#3B82F6', fontSize: '0.6rem' }} />
              </Box>
            </Box>

            {/* Previous reports */}
            {PREVIOUS_REPORTS.map((report) => (
              <Box
                key={report.year}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  px: 1.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#1E293B' },
                  mb: 0.5,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 500 }}>
                    FY {report.year} Report
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Published {report.date}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: report.score >= 60 ? '#10B981' : '#F59E0B',
                      fontWeight: 600,
                    }}
                  >
                    {report.score}%
                  </Typography>
                  <Chip
                    label={report.status}
                    size="small"
                    sx={{ bgcolor: '#10B9811A', color: '#10B981', fontSize: '0.6rem' }}
                  />
                </Box>
              </Box>
            ))}

            <Divider sx={{ borderColor: '#334155', my: 1.5 }} />

            {/* Score trend */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                3-year improvement:
              </Typography>
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                +{overallScore - 41} points ({(((overallScore - 41) / 41) * 100).toFixed(0)}% increase)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TCFDReport;
