/**
 * BridgeTransactionTracker Component
 *
 * Displays a list of recent bridge transactions with real-time finality
 * trust badges. Integrates with the bridge finality monitoring API
 * and uses TransactionTrustBadge for visual status indicators.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Collapse,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useBridgeTransactions } from '../../hooks/useApiQueries';
import { useBridgeFinalityStatus } from '../../hooks/useBridgeFinalityStatus';
import { TransactionTrustBadge } from './TransactionTrustBadge';

/**
 * Row component for a single transaction that fetches its own finality status.
 */
interface TransactionRowProps {
  transaction: {
    id: string;
    from_chain: string;
    to_chain: string;
    sender_address: string;
    recipient_address: string;
    amount: string;
    asset: string;
    status: string;
    timestamp: number;
    tx_hash?: string;
    fee?: string;
    provider?: string;
    estimated_time?: string;
  };
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const [expanded, setExpanded] = useState(false);

  // Only poll finality for transactions that have a tx_hash and are not already
  // in a terminal status on the bridge side
  const shouldPollFinality =
    !!transaction.tx_hash &&
    transaction.status !== 'failed';

  const { data: finalityInfo, isLoading: finalityLoading } = useBridgeFinalityStatus(
    shouldPollFinality ? transaction.tx_hash : undefined,
    { enabled: shouldPollFinality },
  );

  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address || '--';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (ts: number): string => {
    if (!ts) return '--';
    return new Date(ts).toLocaleString();
  };

  const getStatusChipColor = (
    status: string,
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
    case 'initiated':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
    }
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {transaction.from_chain} &rarr; {transaction.to_chain}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(transaction.timestamp)}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {transaction.amount} {transaction.asset}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={transaction.status}
            color={getStatusChipColor(transaction.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          {finalityLoading ? (
            <CircularProgress size={20} />
          ) : finalityInfo ? (
            <TransactionTrustBadge finalityInfo={finalityInfo} compact />
          ) : (
            <Typography variant="caption" color="text.secondary">
              --
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="caption" fontFamily="monospace">
            {formatAddress(transaction.tx_hash || '')}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded Detail Row */}
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap={2}
              >
                {/* Transaction Details */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Transaction Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sender:</strong> {formatAddress(transaction.sender_address)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Recipient:</strong> {formatAddress(transaction.recipient_address)}
                  </Typography>
                  {transaction.fee && (
                    <Typography variant="body2">
                      <strong>Fee:</strong> {transaction.fee}
                    </Typography>
                  )}
                  {transaction.provider && (
                    <Typography variant="body2">
                      <strong>Provider:</strong> {transaction.provider}
                    </Typography>
                  )}
                  {transaction.tx_hash && (
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      <strong>Tx Hash:</strong> {transaction.tx_hash}
                    </Typography>
                  )}
                </Box>

                {/* Finality Trust Badge (full view) */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Finality Status
                  </Typography>
                  {finalityLoading ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Loading finality data...
                      </Typography>
                    </Box>
                  ) : finalityInfo ? (
                    <TransactionTrustBadge finalityInfo={finalityInfo} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Finality monitoring not available for this transaction.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

/**
 * Main tracker component that renders the transaction list.
 */
interface BridgeTransactionTrackerProps {
  /** Maximum number of transactions to display. Defaults to 10. */
  limit?: number;
  /** Optional filter by source chain. */
  fromChain?: string;
  /** Optional filter by destination chain. */
  toChain?: string;
}

export const BridgeTransactionTracker: React.FC<BridgeTransactionTrackerProps> = ({
  limit = 10,
  fromChain,
  toChain,
}) => {
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useBridgeTransactions({ limit, fromChain, toChain });

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Bridge Transactions</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load bridge transactions. Please try again.
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : !transactions || transactions.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography color="text.secondary">No bridge transactions found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Trust State</TableCell>
                  <TableCell>Tx Hash</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx: TransactionRowProps['transaction']) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BridgeTransactionTracker;
