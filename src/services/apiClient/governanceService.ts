import type {
  GovernanceAnalyticsDashboard,
  GovernanceAnalyticsParticipation,
  GovernanceAnalyticsTreasury,
  GovernanceDelegateSummary,
  GovernanceDelegation,
  GovernanceProposal,
  GovernanceVoteInput,
  GovernanceVoteResult,
  GovernanceVotingPower,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';

export class GovernanceService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.governance });
  }

  async getProposals(limit: number = 25): Promise<GovernanceProposal[]> {
    const response = await this.client.getWithFallback<any>([
      `/governance/proposals?limit=${limit}`,
      '/governance/proposals',
    ]);

    const rows = Array.isArray(response) ? response : (response.proposals || []);

    return rows.map((proposal: any) => ({
      id: String(proposal.id || proposal.proposalId || proposal.hash || ''),
      title: String(proposal.title || proposal.name || `Proposal ${proposal.id ?? ''}`.trim()),
      status: String(proposal.status || 'PENDING'),
      createdAt: proposal.createdAt,
      votingEndsAt: proposal.votingEndsAt || proposal.endTime,
      yesVotes: finiteOrUndefined(proposal.yes_votes ?? proposal.yesVotes),
      noVotes: finiteOrUndefined(proposal.no_votes ?? proposal.noVotes),
      proposer: proposal.proposer ? String(proposal.proposer) : undefined,
      votesByVoter: votesByVoter(proposal.votes_by_voter ?? proposal.votesByVoter),
    }));
  }

  async getDelegations(address: string): Promise<GovernanceDelegation[]> {
    const response = await this.client.getWithFallback<any>([
      `/governance/delegations/delegator/${encodeURIComponent(address)}`,
      `/governance/delegations?delegator=${encodeURIComponent(address)}`,
    ]);

    const rows = Array.isArray(response)
      ? response
      : (response.delegations || []);

    return rows.map((delegation: any) => ({
      delegator: String(delegation.delegator || delegation.from || ''),
      delegate: String(delegation.delegate || delegation.to || ''),
      votingPower:
        delegation.votingPower !== undefined
          ? Number(delegation.votingPower)
          : undefined,
      createdAt: delegation.createdAt || delegation.timestamp,
    }));
  }

  /**
   * POST /governance/proposals/:id/vote (backend: requireAuth; the voter is the
   * JWT subject). Exactly one request, no fallback path. `accepted` is true only
   * when the backend says so; failures (401, 503, ...) throw.
   */
  async castVote(input: GovernanceVoteInput): Promise<GovernanceVoteResult> {
    const voteType = toVoteType(input.vote);
    const response = await this.client.post<any>(
      `/governance/proposals/${encodeURIComponent(input.proposalId)}/vote`,
      {
        voteType,
        support: voteType === 'FOR',
        ...(input.rationale ? { reason: input.rationale } : {}),
      },
    );

    return {
      proposalId: input.proposalId,
      voterAddress: String(response?.vote?.voterAddress ?? input.voterAddress ?? ''),
      vote: voteType,
      accepted: response?.success === true || response?.accepted === true,
      txHash: response?.txHash || response?.transactionHash || response?.vote?.core4?.txHash,
    };
  }

  /** GET /governance/voting-power?address= (public read). */
  async getVotingPower(address: string): Promise<GovernanceVotingPower> {
    const data = await this.client.get<any>(
      `/governance/voting-power?address=${encodeURIComponent(address)}`,
    );
    return {
      address: String(data?.address ?? address),
      delegatedPower: requireFinite(data?.delegatedPower, 'delegatedPower'),
      participationBonus: requireFinite(data?.participationBonus, 'participationBonus'),
      totalPower: requireFinite(data?.totalPower, 'totalPower'),
    };
  }

  /** POST /governance/delegate (backend: requireAuth; delegator = JWT subject). */
  async delegate(delegate: string, amount?: number): Promise<GovernanceDelegation> {
    const response = await this.client.post<any>('/governance/delegate', {
      delegate,
      ...(amount !== undefined ? { amount } : {}),
    });
    if (response?.success !== true || !response?.delegation) {
      throw new Error('Delegation was not confirmed by the backend.');
    }
    return {
      delegator: String(response.delegation.delegator ?? ''),
      delegate: String(response.delegation.delegate ?? delegate),
      votingPower: finiteOrUndefined(response.delegation.amount),
      createdAt: response.delegation.createdAt,
    };
  }

  async getAnalyticsDashboard(): Promise<GovernanceAnalyticsDashboard> {
    const data = await this.client.get<any>('/governance/analytics/dashboard');
    return {
      totalProposals: requireFinite(data?.totalProposals, 'totalProposals'),
      totalVotes: requireFinite(data?.totalVotes, 'totalVotes'),
      activeProposals: requireFinite(data?.activeProposals, 'activeProposals'),
    };
  }

  async getAnalyticsParticipation(): Promise<GovernanceAnalyticsParticipation> {
    const data = await this.client.get<any>('/governance/analytics/participation');
    return {
      totalProposals: requireFinite(data?.totalProposals, 'totalProposals'),
      totalVotes: requireFinite(data?.totalVotes, 'totalVotes'),
      uniqueVoters: requireFinite(data?.uniqueVoters, 'uniqueVoters'),
      avgVotesPerProposal: String(data?.avgVotesPerProposal ?? ''),
    };
  }

  async getAnalyticsTreasury(): Promise<GovernanceAnalyticsTreasury> {
    const data = await this.client.get<any>('/governance/analytics/treasury');
    return {
      balance: String(data?.balance ?? ''),
      totalInflow: String(data?.totalInflow ?? ''),
      totalOutflow: String(data?.totalOutflow ?? ''),
      transactionCount: requireFinite(data?.transactionCount, 'transactionCount'),
    };
  }

  async getAnalyticsDelegates(): Promise<GovernanceDelegateSummary[]> {
    const response = await this.client.get<any>('/governance/analytics/delegates');
    const rows = Array.isArray(response?.delegates) ? response.delegates : [];
    return rows.map((row: any) => ({
      address: String(row.address ?? ''),
      totalDelegated: String(row.totalDelegated ?? ''),
      delegatorCount: requireFinite(row.delegatorCount, 'delegatorCount'),
    }));
  }

  async createProposal(payload: {
    title: string;
    description: string;
    authorAddress: string;
    category?: string;
  }): Promise<GovernanceProposal> {
    const response = await this.client.postWithFallback<any>([
      '/governance/proposals',
    ], {
      title: payload.title,
      description: payload.description,
      author: payload.authorAddress,
      category: payload.category,
    });

    return {
      id: String(response.id || response.proposalId || ''),
      title: String(response.title || payload.title),
      status: String(response.status || 'PENDING'),
      createdAt: response.createdAt || new Date().toISOString(),
      votingEndsAt: response.votingEndsAt || response.endTime,
    };
  }
}

function finiteOrUndefined(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function requireFinite(value: unknown, field: string): number {
  const n = finiteOrUndefined(value);
  if (n === undefined) throw new Error(`governance response is missing ${field}`);
  return n;
}

function votesByVoter(raw: unknown): Record<string, boolean> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, boolean> = {};
  for (const [voter, record] of Object.entries(raw as Record<string, any>)) {
    if (record && typeof record.approve === 'boolean') out[voter.toLowerCase()] = record.approve;
  }
  return out;
}

function toVoteType(vote: string): 'FOR' | 'AGAINST' {
  const v = String(vote).toLowerCase();
  if (v === 'for' || v === 'yes') return 'FOR';
  if (v === 'against' || v === 'no') return 'AGAINST';
  throw new Error(`Unsupported vote "${vote}": the backend records FOR or AGAINST only.`);
}

export default GovernanceService;
