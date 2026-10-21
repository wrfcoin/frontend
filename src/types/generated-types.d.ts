// @cohesion: ambient mirror for the type-only @wrfcoin/generated-types import.
// CI cannot npm-install the sibling backend file dependency from frontend alone;
// keep this shape aligned with backend/shared/generated-types/ForecastAccuracyMetrics.ts.
// Refresh: fetch backend, choose its reviewed main SHA, then copy that exact
// generated file to __fixtures__/ForecastAccuracyMetrics.generated.ts.txt with
// a first-line `// Snapshot: wrfcoin/backend@<full SHA> shared/generated-types/ForecastAccuracyMetrics.ts`.
// Keep the remaining bytes unchanged. Update this alias to match and run
// npm test -- --runInBand src/types/__tests__/generated-types-shim.test.ts
// plus npx tsc --noEmit. This detects drift against the pinned snapshot; refresh
// the snapshot deliberately when backend wire types change (no sibling install).
declare module '@wrfcoin/generated-types' {
  export type ForecastAccuracyMetrics = {
    mae: number;
    rmse: number;
    bias: number;
    skill_score: number;
  };
}
