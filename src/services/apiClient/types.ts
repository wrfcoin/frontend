// @cohesion: hand-written API client response types. Most types are frontend-only or
// mirror backend service shapes (not Rust/ts-rs generated).
//
// Notable relationship with @wrfcoin/generated-types:
//   StationObservation (camelCase HTTP response) ≈ WeatherObservation (snake_case wire format).
//   They cannot be unified directly because the backend serialises camelCase for HTTP while
//   ts-rs preserves Rust snake_case for the consensus wire format.
//
// No other types in this file have a generated equivalent in @wrfcoin/generated-types.
// reviewed 2026-06-18: StationObservation/WeatherObservation confirmed non-unifiable (naming
//   convention mismatch + field set divergence: StationObservation adds stationId, timestamp,
//   uvIndex, pm25UgM3, rainRateMmHr; WeatherObservation adds dewpoint_c, visibility_m,
//   radio_metadata; no migration possible without a camelCase adapter layer).

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
};

export interface WeatherStation {
  id: string;
  name: string;
  // live/stale/registered: backend#1263 observation freshness (frontend#415).
  // unknown: the API sent no recognisable status; shown neutrally, never as Offline.
  status: 'live' | 'stale' | 'registered' | 'sleeping' | 'offline' | 'maintenance' | 'unknown';
  location?: string;
  lastUpdatedAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface StationObservation {
  stationId: string;
  timestamp: string;
  temperatureC?: number;
  humidityPct?: number;
  pressureHpa?: number;
  windSpeedMs?: number;
  windDirectionDeg?: number;
  rainRateMmHr?: number;
  uvIndex?: number;
  pm25UgM3?: number;
}

export interface StationQualityDimension {
  key: string;
  label: string;
  score: number;
  color?: string;
}

export interface StationQuality {
  stationId: string;
  overall: number;
  dimensions: StationQualityDimension[];
}

export interface StationSubmissionLogEntry {
  id: string;
  stationId: string;
  timestamp: string;
  success: boolean;
  summary: string;
  qualityScore?: number;
  wrfEarned?: string;
}

export interface EarningsSummary {
  stationId: string;
  /** Proven rewards with a block time in the last day/week/month, within the recent window. */
  today: string;
  thisWeek: string;
  thisMonth: string;
  /**
   * Lifetime WRF for THIS station, base units: set only when the backend proved the station is
   * the sole holder of its reward address (lifetime.scope === 'station'). Otherwise null; see `lifetime`.
   */
  allTime: string | null;
  /** The legacy per-hour rate slot: still always null (the measured rate is `rate`, per day). */
  currentRate: string | null;
  /** Lifetime read (backend#1232): null when the node could not prove it. */
  lifetime: StationLifetime | null;
  /** Measured rate over the complete recent window (backend#1232): null when it cannot be proven. */
  rate: StationRate | null;
  /** The recent-observation window the totals come from (backend station earnings); null when unknown. */
  window: EarningsWindow | null;
}

export interface StationLifetime {
  /** 'station': this station alone holds the reward address. 'address': the address total, shared. */
  scope: 'station' | 'address';
  /** Only for scope 'address', and only when the backend revealed it (operator / owner wallet); else null. */
  stationsSharingAddress: number | null;
  /** Exact base units (decimal string). */
  baseUnits: string;
}

export interface StationRate {
  /** Rewarded base units per day over the window (floored), exact decimal string. */
  baseUnitsPerDay: string;
  /** Rewarded commits bounding the window. */
  windowCommits: number;
  /** Seconds between the oldest and newest proven reward. */
  windowSeconds: number;
}

export interface EarningsWindow {
  /** Recent observations read (commits). */
  commits: number;
  /** Whether the backend read the whole requested tail. */
  complete: boolean;
  rewardedCommits: number;
  /** Observations whose reward evidence could not be read. */
  unknownCommits: number;
  /** Sum of proven rewards in the window, base units. Not a lifetime total. */
  rewardedBaseUnits: string;
}

/** One recent observation's reward evidence, as the backend reports it (core4 source). */
export interface RewardEvidenceEntry {
  commitId: string;
  /** true: a proven reward; false: no reward (see blocker); null: evidence unavailable. */
  rewarded: boolean | null;
  amountBaseUnits: string | null;
  blocker: string | null;
  finalized: boolean | null;
  height: number | null;
  blockTimestamp: string | null;
}

export interface EarningsHistoryEntry {
  id: string;
  stationId: string;
  timestamp: string;
  amount: string;
  rewardType: string;
  qualityScore?: number;
  txHash?: string;
}

export interface EarningsBreakdownEntry {
  stationId: string;
  timestamp: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  baseReward: string;
  accuracyBonus: string;
  uptimeBonus: string;
  dataQualityBonus: string;
  totalEarned: string;
  status: 'pending' | 'confirmed' | 'failed' | string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'PENDING' | string;
  createdAt?: string;
  votingEndsAt?: string;
  /** Tallies only when the source reports them (core4: yes_votes/no_votes). */
  yesVotes?: number;
  noVotes?: number;
  proposer?: string;
  /** core4 `votes_by_voter`: address -> approve. */
  votesByVoter?: Record<string, boolean>;
}

export interface GovernanceDelegation {
  delegator: string;
  delegate: string;
  votingPower?: number;
  createdAt?: string;
}

export interface GovernanceVoteInput {
  proposalId: string;
  /**
   * Informational only: the backend records the vote for the JWT subject
   * (`requireAuth`), never for an address in the body.
   */
  voterAddress?: string;
  /** The backend accepts FOR/AGAINST only (support = true/false). */
  vote: 'for' | 'against' | 'yes' | 'no' | string;
  rationale?: string;
}

export interface GovernanceVoteResult {
  proposalId: string;
  voterAddress: string;
  vote: string;
  accepted: boolean;
  txHash?: string;
}

export interface GovernanceVotingPower {
  address: string;
  delegatedPower: number;
  participationBonus: number;
  totalPower: number;
}

export interface GovernanceAnalyticsDashboard {
  totalProposals: number;
  totalVotes: number;
  activeProposals: number;
}

export interface GovernanceAnalyticsParticipation {
  totalProposals: number;
  totalVotes: number;
  uniqueVoters: number;
  avgVotesPerProposal: string;
}

export interface GovernanceAnalyticsTreasury {
  balance: string;
  totalInflow: string;
  totalOutflow: string;
  transactionCount: number;
}

export interface GovernanceDelegateSummary {
  address: string;
  totalDelegated: string;
  delegatorCount: number;
}

export interface WalletBalance {
  address: string;
  balance: string;
  symbol?: string;
  updatedAt?: string;
  /**
   * Reported chain reward totals in exact base units. `null` means the node did
   * not report the figure; it is never a guess or a share of another total.
   */
  earnedBalanceTotal?: string | null;
  weatherRewards?: string | null;
  weatherRewardsPending?: string | null;
  weatherRewardsUnavailable?: string | null;
}

export type WalletHistoryDirection = 'received' | 'sent' | 'self' | 'unknown';

/** One row of GET /wallet/:address/transactions; unreported fields stay null. */
export interface WalletHistoryItem {
  id: string;
  type: string | null;
  direction: WalletHistoryDirection;
  /** Exact base units, or null when the node did not report an amount. */
  amount: string | null;
  /** Reported or derived from from/to relative to the owner; null for self or unknown. */
  counterparty: string | null;
  from: string | null;
  to: string | null;
  timestamp: string | null;
  settlement: string | null;
  /** An explicit legacy `status` the node sent, preserved verbatim. */
  status: string | null;
  blockHeight: number | null;
}

export interface WalletHistoryPage {
  /** Transfers touching the wallet. */
  items: WalletHistoryItem[];
  /** Paid reward credits (schema v2 only; empty on v1 nodes). */
  creditItems: WalletHistoryItem[];
  offset: number;
  limit: number;
  /**
   * true only when the node says the window is the whole history. A bounded
   * window (false or unreported) can be empty while older activity exists.
   */
  complete: boolean | null;
  creditNextCursor: string | null;
  windowStartHeight: number | null;
  totalInWindow: number | null;
}

export interface WalletTransaction {
  id: string;
  amount: string;
  status: string;
  timestamp: string;
  from?: string;
  to?: string;
}

export interface WalletSendRequest {
  from: string;
  to: string;
  amount: string;
  memo?: string;
  nonce: string;
  auth_pubkey: string;
  auth_signature: string;
}

export interface WalletSendResult {
  txHash: string;
  status?: string;
  message?: string;
}

export interface ComputeRecipeInput {
  model: string;
  datasets: string[];
  computeEnvironment: string;
  validation: string;
  region?: string;
  resolution: string;
  forecastHours: number;
  carbonOffset: boolean;
  academicEndorsement: boolean;
}

export type ComputeTaskStatus =
  | 'queued'
  | 'running'
  | 'failed'
  | 'completed'
  | 'pending'
  | 'processing'
  | 'cancelled';

export interface ComputeTaskSubmission {
  taskId: string;
  status: ComputeTaskStatus;
  createdAt?: string;
}

export interface ComputeTaskProgress {
  taskId: string;
  status: ComputeTaskStatus;
  progress?: number;
  updatedAt?: string;
  error?: string;
  logs?: string[];
}

export interface ComputeTaskResult {
  taskId: string;
  status: ComputeTaskStatus;
  outputCid?: string;
  verificationReportCid?: string;
  receiptTxHash?: string;
  results?: Record<string, unknown>;
  logs?: string[];
}

export interface ValidatorInfo {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline' | string;
  balance: string;
  effectiveness: number;
  uptime: number;
  proposals: number;
  attestations: number;
  missedSlots: number;
  lastAttestation: string;
}

export interface StakingPosition {
  id: string;
  validator: string;
  amount: string;
  apy: number;
  status: 'active' | 'pending' | 'unbonding' | string;
  delegatedAt: string;
  rewards: string;
}

export interface NetworkStats {
  totalStaked: string;
  availableBalance: string;
  totalRewards: string;
  pendingRewards: string;
}

// ─── DeFi types ───────────────────────────────────────────────────────────────

/** Generic transaction result returned by mutating DeFi operations */
export interface TxResult {
  txHash?: string;
  success: boolean;
  message?: string;
}

// Liquid staking (stWRF)

export interface LiquidStakingPosition {
  address: string;
  /** stWRF shares held */
  shares: string;
  /** Underlying WRF value of those shares */
  wrfValue: string;
  unbondingShares?: string;
  unbondingWrfValue?: string;
  claimableAt?: string;
}

export interface ExchangeRate {
  /** stWRF/WRF exchange rate as a decimal string (e.g. "1.05") */
  rate: string;
  total_staked: string;
}

// TWAP oracle

export interface OraclePrice {
  price: string;
  asset: string;
  window_secs: number;
  observation_count: number;
}

// Parametric insurance

export type InsurancePolicyStatus = 'active' | 'expired' | 'settled' | 'claimed' | string;

export interface InsurancePolicy {
  id: string;
  buyer: string;
  coverageAmount: string;
  premium: string;
  startAt: string;
  expiresAt: string;
  status: InsurancePolicyStatus;
  weatherCondition?: string;
  threshold?: number;
}

export interface PolicyPurchaseRequest {
  buyerAddress: string;
  coverageAmount: string;
  durationDays: number;
  weatherCondition: string;
  threshold: number;
  region?: string;
}

export interface VaultStats {
  total_capital: string;
  utilization_bps: number;
  share_price: string;
}

export interface SettlementStatus {
  policyId: string;
  status: 'pending' | 'triggered' | 'settled' | 'not_triggered' | string;
  settledAt?: string;
  payoutAmount?: string;
  triggerValue?: number;
}

// Weather derivatives

export type FutureType = 'temperature' | 'precipitation' | 'wind' | 'humidity' | string;

export interface WeatherFuture {
  id: string;
  futureType: FutureType;
  region: string;
  expiresAt: string;
  settlementPrice?: string;
  currentPrice: string;
  openInterest: string;
}

export interface OpenPositionRequest {
  futureId: string;
  direction: 'long' | 'short';
  size: string;
  /** Margin to post (WRF base units as string) */
  margin: string;
  traderAddress: string;
}

export interface DerivativePosition {
  id: string;
  futureId: string;
  traderAddress: string;
  direction: 'long' | 'short';
  size: string;
  entryPrice: string;
  margin: string;
  openedAt: string;
  pnl?: string;
}

export interface MarginAccount {
  address: string;
  availableMargin: string;
  usedMargin: string;
  totalMargin: string;
  liquidationThreshold: string;
}
