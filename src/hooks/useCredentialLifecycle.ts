/**
 * useCredentialLifecycle Hook
 *
 * Fetches credential issuance/lifecycle data, governance mutation policies,
 * and user policy status from the identity API.
 *
 * Policy-aware: exposes permission flags (canIssue, canRevoke, etc.) so that
 * UI components can disable/hide controls and display denial reasons.
 *
 * Reports unavailable when the backend cannot supply credentials or policies.
 *
 * Issues: #252, #237
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../services/config';
import { getAuthToken as _getAuthToken } from '../services/authTokenStore';

// --- Types ---

export interface Credential {
  id: string;
  did: string;
  type: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  issuedAt: string;
  expiresAt: string | null;
  issuer: string;
  claims: Record<string, unknown>;
}

export type GovernancePolicyScope =
  | 'key_rotation'
  | 'credential_issuance'
  | 'revocation'
  | 'delegation';

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  scope: GovernancePolicyScope;
  enforced: boolean;
  requiredApprovals: number;
}

export interface IssuanceFormData {
  did: string;
  credentialType: string;
  purpose: string;
}

/** Policy status returned by the backend */
export interface PolicyStatus {
  canIssueCredential: boolean;
  canRevokeCredential: boolean;
  canRegisterKeyEpoch: boolean;
  canRotateKeyEpoch: boolean;
  canRevokeKeyEpoch: boolean;
  canTogglePolicy: boolean;
  denialReasons: Record<string, string>;
  evaluatedAt: string;
}

export interface UseCredentialLifecycleReturn {
  credentials: Credential[];
  policies: GovernancePolicy[];
  policyStatus: PolicyStatus;
  loading: boolean;
  /** Credentials and policies came from successful reads; mutation errors preserve this state. */
  available: boolean;
  error: string | null;
  /** Non-null when a mutation was denied by policy */
  policyDenial: string | null;
  requestCredential: (form: IssuanceFormData) => Promise<void>;
  revokeCredential: (credentialId: string) => Promise<void>;
  togglePolicyEnforcement: (policyId: string) => Promise<void>;
  refetch: () => void;
}

// --- Defaults ---

const DEFAULT_POLICY_STATUS: PolicyStatus = {
  canIssueCredential: false,
  canRevokeCredential: false,
  canRegisterKeyEpoch: false,
  canRotateKeyEpoch: false,
  canRevokeKeyEpoch: false,
  canTogglePolicy: false,
  denialReasons: {},
  evaluatedAt: '',
};

// --- Auth token helper ---

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = _getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Hook ---

export function useCredentialLifecycle(): UseCredentialLifecycleReturn {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [policyStatus, setPolicyStatus] = useState<PolicyStatus>(DEFAULT_POLICY_STATUS);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyDenial, setPolicyDenial] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setAvailable(false);
    setError(null);
    setPolicyDenial(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const authHeaders = getAuthHeaders();

      const [credRes, policyRes, statusRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/identity/credentials`, {
          signal: controller.signal,
          headers: authHeaders,
        }),
        fetch(`${API_BASE_URL}/identity/governance-policies`, {
          signal: controller.signal,
          headers: authHeaders,
        }),
        fetch(`${API_BASE_URL}/identity/policy-status`, {
          signal: controller.signal,
          headers: authHeaders,
        }),
      ]);

      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      // Handle credentials response
      if (credRes.status === 'fulfilled' && credRes.value.ok) {
        const credData = await credRes.value.json();
        const creds: Credential[] = (credData.data || credData.credentials || credData || []).map(
          (c: Record<string, unknown>) => ({
            id: c.id as string,
            did: (c.did || c.subject_did || '') as string,
            type: (c.type || c.credential_type || '') as string,
            status: (c.status || 'pending') as Credential['status'],
            issuedAt: (c.issuedAt || c.issued_at || '') as string,
            expiresAt: (c.expiresAt || c.expires_at || null) as string | null,
            issuer: (c.issuer || '') as string,
            claims: (c.claims || {}) as Record<string, unknown>,
          }),
        );
        setCredentials(creds);
      } else {
        setCredentials([]);
        setError('Identity service unavailable. Credentials could not be read.');
      }

      // Handle policies response
      if (policyRes.status === 'fulfilled' && policyRes.value.ok) {
        const polData = await policyRes.value.json();
        const pols: GovernancePolicy[] = (polData.data || polData.policies || polData || []).map(
          (p: Record<string, unknown>) => ({
            id: p.id as string,
            name: (p.name || '') as string,
            description: (p.description || '') as string,
            scope: (p.scope || 'credential_issuance') as GovernancePolicyScope,
            enforced: (p.enforced ?? false) as boolean,
            requiredApprovals: (p.requiredApprovals || p.required_approvals || 1) as number,
          }),
        );
        setPolicies(pols);
      } else {
        setPolicies([]);
        setError('Identity service unavailable. Governance policies could not be read.');
      }

      // Handle policy status response
      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const statusData = await statusRes.value.json();
        const ps = statusData.data || statusData;
        setPolicyStatus({
          canIssueCredential: ps.canIssueCredential ?? false,
          canRevokeCredential: ps.canRevokeCredential ?? false,
          canRegisterKeyEpoch: ps.canRegisterKeyEpoch ?? false,
          canRotateKeyEpoch: ps.canRotateKeyEpoch ?? false,
          canRevokeKeyEpoch: ps.canRevokeKeyEpoch ?? false,
          canTogglePolicy: ps.canTogglePolicy ?? false,
          denialReasons: ps.denialReasons || {},
          evaluatedAt: ps.evaluatedAt || new Date().toISOString(),
        });
      } else {
        // Backend unavailable: default to no permissions (fail-closed)
        console.warn('Policy status endpoint unavailable, defaulting to restricted');
        setPolicyStatus(DEFAULT_POLICY_STATUS);
      }

      setAvailable(credRes.status === 'fulfilled' && credRes.value.ok &&
        policyRes.status === 'fulfilled' && policyRes.value.ok);

      if (credRes.status !== 'fulfilled' || !credRes.value.ok ||
          policyRes.status !== 'fulfilled' || !policyRes.value.ok) {
        setPolicyStatus(DEFAULT_POLICY_STATUS);
      }
      setLoading(false);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setCredentials([]);
      setPolicies([]);
      setPolicyStatus(DEFAULT_POLICY_STATUS);
      setError(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Identity service unavailable. Connection timed out.'
          : 'Identity service unavailable. Credentials and policies could not be read.',
      );
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const requestCredential = useCallback(
    async (form: IssuanceFormData) => {
      setPolicyDenial(null);
      const authHeaders = getAuthHeaders();

      try {
        const response = await fetch(`${API_BASE_URL}/identity/credentials/request`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (response.status === 401 || response.status === 403) {
          const body = await response.json().catch(() => ({}));
          setPolicyDenial(body.message || 'Credential issuance denied by policy.');
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed (HTTP ${response.status})`);
        }

        fetchData();
      } catch (err) {
        setError('Identity service unavailable. Credential request was not accepted.');
      }
    },
    [fetchData],
  );

  const revokeCredential = useCallback(
    async (credentialId: string) => {
      setPolicyDenial(null);
      const authHeaders = getAuthHeaders();

      try {
        const response = await fetch(`${API_BASE_URL}/identity/credentials/${credentialId}/revoke`, {
          method: 'POST',
          headers: authHeaders,
        });

        if (response.status === 401 || response.status === 403) {
          const body = await response.json().catch(() => ({}));
          setPolicyDenial(body.message || 'Credential revocation denied by policy.');
          return;
        }

        if (!response.ok) {
          throw new Error(`Revocation failed (HTTP ${response.status})`);
        }

        fetchData();
      } catch (err) {
        setError('Identity service unavailable. Credential revocation was not accepted.');
      }
    },
    [fetchData],
  );

  const togglePolicyEnforcement = useCallback(
    async (policyId: string) => {
      setPolicyDenial(null);
      const policy = policies.find((p) => p.id === policyId);
      if (!policy) return;
      const authHeaders = getAuthHeaders();

      try {
        const response = await fetch(`${API_BASE_URL}/identity/governance-policies/${policyId}`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ enforced: !policy.enforced }),
        });

        if (response.status === 401 || response.status === 403) {
          const body = await response.json().catch(() => ({}));
          setPolicyDenial(body.message || 'Policy modification denied.');
          return;
        }

        if (!response.ok) {
          throw new Error(`Update failed (HTTP ${response.status})`);
        }

        fetchData();
      } catch (err) {
        setError('Identity service unavailable. Policy update was not accepted.');
      }
    },
    [policies, fetchData],
  );

  return {
    credentials,
    policies,
    policyStatus,
    loading,
    available,
    error,
    policyDenial,
    requestCredential,
    revokeCredential,
    togglePolicyEnforcement,
    refetch: fetchData,
  };
}

export default useCredentialLifecycle;
