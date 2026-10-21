import { API_BASE_URL } from './config';

interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
}

export interface PermissionlessHealthData {
  generatedAt: string;
  participation: {
    status: 'pass' | 'warn' | 'fail';
    geoblockingViolations: number;
    totalEvents: number;
    throttleEvents: number;
    denyEvents: number;
    actorNeutrality: 'verified' | 'review-required';
    privacySafeTelemetry: boolean;
    notes: string[];
    checkedAt: string;
  };
  relay: {
    status: 'healthy' | 'degraded' | 'unavailable';
    globalAvailabilityPercent: number;
    censorshipSignalCount: number;
    checkedAt: string;
    routes: Array<{
      routeId: string;
      providers: number;
      healthyProviders: number;
      unreachableProviders: number;
      censorshipSignals: number;
      availabilityPercent: number;
    }>;
  };
  guidance: string[];
}

export interface TransparencyLedgerData {
  generatedAt: string;
  privacySafe: boolean;
  sanctions: { total: number; disclosed: number };
  appeals: { total: number; cleared: number };
  parity: { human: number; aiAgent: number; robot: number; unknown: number };
  dataFreshnessSeconds: number;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if ((payload as ApiEnvelope<T>).data !== undefined) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function fetchPermissionlessHealth(): Promise<PermissionlessHealthData> {
  return getJson<PermissionlessHealthData>('/resilience/permissionless/health');
}

export async function fetchTransparencyLedger(): Promise<TransparencyLedgerData> {
  return getJson<TransparencyLedgerData>('/resilience/transparency/ledger');
}
