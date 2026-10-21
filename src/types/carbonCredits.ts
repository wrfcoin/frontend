// @cohesion: hand-written; carbon credit marketplace domain is not in @wrfcoin/generated-types.
// No generated equivalent — carbon credit types are UI-domain only; Solidity contract ABI
// is the authoritative source for on-chain types (smart-contracts repo).
// reviewed 2026-06-18: no overlap with generated-types (weather/sensor/physics domain).

/**
 * Carbon Credits Type Definitions
 *
 * TypeScript interfaces for the WRFCoin Carbon Credit Marketplace
 * Supports comprehensive carbon credit trading, impact tracking, and environmental data
 */

// Core Carbon Credit Types
export interface CarbonCredit {
  id: string;
  project: CreditProject;
  price: number; // USD per tCO2e
  availableCredits: number;
  vintage: number; // Year of emission reduction
  methodology: string; // e.g., "VCS-approved methodology VM0006"
  certifications: string[]; // e.g., ["VCS", "Gold_Standard", "CDM"]
  verificationStatus: 'verified' | 'pending' | 'under_review' | 'rejected';
  serialNumber: string;
  retirementStatus: 'active' | 'retired' | 'pending_retirement';
  additionalDocuments?: string[];
  lastUpdated: number;
  marketplaceListingDate: number;
}

export interface CreditProject {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  location: string;
  region: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  developer: string;
  validator: string;
  registryId: string;
  projectScale: 'small' | 'medium' | 'large' | 'mega';
  status: 'active' | 'completed' | 'suspended' | 'cancelled';
  startDate: number;
  endDate?: number;
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  estimatedAnnualReduction: number; // tCO2e per year
  additionalBenefits?: string[]; // Co-benefits like biodiversity, water conservation
  sustainableDevelopmentGoals?: number[]; // UN SDG numbers
  rating?: number; // 1-5 stars
  images?: string[];
  documents?: ProjectDocument[];
  audits?: ProjectAudit[];
  impacts?: ProjectImpact[];
}

export type ProjectType =
  | 'renewable_energy'
  | 'forestry'
  | 'agriculture'
  | 'waste_management'
  | 'transportation'
  | 'industrial'
  | 'nature_based'
  | 'technology'
  | 'blue_carbon'
  | 'direct_air_capture';

export interface ProjectDocument {
  id: string;
  type:
    | 'pdd'
    | 'validation_report'
    | 'verification_report'
    | 'monitoring_report'
    | 'other';
  title: string;
  url: string;
  uploadDate: number;
  fileSize: number;
  hash?: string;
}

export interface ProjectAudit {
  id: string;
  auditor: string;
  auditDate: number;
  auditType: 'validation' | 'verification' | 'surveillance';
  status: 'passed' | 'failed' | 'conditional';
  findings?: string[];
  recommendations?: string[];
  nextAuditDue?: number;
}

export interface ProjectImpact {
  indicator: string;
  value: number;
  unit: string;
  reportingPeriod: string;
  verificationStatus: 'verified' | 'self_reported';
  lastUpdated: number;
}

// Marketplace and Filtering Types
export interface MarketplaceFilters {
  projectTypes: ProjectType[];
  certifications: string[];
  vintageRange: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  regions: string[];
  verificationStatus: 'all' | 'verified' | 'pending' | 'under_review';
  minRating?: number;
  hasAdditionalBenefits?: boolean;
  sustainableDevelopmentGoals?: number[];
  projectSize?: 'all' | 'small' | 'medium' | 'large';
}

export interface AvailableFilters {
  projectTypes: ProjectType[];
  certifications: string[];
  regions: string[];
  vintageRange: {
    min: number;
    max: number;
  };
}

export interface MarketplaceStats {
  totalCredits: number;
  averagePrice: number;
  projectCount: number;
  monthlyRetired: number;
  priceDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  popularProjectTypes: {
    type: ProjectType;
    count: number;
    percentage: number;
  }[];
  regionalDistribution: {
    region: string;
    count: number;
    percentage: number;
  }[];
}

// Purchase and Transaction Types
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerDetails: CustomerDetails;
  items: PurchaseItem[];
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  currency: 'USD' | 'EUR' | 'WRF';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retirementOption: 'immediate' | 'hold';
  certificateDelivery: 'email' | 'mail' | 'both';
  createdAt: number;
  completedAt?: number;
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  retirementTransactions?: RetirementTransaction[];
  certificates?: CertificateDelivery[];
}

export interface PurchaseItem {
  creditId: string;
  credit: CarbonCredit;
  quantity: number;
  pricePerCredit: number;
  totalPrice: number;
  serialNumbers?: string[];
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  taxId?: string;
}

export type PaymentMethod = 'card' | 'crypto' | 'bank_transfer' | 'invoice';

export interface PaymentDetails {
  method: PaymentMethod;
  cardDetails?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  cryptoDetails?: {
    walletAddress: string;
    token: string;
    network: string;
  };
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string; // Encrypted/masked
  };
}

export interface RetirementTransaction {
  id: string;
  creditId: string;
  quantity: number;
  serialNumbers: string[];
  retiredBy: string;
  retiredFor: string;
  retirementDate: number;
  retirementRegistry: string;
  certificateUrl?: string;
  transactionHash: string;
  blockNumber: number;
}

export interface CertificateDelivery {
  id: string;
  type: 'retirement' | 'ownership';
  format: 'pdf' | 'digital';
  deliveryMethod: 'email' | 'mail' | 'blockchain';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  trackingInfo?: string;
  deliveredAt?: number;
  certificateUrl: string;
  certificateHash?: string;
}

// Impact Calculation Types
export interface ImpactMetrics {
  totalAnnualEmissions: number; // kg CO2e
  breakdown: EmissionCategory[];
  offsetCost: number; // USD
  offsetPercentage: number; // % of emissions that can be offset
  projectedReduction: number; // kg CO2e potential reduction
  benchmarks: {
    globalAverage: number; // kg CO2e
    nationalAverage: number; // kg CO2e
    target2030: number; // kg CO2e
  };
}

export interface EmissionCategory {
  category: string;
  emissions: number; // kg CO2e
  percentage: number;
  subcategories: EmissionSource[];
}

export interface EmissionSource {
  name: string;
  value: number;
  unit: string;
  description?: string;
}

export interface CarbonFootprintInput {
  transportation: {
    carMiles: number;
    carType: 'gasoline' | 'hybrid' | 'electric';
    flightHours: number;
    publicTransportHours: number;
  };
  energy: {
    electricityKwh: number;
    gasTherm: number;
    renewablePercentage: number;
  };
  consumption: {
    meatMealsPerWeek: number;
    dietType: 'omnivore' | 'vegetarian' | 'vegan';
    shoppingFrequency: 'minimal' | 'moderate' | 'frequent';
    wasteReduction: 'none' | 'some' | 'extensive';
  };
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Portfolio and Tracking Types
export interface CarbonPortfolio {
  userId: string;
  totalCreditsOwned: number;
  totalCreditsRetired: number;
  totalInvestment: number; // USD
  currentValue: number; // USD
  unrealizedGainLoss: number; // USD
  portfolioPerformance: {
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL';
    return: number; // percentage
    volatility: number;
    sharpeRatio: number;
  };
  holdings: PortfolioHolding[];
  retirements: RetirementRecord[];
  transactions: PortfolioTransaction[];
  impactSummary: PortfolioImpact;
}

export interface PortfolioHolding {
  creditId: string;
  credit: CarbonCredit;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedGainLoss: number;
  acquisitionDate: number;
  status: 'active' | 'pending_retirement' | 'retired';
}

export interface RetirementRecord {
  id: string;
  creditId: string;
  quantity: number;
  retirementDate: number;
  retiredFor: string; // Purpose of retirement
  certificateUrl: string;
  impact: {
    co2Offset: number;
    additionalBenefits: string[];
  };
}

export interface PortfolioTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'retirement' | 'transfer';
  creditId: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: number;
  transactionHash?: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface PortfolioImpact {
  totalCO2Offset: number; // tCO2e
  equivalentImpacts: {
    treesPlanted: number;
    milesNotDriven: number;
    homesEnergized: number;
    phoneCharges: number;
  };
  projectTypeBreakdown: {
    type: ProjectType;
    quantity: number;
    percentage: number;
  }[];
  regionalImpact: {
    region: string;
    quantity: number;
    percentage: number;
  }[];
  sdgContributions: {
    goal: number;
    description: string;
    contribution: number;
  }[];
}

// Real-time Updates and WebSocket Types
export interface MarketplaceUpdate {
  type:
    | 'price_change'
    | 'new_listing'
    | 'purchase'
    | 'retirement'
    | 'project_update';
  creditId?: string;
  projectId?: string;
  data: any;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  userId: string;
  creditId: string;
  alertType: 'price_below' | 'price_above' | 'price_change';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

// Error Types
export interface CarbonCreditError extends Error {
  code: string;
  details?: any;
  timestamp: number;
}

export type CarbonCreditErrorCode =
  | 'CREDIT_NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'INVALID_VINTAGE'
  | 'VERIFICATION_FAILED'
  | 'PAYMENT_FAILED'
  | 'RETIREMENT_FAILED'
  | 'CERTIFICATE_GENERATION_FAILED'
  | 'MARKETPLACE_UNAVAILABLE'
  | 'INVALID_FILTER_CRITERIA'
  | 'UNAUTHORIZED_ACCESS';

// Utility Types
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  order: SortOrder;
  label: string;
}

export interface SearchOptions {
  query: string;
  filters: MarketplaceFilters;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface SearchResults {
  credits: CarbonCredit[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    projectTypes: { value: ProjectType; count: number }[];
    certifications: { value: string; count: number }[];
    regions: { value: string; count: number }[];
    vintages: { value: number; count: number }[];
    priceRanges: { range: string; count: number }[];
  };
}

// Export all types for easy importing
export * from './carbonCredits';
