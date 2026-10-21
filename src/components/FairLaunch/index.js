// Fair Launch Registration Components
// Simplified, user-friendly interface for WRFCoin fair launch system

export { default as PathSelector } from './PathSelector';
export { default as VoucherSystem } from './VoucherSystem';
export { default as ProgressTracker } from './ProgressTracker';
export { default as GlobalAccessibility } from './GlobalAccessibility';

// Import components for the convenience object
import PathSelectorComponent from './PathSelector';
import VoucherSystemComponent from './VoucherSystem';
import ProgressTrackerComponent from './ProgressTracker';
import GlobalAccessibilityComponent from './GlobalAccessibility';

// Export all components as a single object for convenience
export const FairLaunchComponents = {
  PathSelector: PathSelectorComponent,
  VoucherSystem: VoucherSystemComponent,
  ProgressTracker: ProgressTrackerComponent,
  GlobalAccessibility: GlobalAccessibilityComponent,
};
