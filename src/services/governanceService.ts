import { API_BASE_URL } from './config';
import { createLogger } from '../utils/logger';
import {
  GOVERNANCE_PAGE_SIZE,
  GOVERNANCE_TREASURY_PATH,
  governanceProposalPath,
  governanceProposalsPath,
  publicGet,
  type PublicReadResult,
} from './publicReadonlyApi';

const log = createLogger('governance');

// Types
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'PENDING';
  votingStartTime: string;
  votingEndTime: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  vetoVotes: number;
  totalVotingPower: number;
}

interface Vote {
  proposalId: string;
  voter: string;
  vote: 'YES' | 'NO' | 'ABSTAIN' | 'VETO';
  votingPower: number;
  timestamp: string;
}

interface GovernanceParameter {
  name: string;
  value: any;
  description: string;
  type: string;
}

interface Delegation {
  delegator: string;
  delegate: string;
  amount: number;
  timestamp: string;
}

interface CreateProposalData {
  title: string;
  description: string;
  proposer: string;
  votingPeriod?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TrustWeightOrderingHint {
  rule: string;
  satisfied: boolean;
}

interface TrustWeightBounds {
  min: number;
  max: number;
}

interface TrustWeightPolicy {
  unverified_weight: number;
  verified_station_weight: number;
  trusted_provider_weight: number;
}

interface TrustWeightsResponse {
  current_policy: TrustWeightPolicy;
  bounds: TrustWeightBounds;
  ordering_hints: TrustWeightOrderingHint[];
}

interface TrustClassMultiplierPreview {
  contributor_class: string;
  trust_weight: number;
  relative_to_trusted_provider: number;
}

interface TrustProposalPreview {
  parameter: string;
  value: string;
  current_policy: TrustWeightPolicy;
  resulting_policy: TrustWeightPolicy;
  bounds: TrustWeightBounds;
  ordering_hints: TrustWeightOrderingHint[];
  class_multipliers: TrustClassMultiplierPreview[];
}

interface GovernanceProposalPayload {
  parameter: string;
  value: string;
}

interface TrustProposalBuildResponse {
  proposal_payload: GovernanceProposalPayload;
  preview: TrustProposalPreview;
}

interface TrustClassCounters {
  unverified: number;
  verified_station: number;
  trusted_provider: number;
}

interface QualityBandCounters {
  high: number;
  borderline: number;
  warning_only: number;
  low: number;
}

interface TrustRewardImpactMatrixRow {
  quality_band: string;
  quality_reward_multiplier: number;
  unverified: number;
  verified_station: number;
  trusted_provider: number;
}

interface TrustRewardImpactPoint {
  block_height: number;
  minted_count: number;
  minted_total: number;
  trust_class_counts: TrustClassCounters;
  quality_band_counts: QualityBandCounters;
  trust_weights?: TrustWeightPolicy;
  quality_reward_multipliers?: {
    high: number;
    borderline: number;
    warning_only: number;
    low: number;
  };
  joint_multiplier_matrix: TrustRewardImpactMatrixRow[];
}

interface TrustRewardImpactTimelineResponse {
  total: number;
  offset: number;
  limit: number;
  items: TrustRewardImpactPoint[];
}

interface TrustRewardImpactSummaryResponse {
  block_count: number;
  minted_count: number;
  minted_total: number;
  trust_class_counts: TrustClassCounters;
  quality_band_counts: QualityBandCounters;
  estimated_weighted_trust_multiplier: number;
  estimated_weighted_quality_multiplier: number;
  estimated_effective_multiplier: number;
  current_trust_policy: TrustWeightPolicy;
  current_quality_policy: Record<string, unknown>;
  joint_multiplier_preview: TrustRewardImpactMatrixRow[];
}

/**
 * Service for interacting with the governance API
 */
class GovernanceService {
  // ---- Public read-only reads (S4) -------------------------------------------------------------
  // The public edge admits only these three GETs (list with limit+offset, one proposal by id, treasury
  // summary). They answer `{ success, proposals | proposal | data }`; no auth, votes or writes.

  /** One page of proposals: `?limit=<1..100>&offset=<n>` (the edge refuses `page` and a bare `limit`). */
  async getProposalsPage(
    offset = 0,
    limit: number = GOVERNANCE_PAGE_SIZE,
    signal?: globalThis.AbortSignal,
  ): Promise<PublicReadResult<{ proposals: Record<string, unknown>[]; total: number | null; hasMore: boolean | null }>> {
    const result = await publicGet<{ proposals?: Record<string, unknown>[]; total?: unknown; hasMore?: unknown }>(
      governanceProposalsPath(limit, offset),
      signal,
    );
    if (result.kind !== 'ok') return result;
    const proposals = Array.isArray(result.data?.proposals) ? result.data.proposals : [];
    // The list endpoint also reports `total` and `hasMore`; pass them through only when well-typed.
    const total = Number.isSafeInteger(result.data?.total) && (result.data!.total as number) >= 0 ? (result.data!.total as number) : null;
    const hasMore = typeof result.data?.hasMore === 'boolean' ? result.data.hasMore : null;
    return { kind: 'ok', data: { proposals, total, hasMore } };
  }

  async getPublicProposal(
    id: string,
    signal?: globalThis.AbortSignal,
  ): Promise<PublicReadResult<{ proposal: Record<string, unknown> | null }>> {
    const path = governanceProposalPath(id);
    if (!path) return { kind: 'not_found' };
    const result = await publicGet<{ proposal?: Record<string, unknown> | null }>(path, signal);
    if (result.kind !== 'ok') return result;
    return { kind: 'ok', data: { proposal: result.data?.proposal ?? null } };
  }

  async getTreasurySummary(
    signal?: globalThis.AbortSignal,
  ): Promise<PublicReadResult<{ balance: string; totalDeposits: string; totalWithdrawals: string; transactionCount: number; amountUnits: Record<string, unknown> | null }>> {
    const result = await publicGet<{ data?: Record<string, unknown> }>(GOVERNANCE_TREASURY_PATH, signal);
    if (result.kind !== 'ok') return result;
    const d = result.data?.data ?? {};
    const amountUnits = d.amountUnits && typeof d.amountUnits === 'object' ? (d.amountUnits as Record<string, unknown>) : null;
    return {
      kind: 'ok',
      data: {
        balance: String(d.balance ?? ''),
        totalDeposits: String(d.totalDeposits ?? ''),
        totalWithdrawals: String(d.totalWithdrawals ?? ''),
        transactionCount: Number(d.transactionCount ?? 0),
        // The node's unit declaration for the three figures (see utils/declaredWrfAmount).
        amountUnits,
      },
    };
  }

  /**
   * Get all governance proposals
   */
  async getAllProposals(limit: number = 100): Promise<Proposal[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals?limit=${limit}`,
      );
      const data: ApiResponse<Proposal[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch proposals');
      }

      return data.data || [];
    } catch (error) {
      log.error('Error fetching proposals:', error);
      throw error;
    }
  }

  /**
   * Get active governance proposals
   */
  async getActiveProposals(): Promise<Proposal[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals/active`,
      );
      const data: ApiResponse<Proposal[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch active proposals');
      }

      return data.data || [];
    } catch (error) {
      log.error('Error fetching active proposals:', error);
      throw error;
    }
  }

  /**
   * Get a proposal by ID
   */
  async getProposalById(proposalId: string): Promise<Proposal> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals/${proposalId}`,
      );
      const data: ApiResponse<Proposal> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      return data.data!;
    } catch (error) {
      log.error(`Error fetching proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new proposal
   */
  async createProposal(proposalData: CreateProposalData): Promise<Proposal> {
    try {
      const response = await fetch(`${API_BASE_URL}/governance/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });

      const data: ApiResponse<Proposal> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create proposal');
      }

      return data.data!;
    } catch (error) {
      log.error('Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Finalize a proposal
   */
  async finalizeProposal(proposalId: string): Promise<Proposal> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals/${proposalId}/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data: ApiResponse<Proposal> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to finalize proposal');
      }

      return data.data!;
    } catch (error) {
      log.error(`Error finalizing proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    proposalId: string,
    voter: string,
    vote: 'YES' | 'NO' | 'ABSTAIN' | 'VETO',
  ): Promise<Vote> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals/${proposalId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ voter, vote }),
        },
      );

      const data: ApiResponse<Vote> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to cast vote');
      }

      return data.data!;
    } catch (error) {
      log.error(`Error casting vote on proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Get votes for a proposal
   */
  async getVotesByProposal(proposalId: string): Promise<Vote[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/proposals/${proposalId}/votes`,
      );
      const data: ApiResponse<Vote[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch votes');
      }

      return data.data || [];
    } catch (error) {
      log.error(`Error fetching votes for proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Get all governance parameters
   */
  async getAllParameters(): Promise<GovernanceParameter[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/governance/parameters`);
      const data: ApiResponse<GovernanceParameter[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch parameters');
      }

      return data.data || [];
    } catch (error) {
      log.error('Error fetching governance parameters:', error);
      throw error;
    }
  }

  /**
   * Get a parameter by name
   */
  async getParameterByName(paramName: string): Promise<GovernanceParameter> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/parameters/${paramName}`,
      );
      const data: ApiResponse<GovernanceParameter> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch parameter');
      }

      return data.data!;
    } catch (error) {
      log.error(`Error fetching parameter ${paramName}:`, error);
      throw error;
    }
  }

  /**
   * Get delegations by delegator
   */
  async getDelegationsByDelegator(delegator: string): Promise<Delegation[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/delegations/delegator/${delegator}`,
      );
      const data: ApiResponse<Delegation[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch delegations');
      }

      return data.data || [];
    } catch (error) {
      log.error(
        `Error fetching delegations for delegator ${delegator}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get delegations by delegate
   */
  async getDelegationsByDelegate(delegate: string): Promise<Delegation[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/delegations/delegate/${delegate}`,
      );
      const data: ApiResponse<Delegation[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch delegations');
      }

      return data.data || [];
    } catch (error) {
      log.error(
        `Error fetching delegations for delegate ${delegate}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get current trust-weight governance parameters and guardrail hints.
   */
  async getTrustWeights(): Promise<TrustWeightsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/governance/trust/weights`);
      if (!response.ok) {
        throw new Error('Failed to fetch trust weights');
      }
      return (await response.json()) as TrustWeightsResponse;
    } catch (error) {
      log.error('Error fetching trust weights:', error);
      throw error;
    }
  }

  /**
   * Build a trust-weight proposal preview before governance submission.
   */
  async buildTrustWeightProposalPreview(
    target: string,
    value: string | number,
  ): Promise<TrustProposalBuildResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/trust/proposals/build`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ target, value }),
        },
      );
      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: 'Failed to build trust proposal preview' }));
        throw new Error(payload?.error || 'Failed to build trust proposal preview');
      }
      return (await response.json()) as TrustProposalBuildResponse;
    } catch (error) {
      log.error('Error building trust proposal preview:', error);
      throw error;
    }
  }

  /**
   * Get trust-class reward impact timeline for observability dashboards.
   */
  async getTrustRewardImpactTimeline(params?: {
    fromBlock?: number;
    toBlock?: number;
    offset?: number;
    limit?: number;
  }): Promise<TrustRewardImpactTimelineResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.fromBlock !== undefined) {
        query.set('from_block', params.fromBlock.toString());
      }
      if (params?.toBlock !== undefined) {
        query.set('to_block', params.toBlock.toString());
      }
      if (params?.offset !== undefined) {
        query.set('offset', params.offset.toString());
      }
      if (params?.limit !== undefined) {
        query.set('limit', params.limit.toString());
      }
      const suffix = query.toString() ? `?${query}` : '';
      const response = await fetch(
        `${API_BASE_URL}/transactions/rewards/trust/timeline${suffix}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch trust reward impact timeline');
      }
      return (await response.json()) as TrustRewardImpactTimelineResponse;
    } catch (error) {
      log.error('Error fetching trust reward impact timeline:', error);
      throw error;
    }
  }

  /**
   * Get aggregate trust/quality multiplier observability metrics.
   */
  async getTrustRewardImpactSummary(params?: {
    fromBlock?: number;
    toBlock?: number;
  }): Promise<TrustRewardImpactSummaryResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.fromBlock !== undefined) {
        query.set('from_block', params.fromBlock.toString());
      }
      if (params?.toBlock !== undefined) {
        query.set('to_block', params.toBlock.toString());
      }
      const suffix = query.toString() ? `?${query}` : '';
      const response = await fetch(
        `${API_BASE_URL}/transactions/rewards/trust/summary${suffix}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch trust reward impact summary');
      }
      return (await response.json()) as TrustRewardImpactSummaryResponse;
    } catch (error) {
      log.error('Error fetching trust reward impact summary:', error);
      throw error;
    }
  }

  /**
   * Create a delegation
   */
  async createDelegation(
    delegator: string,
    delegate: string,
    amount: number,
  ): Promise<Delegation> {
    try {
      const response = await fetch(`${API_BASE_URL}/governance/delegations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delegator, delegate, amount }),
      });

      const data: ApiResponse<Delegation> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create delegation');
      }

      return data.data!;
    } catch (error) {
      log.error('Error creating delegation:', error);
      throw error;
    }
  }

  /**
   * Remove a delegation
   */
  async removeDelegation(
    delegator: string,
    delegate: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/governance/delegations/${delegator}/${delegate}`,
        {
          method: 'DELETE',
        },
      );

      const data: ApiResponse<boolean> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove delegation');
      }

      return true;
    } catch (error) {
      log.error('Error removing delegation:', error);
      throw error;
    }
  }
}

export const governanceService = new GovernanceService();

// ---------------------------------------------------------------------------
// Actor Status (frontend#27)
// ---------------------------------------------------------------------------

export interface ActorRecord {
  id: string;
  actorClass: 'human' | 'ai' | 'robot' | 'unknown';
  trustTier: 'trusted' | 'standard' | 'probation' | 'sanctioned';
  sanctionStatus: 'none' | 'active' | 'resolved' | 'appealing';
  lastUpdated: string;
}

export interface ActorStatusSummary {
  total: number;
  trusted: number;
  standard: number;
  probation: number;
  sanctioned: number;
}

export interface ActorStatusChange {
  actorId: string;
  field: string;
  from: string;
  to: string;
  changedAt: string;
}

export interface ActorStatusData {
  actors: ActorRecord[];
  summary: ActorStatusSummary;
  recentChanges: ActorStatusChange[];
  generatedAt: string;
}

export async function fetchActorStatus(): Promise<ActorStatusData> {
  const response = await fetch(`${API_BASE_URL}/governance/actor-status`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as ActorStatusData;
}

// ---------------------------------------------------------------------------
// Sanction Timeline (frontend#28)
// ---------------------------------------------------------------------------

export type SanctionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SanctionEvent {
  id: string;
  actorId: string;
  reason: string;
  reasonCode: string;
  severity: SanctionSeverity;
  date: string;
  status: 'active' | 'resolved' | 'appealing';
}

export interface AppealStatus {
  id: string | null;
  state: 'none' | 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string | null;
  updatedAt: string | null;
}

export interface SanctionTimelineData {
  events: SanctionEvent[];
  appealStatus: AppealStatus;
  availableActions: string[];
  generatedAt: string;
}

export async function fetchSanctionTimeline(): Promise<SanctionTimelineData> {
  const response = await fetch(`${API_BASE_URL}/governance/sanctions/timeline`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as SanctionTimelineData;
}

export async function submitAppeal(reason: string, evidence: string): Promise<{ appealId: string }> {
  const response = await fetch(`${API_BASE_URL}/governance/sanctions/appeal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, evidence }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? `Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as { appealId: string };
}

// ---------------------------------------------------------------------------
// Participation Onboarding (frontend#29)
// ---------------------------------------------------------------------------

export interface OnboardingSection {
  id: string;
  title: string;
  items: string[];
  acknowledged: boolean;
}

export interface OnboardingData {
  sections: OnboardingSection[];
  generatedAt: string;
}

export async function fetchOnboarding(): Promise<OnboardingData> {
  const response = await fetch(`${API_BASE_URL}/governance/onboarding`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as OnboardingData;
}

// ---------------------------------------------------------------------------
// Forecast Coverage Dashboard (frontend#30)
// ---------------------------------------------------------------------------

export type DomainType = 'Weather' | 'AQ' | 'Water' | 'Wildfire';
export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface CoverageDomain {
  name: DomainType;
  spatialCoveragePercent: number;
  temporalCoveragePercent: number;
  regionCount: number;
}

export interface CoverageGap {
  region: string;
  domain: DomainType;
  missingHours: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CoverageTrend {
  domain: DomainType;
  direction: TrendDirection;
  changePercent: number;
}

export interface OverallCoverage {
  spatialPercent: number;
  temporalPercent: number;
  domainCount: number;
}

export interface ForecastCoverageData {
  domains: CoverageDomain[];
  overallCoverage: OverallCoverage;
  gaps: CoverageGap[];
  trends: CoverageTrend[];
  generatedAt: string;
}

export async function fetchForecastCoverage(): Promise<ForecastCoverageData> {
  const response = await fetch(`${API_BASE_URL}/kpi/alignment/forecast-coverage`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as ForecastCoverageData;
}

export type {
  Proposal,
  Vote,
  GovernanceParameter,
  Delegation,
  CreateProposalData,
  ApiResponse,
  TrustWeightOrderingHint,
  TrustWeightBounds,
  TrustWeightPolicy,
  TrustWeightsResponse,
  TrustClassMultiplierPreview,
  TrustProposalPreview,
  GovernanceProposalPayload,
  TrustProposalBuildResponse,
  TrustClassCounters,
  QualityBandCounters,
  TrustRewardImpactMatrixRow,
  TrustRewardImpactPoint,
  TrustRewardImpactTimelineResponse,
  TrustRewardImpactSummaryResponse,
};

// ---------------------------------------------------------------------------
// Appeals Portal (frontend#31)
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  label: string;
  timestamp: string | null;
  url: string | null;
}

export interface AppealDecision {
  outcome: 'approved' | 'rejected' | 'pending';
  explanation: string;
  decidedAt: string;
}

export interface Appeal {
  id: string;
  type: string;
  status: 'filed' | 'under_review' | 'decided' | 'dismissed';
  filingDate: string;
  evidencePack: EvidenceItem[];
  decision: AppealDecision | null;
}

export interface AppealsSummary {
  total: number;
  active: number;
  underReview: number;
  decided: number;
}

export interface AppealsData {
  appeals: Appeal[];
  summary: AppealsSummary;
  generatedAt: string;
}

export async function fetchAppeals(): Promise<AppealsData> {
  const response = await fetch(`${API_BASE_URL}/governance/appeals`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as AppealsData;
}

// ---------------------------------------------------------------------------
// Actor Transparency (frontend#32)
// ---------------------------------------------------------------------------

export type ActorType = 'human' | 'ai' | 'robot';

export interface TransparencyActor {
  id: string;
  name: string;
  type: ActorType;
  automationConfidence: number;
}

export interface ParityPrinciple {
  title: string;
  explanation: string;
}

export interface SanctionComparison {
  offenseType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  humanPenalty: string;
  aiPenalty: string;
  robotPenalty: string;
  rationale: string;
}

export interface SanctionRationaleItem {
  sanctionType: string;
  rationale: string;
}

export interface ActorTransparencyData {
  actors: TransparencyActor[];
  parityPrinciples: ParityPrinciple[];
  sanctionComparisons: SanctionComparison[];
  sanctionRationale: SanctionRationaleItem[];
  generatedAt: string;
}

export async function fetchActorTransparency(): Promise<ActorTransparencyData> {
  const response = await fetch(`${API_BASE_URL}/governance/actor-transparency`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as ActorTransparencyData;
}

// ---------------------------------------------------------------------------
// Multilingual Policy Pages (frontend#33)
// ---------------------------------------------------------------------------

export interface PolicySection {
  name: string;
  version: string;
  updatedDate: string;
  content: string;
  items: string[];
}

export interface PolicyChangeLogEntry {
  date: string;
  section: string;
  version: string;
  summary: string;
}

export interface PolicyData {
  lang: string;
  sections: PolicySection[];
  changeLog: PolicyChangeLogEntry[];
  generatedAt: string;
}

export async function fetchPolicies(lang: string): Promise<PolicyData> {
  const response = await fetch(`${API_BASE_URL}/governance/policies?lang=${encodeURIComponent(lang)}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const payload = await response.json();
  return (payload.data ?? payload) as PolicyData;
}
