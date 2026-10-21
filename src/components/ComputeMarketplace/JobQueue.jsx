import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
  Collapse,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Bolt as BoltIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
  cancelled: '#6B7280',
};

// ---------------------------------------------------------------------------
// Job form choices
// ---------------------------------------------------------------------------

const JOB_TYPES = [
  'Model Training',
  'Ensemble Forecast',
  'Climate Simulation',
  'Data Processing',
  'Reanalysis',
];

const MODEL_OPTIONS = [
  'WRF v4.5',
  'GFS Downscaling',
  'ECMWF ERA5',
  'MPAS-A',
  'CESM2',
  'FV3-GFS',
  'ICON',
  'HRRR Clone',
];

const PRIORITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'priority', label: 'Priority' },
  { value: 'urgent', label: 'Urgent' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusChip(status) {
  const map = {
    running: { color: palette.primary, bg: `${palette.primary}22`, label: 'Running' },
    queued: { color: palette.warning, bg: `${palette.warning}22`, label: 'Queued' },
    completed: { color: palette.success, bg: `${palette.success}22`, label: 'Completed' },
    failed: { color: palette.error, bg: `${palette.error}22`, label: 'Failed' },
    cancelled: { color: palette.cancelled, bg: `${palette.cancelled}22`, label: 'Cancelled' },
  };
  const s = map[status] || map.queued;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: 11, height: 24, minWidth: 80 }}
    />
  );
}

function getPriorityChip(priority) {
  const map = {
    standard: { color: palette.textSecondary, label: 'STD' },
    priority: { color: palette.warning, label: 'PRI' },
    urgent: { color: palette.error, label: 'URG' },
  };
  const p = map[priority] || map.standard;
  return (
    <Chip
      label={p.label}
      size="small"
      variant="outlined"
      sx={{ borderColor: p.color, color: p.color, fontWeight: 600, fontSize: 10, height: 20 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const JobQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedJob, setExpandedJob] = useState(null);

  const [readState, setReadState] = useState('loading');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setReadState('loading');
    apiClient.get('/compute/jobs')
      .then((data) => {
        const rows = Array.isArray(data) ? data : data?.jobs;
        if (!Array.isArray(rows) || !rows.every((job) =>
          job && typeof job.id === 'string' && job.id.trim() &&
          ['running', 'queued', 'completed', 'failed', 'cancelled'].includes(job.status) &&
          ['costWrf', 'gpu', 'cpu', 'progress'].every((key) =>
            typeof job[key] === 'number' && Number.isFinite(job[key]) && job[key] >= 0))) {
          throw new Error('Incomplete jobs response');
        }
        if (active) { setJobs(rows); setReadState('ready'); }
      })
      .catch(() => { if (active) { setJobs([]); setReadState('unavailable'); } });
    return () => { active = false; };
  }, [reload]);

  // Submission form state
  const [formJobType, setFormJobType] = useState('Model Training');
  const [formModel, setFormModel] = useState('WRF v4.5');
  const [formResolution, setFormResolution] = useState('3km');
  const [formPriority, setFormPriority] = useState('standard');
  const [formDataRange, setFormDataRange] = useState('2023-01-01 to 2025-12-31');
  const [showForm, setShowForm] = useState(false);

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs;
    return jobs.filter((j) => j.status === statusFilter);
  }, [statusFilter, jobs]);

  const toggleExpand = useCallback(
    (jobId) => {
      setExpandedJob((prev) => (prev === jobId ? null : jobId));
    },
    [],
  );

  const statusCounts = useMemo(() => {
    const counts = { all: jobs.length, running: 0, queued: 0, completed: 0, failed: 0, cancelled: 0 };
    jobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  if (readState !== 'ready') {
    return <Box sx={{ p: 3 }}>
      <Typography>Compute Job Queue</Typography>
      <Typography role="status">{readState === 'loading' ? 'Loading jobs…' : 'Jobs unavailable.'}</Typography>
      {readState === 'unavailable' && <Button onClick={() => setReload((value) => value + 1)}>Retry</Button>}
    </Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Submission Form Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 600 }}>
          Compute Job Queue
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh job list">
            <IconButton size="small" onClick={() => setReload((value) => value + 1)} sx={{ color: palette.textSecondary }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<CloudIcon />}
            onClick={() => setShowForm(!showForm)}
            sx={{
              bgcolor: palette.success,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            {showForm ? 'Hide Form' : 'New Job'}
          </Button>
        </Box>
      </Box>

      {/* Submission Form */}
      <Collapse in={showForm}>
        <Paper sx={{ bgcolor: `${palette.primary}08`, border: `1px solid ${palette.primary}33`, borderRadius: 2, p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: palette.primary, fontWeight: 600, mb: 2 }}>
            Job submission unavailable.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Job Type
              </Typography>
              <Select
                fullWidth
                size="small"
                value={formJobType}
                onChange={(e) => setFormJobType(e.target.value)}
                sx={{
                  bgcolor: palette.card,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {JOB_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Model Selection
              </Typography>
              <Select
                fullWidth
                size="small"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                sx={{
                  bgcolor: palette.card,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {MODEL_OPTIONS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Data Range
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={formDataRange}
                onChange={(e) => setFormDataRange(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: palette.card,
                    color: palette.text,
                    '& fieldset': { borderColor: palette.border },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Resolution
              </Typography>
              <Select
                fullWidth
                size="small"
                value={formResolution}
                onChange={(e) => setFormResolution(e.target.value)}
                sx={{
                  bgcolor: palette.card,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {['1km', '3km', '9km', '27km', '0.25deg', '0.5deg', '1deg'].map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: palette.textSecondary, mb: 0.5, display: 'block' }}>
                Priority
              </Typography>
              <Select
                fullWidth
                size="small"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                sx={{
                  bgcolor: palette.card,
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<BoltIcon />}
                disabled
                sx={{
                  bgcolor: palette.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  height: 40,
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                Estimate & Submit
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Status Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {['all', 'running', 'queued', 'completed', 'failed', 'cancelled'].map((s) => {
          const colorMap = {
            all: palette.text,
            running: palette.primary,
            queued: palette.warning,
            completed: palette.success,
            failed: palette.error,
            cancelled: palette.cancelled,
          };
          const isActive = statusFilter === s;
          return (
            <Chip
              key={s}
              label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] || 0})`}
              size="small"
              onClick={() => setStatusFilter(s)}
              sx={{
                bgcolor: isActive ? `${colorMap[s]}22` : 'transparent',
                color: isActive ? colorMap[s] : palette.textSecondary,
                border: `1px solid ${isActive ? colorMap[s] : palette.border}`,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                '&:hover': { bgcolor: `${colorMap[s]}11` },
              }}
            />
          );
        })}
      </Box>

      {jobs.length === 0 && <Typography>No jobs.</Typography>}
      {/* Jobs Table */}
      <TableContainer
        component={Paper}
        sx={{ bgcolor: 'transparent', boxShadow: 'none', border: `1px solid ${palette.border}`, borderRadius: 2 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: `1px solid ${palette.border}`, color: palette.textSecondary, fontWeight: 600, fontSize: 12, py: 1.5 } }}>
              <TableCell />
              <TableCell>Job ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Submitter</TableCell>
              <TableCell>Model</TableCell>
              <TableCell align="center">Progress</TableCell>
              <TableCell>ETA</TableCell>
              <TableCell align="right">Cost (WRF)</TableCell>
              <TableCell align="center">GPU/CPU</TableCell>
              <TableCell align="center">Priority</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map((job) => (
              <React.Fragment key={job.id}>
                <TableRow
                  onClick={() => toggleExpand(job.id)}
                  sx={{
                    cursor: 'pointer',
                    '& td': { borderBottom: expandedJob === job.id ? 'none' : `1px solid ${palette.border}`, color: palette.text, fontSize: 13, py: 1.2 },
                    '&:hover': { bgcolor: `${palette.primary}08` },
                    bgcolor: expandedJob === job.id ? `${palette.primary}06` : 'transparent',
                  }}
                >
                  <TableCell sx={{ width: 36 }}>
                    <IconButton size="small" sx={{ color: palette.textSecondary }}>
                      {expandedJob === job.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: palette.primary, fontWeight: 600, fontSize: 12 }}>
                      {job.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: palette.textSecondary }}>
                      {job.submitter}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.model}</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    {job.status === 'running' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: `${palette.primary}22`,
                            '& .MuiLinearProgress-bar': { bgcolor: palette.primary, borderRadius: 3 },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: palette.primary, fontWeight: 600, minWidth: 32 }}>
                          {job.progress}%
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                        {job.progress === 100 ? '100%' : '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: 12, color: palette.textSecondary }}>
                      {job.eta}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: palette.warning, fontSize: 12 }}>
                      {job.costWrf.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                      {job.gpu}/{job.cpu}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{getPriorityChip(job.priority)}</TableCell>
                  <TableCell align="center">{getStatusChip(job.status)}</TableCell>
                </TableRow>

                {/* Expanded Detail Row */}
                <TableRow>
                  <TableCell colSpan={11} sx={{ p: 0, border: expandedJob === job.id ? `1px solid ${palette.border}` : 'none' }}>
                    <Collapse in={expandedJob === job.id}>
                      <Box sx={{ p: 2.5, bgcolor: `${palette.card}88` }}>
                        <Grid container spacing={2}>
                          {/* Resource Usage */}
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                              Resource Allocation
                            </Typography>
                            <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                              Resource utilization unavailable.
                            </Typography>
                          </Grid>

                          {/* Job Details */}
                          <Grid item xs={12} md={3}>
                            <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                              Job Details
                            </Typography>
                            {[
                              { label: 'Submitted', value: job.submitted },
                              { label: 'Model', value: job.model },
                              { label: 'GPUs Allocated', value: job.gpu },
                              { label: 'CPUs Allocated', value: job.cpu },
                              { label: 'Est. Cost', value: `${job.costWrf} WRF` },
                            ].map((d) => (
                              <Box key={d.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                                <Typography variant="caption" sx={{ color: palette.textSecondary }}>{d.label}</Typography>
                                <Typography variant="caption" sx={{ color: palette.text, fontWeight: 500 }}>{d.value}</Typography>
                              </Box>
                            ))}
                          </Grid>

                          {/* Logs */}
                          <Grid item xs={12} md={5}>
                            <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                              Recent Logs
                            </Typography>
                            <Box
                              sx={{
                                bgcolor: '#0D1117',
                                borderRadius: 1,
                                p: 1.5,
                                maxHeight: 140,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: 11,
                                lineHeight: 1.6,
                              }}
                            >
                              {Array.isArray(job.logs) && job.logs.every((line) => typeof line === 'string') ? (
                                job.logs.length ? job.logs.map((line, i) => (
                                  <Box key={i} sx={{ color: palette.textSecondary, whiteSpace: 'pre-wrap' }}>
                                    {line}
                                  </Box>
                                )) : <Typography variant="body2">No logs yet.</Typography>
                              ) : <Typography variant="body2">Logs unavailable.</Typography>}
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Action Buttons */}
                        {(job.status === 'running' || job.status === 'queued') && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                            {job.status === 'running' && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PauseIcon />}
                                disabled
                                sx={{ color: palette.warning, borderColor: palette.warning, textTransform: 'none', fontSize: 12 }}
                              >
                                Pause
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<StopIcon />}
                              disabled
                              sx={{ color: palette.error, borderColor: palette.error, textTransform: 'none', fontSize: 12 }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 1 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary }}>
          Showing {filteredJobs.length} of {jobs.length} jobs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Total GPU allocation: {filteredJobs.filter((j) => j.status === 'running').reduce((a, j) => a + j.gpu, 0)} GPUs
          </Typography>
          <Typography variant="caption" sx={{ color: palette.warning }}>
            Total cost: {filteredJobs.reduce((a, j) => a + j.costWrf, 0).toLocaleString()} WRF
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default JobQueue;
