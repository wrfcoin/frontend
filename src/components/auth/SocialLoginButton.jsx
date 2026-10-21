/**
 * SocialLoginButton — renders a Google GSI button or an Apple coming-soon pill.
 *
 * Google: uses the Google Identity Services (GSI) script directly (no @react-oauth/google).
 *         Hidden, with no script load, until VITE_GOOGLE_CLIENT_ID is set.
 * Apple:  renders a dark styled button; shows coming-soon until VITE_APPLE_CLIENT_ID is
 *         provisioned (TODO: implement Apple OAuth popup).
 */

import React, { useEffect, useRef } from 'react';
import { CircularProgress } from '@mui/material';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { devLog } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Google button (GSI)
// ---------------------------------------------------------------------------

// Unset means unconfigured: render nothing and never load Google's script
// (it rendered a broken button and still called a third party).
const googleClientId = () => (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

function GoogleButton({ onSuccess, loading }) {
  const { loginWithGoogle } = useSocialAuth();
  const containerRef = useRef(null);

  useEffect(() => {
    let scriptEl = document.getElementById('google-gsi-script');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'google-gsi-script';
      scriptEl.src = 'https://accounts.google.com/gsi/client';
      scriptEl.async = true;
      scriptEl.defer = true;
      document.body.appendChild(scriptEl);
    }

    const initGSI = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId(),
        callback: async (response) => {
          try {
            const data = await loginWithGoogle(response.credential);
            if (data?.walletAddress && onSuccess) {
              onSuccess(data.walletAddress);
            }
          } catch (err) {
            console.error('[SocialLoginButton] Google login error:', err);
          }
        },
      });

      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: containerRef.current.offsetWidth || 300,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGSI();
    } else {
      scriptEl.addEventListener('load', initGSI);
    }

    return () => {
      scriptEl.removeEventListener('load', initGSI);
    };
  }, [loginWithGoogle, onSuccess]);

  return (
    <div style={{ position: 'relative', minHeight: 44 }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)', borderRadius: 4, zIndex: 2,
        }}>
          <CircularProgress size={24} />
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apple button — live when VITE_APPLE_CLIENT_ID is set, hidden otherwise
// ---------------------------------------------------------------------------

const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID ?? '';

function AppleButton({ onSuccess, loading }) {
  const { loginWithApple } = useSocialAuth();

  // Load the Apple ID JS SDK once
  React.useEffect(() => {
    if (!APPLE_CLIENT_ID) return;

    let scriptEl = document.getElementById('apple-id-script');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'apple-id-script';
      scriptEl.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      scriptEl.async = true;
      scriptEl.defer = true;
      document.body.appendChild(scriptEl);
    }

    const initApple = () => {
      if (!window.AppleID?.auth) return;
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
    };

    if (window.AppleID?.auth) {
      initApple();
    } else {
      scriptEl.addEventListener('load', initApple);
    }

    return () => {
      scriptEl.removeEventListener('load', initApple);
    };
  }, []);

  const handleClick = async () => {
    if (!window.AppleID?.auth) {
      devLog('[SocialLoginButton] Apple Sign-In SDK not loaded yet — retry in a moment.');
      return;
    }
    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) throw new Error('No id_token in Apple response');
      const data = await loginWithApple(idToken);
      if (data?.walletAddress && onSuccess) {
        onSuccess(data.walletAddress);
      }
    } catch (err) {
      // User dismissed the popup — not a real error
      if (err?.error === 'popup_closed_by_user') return;
      console.error('[SocialLoginButton] Apple login error:', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        padding: '11px 16px',
        background: '#000',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: 24,
        fontSize: '0.9375rem',
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.55 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {loading ? (
        <CircularProgress size={18} sx={{ color: '#fff' }} />
      ) : (
        /* Apple logo SVG */
        <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.2C87.5 731.4 40 558.9 40 399.5c0-235.8 151.9-360.5 301.4-360.5 79 0 138.6 51.5 185.6 51.5 44.8 0 114.6-55.2 205.3-55.2zM765.4 32.5c-36.8 41.6-97.9 72.2-155.2 72.2-6.4 0-12.8-.6-19.2-1.9-1.3-6.4-1.9-12.8-1.9-20.5 0-40.2 17.9-82.7 50.6-113.3 33.3-31.3 88.5-54.5 141.2-54.5 5.1 0 10.2.6 15.4 1.3.6 7 1.3 14 1.3 20.5 0 41.5-17.3 83.4-32.2 95.2z" />
        </svg>
      )}
      Sign in with Apple
    </button>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

/**
 * @param {{ provider: 'google' | 'apple', onSuccess?: (addr: string) => void }} props
 *
 * Apple button is hidden (returns null) when VITE_APPLE_CLIENT_ID is not set.
 * Set VITE_APPLE_CLIENT_ID in .env (or environment) to enable Apple Sign-In.
 */
export function SocialLoginButton({ provider, onSuccess }) {
  const { loading } = useSocialAuth();

  if (provider === 'google') {
    if (!googleClientId()) return null;
    return <GoogleButton onSuccess={onSuccess} loading={loading} />;
  }

  if (provider === 'apple') {
    // Feature-flagged: only render when VITE_APPLE_CLIENT_ID is provisioned
    if (!APPLE_CLIENT_ID) return null;
    return <AppleButton onSuccess={onSuccess} loading={loading} />;
  }

  return null;
}

export default SocialLoginButton;
