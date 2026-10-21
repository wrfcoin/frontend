import type {
  NetworkStats,
  StakingPosition,
  ValidatorInfo,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { requireExactBaseUnits, toNumber } from './number';

export class ValidatorApiService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.validator });
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    const response = await this.client.getWithFallback<any>([
      '/validators',
      '/governance/validators',
    ]);

    const rows = Array.isArray(response) ? response : (response.validators || []);

    return rows.map((validator: any, index: number) => ({
      id: String(validator.id || validator.nodeId || `validator-${index}`),
      name: String(validator.name || validator.moniker || `Validator ${index + 1}`),
      status: String(validator.status || 'offline'),
      balance: requireExactBaseUnits(validator.balance, `validator ${validator.id ?? index} balance`),
      effectiveness: toNumber(validator.effectiveness) ?? 0,
      uptime: toNumber(validator.uptime) ?? 0,
      proposals: toNumber(validator.proposals) ?? 0,
      attestations: toNumber(validator.attestations) ?? 0,
      missedSlots: toNumber(validator.missedSlots) ?? 0,
      lastAttestation: String(validator.lastAttestation || 'unknown'),
    }));
  }

  async getStakingPositions(address?: string): Promise<StakingPosition[]> {
    const query = address ? `?address=${encodeURIComponent(address)}` : '';
    const response = await this.client.getWithFallback<any>([
      `/staking/positions${query}`,
      `/governance/staking/positions${query}`,
    ]);

    const rows = Array.isArray(response) ? response : (response.positions || []);

    return rows.map((position: any, index: number) => ({
      id: String(position.id || `position-${index}`),
      validator: String(position.validator || position.validatorName || 'Unknown Validator'),
      amount: requireExactBaseUnits(position.amount, `staking position ${position.id ?? index} amount`),
      apy: toNumber(position.apy) ?? 0,
      status: String(position.status || 'pending'),
      delegatedAt: String(position.delegatedAt || position.createdAt || new Date().toISOString()),
      rewards: requireExactBaseUnits(position.rewards, `staking position ${position.id ?? index} rewards`),
    }));
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const response = await this.client.getWithFallback<any>([
      '/validators/stats/overview',
      '/staking/stats',
      '/governance/network/stats',
    ]);

    return {
      totalStaked: requireExactBaseUnits(response.totalStaked ?? response.total_staked, 'network totalStaked'),
      availableBalance: requireExactBaseUnits(response.availableBalance ?? response.available_balance, 'network availableBalance'),
      totalRewards: requireExactBaseUnits(response.totalRewards ?? response.total_rewards, 'network totalRewards'),
      pendingRewards: requireExactBaseUnits(response.pendingRewards ?? response.pending_rewards, 'network pendingRewards'),
    };
  }
}

export default ValidatorApiService;
