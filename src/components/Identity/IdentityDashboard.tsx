import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  Paper,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Key as KeyIcon,
  Badge as BadgeIcon,
  Description as DocIcon,
  MiscellaneousServices as ServiceIcon,
  Fingerprint as FingerprintIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Autorenew as RotateIcon,
} from '@mui/icons-material';
import KeyEpochTimeline, { KeyEpochEntry, KeyEpochStatus } from './KeyEpochTimeline';
import CredentialLifecyclePanel from './CredentialLifecyclePanel';
import GovernancePolicyPanel from './GovernancePolicyPanel';
import { useCredentialLifecycle } from '../../hooks/useCredentialLifecycle';
import FEATURES from '../../config/features';

// --- Types ---

interface VerificationMethod {
  id: string;
  type: 'Ed25519VerificationKey2020' | 'EcdsaSecp256k1VerificationKey2019' | 'JsonWebKey2020';
  controller: string;
  publicKeyMultibase: string;
  purpose: string[];
  created: string;
}

interface VerifiableCredential {
  id: string;
  type: string;
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  status: 'valid' | 'expired' | 'revoked';
  credentialSubject: string;
}

interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

interface DIDDocument {
  id: string;
  controller: string;
  created: string;
  updated: string;
  verificationMethods: VerificationMethod[];
  credentials: VerifiableCredential[];
  services: ServiceEndpoint[];
}

// --- Key Lifecycle Types ---

interface SignerRolePolicy {
  role: string;
  maxEpochs: number;
  rotationIntervalDays: number;
  requiresMultiSig: boolean;
}

interface KeyLifecycleData {
  epochs: KeyEpochEntry[];
  activeEpoch: KeyEpochEntry | null;
  signerRolePolicies: SignerRolePolicy[];
  lastRotation: string | null;
  nextScheduledRotation: string | null;
}

type KeyLifecycleLoadState = 'idle' | 'loading' | 'loaded' | 'error';

// --- Sample key lifecycle: rendered ONLY under FEATURES.demoSurfaces (frontend#329) ---

const SAMPLE_KEY_LIFECYCLE: KeyLifecycleData = {
  epochs: [
    {
      epoch: 3,
      keyFingerprint: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      activatedAt: '2026-01-20T16:45:00Z',
      revokedAt: null,
      status: 'active',
      signingRole: 'Validator',
    },
    {
      epoch: 2,
      keyFingerprint: 'zQ3shokFTS3brHcDQrn82RUDfCZESWL1ZdCEJwekUDPQiYBme',
      activatedAt: '2025-12-01T08:15:00Z',
      revokedAt: '2026-01-20T16:44:00Z',
      status: 'revoked',
      signingRole: 'Oracle',
    },
    {
      epoch: 1,
      keyFingerprint: 'z82Lm1MpAkeJcix9K8TMiLd5NMAhnwkjjCBeWHXyu3U4oT2MVJy',
      activatedAt: '2025-11-15T10:30:00Z',
      revokedAt: '2025-12-01T08:14:00Z',
      status: 'expired',
      signingRole: 'Oracle',
    },
    {
      epoch: 0,
      keyFingerprint: '7a3b9c1d4e5f6a2b8c9d0e1f2a3b4c5d6e7f8a9b',
      activatedAt: '2025-11-15T10:30:00Z',
      revokedAt: '2025-11-15T10:30:00Z',
      status: 'expired',
      signingRole: 'Validator',
    },
  ],
  activeEpoch: {
    epoch: 3,
    keyFingerprint: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    activatedAt: '2026-01-20T16:45:00Z',
    revokedAt: null,
    status: 'active',
    signingRole: 'Validator',
  },
  signerRolePolicies: [
    { role: 'Oracle', maxEpochs: 10, rotationIntervalDays: 90, requiresMultiSig: false },
    { role: 'Validator', maxEpochs: 5, rotationIntervalDays: 180, requiresMultiSig: true },
    { role: 'BridgeOperator', maxEpochs: 8, rotationIntervalDays: 120, requiresMultiSig: true },
    { role: 'GovernanceOperator', maxEpochs: 12, rotationIntervalDays: 365, requiresMultiSig: false },
  ],
  lastRotation: '2026-01-20T16:45:00Z',
  nextScheduledRotation: '2026-07-20T16:45:00Z',
};

// MOCK_DID removed — DID document fetched from /api/identity/did

// --- Palette ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

const KEY_TYPE_COLORS: Record<string, string> = {
  Ed25519VerificationKey2020: '#8B5CF6',
  EcdsaSecp256k1VerificationKey2019: '#F59E0B',
  JsonWebKey2020: '#06B6D4',
};

const KEY_TYPE_SHORT: Record<string, string> = {
  Ed25519VerificationKey2020: 'Ed25519',
  EcdsaSecp256k1VerificationKey2019: 'Secp256k1',
  JsonWebKey2020: 'JWK',
};

// --- Helpers ---

function deriveEpochStatus(revokedAt: string | null | undefined, activatedAt: string): KeyEpochStatus {
  if (revokedAt) return 'revoked';
  // If activatedAt is more than 365 days ago and there's no explicit revocation,
  // we can't automatically mark as expired since the backend should dictate that.
  // For now, consider it active unless revoked.
  try {
    const activated = new Date(activatedAt).getTime();
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (now - activated > oneYearMs) return 'expired';
  } catch {
    // If date parsing fails, default to active
  }
  return 'active';
}

function formatScheduleDate(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// --- Component ---

const IdentityDashboard: React.FC = () => {
  const [didDoc, setDidDoc] = useState<DIDDocument | null>(null);
  const [didLoading, setDidLoading] = useState(true);
  const [didError, setDidError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newDidAlias, setNewDidAlias] = useState('');

  // Credential lifecycle & governance policies (policy-aware)
  const {
    credentials: lifecycleCredentials,
    policies: governancePolicies,
    policyStatus,
    loading: credLifecycleLoading,
    available: credLifecycleAvailable,
    error: credLifecycleError,
    policyDenial,
    requestCredential,
    revokeCredential,
    togglePolicyEnforcement,
  } = useCredentialLifecycle();

  // Fetch DID document from backend
  const fetchDID = useCallback(async () => {
    setDidLoading(true);
    setDidError(null);
    try {
      const response = await fetch('/api/identity/did', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`DID fetch failed: ${response.status}`);
      const data = await response.json();
      const raw = data?.data ?? data;
      const verificationMethods = raw?.verificationMethods ?? raw?.verification_methods;
      const services = raw?.services ?? raw?.service;
      if (!raw || typeof (raw.id ?? raw.did) !== 'string' || !(raw.id ?? raw.did).trim() ||
          !Array.isArray(verificationMethods) || !Array.isArray(raw.credentials) || !Array.isArray(services)) {
        throw new Error('DID response is incomplete.');
      }
      setDidDoc({
        id: String(raw.id ?? raw.did ?? ''),
        controller: String(raw.controller ?? raw.id ?? ''),
        created: String(raw.created ?? raw.createdAt ?? ''),
        updated: String(raw.updated ?? raw.updatedAt ?? ''),
        verificationMethods,
        credentials: raw.credentials,
        services,
      });
    } catch (err: unknown) {
      setDidDoc(null);
      setDidError(err instanceof Error ? err.message : 'Failed to load DID document');
    } finally {
      setDidLoading(false);
    }
  }, []);

  useEffect(() => { fetchDID(); }, [fetchDID]);

  // Key Lifecycle state
  const [keyLifecycle, setKeyLifecycle] = useState<KeyLifecycleData | null>(null);
  const [keyLoadState, setKeyLoadState] = useState<KeyLifecycleLoadState>('idle');
  const [keyLoadError, setKeyLoadError] = useState<string | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [policiesExpanded, setPoliciesExpanded] = useState(false);

  // Fetch key lifecycle data from backend, fall back gracefully
  const fetchKeyLifecycle = useCallback(async () => {
    setKeyLoadState('loading');
    setKeyLoadError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/identity/keys', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Normalize backend response into our KeyLifecycleData shape
      const epochs: KeyEpochEntry[] = (data.data?.epochs || data.epochs || []).map(
        (e: Record<string, unknown>) => ({
          epoch: e.epoch as number,
          keyFingerprint: (e.keyFingerprint || e.public_key || e.publicKey || '') as string,
          activatedAt: (e.activatedAt || e.activated_at || '') as string,
          revokedAt: (e.revokedAt || e.revoked_at || null) as string | null,
          status: deriveEpochStatus(
            e.revokedAt as string | null || e.revoked_at as string | null,
            e.activatedAt as string || e.activated_at as string || '',
          ),
          signingRole: (e.signingRole || e.signing_role || e.role || 'Unknown') as string,
        }),
      );

      const activeEpochs = epochs.filter((ep) => ep.status === 'active');
      const policies: SignerRolePolicy[] = (data.data?.signerRolePolicies || data.signerRolePolicies || []).map(
        (p: Record<string, unknown>) => ({
          role: (p.role || '') as string,
          maxEpochs: (p.maxEpochs || p.max_epochs || 0) as number,
          rotationIntervalDays: (p.rotationIntervalDays || p.rotation_interval_days || 0) as number,
          requiresMultiSig: (p.requiresMultiSig || p.requires_multi_sig || false) as boolean,
        }),
      );

      setKeyLifecycle({
        epochs,
        activeEpoch: activeEpochs.length > 0 ? activeEpochs[activeEpochs.length - 1] : null,
        signerRolePolicies: policies,
        lastRotation: (data.data?.lastRotation || data.lastRotation || null) as string | null,
        nextScheduledRotation: (data.data?.nextScheduledRotation || data.nextScheduledRotation || null) as string | null,
      });
      setKeyLoadState('loaded');
    } catch (err: unknown) {
      // SAMPLE_KEY_LIFECYCLE is invented: hard-coded DID fingerprints, epochs
      // and rotation timestamps that no backend ever produced. It used to be
      // labelled "cached data" (frontend#214) and then shown as SAMPLE by
      // default. Per the #300 decision (frontend#329) the default build shows
      // nothing in its place: the real state is unknown, say so. The sample
      // renders only when demo surfaces are explicitly on.
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      if (FEATURES.demoSurfaces) {
        console.warn('Key lifecycle endpoint unavailable, showing SAMPLE data (demo surfaces on):', err);
        setKeyLifecycle(SAMPLE_KEY_LIFECYCLE);
        setKeyLoadError(
          timedOut
            ? 'Connection timed out. Showing SAMPLE key data — not this identity’s real key history.'
            : 'Key management service unavailable. Showing SAMPLE key data — not this identity’s real key history.',
        );
      } else {
        console.warn('Key lifecycle endpoint unavailable:', err);
        setKeyLifecycle(null);
        setKeyLoadError(
          timedOut
            ? 'Connection timed out — this identity’s key history is unknown.'
            : 'Key management service unavailable — this identity’s key history is unknown.',
        );
      }
      setKeyLoadState('error');
    }
  }, []);

  useEffect(() => {
    fetchKeyLifecycle();
  }, [fetchKeyLifecycle]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const credentialStatusChip = (status: VerifiableCredential['status']) => {
    const config = {
      valid: { color: palette.success, icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'Valid' },
      expired: { color: palette.warning, icon: <WarningIcon sx={{ fontSize: 14 }} />, label: 'Expired' },
      revoked: { color: palette.error, icon: <CancelIcon sx={{ fontSize: 14 }} />, label: 'Revoked' },
    };
    const c = config[status];
    return (
      <Chip
        icon={c.icon}
        label={c.label}
        size="small"
        sx={{
          bgcolor: `${c.color}1a`,
          color: c.color,
          border: `1px solid ${c.color}33`,
          fontWeight: 600,
          fontSize: '0.7rem',
          '& .MuiChip-icon': { color: c.color },
        }}
      />
    );
  };

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <FingerprintIcon sx={{ color: palette.primary, fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700 }}>
            Decentralized Identity
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Manage your W3C DID, verification keys, and verifiable credentials
        </Typography>
      </Box>

      {/* DID Hero Card */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {didLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} sx={{ color: palette.primary }} />
            </Box>
          ) : didError ? (
            <Alert severity="warning" action={<Button size="small" onClick={fetchDID}>Retry</Button>}>
              {didError}
            </Alert>
          ) : didDoc ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, letterSpacing: 1 }}>
                YOUR DECENTRALIZED IDENTIFIER
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Typography
                    sx={{
                      color: palette.text,
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      wordBreak: 'break-all',
                    }}
                  >
                  {didDoc.id}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy DID'}>
                  <IconButton
                      size="small"
                      onClick={() => handleCopy(didDoc.id)}
                      sx={{ color: palette.textSecondary, '&:hover': { color: palette.primary } }}
                    >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Created: {new Date(didDoc.created).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                  Updated: {new Date(didDoc.updated).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
                sx={{
                  bgcolor: palette.primary,
                  '&:hover': { bgcolor: palette.primaryDark },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                }}
              >
              Create New DID
            </Button>
          </Stack>
          ) : null}
        </CardContent>
      </Card>

      {didDoc && !didLoading && !didError ? (<>
      {/* Summary Cards Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {[
            {
              icon: <DocIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />,
              title: 'DID Document',
              subtitle: `${didDoc?.verificationMethods.length ?? 0} keys registered`,
              accent: '#8B5CF6',
            },
            {
              icon: <BadgeIcon sx={{ fontSize: 32, color: '#3B82F6' }} />,
              title: 'Credentials',
              subtitle: `${(didDoc?.credentials ?? []).filter(c => c.status === 'valid').length} active of ${didDoc?.credentials.length ?? 0}`,
              accent: '#3B82F6',
            },
            {
              icon: <ServiceIcon sx={{ fontSize: 32, color: '#06B6D4' }} />,
              title: 'Services',
              subtitle: `${didDoc?.services.length ?? 0} endpoints linked`,
              accent: '#06B6D4',
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              sx={{
                bgcolor: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 3,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: item.accent },
              }}
            >
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: `${item.accent}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                {item.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  {item.subtitle}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          ))}
      </Box>

      {/* Verification Methods */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <KeyIcon sx={{ color: palette.primary }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Verification Methods
            </Typography>
          </Stack>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Key ID', 'Type', 'Purpose', 'Public Key', 'Created'].map(h => (
                      <TableCell
                        key={h}
                        sx={{ color: palette.textSecondary, borderBottom: `1px solid ${palette.border}`, fontWeight: 600, fontSize: '0.75rem', letterSpacing: 0.5 }}
                      >
                      {h}
                    </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(didDoc?.verificationMethods ?? []).map((vm) => (
                    <TableRow key={vm.id} sx={{ '&:hover': { bgcolor: `${palette.primary}08` } }}>
                    <TableCell sx={{ color: palette.text, fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                      {vm.id.split('#')[1] || vm.id}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                      <Chip
                          label={KEY_TYPE_SHORT[vm.type] || vm.type}
                          size="small"
                          sx={{
                            bgcolor: `${KEY_TYPE_COLORS[vm.type] || palette.primary}1a`,
                            color: KEY_TYPE_COLORS[vm.type] || palette.primary,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            border: `1px solid ${KEY_TYPE_COLORS[vm.type] || palette.primary}33`,
                          }}
                        />
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {vm.purpose.map(p => (
                            <Chip
                              key={p}
                              label={p}
                              size="small"
                              sx={{
                                bgcolor: `${palette.primary}15`,
                                color: palette.textSecondary,
                                fontSize: '0.65rem',
                              }}
                            />
                          ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: `1px solid ${palette.border}`, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Tooltip title={vm.publicKeyMultibase}>
                        <span>{vm.publicKeyMultibase.slice(0, 24)}...</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: palette.textSecondary, fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                      {new Date(vm.created).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Verifiable Credentials */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ShieldIcon sx={{ color: palette.success }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Verifiable Credentials
            </Typography>
          </Stack>
          <Stack spacing={2}>
            {(didDoc?.credentials ?? []).map((vc) => (
                <Paper
                  key={vc.id}
                  sx={{
                    bgcolor: `${palette.bg}80`,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 2,
                    p: 2.5,
                    '&:hover': { borderColor: palette.primary },
                    transition: 'border-color 0.2s',
                  }}
                >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 700 }}>
                        {vc.type}
                      </Typography>
                      {credentialStatusChip(vc.status)}
                    </Stack>
                    <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 1 }}>
                      {vc.credentialSubject}
                    </Typography>
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                        Issuer: <span style={{ color: palette.primary, fontFamily: 'monospace' }}>{vc.issuer}</span>
                      </Typography>
                      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                        Issued: {new Date(vc.issuanceDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                        Expires: {new Date(vc.expirationDate).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Box>
                  <Tooltip title="Verify on-chain">
                    <IconButton size="small" sx={{ color: palette.primary }}>
                      <VerifiedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
              ))}
          </Stack>
        </CardContent>
      </Card>

      </>) : <Alert severity="info" sx={{ mb: 3 }}>{didLoading ? 'Loading DID details.' : 'DID details unavailable.'}</Alert>}

      {/* Key Lifecycle */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryIcon sx={{ color: palette.primary }} />
              <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
                Key Lifecycle
              </Typography>
            </Stack>
            <Tooltip title="Refresh lifecycle data">
              <IconButton size="small" onClick={fetchKeyLifecycle} sx={{ color: palette.textSecondary }}>
                <RotateIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {keyLoadState === 'loading' && (
            <LinearProgress sx={{ mb: 2, bgcolor: `${palette.primary}22`, '& .MuiLinearProgress-bar': { bgcolor: palette.primary } }} />
          )}

          {keyLoadError && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                bgcolor: `${palette.warning}1a`,
                color: palette.textSecondary,
                border: `1px solid ${palette.warning}33`,
                '& .MuiAlert-icon': { color: palette.warning },
              }}
            >
              {keyLoadError}
            </Alert>
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              size="small"
              label={
                keyLifecycle?.activeEpoch
                  ? `Active Epoch: ${keyLifecycle.activeEpoch.epoch}`
                  : 'Active Epoch: unavailable'
              }
              sx={{ bgcolor: `${palette.primary}1a`, color: palette.primary, border: `1px solid ${palette.primary}33` }}
            />
            <Chip
              size="small"
              label={`Last Rotation: ${formatScheduleDate(keyLifecycle?.lastRotation || null)}`}
              sx={{ bgcolor: `${palette.success}1a`, color: palette.success, border: `1px solid ${palette.success}33` }}
            />
            <Chip
              size="small"
              label={`Next Rotation: ${formatScheduleDate(keyLifecycle?.nextScheduledRotation || null)}`}
              sx={{ bgcolor: `${palette.warning}1a`, color: palette.warning, border: `1px solid ${palette.warning}33` }}
            />
          </Stack>

          <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, mb: 2 }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 700 }}>
                  Epoch Timeline
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setTimelineExpanded(!timelineExpanded)}
                  sx={{ color: palette.textSecondary }}
                >
                  {timelineExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Box>
            <Collapse in={timelineExpanded}>
              <Divider sx={{ borderColor: palette.border }} />
              <Box sx={{ p: 2 }}>
                <KeyEpochTimeline
                  epochs={keyLifecycle?.epochs || []}
                  palette={palette}
                  policyEvaluatedAt={policyStatus.evaluatedAt}
                  canMutateEpochs={policyStatus.canRegisterKeyEpoch || policyStatus.canRotateKeyEpoch}
                  epochDenialReason={
                    policyStatus.denialReasons['key_epoch:register'] ||
                    policyStatus.denialReasons['key_epoch:rotate']
                  }
                />
              </Box>
            </Collapse>
          </Paper>

          <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2 }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ color: palette.text, fontWeight: 700 }}>
                  Signer Role Policies
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPoliciesExpanded(!policiesExpanded)}
                  sx={{ color: palette.textSecondary }}
                >
                  {policiesExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Box>
            <Collapse in={policiesExpanded}>
              <Divider sx={{ borderColor: palette.border }} />
              <Box sx={{ p: 2 }}>
                {keyLifecycle?.signerRolePolicies?.length ? (
                  <Stack spacing={1}>
                    {keyLifecycle.signerRolePolicies.map(policy => (
                      <Box
                        key={policy.role}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: 1.5,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: palette.text, fontWeight: 600 }}>
                          {policy.role}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={`Max epochs: ${policy.maxEpochs}`} />
                          <Chip size="small" label={`Rotate: ${policy.rotationIntervalDays}d`} />
                          <Chip
                            size="small"
                            label={policy.requiresMultiSig ? 'Multi-sig' : 'Single-sig'}
                            color={policy.requiresMultiSig ? 'primary' : 'default'}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                    No signer role policies available.
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Paper>
        </CardContent>
      </Card>

      {didDoc && !didLoading && !didError && (<>
      {/* Service Endpoints */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ServiceIcon sx={{ color: '#06B6D4' }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Service Endpoints
            </Typography>
          </Stack>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Service ID', 'Type', 'Endpoint'].map(h => (
                      <TableCell
                        key={h}
                        sx={{ color: palette.textSecondary, borderBottom: `1px solid ${palette.border}`, fontWeight: 600, fontSize: '0.75rem' }}
                      >
                      {h}
                    </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(didDoc?.services ?? []).map((svc) => (
                    <TableRow key={svc.id} sx={{ '&:hover': { bgcolor: `${palette.primary}08` } }}>
                    <TableCell sx={{ color: palette.text, fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                      {svc.id}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                      <Chip label={svc.type} size="small" sx={{ bgcolor: '#06B6D41a', color: '#06B6D4', fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: '0.8rem', borderBottom: `1px solid ${palette.border}` }}>
                      {svc.serviceEndpoint}
                    </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      </>)}

      {/* Credential Lifecycle */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {credLifecycleError && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                bgcolor: `${palette.warning}10`,
                color: palette.textSecondary,
                '& .MuiAlert-icon': { color: palette.warning },
              }}
            >
              {credLifecycleError}
            </Alert>
          )}
          {credLifecycleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: palette.primary }} />
            </Box>
          ) : !credLifecycleAvailable ? null : (
            <CredentialLifecyclePanel
              credentials={lifecycleCredentials}
              onRequestCredential={requestCredential}
              onRevokeCredential={revokeCredential}
              canIssue={policyStatus.canIssueCredential}
              canRevoke={policyStatus.canRevokeCredential}
              policyDenial={policyDenial}
              denialReasons={policyStatus.denialReasons}
            />
          )}
        </CardContent>
      </Card>

      {/* Governance Mutation Policies */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {credLifecycleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: palette.primary }} />
            </Box>
          ) : !credLifecycleAvailable ? null : (
            <GovernancePolicyPanel
              policies={governancePolicies}
              onToggleEnforcement={togglePolicyEnforcement}
              canToggle={policyStatus.canTogglePolicy}
              toggleDenialReason={policyStatus.denialReasons['governance:toggle_policy']}
            />
          )}
        </CardContent>
      </Card>

      {/* Create DID Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        PaperProps={{
          sx: { bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: 420 },
        }}
      >
        <DialogTitle sx={{ color: palette.text, fontWeight: 700 }}>
          Create New DID
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
            Create a new decentralized identifier on the WRF network. A new Ed25519 key pair will be generated automatically.
          </Typography>
          <TextField
            fullWidth
            label="Display Alias (optional)"
            value={newDidAlias}
            onChange={(e) => setNewDidAlias(e.target.value)}
            placeholder="e.g., my-weather-station"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: palette.text,
                '& fieldset': { borderColor: palette.border },
                '&:hover fieldset': { borderColor: palette.primary },
              },
              '& .MuiInputLabel-root': { color: palette.textSecondary },
            }}
          />
          <Alert severity="info" sx={{ mt: 2, bgcolor: `${palette.primary}10`, color: palette.textSecondary, '& .MuiAlert-icon': { color: palette.primary } }}>
            This will create a W3C DID Document on-chain. Gas fees apply.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: palette.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setCreateOpen(false)}
            sx={{ bgcolor: palette.primary, '&:hover': { bgcolor: palette.primaryDark }, textTransform: 'none', fontWeight: 600 }}
          >
            Create DID
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IdentityDashboard;
