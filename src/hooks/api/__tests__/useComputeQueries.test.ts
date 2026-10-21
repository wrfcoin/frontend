import { describe, expect, it } from '@jest/globals';
import {
  getResultsRefetchInterval,
  getStatusRefetchInterval,
  MAX_STATUS_POLL_WINDOW_MS,
  MAX_RESULTS_POLL_WINDOW_MS,
  RESULTS_POLL_INTERVAL_MS,
  STATUS_POLL_INTERVAL_MS,
} from '../useComputeQueries';

describe('useComputeQueries polling controls', () => {
  it('continues polling while results are absent before timeout window', () => {
    expect(getResultsRefetchInterval(undefined, 0)).toBe(RESULTS_POLL_INTERVAL_MS);
    expect(getResultsRefetchInterval(undefined, 55_000)).toBe(RESULTS_POLL_INTERVAL_MS);
  });

  it('stops polling once timeout window is reached', () => {
    expect(
      getResultsRefetchInterval(undefined, MAX_RESULTS_POLL_WINDOW_MS),
    ).toBe(false);
  });

  it('continues polling for completed tasks missing receipt fields before timeout', () => {
    expect(
      getResultsRefetchInterval(
        {
          status: 'completed',
          outputCid: undefined,
          verificationReportCid: undefined,
          receiptTxHash: undefined,
        },
        40_000,
      ),
    ).toBe(RESULTS_POLL_INTERVAL_MS);
  });

  it('stops polling completed tasks missing receipt fields after timeout', () => {
    expect(
      getResultsRefetchInterval(
        {
          status: 'completed',
        },
        MAX_RESULTS_POLL_WINDOW_MS,
      ),
    ).toBe(false);
  });

  it('stops polling completed tasks once receipt fields are present', () => {
    expect(
      getResultsRefetchInterval(
        {
          status: 'completed',
          outputCid: 'bafy-output',
          verificationReportCid: 'bafy-verify',
          receiptTxHash: '0xtx',
        },
        2,
      ),
    ).toBe(false);
  });

  it('continues polling completed tasks until all receipt fields are present', () => {
    expect(
      getResultsRefetchInterval(
        {
          status: 'completed',
          outputCid: 'bafy-output',
        },
        2,
      ),
    ).toBe(RESULTS_POLL_INTERVAL_MS);
  });

  it('continues polling when result status is non-terminal', () => {
    expect(
      getResultsRefetchInterval(
        {
          status: 'running',
        },
        10_000,
      ),
    ).toBe(RESULTS_POLL_INTERVAL_MS);
  });
});

describe('useForecastTaskStatus polling controls', () => {
  it('continues status polling for non-terminal statuses', () => {
    expect(getStatusRefetchInterval('running', 5_000)).toBe(STATUS_POLL_INTERVAL_MS);
  });

  it('stops status polling for terminal statuses', () => {
    expect(getStatusRefetchInterval('completed', 5_000)).toBe(false);
    expect(getStatusRefetchInterval('failed', 5_000)).toBe(false);
    expect(getStatusRefetchInterval('cancelled', 5_000)).toBe(false);
  });

  it('stops status polling when timeout window is reached', () => {
    expect(
      getStatusRefetchInterval('running', MAX_STATUS_POLL_WINDOW_MS),
    ).toBe(false);
  });
});
