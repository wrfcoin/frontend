import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ActiveIcon,
  Schedule as ExpiredIcon,
  Cancel as RevokedIcon,
  HourglassEmpty as PendingIcon,
  Badge as CredentialIcon,
  Delete as RevokeIcon,
} from '@mui/icons-material';
import type { Credential, IssuanceFormData } from '../../hooks/useCredentialLifecycle';

// --- Palette (matches IdentityDashboard) ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#334155',
};

const STATUS_CONFIG: Record<
  Credential['status'],
  { color: string; icon: React.ReactElement; label: string }
> = {
  active: { color: palette.success, icon: <ActiveIcon sx={{ fontSize: 14 }} />, label: 'Active' },
  expired: { color: palette.warning, icon: <ExpiredIcon sx={{ fontSize: 14 }} />, label: 'Expired' },
  revoked: { color: palette.error, icon: <RevokedIcon sx={{ fontSize: 14 }} />, label: 'Revoked' },
  pending: { color: palette.info, icon: <PendingIcon sx={{ fontSize: 14 }} />, label: 'Pending' },
};

const CREDENTIAL_TYPES = [
  'WeatherStationOperatorCredential',
  'DataQualityCertification',
  'KYCVerification',
  'GovernanceParticipantCredential',
  'BridgeOperatorCredential',
  'ValidatorCredential',
];

// --- Props ---

interface CredentialLifecyclePanelProps {
  credentials: Credential[];
  onRequestCredential: (form: IssuanceFormData) => Promise<void>;
  onRevokeCredential: (credentialId: string) => Promise<void>;
  /** Whether the user is authorized to issue credentials (from policy-status). */
  canIssue?: boolean;
  /** Whether the user is authorized to revoke credentials (from policy-status). */
  canRevoke?: boolean;
  /** Human-readable denial reason when a mutation was rejected by policy. */
  policyDenial?: string | null;
  /** Denial reasons keyed by action, for tooltip display. */
  denialReasons?: Record<string, string>;
}

// --- Component ---

const CredentialLifecyclePanel: React.FC<CredentialLifecyclePanelProps> = ({
  credentials,
  onRequestCredential,
  onRevokeCredential,
  canIssue = true,
  canRevoke = true,
  policyDenial = null,
  denialReasons = {},
}) => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<IssuanceFormData>({
    did: '',
    credentialType: '',
    purpose: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCredentials = useMemo(() => {
    if (statusFilter === 'all') return credentials;
    return credentials.filter((c) => c.status === statusFilter);
  }, [credentials, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: credentials.length };
    for (const c of credentials) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, [credentials]);

  const handleRequestSubmit = async () => {
    if (!formData.did || !formData.credentialType) return;
    setSubmitting(true);
    try {
      await onRequestCredential(formData);
      setRequestDialogOpen(false);
      setFormData({ did: '', credentialType: '', purpose: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    setSubmitting(true);
    try {
      await onRevokeCredential(revokeTarget.id);
      setRevokeDialogOpen(false);
      setRevokeTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openRevokeDialog = (credential: Credential) => {
    setRevokeTarget(credential);
    setRevokeDialogOpen(true);
  };

  const statusChip = (status: Credential['status']) => {
    const cfg = STATUS_CONFIG[status];
    return (
      <Chip
        icon={cfg.icon}
        label={cfg.label}
        size="small"
        sx={{
          bgcolor: `${cfg.color}1a`,
          color: cfg.color,
          border: `1px solid ${cfg.color}33`,
          fontWeight: 600,
          fontSize: '0.7rem',
          '& .MuiChip-icon': { color: cfg.color },
        }}
      />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CredentialIcon sx={{ color: palette.primary }} />
          <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
            Credential Lifecycle
          </Typography>
          <Chip
            label={credentials.length}
            size="small"
            sx={{
              bgcolor: `${palette.primary}1a`,
              color: palette.primary,
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          />
        </Stack>
        <Tooltip
          title={
            !canIssue
              ? denialReasons['credential:issue'] || 'You do not have permission to issue credentials.'
              : ''
          }
        >
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setRequestDialogOpen(true)}
              disabled={!canIssue}
              sx={{
                bgcolor: canIssue ? palette.primary : palette.border,
                '&:hover': { bgcolor: canIssue ? palette.primaryDark : palette.border },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Request Credential
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Policy denial alert */}
      {policyDenial && (
        <Alert
          severity="error"
          onClose={() => {/* cleared by parent refetch */}}
          sx={{
            mb: 2,
            bgcolor: `${palette.error}15`,
            color: palette.text,
            border: `1px solid ${palette.error}33`,
            '& .MuiAlert-icon': { color: palette.error },
          }}
        >
          {policyDenial}
        </Alert>
      )}

      {/* Status filter chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {['all', 'active', 'pending', 'expired', 'revoked'].map((s) => (
          <Chip
            key={s}
            label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] || 0})`}
            size="small"
            onClick={() => setStatusFilter(s)}
            sx={{
              bgcolor: statusFilter === s ? `${palette.primary}33` : `${palette.border}66`,
              color: statusFilter === s ? palette.primary : palette.textSecondary,
              fontWeight: 600,
              fontSize: '0.7rem',
              cursor: 'pointer',
              border: statusFilter === s ? `1px solid ${palette.primary}55` : '1px solid transparent',
              '&:hover': { bgcolor: `${palette.primary}22` },
            }}
          />
        ))}
      </Stack>

      {/* Credentials Table */}
      <TableContainer
        component={Paper}
        sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Credential ID', 'Type', 'Status', 'Issuer', 'Issued', 'Expires', 'Actions'].map(
                (h) => (
                  <TableCell
                    key={h}
                    sx={{
                      color: palette.textSecondary,
                      borderBottom: `1px solid ${palette.border}`,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: 0.5,
                    }}
                  >
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCredentials.map((cred) => (
              <TableRow
                key={cred.id}
                sx={{ '&:hover': { bgcolor: `${palette.primary}08` } }}
              >
                <TableCell
                  sx={{
                    color: palette.text,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    borderBottom: `1px solid ${palette.border}`,
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Tooltip title={cred.id}>
                    <span>{cred.id}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  <Chip
                    label={cred.type.replace(/Credential$/, '')}
                    size="small"
                    sx={{
                      bgcolor: `${palette.primary}15`,
                      color: palette.text,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  {statusChip(cred.status)}
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.textSecondary,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    borderBottom: `1px solid ${palette.border}`,
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Tooltip title={cred.issuer}>
                    <span>{cred.issuer}</span>
                  </Tooltip>
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.textSecondary,
                    fontSize: '0.8rem',
                    borderBottom: `1px solid ${palette.border}`,
                  }}
                >
                  {new Date(cred.issuedAt).toLocaleDateString()}
                </TableCell>
                <TableCell
                  sx={{
                    color: palette.textSecondary,
                    fontSize: '0.8rem',
                    borderBottom: `1px solid ${palette.border}`,
                  }}
                >
                  {cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  {cred.status === 'active' && (
                    <Tooltip
                      title={
                        !canRevoke
                          ? denialReasons['credential:revoke'] || 'You do not have permission to revoke credentials.'
                          : 'Revoke credential'
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => openRevokeDialog(cred)}
                          disabled={!canRevoke}
                          sx={{
                            color: canRevoke ? palette.error : palette.textSecondary,
                            '&:hover': { bgcolor: canRevoke ? `${palette.error}15` : 'transparent' },
                          }}
                        >
                          <RevokeIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredCredentials.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  sx={{
                    color: palette.textSecondary,
                    textAlign: 'center',
                    py: 4,
                    borderBottom: `1px solid ${palette.border}`,
                  }}
                >
                  No credentials match the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Request Credential Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            minWidth: 460,
          },
        }}
      >
        <DialogTitle sx={{ color: palette.text, fontWeight: 700 }}>
          Request New Credential
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2.5 }}>
            Submit a credential issuance request. The request will be reviewed according to the
            active governance policies.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="DID (Subject)"
              value={formData.did}
              onChange={(e) => setFormData((prev) => ({ ...prev, did: e.target.value }))}
              placeholder="did:wrf:0x..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: palette.text,
                  '& fieldset': { borderColor: palette.border },
                  '&:hover fieldset': { borderColor: palette.primary },
                },
                '& .MuiInputLabel-root': { color: palette.textSecondary },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: palette.textSecondary }}>Credential Type</InputLabel>
              <Select
                value={formData.credentialType}
                onChange={(e: SelectChangeEvent) =>
                  setFormData((prev) => ({ ...prev, credentialType: e.target.value }))
                }
                label="Credential Type"
                sx={{
                  color: palette.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.primary },
                  '& .MuiSvgIcon-root': { color: palette.textSecondary },
                }}
              >
                {CREDENTIAL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/Credential$/, '')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Purpose / Justification"
              value={formData.purpose}
              onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
              multiline
              rows={3}
              placeholder="Describe the purpose of this credential request..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: palette.text,
                  '& fieldset': { borderColor: palette.border },
                  '&:hover fieldset': { borderColor: palette.primary },
                },
                '& .MuiInputLabel-root': { color: palette.textSecondary },
              }}
            />
          </Stack>
          <Alert
            severity="info"
            sx={{
              mt: 2,
              bgcolor: `${palette.primary}10`,
              color: palette.textSecondary,
              '& .MuiAlert-icon': { color: palette.primary },
            }}
          >
            Credential requests are subject to governance policy approval.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRequestDialogOpen(false)}
            sx={{ color: palette.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRequestSubmit}
            disabled={!formData.did || !formData.credentialType || submitting}
            sx={{
              bgcolor: palette.primary,
              '&:hover': { bgcolor: palette.primaryDark },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            minWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ color: palette.error, fontWeight: 700 }}>
          Revoke Credential
        </DialogTitle>
        <DialogContent>
          {revokeTarget && (
            <>
              <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                Are you sure you want to revoke this credential? This action cannot be undone.
              </Typography>
              <Paper
                sx={{
                  bgcolor: `${palette.bg}80`,
                  border: `1px solid ${palette.error}33`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                  {revokeTarget.type}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: palette.textSecondary, fontFamily: 'monospace' }}
                >
                  {revokeTarget.id}
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRevokeDialogOpen(false)}
            sx={{ color: palette.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRevokeConfirm}
            disabled={submitting}
            sx={{
              bgcolor: palette.error,
              '&:hover': { bgcolor: '#DC2626' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {submitting ? 'Revoking...' : 'Confirm Revoke'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CredentialLifecyclePanel;
