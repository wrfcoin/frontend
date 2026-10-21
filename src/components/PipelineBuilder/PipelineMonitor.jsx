import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Replay as RetryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as IdleIcon,
  Loop as RunningIcon,
  Speed as ThroughputIcon,
  Schedule as TimeIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
};

const STATUS_STYLES = {
  idle: { color: colors.textSecondary, label: 'Idle', Icon: IdleIcon },
  running: { color: colors.primary, label: 'Running', Icon: RunningIcon },
  completed: { color: colors.success, label: 'Completed', Icon: SuccessIcon },
  error: { color: colors.error, label: 'Error', Icon: ErrorIcon },
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockNodeStatuses(nodes) {
  const statuses = ['completed', 'completed', 'running', 'idle'];
  return nodes.map((node, i) => ({
    nodeId: node.id,
    label: node.label,
    type: node.type,
    status: statuses[Math.min(i, statuses.length - 1)],
    recordsIn: i < 2 ? Math.floor(1200 + Math.random() * 800) : i === 2 ? Math.floor(600 + Math.random() * 200) : 0,
    recordsOut: i < 2 ? Math.floor(1100 + Math.random() * 700) : i === 2 ? Math.floor(300 + Math.random() * 100) : 0,
    processingTimeMs: i < 2 ? Math.floor(50 + Math.random() * 200) : i === 2 ? null : null,
    errorMessage: null,
  }));
}

function generateMockRunHistory() {
  const statuses = ['completed', 'completed', 'error', 'completed', 'completed', 'completed', 'error', 'completed', 'completed', 'completed'];
  const now = Date.now();
  return statuses.map((status, i) => ({
    id: `run-${10 - i}`,
    startedAt: new Date(now - (i + 1) * 3600000 * 2 - Math.random() * 3600000).toISOString(),
    duration: status === 'error' ? Math.floor(5 + Math.random() * 15) : Math.floor(30 + Math.random() * 120),
    status,
    recordsProcessed: status === 'error' ? Math.floor(200 + Math.random() * 300) : Math.floor(1000 + Math.random() * 3000),
    errorMessage: status === 'error' ? 'Connection timeout to station WS-003 after 10s' : null,
  }));
}

function generateMockLogs() {
  const now = Date.now();
  return [
    { time: now - 120000, level: 'info', message: 'Pipeline execution started (run-11)' },
    { time: now - 115000, level: 'info', message: 'Node "NYC Station": Connecting to data source WS-001...' },
    { time: now - 110000, level: 'info', message: 'Node "NYC Station": Streaming active - 42 records/sec' },
    { time: now - 95000, level: 'info', message: 'Node "Moving Average": Processing started (window=12)' },
    { time: now - 90000, level: 'info', message: 'Node "Moving Average": 1,247 records processed, 1,180 output' },
    { time: now - 60000, level: 'info', message: 'Node "Anomaly Detector": Loading model anomaly-autoencoder (v2.1)' },
    { time: now - 55000, level: 'warn', message: 'Node "Anomaly Detector": GPU not available, falling back to CPU inference' },
    { time: now - 30000, level: 'info', message: 'Node "Anomaly Detector": Inference in progress - 18 records/sec' },
    { time: now - 15000, level: 'info', message: 'Node "Anomaly Detector": 3 anomalies detected (confidence > 0.85)' },
    { time: now - 5000, level: 'info', message: 'Node "Email Alert": Waiting for upstream completion...' },
  ];
}

// ---------------------------------------------------------------------------
// Node Status Row
// ---------------------------------------------------------------------------

function NodeStatusRow({ nodeStatus }) {
  const { color, label, Icon } = STATUS_STYLES[nodeStatus.status] || STATUS_STYLES.idle;
  const NODE_COLORS = { source: '#3B82F6', transform: '#F59E0B', ml: '#8B5CF6', output: '#10B981' };
  const nodeColor = NODE_COLORS[nodeStatus.type] || colors.primary;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        bgcolor: nodeStatus.status === 'running' ? `${colors.primary}11` : 'transparent',
        border: `1px solid ${nodeStatus.status === 'running' ? colors.primary + '44' : 'transparent'}`,
      }}
    >
      {/* Node type indicator */}
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: nodeColor,
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.8rem' }}>
          {nodeStatus.label}
        </Typography>
      </Box>

      {/* Records throughput */}
      <Box sx={{ textAlign: 'right', minWidth: 70 }}>
        {nodeStatus.status !== 'idle' && (
          <>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem', display: 'block' }}>
              {nodeStatus.recordsIn?.toLocaleString() || 0} in
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text, fontSize: '0.65rem', display: 'block' }}>
              {nodeStatus.recordsOut?.toLocaleString() || 0} out
            </Typography>
          </>
        )}
      </Box>

      {/* Status chip */}
      <Chip
        icon={<Icon sx={{ fontSize: 12, color: `${color} !important` }} />}
        label={label}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.65rem',
          bgcolor: `${color}22`,
          color,
          border: `1px solid ${color}44`,
          '& .MuiChip-icon': { ml: '4px' },
          ...(nodeStatus.status === 'running' ? { animation: 'pulse 2s infinite' } : {}),
        }}
      />

      {/* Processing time */}
      {nodeStatus.processingTimeMs !== null && nodeStatus.processingTimeMs !== undefined && (
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem', minWidth: 40, textAlign: 'right' }}>
          {nodeStatus.processingTimeMs}ms
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const PipelineMonitorSample = ({ pipeline, nodes, onRun, onStop }) => {
  const [pipelineStatus, setPipelineStatus] = useState('running'); // idle, running, completed, error
  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [throughput, setThroughput] = useState({ in: 42, out: 38 });

  // Initialize mock data
  useEffect(() => {
    const mockNodes = nodes || [
      { id: 'n1', type: 'source', label: 'NYC Station' },
      { id: 'n2', type: 'transform', label: 'Moving Average' },
      { id: 'n3', type: 'ml', label: 'Anomaly Detector' },
      { id: 'n4', type: 'output', label: 'Email Alert' },
    ];
    setNodeStatuses(generateMockNodeStatuses(mockNodes));
    setRunHistory(generateMockRunHistory());
    setLogs(generateMockLogs());
  }, [nodes]);

  // Simulate throughput updates
  useEffect(() => {
    if (pipelineStatus !== 'running') return;
    const interval = setInterval(() => {
      setThroughput({
        in: Math.floor(35 + Math.random() * 15),
        out: Math.floor(30 + Math.random() * 15),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [pipelineStatus]);

  const statusMeta = STATUS_STYLES[pipelineStatus] || STATUS_STYLES.idle;
  const StatusIcon = statusMeta.Icon;

  const totalRecordsIn = useMemo(() => nodeStatuses.reduce((sum, n) => sum + (n.recordsIn || 0), 0), [nodeStatuses]);
  const totalRecordsOut = useMemo(() => nodeStatuses.reduce((sum, n) => sum + (n.recordsOut || 0), 0), [nodeStatuses]);
  const completedNodes = useMemo(() => nodeStatuses.filter((n) => n.status === 'completed').length, [nodeStatuses]);
  const progress = nodeStatuses.length > 0 ? (completedNodes / nodeStatuses.length) * 100 : 0;

  const handleRun = useCallback(() => {
    setPipelineStatus('running');
    if (onRun) onRun();
  }, [onRun]);

  const handleStop = useCallback(() => {
    setPipelineStatus('idle');
    if (onStop) onStop();
  }, [onStop]);

  const handleRetry = useCallback(() => {
    setPipelineStatus('running');
    if (onRun) onRun();
  }, [onRun]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
      {/* Status Header */}
      <Paper sx={{ bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: `${statusMeta.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StatusIcon sx={{
                color: statusMeta.color,
                fontSize: 20,
                ...(pipelineStatus === 'running' ? { animation: 'spin 2s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } } : {}),
              }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ color: colors.text, fontWeight: 700 }}>
                {pipeline?.name || 'Pipeline Execution'}
              </Typography>
              <Chip
                label={statusMeta.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: `${statusMeta.color}22`,
                  color: statusMeta.color,
                  border: `1px solid ${statusMeta.color}44`,
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {pipelineStatus === 'running' ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<StopIcon />}
                onClick={handleStop}
                sx={{ color: colors.error, borderColor: colors.error, textTransform: 'none', '&:hover': { borderColor: colors.error, bgcolor: `${colors.error}11` } }}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayIcon />}
                onClick={handleRun}
                sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
              >
                Run
              </Button>
            )}
            {pipelineStatus === 'error' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RetryIcon />}
                onClick={handleRetry}
                sx={{ color: colors.warning, borderColor: colors.warning, textTransform: 'none', '&:hover': { borderColor: colors.warning, bgcolor: `${colors.warning}11` } }}
              >
                Retry
              </Button>
            )}
          </Box>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Progress: {completedNodes}/{nodeStatuses.length} nodes
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {progress.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: colors.border,
              '& .MuiLinearProgress-bar': {
                bgcolor: pipelineStatus === 'error' ? colors.error : colors.success,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Throughput metrics */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Paper sx={{ flex: 1, bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 1, p: 1.5, textAlign: 'center' }}>
            <ThroughputIcon sx={{ fontSize: 16, color: colors.primary, mb: 0.5 }} />
            <Typography variant="h6" sx={{ color: colors.text, fontWeight: 700, fontSize: '1.1rem' }}>
              {throughput.in}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>records/sec in</Typography>
          </Paper>
          <Paper sx={{ flex: 1, bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 1, p: 1.5, textAlign: 'center' }}>
            <ThroughputIcon sx={{ fontSize: 16, color: colors.success, mb: 0.5 }} />
            <Typography variant="h6" sx={{ color: colors.text, fontWeight: 700, fontSize: '1.1rem' }}>
              {throughput.out}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>records/sec out</Typography>
          </Paper>
          <Paper sx={{ flex: 1, bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 1, p: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: colors.text, fontWeight: 700, fontSize: '1.1rem' }}>
              {totalRecordsIn.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem' }}>total records</Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Node-by-Node Status */}
      <Paper sx={{ bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, mb: 1.5 }}>
          Node Execution Status
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {nodeStatuses.map((ns) => (
            <NodeStatusRow key={ns.nodeId} nodeStatus={ns} />
          ))}
        </Box>
      </Paper>

      {/* Execution Log */}
      <Paper sx={{ bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            cursor: 'pointer',
          }}
          onClick={() => setShowLogs((prev) => !prev)}
        >
          <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600 }}>
            Execution Log
          </Typography>
          <IconButton size="small" sx={{ color: colors.textSecondary }}>
            {showLogs ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        </Box>
        {showLogs && (
          <Box
            sx={{
              maxHeight: 200,
              overflowY: 'auto',
              px: 2,
              pb: 2,
              fontFamily: 'monospace',
            }}
          >
            {logs.map((log, i) => {
              const levelColor = log.level === 'warn' ? colors.warning : log.level === 'error' ? colors.error : colors.textSecondary;
              return (
                <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.3 }}>
                  <Typography variant="caption" sx={{ color: colors.border, fontSize: '0.65rem', minWidth: 55, flexShrink: 0 }}>
                    {new Date(log.time).toLocaleTimeString('en-US', { hour12: false })}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: levelColor, fontSize: '0.65rem', minWidth: 35, flexShrink: 0, textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    {log.level}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.text, fontSize: '0.65rem' }}>
                    {log.message}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Run History */}
      <Paper sx={{ bgcolor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, mb: 1.5 }}>
          Run History (Last 10)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Started</TableCell>
                <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Duration</TableCell>
                <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Records</TableCell>
                <TableCell sx={{ color: colors.textSecondary, borderColor: colors.border, fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runHistory.map((run) => {
                const st = STATUS_STYLES[run.status] || STATUS_STYLES.idle;
                return (
                  <TableRow key={run.id} hover sx={{ '&:hover': { bgcolor: `${colors.primary}08` } }}>
                    <TableCell sx={{ color: colors.text, borderColor: colors.border, fontSize: '0.7rem', py: 0.75 }}>
                      {new Date(run.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell sx={{ color: colors.text, borderColor: colors.border, fontSize: '0.7rem', py: 0.75 }}>
                      {run.duration}s
                    </TableCell>
                    <TableCell sx={{ color: colors.text, borderColor: colors.border, fontSize: '0.7rem', py: 0.75 }}>
                      {run.recordsProcessed.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: colors.border, py: 0.75 }}>
                      <Tooltip title={run.errorMessage || ''} disableHoverListener={!run.errorMessage}>
                        <Chip
                          icon={<st.Icon sx={{ fontSize: 10, color: `${st.color} !important` }} />}
                          label={st.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            bgcolor: `${st.color}22`,
                            color: st.color,
                            border: `1px solid ${st.color}44`,
                            '& .MuiChip-icon': { ml: '4px' },
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

const PipelineMonitor = (props) => (
  <DemoSurfaceGate
    title="Pipeline execution telemetry unavailable."
    description="No trusted pipeline execution, run history or throughput source is connected. Demo runs and logs are illustrative."
    testId="pipeline-monitor"
  >
    <PipelineMonitorSample {...props} />
  </DemoSurfaceGate>
);

export default PipelineMonitor;
