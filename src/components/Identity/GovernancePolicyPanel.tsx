import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Policy as PolicyIcon,
  CheckCircle as EnforcedIcon,
  RemoveCircleOutline as DisabledIcon,
  VpnKey as KeyRotationIcon,
  Badge as IssuanceIcon,
  Cancel as RevocationIcon,
  Share as DelegationIcon,
  Groups as ApprovalIcon,
} from '@mui/icons-material';
import type { GovernancePolicy, GovernancePolicyScope } from '../../hooks/useCredentialLifecycle';

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
  border: '#334155',
};

const SCOPE_CONFIG: Record<
  GovernancePolicyScope,
  { color: string; icon: React.ReactElement; label: string }
> = {
  key_rotation: {
    color: '#8B5CF6',
    icon: <KeyRotationIcon sx={{ fontSize: 16 }} />,
    label: 'Key Rotation',
  },
  credential_issuance: {
    color: palette.primary,
    icon: <IssuanceIcon sx={{ fontSize: 16 }} />,
    label: 'Issuance',
  },
  revocation: {
    color: palette.error,
    icon: <RevocationIcon sx={{ fontSize: 16 }} />,
    label: 'Revocation',
  },
  delegation: {
    color: '#06B6D4',
    icon: <DelegationIcon sx={{ fontSize: 16 }} />,
    label: 'Delegation',
  },
};

// --- Props ---

interface GovernancePolicyPanelProps {
  policies: GovernancePolicy[];
  onToggleEnforcement: (policyId: string) => Promise<void>;
  /** Whether the user is authorized to toggle policy enforcement. */
  canToggle?: boolean;
  /** Denial reason for tooltip display when toggle is disabled. */
  toggleDenialReason?: string;
}

// --- Component ---

const GovernancePolicyPanel: React.FC<GovernancePolicyPanelProps> = ({
  policies,
  onToggleEnforcement,
  canToggle = true,
  toggleDenialReason = '',
}) => {
  const [confirmDialog, setConfirmDialog] = useState<GovernancePolicy | null>(null);
  const [toggling, setToggling] = useState(false);

  const enforcedCount = useMemo(
    () => policies.filter((p) => p.enforced).length,
    [policies],
  );

  const handleToggleClick = (policy: GovernancePolicy) => {
    setConfirmDialog(policy);
  };

  const handleToggleConfirm = async () => {
    if (!confirmDialog) return;
    setToggling(true);
    try {
      await onToggleEnforcement(confirmDialog.id);
      setConfirmDialog(null);
    } finally {
      setToggling(false);
    }
  };

  const scopeChip = (scope: GovernancePolicyScope) => {
    const cfg = SCOPE_CONFIG[scope];
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
          <PolicyIcon sx={{ color: palette.warning }} />
          <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
            Governance Mutation Policies
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip
            icon={<EnforcedIcon sx={{ fontSize: 14 }} />}
            label={`${enforcedCount} Enforced`}
            size="small"
            sx={{
              bgcolor: `${palette.success}1a`,
              color: palette.success,
              fontWeight: 600,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: palette.success },
            }}
          />
          <Chip
            icon={<DisabledIcon sx={{ fontSize: 14 }} />}
            label={`${policies.length - enforcedCount} Disabled`}
            size="small"
            sx={{
              bgcolor: `${palette.textSecondary}1a`,
              color: palette.textSecondary,
              fontWeight: 600,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: palette.textSecondary },
            }}
          />
        </Stack>
      </Stack>

      <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
        These policies govern key identity mutations such as key rotation, credential issuance,
        revocation, and delegation. Enforced policies require approval before the operation can
        proceed.
      </Typography>

      {/* Policies Table */}
      <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Policy', 'Scope', 'Required Approvals', 'Enforced', 'Toggle'].map((h) => (
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
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow
                key={policy.id}
                sx={{
                  '&:hover': { bgcolor: `${palette.primary}08` },
                  opacity: policy.enforced ? 1 : 0.7,
                }}
              >
                <TableCell
                  sx={{
                    borderBottom: `1px solid ${palette.border}`,
                    maxWidth: 280,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: palette.text, fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    {policy.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: palette.textSecondary, display: 'block', mt: 0.25 }}
                  >
                    {policy.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  {scopeChip(policy.scope)}
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <ApprovalIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
                    <Typography
                      variant="body2"
                      sx={{ color: palette.text, fontWeight: 600 }}
                    >
                      {policy.requiredApprovals}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  <Chip
                    label={policy.enforced ? 'Enforced' : 'Disabled'}
                    size="small"
                    sx={{
                      bgcolor: policy.enforced ? `${palette.success}1a` : `${palette.textSecondary}1a`,
                      color: policy.enforced ? palette.success : palette.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: `1px solid ${policy.enforced ? `${palette.success}33` : `${palette.textSecondary}33`}`,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                  <Tooltip
                    title={
                      !canToggle
                        ? toggleDenialReason || 'You do not have permission to modify policies.'
                        : policy.enforced
                          ? 'Disable enforcement'
                          : 'Enable enforcement'
                    }
                  >
                    <span>
                      <Switch
                        checked={policy.enforced}
                        onChange={() => handleToggleClick(policy)}
                        disabled={!canToggle}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: palette.success },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            bgcolor: `${palette.success}66`,
                          },
                          '& .MuiSwitch-track': { bgcolor: `${palette.textSecondary}44` },
                        }}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Toggle Confirmation Dialog */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        PaperProps={{
          sx: {
            bgcolor: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
            minWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ color: palette.text, fontWeight: 700 }}>
          {confirmDialog?.enforced ? 'Disable' : 'Enable'} Policy Enforcement
        </DialogTitle>
        <DialogContent>
          {confirmDialog && (
            <>
              <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                {confirmDialog.enforced
                  ? 'Disabling this policy will allow the governed operation to proceed without approval. This may reduce security.'
                  : 'Enabling this policy will require approval before the governed operation can proceed.'}
              </Typography>
              <Paper
                sx={{
                  bgcolor: `${palette.bg}80`,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 600 }}>
                  {confirmDialog.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {scopeChip(confirmDialog.scope)}
                  <Chip
                    label={`${confirmDialog.requiredApprovals} approvals needed`}
                    size="small"
                    sx={{
                      bgcolor: `${palette.primary}15`,
                      color: palette.textSecondary,
                      fontSize: '0.7rem',
                    }}
                  />
                </Stack>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            sx={{ color: palette.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleToggleConfirm}
            disabled={toggling}
            sx={{
              bgcolor: confirmDialog?.enforced ? palette.warning : palette.success,
              '&:hover': {
                bgcolor: confirmDialog?.enforced ? '#D97706' : '#16A34A',
              },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {toggling
              ? 'Updating...'
              : confirmDialog?.enforced
                ? 'Disable Enforcement'
                : 'Enable Enforcement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GovernancePolicyPanel;
