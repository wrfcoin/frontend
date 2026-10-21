import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ReplayIcon from '@mui/icons-material/Replay';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReportIcon from '@mui/icons-material/Report';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';
import TimelineIcon from '@mui/icons-material/Timeline';
import GavelIcon from '@mui/icons-material/Gavel';

// Mapping of error codes to more user-friendly messages and suggested solutions
const ERROR_MESSAGES = {
  TIMEOUT: {
    title: 'Transaction Timeout',
    description:
      'The cross-chain transaction is taking longer than expected to complete.',
    solutions: [
      'Wait a little longer - cross-chain transfers can sometimes take 30+ minutes depending on network congestion.',
      'Check the source chain explorer to confirm if your transaction has been processed.',
      'Verify that the destination chain is operating normally.',
    ],
    icon: <TimelineIcon />,
    severity: 'warning',
  },
  LIQUIDITY: {
    title: 'Insufficient Liquidity',
    description:
      'There is not enough liquidity in the destination chain bridge pool to complete your transfer.',
    solutions: [
      'Try a smaller amount for your transfer.',
      'Try again later when liquidity might be replenished.',
      'Consider using a different bridge provider that may have more liquidity.',
    ],
    icon: <ReportIcon />,
    severity: 'error',
  },
  SLIPPAGE: {
    title: 'Slippage Exceeded',
    description:
      'The price moved unfavorably beyond your slippage tolerance during processing.',
    solutions: [
      'Increase your slippage tolerance and try again.',
      'Wait for more stable market conditions.',
      'Consider using a different bridge provider with better rates.',
    ],
    icon: <GavelIcon />,
    severity: 'warning',
  },
  REJECTED: {
    title: 'Transaction Rejected',
    description:
      'Your transaction was rejected by the bridge provider or destination chain.',
    solutions: [
      'Check if your wallet has sufficient funds for gas fees.',
      'Ensure you are using the correct receiver address format for the destination chain.',
      'Verify that the asset you are trying to transfer is supported on the destination chain.',
    ],
    icon: <ErrorIcon />,
    severity: 'error',
  },
  CONNECTIVITY: {
    title: 'Network Connectivity Issue',
    description:
      'There was a problem connecting to the bridge provider or blockchain network.',
    solutions: [
      'Check your internet connection.',
      'Refresh the page and try again.',
      'Try again later if the network issue persists.',
    ],
    icon: <LinkIcon />,
    severity: 'warning',
  },
  VALIDATION: {
    title: 'Transaction Validation Failed',
    description:
      'The transaction failed validation checks on the source or destination chain.',
    solutions: [
      'Check that you are transferring an amount above the minimum required.',
      'Verify that the destination address is valid and properly formatted.',
      'Ensure the asset is not restricted from cross-chain transfers.',
    ],
    icon: <CodeIcon />,
    severity: 'error',
  },
  UNKNOWN: {
    title: 'Unknown Error',
    description:
      'An unexpected error occurred during the cross-chain transfer process.',
    solutions: [
      'Refresh the page and try again.',
      'Check your wallet and bridge provider status.',
      'Contact support if the problem persists.',
    ],
    icon: <HelpOutlineIcon />,
    severity: 'error',
  },
};

const CrossChainErrorHandler = ({
  errorData,
  onRetry,
  onReset,
  onSubmitReport,
  currentTransaction,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  // Get error details from the error code, or use unknown as fallback
  const errorInfo = errorData?.code
    ? ERROR_MESSAGES[errorData.code] || ERROR_MESSAGES.UNKNOWN
    : ERROR_MESSAGES.UNKNOWN;

  // Handle expanding and collapsing the error details
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Check transaction status across chains
  const checkTransactionStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      setCheckResult(null);

      // In a real implementation, this would call the API to check status across chains
      const response = await fetch('/api/cross-chain/status-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: currentTransaction?.id,
          sourceChain: currentTransaction?.sourceChain,
          destinationChain: currentTransaction?.destinationChain,
          sourceTxHash: currentTransaction?.sourceTxHash,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status check failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Status check failed');
      }

      setCheckResult({
        sourceChainStatus: data.sourceChainStatus,
        destinationChainStatus: data.destinationChainStatus,
        bridgeStatus: data.bridgeStatus,
        recommendation: data.recommendation,
        canRetry: data.canRetry,
        transactionFound: data.transactionFound,
        estimatedTimeRemaining: data.estimatedTimeRemaining,
      });
    } catch (error) {
      console.error('Error checking transaction status:', error);
      setCheckResult({
        error: error.message || 'Error checking transaction status',
        transactionFound: false,
        canRetry: true,
      });
    } finally {
      setIsChecking(false);
    }
  }, [currentTransaction]);

  // Effect to auto-check status when component mounts with a current transaction
  useEffect(() => {
    if (currentTransaction && currentTransaction.id) {
      checkTransactionStatus();
    }
  }, [currentTransaction, checkTransactionStatus]);

  // Handle opening the report dialog
  const handleOpenReportDialog = () => {
    setReportDialogOpen(true);
  };

  // Handle closing the report dialog
  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
  };

  // Handle submitting the error report
  const handleSubmitReport = () => {
    if (onSubmitReport) {
      onSubmitReport({
        transactionId: currentTransaction?.id,
        errorCode: errorData?.code,
        errorMessage: errorData?.message,
        userDescription: reportDescription,
        timestamp: new Date().toISOString(),
      });
    }
    setReportDialogOpen(false);
    setReportDescription('');
  };

  // If no error data, don't render anything
  if (!errorData) {
    return null;
  }

  return (
    <Card
      sx={{
        mt: 3,
        border: '1px solid',
        borderColor: `${errorInfo.severity}.main`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${errorInfo.severity}.main`,
              mr: 2,
            }}
          >
            {React.cloneElement(errorInfo.icon, { fontSize: 'large' })}
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {errorInfo.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {errorInfo.description}
            </Typography>

            {errorData.message && (
              <Alert severity={errorInfo.severity} sx={{ mt: 1, mb: 1 }}>
                {errorData.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Button
                size="small"
                startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={toggleExpanded}
                sx={{ mr: 1 }}
              >
                {expanded ? 'Hide Details' : 'Show Details'}
              </Button>

              {onRetry && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<ReplayIcon />}
                  onClick={onRetry}
                  sx={{ mr: 1 }}
                >
                  Retry
                </Button>
              )}

              {onReset && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={onReset}
                >
                  New Transaction
                </Button>
              )}

              <Button
                size="small"
                variant="text"
                color="info"
                onClick={handleOpenReportDialog}
                sx={{ ml: 'auto' }}
              >
                Report Issue
              </Button>
            </Box>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Suggested Solutions:
            </Typography>

            <List dense>
              {errorInfo.solutions.map((solution, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary={solution} />
                </ListItem>
              ))}
            </List>

            {currentTransaction && (
              <>
                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Transaction Status Check:
                </Typography>

                {isChecking ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Checking transaction status across chains...
                    </Typography>
                  </Box>
                ) : checkResult ? (
                  checkResult.error ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {checkResult.error}
                    </Alert>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Alert
                            severity={
                              checkResult.sourceChainStatus === 'confirmed'
                                ? 'success'
                                : checkResult.sourceChainStatus === 'pending'
                                  ? 'warning'
                                  : 'error'
                            }
                            sx={{ height: '100%' }}
                          >
                            <AlertTitle>Source Chain</AlertTitle>
                            {checkResult.sourceChainStatus === 'confirmed'
                              ? 'Transaction confirmed'
                              : checkResult.sourceChainStatus === 'pending'
                                ? 'Transaction pending'
                                : 'Transaction failed or not found'}
                          </Alert>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Alert
                            severity={
                              checkResult.bridgeStatus === 'completed'
                                ? 'success'
                                : checkResult.bridgeStatus === 'processing'
                                  ? 'warning'
                                  : 'error'
                            }
                            sx={{ height: '100%' }}
                          >
                            <AlertTitle>Bridge Provider</AlertTitle>
                            {checkResult.bridgeStatus === 'completed'
                              ? 'Transfer completed'
                              : checkResult.bridgeStatus === 'processing'
                                ? 'Transfer in progress'
                                : 'Transfer failed or not initiated'}
                          </Alert>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Alert
                            severity={
                              checkResult.destinationChainStatus === 'confirmed'
                                ? 'success'
                                : checkResult.destinationChainStatus ===
                                    'pending'
                                  ? 'warning'
                                  : 'error'
                            }
                            sx={{ height: '100%' }}
                          >
                            <AlertTitle>Destination Chain</AlertTitle>
                            {checkResult.destinationChainStatus === 'confirmed'
                              ? 'Transaction confirmed'
                              : checkResult.destinationChainStatus === 'pending'
                                ? 'Transaction pending'
                                : 'Transaction not yet initiated'}
                          </Alert>
                        </Grid>
                      </Grid>

                      {checkResult.recommendation && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <AlertTitle>Recommendation</AlertTitle>
                          {checkResult.recommendation}
                          {checkResult.estimatedTimeRemaining && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Estimated time remaining:{' '}
                              {checkResult.estimatedTimeRemaining}
                            </Typography>
                          )}
                        </Alert>
                      )}
                    </Box>
                  )
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ReplayIcon />}
                    onClick={checkTransactionStatus}
                  >
                    Check Status
                  </Button>
                )}
              </>
            )}

            {errorData.code && errorData.timestamp && (
              <>
                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="caption">
                    Error Code: {errorData.code}
                  </Typography>
                  <Typography variant="caption">
                    Timestamp: {new Date(errorData.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Report Issue Dialog */}
      <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog}>
        <DialogTitle>Report Issue</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please describe the issue you're experiencing with your cross-chain
            transaction. This report will help us improve our service.
          </DialogContentText>

          <TextField
            autoFocus
            margin="dense"
            id="report-description"
            label="Issue Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reportDescription}
            onChange={e => setReportDescription(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Transaction Details:
            </Typography>
            <Typography variant="body2" component="div">
              <Box component="span" sx={{ display: 'block' }}>
                <b>Transaction ID:</b> {currentTransaction?.id || 'N/A'}
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                <b>Error Code:</b> {errorData?.code || 'N/A'}
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                <b>Source Chain:</b> {currentTransaction?.sourceChain || 'N/A'}
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                <b>Destination Chain:</b>{' '}
                {currentTransaction?.destinationChain || 'N/A'}
              </Box>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReport}
            variant="contained"
            disabled={!reportDescription.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CrossChainErrorHandler;
