// @cohesion: hand-written; integrations marketplace domain is frontend-only.
// No generated equivalent in @wrfcoin/generated-types.
// reviewed 2026-06-18: no overlap with generated-types.

// Type definitions for the WRFCoin Integrations system
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: 'connected' | 'configured' | 'unconfigured' | 'error';
  popularity: number;
  rating: number;
  lastUsed?: Date;
  icon: string;
  provider?: string;
  setupComplexity: 'easy' | 'medium' | 'advanced';
  usageCount: number;
  responseTime?: number;
  uptime?: number;
  errorCount?: number;
  warningCount?: number;
  throughput?: number;
  version?: string;
  endpoint?: string;
  dependencies?: string[];
  alerts?: Alert[];
}

export interface IntegrationStatus extends Integration {
  uptime: number; // percentage
  responseTime: number; // milliseconds
  lastCheck: Date;
  errorCount: number;
  warningCount: number;
  throughput: number; // requests per minute
  alerts: Alert[];
}

export interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  integrations: Integration[];
  isCustom: boolean;
  createdAt?: Date;
  usageScore: number;
  suggestedOptimizations?: string[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  provider: string;
  setupComplexity: 'easy' | 'medium' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  documentation: string;
  endpoints?: string[];
}

export interface SearchQuery {
  text: string;
  category?: string;
  tags: string[];
  status?: string;
  popularity?: number;
  rating?: number;
  timestamp: Date;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface PerformanceMetric {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  confidence: number;
  reason: string;
  integrationsToMove: Integration[];
  expectedBenefit: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'form' | 'validation' | 'confirmation';
  required: boolean;
  fields?: FormField[];
  validationFn?: () => Promise<ValidationResult>;
  content?: React.ReactNode;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'checkbox' | 'radio' | 'url' | 'email';
  required: boolean;
  placeholder?: string;
  helperText?: string;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  secure?: boolean;
}
