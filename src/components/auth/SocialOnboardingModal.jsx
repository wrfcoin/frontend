/**
 * SocialOnboardingModal — wallet-free onboarding entry point.
 *
 * Offers: Google GSI, Apple (coming soon), or MetaMask.
 * On any successful login, calls onSuccess(walletAddress) and closes.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { SocialLoginButton } from './SocialLoginButton';

export function SocialOnboardingModal({ open, onClose, onSuccess }) {
  const [metaMaskLoading, setMetaMaskLoading] = useState(false);
  const [metaMaskError, setMetaMaskError] = useState(null);

  const handleMetaMask = async () => {
    setMetaMaskLoading(true);
    setMetaMaskError(null);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install the MetaMask extension.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        onSuccess(accounts[0]);
      }
    } catch (err) {
      setMetaMaskError(err.message ?? 'Failed to connect MetaMask');
    } finally {
      setMetaMaskLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: 3,
          color: '#e0e0e0',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h5" fontWeight={700} component="div">
          Join WRFCoin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No crypto wallet needed
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Google */}
        <SocialLoginButton
          provider="google"
          onSuccess={(addr) => {
            onSuccess(addr);
          }}
        />

        {/* Apple */}
        <SocialLoginButton provider="apple" />

        <Divider sx={{ borderColor: '#2a2a4a' }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        {/* MetaMask */}
        {metaMaskError && (
          <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>
            {metaMaskError}
          </Alert>
        )}
        <button
          onClick={handleMetaMask}
          disabled={metaMaskLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '11px 16px',
            background: '#f6851b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: metaMaskLoading ? 'not-allowed' : 'pointer',
            opacity: metaMaskLoading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {metaMaskLoading ? (
            <CircularProgress size={18} sx={{ color: '#fff' }} />
          ) : (
            /* MetaMask fox icon SVG */
            <svg width="20" height="20" viewBox="0 0 318.6 318.6" fill="none" aria-hidden="true">
              <polygon fill="#E2761B" points="274.1,35.5 174.6,109.4 193,65.8" />
              <polygon fill="#E4761B" points="44.4,35.5 143.1,110.1 125.6,65.8" />
              <polygon fill="#D7C1B3" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" />
              <polygon fill="#D7C1B3" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" />
              <polygon fill="#D7C1B3" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1" />
              <polygon fill="#D7C1B3" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1" />
              <polygon fill="#233447" points="106.8,247.4 140.6,230.9 111.4,208.1" />
              <polygon fill="#233447" points="177.9,230.9 211.8,247.4 207.1,208.1" />
              <polygon fill="#CD6116" points="211.8,247.4 177.9,230.9 180.6,253.3 180.3,262.9" />
              <polygon fill="#CD6116" points="106.8,247.4 138.3,262.9 138.1,253.3 140.6,230.9" />
              <polygon fill="#E4751F" points="138.8,193.5 110.6,185.2 130.5,176.1" />
              <polygon fill="#E4751F" points="179.7,193.5 187.9,176.1 207.9,185.2" />
              <polygon fill="#F6851B" points="106.8,247.4 111.6,206.8 80.3,207.7" />
              <polygon fill="#F6851B" points="207,206.8 211.8,247.4 238.3,207.7" />
              <polygon fill="#F6851B" points="230.8,162.1 174.6,164.6 179.8,193.5 188,176.1 208,185.2" />
              <polygon fill="#F6851B" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1" />
              <polygon fill="#C0AD9E" points="87.8,162.1 111.4,208.1 110.6,185.2" />
              <polygon fill="#C0AD9E" points="208,185.2 207.1,208.1 230.8,162.1" />
              <polygon fill="#C0AD9E" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7" />
              <polygon fill="#C0AD9E" points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5" />
              <polygon fill="#161616" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208,185.2" />
              <polygon fill="#161616" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5" />
            </svg>
          )}
          Connect with MetaMask
        </button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', lineHeight: 1.5 }}
        >
          Your smart account is created instantly. Gas fees are sponsored for first weather submissions.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default SocialOnboardingModal;
