import type {
  ComputeRecipeInput,
  ComputeTaskProgress,
  ComputeTaskResult,
  ComputeTaskStatus,
  ComputeTaskSubmission,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { toNumber } from './number';
import ApiError, { ApiErrorCode } from '../../utils/apiError';

function normalizeStatus(value: unknown): ComputeTaskStatus {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'queued') return 'queued';
  if (normalized === 'running' || normalized === 'in_progress' || normalized === 'in-progress') return 'running';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  if (normalized === 'completed' || normalized === 'done' || normalized === 'success') return 'completed';
  if (normalized === 'processing') return 'processing';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  return 'pending';
}

export class ComputeService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.compute });
  }

  async submitForecastTask(recipe: ComputeRecipeInput): Promise<ComputeTaskSubmission> {
    const payload = {
      taskType: 'forecast',
      priority: 'high',
      payload: {
        model: recipe.model,
        datasets: recipe.datasets,
        computeEnvironment: recipe.computeEnvironment,
        validation: recipe.validation,
        region: recipe.region,
        resolution: recipe.resolution,
        forecastHours: recipe.forecastHours,
        carbonOffset: recipe.carbonOffset,
        academicEndorsement: recipe.academicEndorsement,
      },
    };

    const response = asRecord(
      await this.client.postWithFallback<any>([
        '/compute/tasks',
        '/compute/submit',
        '/compute/submit-job',
      ], payload),
      'Unexpected submit response from compute API',
    );

    const taskId = String(
      response.taskId ||
      response.jobId ||
      response.id ||
      response.computeTaskId ||
      '',
    );

    if (!taskId) {
      throw new ApiError(
        'Compute API did not return a task identifier',
        502,
        ApiErrorCode.SERVER_ERROR,
        { response },
      );
    }

    return {
      taskId,
      status: normalizeStatus(response.status),
      createdAt: response.createdAt || response.submitted_at || new Date().toISOString(),
    };
  }

  async getTaskStatus(taskId: string): Promise<ComputeTaskProgress> {
    const response = asRecord(
      await this.client.getWithFallback<any>([
        `/compute/tasks/${encodeURIComponent(taskId)}/status`,
        `/compute/jobs/${encodeURIComponent(taskId)}`,
        `/compute/task/${encodeURIComponent(taskId)}/status`,
      ]),
      'Unexpected status response from compute API',
    );

    return {
      taskId,
      status: normalizeStatus(response.status),
      progress: toNumber(response.progress),
      updatedAt: response.updatedAt || response.started_at || response.completed_at,
      error: response.error,
      logs: normalizeLogs(response.logs || response.events || response.timeline),
    };
  }

  async getTaskResults(taskId: string): Promise<ComputeTaskResult> {
    const response = asRecord(
      await this.client.getWithFallback<any>([
        `/compute/tasks/${encodeURIComponent(taskId)}/results`,
        `/compute/jobs/${encodeURIComponent(taskId)}`,
      ]),
      'Unexpected results response from compute API',
    );

    const results = (response.results || response.result || {}) as Record<string, unknown>;

    return {
      taskId,
      status: normalizeStatus(response.status),
      outputCid: asString(results.outputCid || results.cid || response.outputCid),
      verificationReportCid: asString(results.verificationReportCid || results.verification_report_cid || response.verificationReportCid),
      receiptTxHash: asString(results.receiptTxHash || results.receipt_tx_hash || response.receiptTxHash),
      results,
      logs: normalizeLogs(results.logs || results.events || response.logs || response.events),
    };
  }
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return undefined;
}

function normalizeLogs(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const lines = value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    return lines.length ? lines : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const lines = value
    .map(entry => {
      if (typeof entry === 'string') {
        return entry.trim();
      }

      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        return (
          asString(record.message) ||
          asString(record.log) ||
          asString(record.text) ||
          asString(record.line)
        );
      }

      return undefined;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length ? lines : undefined;
}

function asRecord(
  value: unknown,
  message: string,
): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  throw new ApiError(message, 502, ApiErrorCode.SERVER_ERROR, {
    response: value,
  });
}

export default ComputeService;
