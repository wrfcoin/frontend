import { formatExactAmount } from '../../services/apiClient/amountPrecision';

export function formatTransactionAmount(amount: unknown, prefix = '', symbol = 'WRF'): string {
  return `${prefix}${formatExactAmount(amount, 4)} ${symbol}`;
}
