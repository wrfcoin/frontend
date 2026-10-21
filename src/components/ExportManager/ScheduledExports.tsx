import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge } from '../ui';

interface ScheduleRun {
  status: 'success' | 'failed' | 'skipped';
}

interface Schedule {
  id: number;
  name: string;
  frequency: string;
  frequencyStatus: 'online' | 'offline' | 'degraded' | 'pending' | 'syncing';
  template: string;
  format: string;
  recipients: string[];
  nextRun: string;
  enabled: boolean;
  recentRuns: ScheduleRun[];
}

const schedules: Schedule[] = [
  {
    id: 1,
    name: 'Daily Station Digest',
    frequency: 'Daily',
    frequencyStatus: 'online',
    template: 'Monthly Station Report',
    format: 'PDF',
    recipients: ['ops@wrfcoin.io', 'admin@wrfcoin.io'],
    nextRun: 'Today at 6:00 PM UTC',
    enabled: true,
    recentRuns: [
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
      { status: 'failed' },
      { status: 'success' },
    ],
  },
  {
    id: 2,
    name: 'Weekly Climate Rollup',
    frequency: 'Weekly',
    frequencyStatus: 'pending',
    template: 'Annual Climate Summary',
    format: 'XLSX',
    recipients: ['climate@wrfcoin.io', 'research@wrfcoin.io', 'data@wrfcoin.io'],
    nextRun: 'Monday at 9:00 AM UTC',
    enabled: true,
    recentRuns: [
      { status: 'success' },
      { status: 'success' },
      { status: 'skipped' },
      { status: 'success' },
      { status: 'success' },
    ],
  },
  {
    id: 3,
    name: 'Monthly Earnings Report',
    frequency: 'Monthly',
    frequencyStatus: 'degraded',
    template: 'Earnings Statement',
    format: 'PDF',
    recipients: ['finance@wrfcoin.io'],
    nextRun: 'Mar 1 at 12:00 AM UTC',
    enabled: false,
    recentRuns: [
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
    ],
  },
];

const runDotColor: Record<string, string> = {
  success: colors.success.main,
  failed: colors.error.main,
  skipped: colors.text.muted,
};

interface TimelineEvent {
  id: number;
  timestamp: string;
  scheduleName: string;
  status: string;
  statusBadge: 'online' | 'offline' | 'degraded' | 'pending' | 'syncing';
  size: string;
  duration: string;
}

const timelineEvents: TimelineEvent[] = [
  { id: 1, timestamp: '2026-02-14 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '3.1 MB', duration: '4.2s' },
  { id: 2, timestamp: '2026-02-13 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '2.9 MB', duration: '3.8s' },
  { id: 3, timestamp: '2026-02-12 06:00', scheduleName: 'Daily Station Digest', status: 'Failed', statusBadge: 'degraded', size: '--', duration: '12.1s' },
  { id: 4, timestamp: '2026-02-10 09:00', scheduleName: 'Weekly Climate Rollup', status: 'Complete', statusBadge: 'online', size: '8.4 MB', duration: '11.3s' },
  { id: 5, timestamp: '2026-02-11 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '3.0 MB', duration: '4.0s' },
  { id: 6, timestamp: '2026-02-10 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '3.2 MB', duration: '4.5s' },
  { id: 7, timestamp: '2026-02-03 09:00', scheduleName: 'Weekly Climate Rollup', status: 'Skipped', statusBadge: 'offline', size: '--', duration: '--' },
  { id: 8, timestamp: '2026-02-09 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '2.8 MB', duration: '3.9s' },
  { id: 9, timestamp: '2026-02-01 00:00', scheduleName: 'Monthly Earnings Report', status: 'Complete', statusBadge: 'online', size: '5.2 MB', duration: '7.6s' },
  { id: 10, timestamp: '2026-02-08 06:00', scheduleName: 'Daily Station Digest', status: 'Complete', statusBadge: 'online', size: '3.1 MB', duration: '4.1s' },
];

const templateOptions = [
  'Monthly Station Report',
  'Annual Climate Summary',
  'Earnings Statement',
  'Network Health Report',
  'Carbon Credit Certificate',
  'Fleet Performance',
  'Forecast Accuracy',
  'Regulatory Compliance',
];

const ScheduledExports = () => {
  const [scheduleState, setScheduleState] = useState<Record<number, boolean>>(
    Object.fromEntries(schedules.map((s) => [s.id, s.enabled])),
  );
  const [newTemplate, setNewTemplate] = useState('Monthly Station Report');
  const [newFrequency, setNewFrequency] = useState('Daily');
  const [newTime, setNewTime] = useState('06:00');
  const [newDay, setNewDay] = useState('Monday');
  const [newDayOfMonth, setNewDayOfMonth] = useState('1');
  const [newRecipients, setNewRecipients] = useState('');
  const [newFormat, setNewFormat] = useState('PDF');

  const toggleSchedule = (id: number) => {
    setScheduleState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: colors.text.primary,
      backgroundColor: colors.bg.tertiary,
      borderRadius: `${borderRadius.md}px`,
      '& fieldset': { borderColor: colors.border.default },
      '&:hover fieldset': { borderColor: colors.border.light },
      '&.Mui-focused fieldset': { borderColor: colors.border.focus },
    },
    '& .MuiInputLabel-root': { color: colors.text.muted },
    '& .MuiInputLabel-root.Mui-focused': { color: colors.brand.primary },
    '& .MuiSelect-icon': { color: colors.text.muted },
  };

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Scheduled Exports
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: colors.text.secondary }}>
          Automate recurring data exports with customizable schedules and delivery
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Active Schedules"
            value="3"
            icon={ScheduleIcon}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Next Run"
            value="in 2h 15m"
            icon={PlayArrowIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Runs"
            value="156"
            trend={8}
            trendLabel="this week"
            icon={CheckCircleIcon}
            sparklineData={[12, 15, 14, 18, 16, 19, 22, 20]}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Success Rate"
            value="98.7%"
            trend={1.2}
            trendLabel="vs last month"
            icon={TrendingUpIcon}
            color="#A855F7"
          />
        </Grid>
      </Grid>

      {/* Active Schedules */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Active Schedules
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {schedules.map((schedule) => {
          const isEnabled = scheduleState[schedule.id];
          return (
            <Grid size={{ xs: 12, md: 4 }} key={schedule.id}>
              <WrfCard
                sx={{
                  opacity: isEnabled ? 1 : 0.6,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Header with toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
                      {schedule.name}
                    </Typography>
                    <WrfBadge
                      status={schedule.frequencyStatus}
                      label={schedule.frequency}
                      size="sm"
                    />
                  </Box>
                  <Switch
                    checked={isEnabled}
                    onChange={() => toggleSchedule(schedule.id)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                </Box>

                {/* Details */}
                <Box sx={{ mb: 2 }}>
                  {[
                    { label: 'Template', value: schedule.template },
                    { label: 'Format', value: schedule.format },
                    { label: 'Next Run', value: schedule.nextRun },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.text.muted }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary, fontWeight: 500 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Recipients */}
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 0.5 }}>
                  Recipients
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {schedule.recipients.map((email) => (
                    <Box
                      key={email}
                      sx={{
                        fontSize: '0.7rem',
                        color: colors.text.secondary,
                        bgcolor: colors.bg.tertiary,
                        px: 1,
                        py: 0.25,
                        borderRadius: `${borderRadius.sm}px`,
                      }}
                    >
                      {email}
                    </Box>
                  ))}
                </Box>

                {/* Recent runs */}
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 0.5 }}>
                  Last 5 Runs
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {schedule.recentRuns.map((run, idx) => (
                    <Box
                      key={idx}
                      title={run.status}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: runDotColor[run.status],
                        transition: 'transform 0.15s ease',
                        cursor: 'default',
                        '&:hover': { transform: 'scale(1.4)' },
                      }}
                    />
                  ))}
                  <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, ml: 0.5 }}>
                    (newest first)
                  </Typography>
                </Box>
              </WrfCard>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Schedule Form */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Create Schedule
      </Typography>
      <WrfCard sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Template</InputLabel>
              <Select value={newTemplate} label="Template" onChange={(e) => setNewTemplate(e.target.value)}>
                {templateOptions.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Frequency</InputLabel>
              <Select value={newFrequency} label="Frequency" onChange={(e) => setNewFrequency(e.target.value)}>
                {['Daily', 'Weekly', 'Monthly', 'Custom'].map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Time (UTC)"
              type="time"
              size="small"
              fullWidth
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Grid>

          {/* Conditional: Day of week for Weekly */}
          {newFrequency === 'Weekly' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Day of Week</InputLabel>
                <Select value={newDay} label="Day of Week" onChange={(e) => setNewDay(e.target.value)}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Conditional: Day of month for Monthly */}
          {newFrequency === 'Monthly' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Day of Month</InputLabel>
                <Select value={newDayOfMonth} label="Day of Month" onChange={(e) => setNewDayOfMonth(e.target.value)}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <MenuItem key={d} value={String(d)}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: newFrequency === 'Weekly' || newFrequency === 'Monthly' ? 4 : 6 }}>
            <TextField
              label="Recipients (comma-separated)"
              size="small"
              fullWidth
              value={newRecipients}
              onChange={(e) => setNewRecipients(e.target.value)}
              placeholder="user@example.com, team@wrfcoin.io"
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: newFrequency === 'Weekly' || newFrequency === 'Monthly' ? 4 : 6 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Format</InputLabel>
              <Select value={newFormat} label="Format" onChange={(e) => setNewFormat(e.target.value)}>
                {['PDF', 'XLSX', 'CSV', 'JSON'].map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <WrfButton
              onClick={() => alert(`Schedule created: ${newTemplate} - ${newFrequency} at ${newTime} UTC, format: ${newFormat}, recipients: ${newRecipients || '(none)'}`)}
            >
              Save Schedule
            </WrfButton>
          </Grid>
        </Grid>
      </WrfCard>

      {/* Export History Timeline */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Export History
      </Typography>
      <WrfCard>
        <Box sx={{ position: 'relative', pl: 4 }}>
          {/* Vertical line */}
          <Box sx={{
            position: 'absolute',
            left: 11,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: colors.border.default,
          }} />

          {timelineEvents.map((event, idx) => {
            const dotColor = event.statusBadge === 'online'
              ? colors.success.main
              : event.statusBadge === 'degraded'
                ? colors.error.main
                : colors.text.muted;

            return (
              <Box
                key={event.id}
                sx={{
                  position: 'relative',
                  pb: idx < timelineEvents.length - 1 ? 3 : 0,
                }}
              >
                {/* Timeline dot */}
                <Box sx={{
                  position: 'absolute',
                  left: -23,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: dotColor,
                  border: `2px solid ${colors.bg.secondary}`,
                  zIndex: 1,
                }} />

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                      {event.scheduleName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                      {event.timestamp} UTC
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WrfBadge status={event.statusBadge} label={event.status} size="sm" />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, minWidth: 50 }}>
                      {event.size}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, minWidth: 40 }}>
                      {event.duration}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </WrfCard>
    </Box>
  );
};

export default ScheduledExports;
