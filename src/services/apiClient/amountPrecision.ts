import { formatBaseUnitsToWrf, toBaseUnits, toWrfNumberForChart } from './number';

export function sumExactBaseUnits(values: readonly unknown[]): string | null {
  if (values.length === 0) return null;
  let total = 0n;
  for (const value of values) {
    const units = toBaseUnits(value);
    if (units === null) return null;
    total += units;
  }
  return total.toString();
}

export function formatExactAmount(value: unknown, fractionDigits: number): string {
  return formatBaseUnitsToWrf(value, fractionDigits) ?? 'Unavailable';
}

export function chartAmountOrGap(value: unknown): number | null {
  return toWrfNumberForChart(value);
}
