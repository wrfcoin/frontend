import type { EarningsHistoryEntry } from '../../services/apiClient';
import { chartAmountOrGap } from '../../services/apiClient/amountPrecision';

export function buildStationReportEarningsChartData(entries: EarningsHistoryEntry[]) {
  return {
    labels: entries.map((entry) =>
      new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    ),
    data: entries.map((entry) => chartAmountOrGap(entry.amount)),
  };
}
