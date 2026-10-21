import React, { useState, useCallback, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as AvailableIcon,
  Cancel as TakenIcon,
  Send as TransferIcon,
  Autorenew as RenewIcon,
  AccountTree as SubdomainIcon,
  Language as LanguageIcon,
  ContentCopy as CopyIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

// --- Types ---

interface WrfName {
  name: string;
  owner: string;
  expiryDate: string;
  registeredDate: string;
  resolvedAddress: string;
  subdomains: string[];
}

// --- Constants ---

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

const FEE_PER_YEAR = 12.5; // WRF per year

// MOCK_NAMES removed — names fetched from /api/identity/names

// --- Component ---

const NamingServiceSample: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<'available' | 'taken' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [regDuration, setRegDuration] = useState(1);
  const [showRegister, setShowRegister] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [selectedName, setSelectedName] = useState<WrfName | null>(null);
  const [myNames, setMyNames] = useState<WrfName[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [namesError, setNamesError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      setNamesLoading(true);
      setNamesError(null);
      try {
        // TODO: confirm endpoint path with backend team
        const res = await fetch('/api/identity/names', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Names fetch failed: ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.data ?? data.names ?? []);
        setMyNames(rows.map((n: any) => ({
          name: n.name ?? '',
          owner: n.owner ?? '',
          expiryDate: n.expiryDate ?? n.expiry_date ?? '',
          registeredDate: n.registeredDate ?? n.registered_date ?? '',
          resolvedAddress: n.resolvedAddress ?? n.resolved_address ?? n.owner ?? '',
          subdomains: Array.isArray(n.subdomains) ? n.subdomains : [],
        })));
      } catch (err: unknown) {
        setNamesError(err instanceof Error ? err.message : 'Failed to load names');
      } finally {
        setNamesLoading(false);
      }
    };
    fetchNames();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    setShowRegister(false);
    try {
      const normalized = searchQuery.toLowerCase().replace(/\.wrf$/, '') + '.wrf';
      // TODO: confirm endpoint path with backend team
      const res = await fetch(`/api/identity/names/lookup?name=${encodeURIComponent(normalized)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const available = data.available ?? !(data.taken ?? false);
        setSearchResult(available ? 'available' : 'taken');
        if (available) setShowRegister(true);
      } else {
        // Fallback: check locally against fetched names
        const taken = myNames.some(n => n.name === normalized);
        setSearchResult(taken ? 'taken' : 'available');
        if (!taken) setShowRegister(true);
      }
    } catch {
      const normalized = searchQuery.toLowerCase().replace(/\.wrf$/, '') + '.wrf';
      const taken = myNames.some(n => n.name === normalized);
      setSearchResult(taken ? 'taken' : 'available');
      if (!taken) setShowRegister(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, myNames]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysUntilExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const normalizedSearch = searchQuery.toLowerCase().replace(/\.wrf$/, '') + '.wrf';
  const totalFee = FEE_PER_YEAR * regDuration;

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <LanguageIcon sx={{ color: palette.primary, fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700 }}>
            WRF Naming Service
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Register human-readable .wrf names for your addresses, stations, and services
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700, mb: 2, textAlign: 'center' }}>
            Find your .wrf name
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResult(null);
                setShowRegister(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="yourname"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ color: palette.textSecondary, fontWeight: 600 }}>.wrf</Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: palette.text,
                  fontSize: '1.1rem',
                  '& fieldset': { borderColor: palette.border },
                  '&:hover fieldset': { borderColor: palette.primary },
                  '&.Mui-focused fieldset': { borderColor: palette.primary },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              startIcon={isSearching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              sx={{
                bgcolor: palette.primary,
                '&:hover': { bgcolor: palette.primaryDark },
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                minWidth: 120,
                whiteSpace: 'nowrap',
              }}
            >
              {isSearching ? 'Checking...' : 'Search'}
            </Button>
          </Stack>

          {/* Search Result */}
          {searchResult && (
            <Box sx={{ mt: 2 }}>
              {searchResult === 'available' ? (
                <Alert
                  icon={<AvailableIcon />}
                  severity="success"
                  sx={{ bgcolor: `${palette.success}15`, color: palette.success, '& .MuiAlert-icon': { color: palette.success } }}
                >
                  <strong>{normalizedSearch}</strong> is available!
                </Alert>
              ) : (
                <Alert
                  icon={<TakenIcon />}
                  severity="error"
                  sx={{ bgcolor: `${palette.error}15`, color: palette.error, '& .MuiAlert-icon': { color: palette.error } }}
                >
                  <strong>{normalizedSearch}</strong> is already registered.
                </Alert>
              )}
            </Box>
          )}

          {/* Registration Form */}
          {showRegister && (
            <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, p: 3, mt: 2 }}>
              <Typography variant="subtitle1" sx={{ color: palette.text, fontWeight: 700, mb: 2 }}>
                Register {normalizedSearch}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 1 }}>
                  Registration Duration: {regDuration} year{regDuration > 1 ? 's' : ''}
                </Typography>
                <Slider
                  value={regDuration}
                  onChange={(_, val) => setRegDuration(val as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks={[
                    { value: 1, label: '1y' },
                    { value: 2, label: '2y' },
                    { value: 3, label: '3y' },
                    { value: 4, label: '4y' },
                    { value: 5, label: '5y' },
                  ]}
                  sx={{
                    color: palette.primary,
                    '& .MuiSlider-markLabel': { color: palette.textSecondary, fontSize: '0.75rem' },
                  }}
                />
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, p: 2, bgcolor: `${palette.primary}10`, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Registration Fee
                </Typography>
                <Typography sx={{ color: palette.text, fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  {totalFee.toFixed(1)} WRF
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mb: 2 }}>
                Rate: {FEE_PER_YEAR} WRF per year. Names are registered on-chain and link to your DID.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                sx={{ bgcolor: palette.primary, '&:hover': { bgcolor: palette.primaryDark }, textTransform: 'none', fontWeight: 600 }}
              >
                Register for {totalFee.toFixed(1)} WRF
              </Button>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* My Names Table */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700, mb: 2 }}>
            My Names
          </Typography>
          {namesLoading && <CircularProgress size={24} sx={{ color: palette.primary, display: 'block', mx: 'auto', my: 2 }} />}
          {namesError && <Alert severity="error" sx={{ mb: 2 }}>{namesError}</Alert>}
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Name', 'Resolves To', 'Expiry', 'Subdomains', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ color: palette.textSecondary, borderBottom: `1px solid ${palette.border}`, fontWeight: 600, fontSize: '0.75rem' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {myNames.map((n) => {
                  const days = daysUntilExpiry(n.expiryDate);
                  const isExpiringSoon = days < 90;
                  return (
                    <TableRow key={n.name} sx={{ '&:hover': { bgcolor: `${palette.primary}08` } }}>
                      <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: '0.9rem' }}>
                            {n.name}
                          </Typography>
                          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                            <IconButton size="small" onClick={() => handleCopy(n.name)} sx={{ color: palette.textSecondary, p: 0.5 }}>
                              <CopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: `1px solid ${palette.border}` }}>
                        {n.resolvedAddress.slice(0, 8)}...{n.resolvedAddress.slice(-6)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ color: isExpiringSoon ? palette.warning : palette.textSecondary, fontWeight: isExpiringSoon ? 600 : 400, fontSize: '0.85rem' }}
                          >
                            {new Date(n.expiryDate).toLocaleDateString()}
                          </Typography>
                          {isExpiringSoon && (
                            <Chip label={`${days}d left`} size="small" sx={{ bgcolor: `${palette.warning}1a`, color: palette.warning, fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                        {n.subdomains.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {n.subdomains.map((sd) => (
                              <Chip key={sd} label={sd} size="small" sx={{ bgcolor: `${palette.primary}15`, color: palette.textSecondary, fontSize: '0.6rem', height: 20 }} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" sx={{ color: palette.textSecondary, fontSize: '0.8rem' }}>
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${palette.border}` }}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Renew">
                            <IconButton size="small" sx={{ color: palette.success }}>
                              <RenewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Transfer">
                            <IconButton
                              size="small"
                              sx={{ color: palette.primary }}
                              onClick={() => { setSelectedName(n); setTransferOpen(true); }}
                            >
                              <TransferIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage Subdomains">
                            <IconButton size="small" sx={{ color: '#06B6D4' }}>
                              <SubdomainIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Reverse Resolution Card */}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <SwapIcon sx={{ color: '#06B6D4' }} />
            <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
              Reverse Resolution
            </Typography>
          </Stack>
          <Paper sx={{ bgcolor: `${palette.bg}80`, border: `1px solid ${palette.border}`, borderRadius: 2, p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Box>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>Address</Typography>
                <Typography sx={{ color: palette.textSecondary, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {myNames[0]?.resolvedAddress ?? '—'}
                </Typography>
              </Box>
              <Typography sx={{ color: palette.textSecondary, fontSize: '1.2rem' }}>
                →
              </Typography>
              <Box>
                <Typography variant="caption" sx={{ color: palette.textSecondary }}>Primary Name</Typography>
                <Typography sx={{ color: palette.primary, fontWeight: 700, fontSize: '1rem' }}>
                  {myNames[0]?.name ?? '—'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        PaperProps={{ sx: { bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: 420 } }}
      >
        <DialogTitle sx={{ color: palette.text, fontWeight: 700 }}>
          Transfer {selectedName?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
            Transfer ownership of this name to another address. This action is irreversible.
          </Typography>
          <TextField
            fullWidth
            label="Recipient Address or .wrf Name"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            placeholder="0x... or recipient.wrf"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: palette.text,
                '& fieldset': { borderColor: palette.border },
                '&:hover fieldset': { borderColor: palette.primary },
              },
              '& .MuiInputLabel-root': { color: palette.textSecondary },
            }}
          />
          <Alert severity="warning" sx={{ mt: 2, bgcolor: `${palette.warning}10`, color: palette.warning, '& .MuiAlert-icon': { color: palette.warning } }}>
            Transferring a name cannot be undone. Ensure the recipient address is correct.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTransferOpen(false)} sx={{ color: palette.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!transferTarget.trim()}
            onClick={() => setTransferOpen(false)}
            sx={{ bgcolor: palette.primary, '&:hover': { bgcolor: palette.primaryDark }, textTransform: 'none', fontWeight: 600 }}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default function NamingService() {
  return <DemoSurfaceGate testId="identity-names" title="Identity names are unavailable"
    description="The identity naming API is not served by the testnet. Names, availability and fees in this preview are illustrative only.">
    <NamingServiceSample />
  </DemoSurfaceGate>;
}
