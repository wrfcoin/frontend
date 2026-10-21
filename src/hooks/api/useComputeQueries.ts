import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { computeService } from '../../services/apiClient';
import type { ComputeRecipeInput } from '../../services/apiClient';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);
export const STATUS_POLL_INTERVAL_MS = 5_000;
export const MAX_STATUS_POLL_WINDOW_MS = 120_000;
export const RESULTS_POLL_INTERVAL_MS = 5_000;
export const MAX_RESULTS_POLL_WINDOW_MS = 60_000;

type TaskResultSnapshot = {
  status?: string;
  outputCid?: string;
  verificationReportCid?: string;
  receiptTxHash?: string;
};

export function getResultsRefetchInterval(
  data: TaskResultSnapshot | undefined,
  elapsedMs: number,
): number | false {
  if (elapsedMs >= MAX_RESULTS_POLL_WINDOW_MS) {
    return false;
  }

  if (!data) {
    return RESULTS_POLL_INTERVAL_MS;
  }

  const status = String(data.status || '').toLowerCase();
  if (!TERMINAL_STATUSES.has(status)) {
    return RESULTS_POLL_INTERVAL_MS;
  }

  if (status === 'completed') {
    const hasAllReceiptFields =
      Boolean(data.outputCid) &&
      Boolean(data.verificationReportCid) &&
      Boolean(data.receiptTxHash);

    if (!hasAllReceiptFields) {
      return RESULTS_POLL_INTERVAL_MS;
    }
  }

  return false;
}

export function getStatusRefetchInterval(
  status: string | undefined,
  elapsedMs: number,
): number | false {
  if (elapsedMs >= MAX_STATUS_POLL_WINDOW_MS) {
    return false;
  }

  if (!TERMINAL_STATUSES.has(String(status || '').toLowerCase())) {
    return STATUS_POLL_INTERVAL_MS;
  }

  return false;
}

export function useSubmitForecastTask() {
  return useMutation({
    mutationFn: (recipe: ComputeRecipeInput) => computeService.submitForecastTask(recipe),
  });
}

export function useForecastTaskStatus(taskId: string | undefined) {
  const pollWindowStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    pollWindowStartedAtRef.current = taskId ? Date.now() : null;
  }, [taskId]);

  return useQuery({
    queryKey: queryKeys.compute.taskStatus(taskId || ''),
    queryFn: () => {
      if (!taskId) throw new Error('Task ID is required');
      return computeService.getTaskStatus(taskId);
    },
    enabled: Boolean(taskId),
    refetchInterval: query => {
      const elapsedMs = pollWindowStartedAtRef.current
        ? Date.now() - pollWindowStartedAtRef.current
        : 0;
      return getStatusRefetchInterval(
        query.state.data?.status,
        elapsedMs,
      );
    },
    staleTime: 1000,
  });
}

export function useForecastTaskResults(taskId: string | undefined, enabled: boolean = true) {
  const pollWindowStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    pollWindowStartedAtRef.current =
      taskId && enabled ? Date.now() : null;
  }, [taskId, enabled]);

  const query = useQuery({
    queryKey: queryKeys.compute.taskResults(taskId || ''),
    queryFn: () => {
      if (!taskId) throw new Error('Task ID is required');
      return computeService.getTaskResults(taskId);
    },
    enabled: Boolean(taskId) && enabled,
    staleTime: 1_000,
    refetchInterval: query => {
      const elapsedMs = pollWindowStartedAtRef.current
        ? Date.now() - pollWindowStartedAtRef.current
        : 0;
      return getResultsRefetchInterval(
        query.state.data,
        elapsedMs,
      );
    },
  });

  return query;
}
