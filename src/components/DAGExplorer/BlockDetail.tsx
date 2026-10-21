import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Collapse,
  Stack,
  Divider,
  Button,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ExpandMore as ExpandIcon,
  Code as CodeIcon,
  Receipt as TxIcon,
  Shield as AttestIcon,
} from '@mui/icons-material';
import type { DAGBlock } from './DAGGraph';

// --- Types ---

export interface BlockTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  status: 'success' | 'failed';
  type: string;
}

interface BlockDetailProps {
  block: DAGBlock | null;
  transactions?: BlockTransaction[];
  attestors?: string[];
  onNavigateBlock: (direction: 'prev' | 'next') => void;
  onSelectParent: (hash: string) => void;
  onSelectTransaction: (tx: BlockTransaction) => void;
}

// --- Constants ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

const STATUS_COLORS: Record<string, string> = {
  finalized: palette.success,
  confirmed: palette.primary,
  pending: palette.warning,
  orphaned: '#64748B',
};

// (generateMockTransactions and MOCK_ATTESTORS removed — data passed via props from parent)

// --- Helpers ---

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

// --- Component ---

const BlockDetail: React.FC<BlockDetailProps> = ({
  block,
  transactions = [],
  attestors = [],
  onNavigateBlock,
  onSelectParent,
  onSelectTransaction,
}) => {
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);

  const handleToggleTx = useCallback((hash: string) => {
    setExpandedTx(prev => (prev === hash ? null : hash));
  }, []);

  if (!block) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          Select a block in the DAG to view details
        </Typography>
      </Box>
    );
  }

  const statusColor = STATUS_COLORS[block.status] || palette.textSecondary;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Header with navigation */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={() => onNavigateBlock('prev')} sx={{ color: palette.textSecondary }}>
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: palette.text, fontWeight: 700 }}>
            Block #{block.height}
          </Typography>
          <IconButton size="small" onClick={() => onNavigateBlock('next')} sx={{ color: palette.textSecondary }}>
            <NextIcon />
          </IconButton>
        </Stack>
        <Chip
          label={block.status.toUpperCase()}
          size="small"
          sx={{
            bgcolor: statusColor + '22',
            color: statusColor,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      </Stack>

      {/* Block hash */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mb: 0.5 }}>
          Block Hash
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ color: palette.text, fontFamily: 'monospace', fontSize: 12, flex: 1 }}>
            {block.hash}
          </Typography>
          <IconButton size="small" onClick={() => copyToClipboard(block.hash)} sx={{ color: palette.textSecondary }}>
            <CopyIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* Key details grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Timestamp</Typography>
          <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>
            {formatTimestamp(block.timestamp)}
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Proposer</Typography>
          <Typography variant="body2" sx={{ color: palette.primary, fontSize: 12, fontFamily: 'monospace' }}>
            {block.proposer}
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Gas Used / Limit</Typography>
          <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>
            {(block.gasUsed / 1_000_000).toFixed(1)}M / {(block.gasLimit / 1_000_000).toFixed(0)}M
            <Typography component="span" variant="caption" sx={{ color: palette.textSecondary, ml: 0.5 }}>
              ({((block.gasUsed / block.gasLimit) * 100).toFixed(1)}%)
            </Typography>
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Block Size</Typography>
          <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>
            {formatBytes(block.size)}
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Reward</Typography>
          <Typography variant="body2" sx={{ color: palette.success, fontSize: 12, fontWeight: 600 }}>
            {block.reward} WRF
          </Typography>
        </Paper>
        <Paper sx={{ bgcolor: palette.card, p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>Attestations</Typography>
          <Typography variant="body2" sx={{ color: palette.text, fontSize: 12 }}>
            {block.attestationCount} / 128
          </Typography>
        </Paper>
      </Box>

      {/* Parent blocks */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mb: 1 }}>
          Parent Blocks ({block.parentHashes.length})
        </Typography>
        <Stack spacing={0.5}>
          {block.parentHashes.map((hash, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="body2"
                sx={{
                  color: palette.primary,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => onSelectParent(hash)}
              >
                {hash}
              </Typography>
              {i === 0 && (
                <Chip label="primary" size="small" sx={{ height: 18, fontSize: 9, bgcolor: palette.primary + '22', color: palette.primary }} />
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* State / receipt roots */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>State Root</Typography>
            <Typography variant="body2" sx={{ color: palette.text, fontFamily: 'monospace', fontSize: 10 }}>
              {block.stateRoot}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>Receipt Root</Typography>
            <Typography variant="body2" sx={{ color: palette.text, fontFamily: 'monospace', fontSize: 10 }}>
              {block.receiptRoot}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Attestors */}
      <Paper sx={{ bgcolor: palette.card, p: 1.5, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AttestIcon sx={{ color: palette.primary, fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Attestors ({attestors.length} shown)
          </Typography>
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {attestors.map((addr, i) => (
            <Chip
              key={i}
              label={addr}
              size="small"
              sx={{
                bgcolor: palette.bg,
                color: palette.textSecondary,
                fontSize: 10,
                fontFamily: 'monospace',
                height: 22,
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Transactions */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1 }}>
          <TxIcon sx={{ color: palette.primary, fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
            Transactions ({block.txCount})
          </Typography>
        </Stack>
        <Divider sx={{ borderColor: palette.border }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Hash</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Type</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Value</TableCell>
              <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.5 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map(tx => (
              <React.Fragment key={tx.hash}>
                <TableRow
                  hover
                  onClick={() => handleToggleTx(tx.hash)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: palette.bg },
                  }}
                >
                  <TableCell sx={{ color: palette.primary, fontFamily: 'monospace', fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                    {tx.hash.slice(0, 14)}...
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                    {tx.type}
                  </TableCell>
                  <TableCell sx={{ color: palette.text, fontSize: 10, borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                    {tx.value}
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${palette.border}`, py: 0.75 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: tx.status === 'success' ? palette.success : palette.error,
                      }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} sx={{ p: 0, borderBottom: expandedTx === tx.hash ? `1px solid ${palette.border}` : 'none' }}>
                    <Collapse in={expandedTx === tx.hash}>
                      <Box sx={{ p: 1.5, bgcolor: palette.bg }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block' }}>
                          From: <span style={{ color: palette.text, fontFamily: 'monospace' }}>{tx.from}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mt: 0.25 }}>
                          To: <span style={{ color: palette.text, fontFamily: 'monospace' }}>{tx.to}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', mt: 0.25 }}>
                          Gas Used: <span style={{ color: palette.text }}>{tx.gasUsed.toLocaleString()}</span>
                        </Typography>
                        <Button
                          size="small"
                          variant="text"
                          sx={{ mt: 0.5, fontSize: 10, color: palette.primary, textTransform: 'none', p: 0 }}
                          onClick={(e) => { e.stopPropagation(); onSelectTransaction(tx); }}
                        >
                          View Execution Trace
                        </Button>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Raw JSON Toggle */}
      <Paper sx={{ bgcolor: palette.card, borderRadius: 2, overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1.5, py: 1, cursor: 'pointer' }}
          onClick={() => setShowRawJSON(!showRawJSON)}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <CodeIcon sx={{ color: palette.textSecondary, fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>
              Raw Block Data
            </Typography>
          </Stack>
          <ExpandIcon
            sx={{
              color: palette.textSecondary,
              fontSize: 18,
              transform: showRawJSON ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </Stack>
        <Collapse in={showRawJSON}>
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Box
              component="pre"
              sx={{
                bgcolor: palette.bg,
                p: 1.5,
                borderRadius: 1,
                color: palette.textSecondary,
                fontFamily: 'monospace',
                fontSize: 10,
                overflow: 'auto',
                maxHeight: 300,
                m: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(block, null, 2)}
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default BlockDetail;
