import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'wrfcoin_social_session';

/**
 * Manages social authentication state (Google/Apple OIDC → backend JWT).
 *
 * State shape: { jwt, walletAddress, isNewUser, loading, error }
 */
export function useSocialAuth() {
  const [jwt, setJwt] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.jwt) {
          setJwt(session.jwt);
          setWalletAddress(session.walletAddress ?? null);
          setIsNewUser(session.isNewUser ?? false);
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }, []);

  const persistSession = useCallback((data) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
      // Silently ignore storage failures
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/social/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setJwt(data.jwt);
      setWalletAddress(data.walletAddress);
      setIsNewUser(data.isNewUser ?? false);
      persistSession({ jwt: data.jwt, walletAddress: data.walletAddress, isNewUser: data.isNewUser });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const loginWithApple = useCallback(async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/social/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setJwt(data.jwt);
      setWalletAddress(data.walletAddress);
      setIsNewUser(data.isNewUser ?? false);
      persistSession({ jwt: data.jwt, walletAddress: data.walletAddress, isNewUser: data.isNewUser });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    setJwt(null);
    setWalletAddress(null);
    setIsNewUser(false);
    setError(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  /**
   * Called by SocialAuthContext after any successful login (social or MetaMask)
   * to update the wallet address in state.
   */
  const loginSucceeded = useCallback((addr) => {
    setWalletAddress(addr);
  }, []);

  const isLoggedInSocially = !!jwt;

  return {
    jwt,
    walletAddress,
    isNewUser,
    loading,
    error,
    isLoggedInSocially,
    loginWithGoogle,
    loginWithApple,
    logout,
    loginSucceeded,
  };
}

export default useSocialAuth;
