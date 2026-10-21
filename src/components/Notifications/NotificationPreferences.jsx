import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Save,
  RestartAlt,
  Warning,
  AttachMoney,
  HowToVote,
  Settings,
  SwapHoriz,
  Cloud,
  Email,
  PhoneIphone,
  DesktopWindows,
  NightsStay,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Dark theme constants
// ---------------------------------------------------------------------------
const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { key: 'quality_alerts', label: 'Quality Alerts', icon: Warning, color: DARK.warning, description: 'Data quality warnings and sensor calibration notices' },
  { key: 'earnings_updates', label: 'Earnings Updates', icon: AttachMoney, color: DARK.success, description: 'Token payouts, bonus rewards, and earnings summaries' },
  { key: 'governance_votes', label: 'Governance Votes', icon: HowToVote, color: '#8B5CF6', description: 'New proposals, vote reminders, and governance outcomes' },
  { key: 'system_alerts', label: 'System Alerts', icon: Settings, color: DARK.textSecondary, description: 'Maintenance windows, platform updates, and outage notices' },
  { key: 'bridge_transfers', label: 'Bridge Transfers', icon: SwapHoriz, color: '#F472B6', description: 'Cross-chain transfer confirmations and bridge status' },
  { key: 'weather_events', label: 'Weather Events', icon: Cloud, color: '#38BDF8', description: 'Severe weather alerts and station network updates' },
];

// ---------------------------------------------------------------------------
// Channel headers
// ---------------------------------------------------------------------------
const CHANNELS = [
  { key: 'email', label: 'Email', icon: Email },
  { key: 'push', label: 'Push', icon: PhoneIphone },
  { key: 'inApp', label: 'In-App', icon: DesktopWindows },
];

// ---------------------------------------------------------------------------
// Default preference state
// ---------------------------------------------------------------------------
function buildDefaultPreferences() {
  const prefs = {};
  CATEGORIES.forEach((cat) => {
    prefs[cat.key] = { email: true, push: true, inApp: true };
  });
  return prefs;
}

// ---------------------------------------------------------------------------
// NotificationPreferences component
// ---------------------------------------------------------------------------
const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(buildDefaultPreferences);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleToggle = useCallback((categoryKey, channel) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [channel]: !prev[categoryKey][channel],
      },
    }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    // In production this would POST to an API
    setSaved(true);
    setDirty(false);
  }, []);

  const handleReset = useCallback(() => {
    setPreferences(buildDefaultPreferences());
    setQuietStart('22:00');
    setQuietEnd('07:00');
    setQuietEnabled(false);
    setDirty(false);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: DARK.bg,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Page header */}
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: DARK.textPrimary, mb: 0.5 }}
        >
          Notification Preferences
        </Typography>
        <Typography variant="body2" sx={{ color: DARK.textSecondary, mb: 3 }}>
          Control how and when you receive notifications across the WRFCoin
          platform.
        </Typography>

        {/* Channel toggles table */}
        <Paper
          sx={{
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      color: DARK.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderBottom: `1px solid ${DARK.border}`,
                      width: '40%',
                    }}
                  >
                    Category
                  </TableCell>
                  {CHANNELS.map((ch) => {
                    const ChIcon = ch.icon;
                    return (
                      <TableCell
                        key={ch.key}
                        align="center"
                        sx={{
                          color: DARK.textSecondary,
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          borderBottom: `1px solid ${DARK.border}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.75,
                          }}
                        >
                          <ChIcon sx={{ fontSize: 16 }} />
                          {ch.label}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <TableRow
                      key={cat.key}
                      sx={{
                        '&:hover': { backgroundColor: DARK.cardHover },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <TableCell
                        sx={{
                          borderBottom: `1px solid ${DARK.border}`,
                          py: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: `${cat.color}18`,
                              flexShrink: 0,
                            }}
                          >
                            <CatIcon sx={{ fontSize: 18, color: cat.color }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: DARK.textPrimary,
                                lineHeight: 1.3,
                              }}
                            >
                              {cat.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: DARK.textMuted, lineHeight: 1.3 }}
                            >
                              {cat.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      {CHANNELS.map((ch) => (
                        <TableCell
                          key={ch.key}
                          align="center"
                          sx={{ borderBottom: `1px solid ${DARK.border}` }}
                        >
                          <Switch
                            checked={preferences[cat.key][ch.key]}
                            onChange={() => handleToggle(cat.key, ch.key)}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: DARK.primary,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                                {
                                  backgroundColor: DARK.primary,
                                },
                              '& .MuiSwitch-track': {
                                backgroundColor: DARK.textMuted,
                              },
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Quiet hours */}
        <Paper
          sx={{
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.border}`,
            borderRadius: '12px',
            p: 3,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(139,92,246,0.15)',
                }}
              >
                <NightsStay sx={{ fontSize: 18, color: '#8B5CF6' }} />
              </Box>
              <Box>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: DARK.textPrimary }}
                >
                  Quiet Hours
                </Typography>
                <Typography variant="caption" sx={{ color: DARK.textMuted }}>
                  Pause push and email notifications during specified hours
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={quietEnabled}
              onChange={() => {
                setQuietEnabled((v) => !v);
                setDirty(true);
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: DARK.primary,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: DARK.primary,
                },
                '& .MuiSwitch-track': { backgroundColor: DARK.textMuted },
              }}
            />
          </Box>

          {quietEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 6 }}>
              <TextField
                label="Start"
                type="time"
                value={quietStart}
                onChange={(e) => {
                  setQuietStart(e.target.value);
                  setDirty(true);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                sx={{
                  width: 140,
                  '& .MuiInputBase-root': {
                    color: DARK.textPrimary,
                    backgroundColor: DARK.bg,
                    borderRadius: '8px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: DARK.border,
                  },
                  '& .MuiInputLabel-root': { color: DARK.textMuted },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.7)',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: DARK.textMuted }}>
                to
              </Typography>
              <TextField
                label="End"
                type="time"
                value={quietEnd}
                onChange={(e) => {
                  setQuietEnd(e.target.value);
                  setDirty(true);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                sx={{
                  width: 140,
                  '& .MuiInputBase-root': {
                    color: DARK.textPrimary,
                    backgroundColor: DARK.bg,
                    borderRadius: '8px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: DARK.border,
                  },
                  '& .MuiInputLabel-root': { color: DARK.textMuted },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.7)',
                  },
                }}
              />
              <Chip
                label="Local timezone"
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  color: DARK.primary,
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={handleReset}
            sx={{
              textTransform: 'none',
              borderColor: DARK.border,
              color: DARK.textSecondary,
              borderRadius: '8px',
              '&:hover': {
                borderColor: DARK.textMuted,
                backgroundColor: 'rgba(255,255,255,0.04)',
              },
            }}
          >
            Reset to defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!dirty}
            sx={{
              textTransform: 'none',
              backgroundColor: DARK.primary,
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#2563EB' },
              '&.Mui-disabled': {
                backgroundColor: DARK.border,
                color: DARK.textMuted,
              },
            }}
          >
            Save preferences
          </Button>
        </Box>
      </Box>

      {/* Save confirmation */}
      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSaved(false)}
          sx={{
            backgroundColor: '#064E3B',
            color: DARK.success,
            border: `1px solid ${DARK.success}`,
            borderRadius: '8px',
          }}
        >
          Notification preferences saved successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationPreferences;
