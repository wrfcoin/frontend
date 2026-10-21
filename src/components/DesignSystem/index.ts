// Design System - WRFCoin
// Unified component library and design tokens

// Tokens
export * from './tokens';

// Theme
export { WrfThemeProvider, useThemeMode } from './WrfThemeProvider';

// Primitives
export { WrfButton, type WrfButtonProps } from './WrfButton';
export { WrfCard, type WrfCardProps } from './WrfCard';
export { WrfInput, type WrfInputProps } from './WrfInput';
export { WrfBadge, type WrfBadgeProps } from './WrfBadge';
export { WrfAvatar, type WrfAvatarProps } from './WrfAvatar';
export { WrfTooltip, type WrfTooltipProps } from './WrfTooltip';
export { WrfModal, type WrfModalProps } from './WrfModal';
export { WrfSkeleton, type WrfSkeletonProps } from './WrfSkeleton';
export { WrfAlert, type WrfAlertProps } from './WrfAlert';
export { WrfTabs, WrfTabPanel, type WrfTabsProps, type WrfTabItem, type WrfTabPanelProps } from './WrfTabs';
export { WrfGrid, WrfContainer, type WrfGridProps, type WrfContainerProps } from './WrfGrid';
export { WrfSelect, type WrfSelectProps, type WrfSelectOption } from './WrfSelect';

// Composite
export { WrfStatCard, type WrfStatCardProps } from './WrfStatCard';
export { WrfEmptyState, type WrfEmptyStateProps } from './WrfEmptyState';
export { WrfDataTable, type WrfDataTableProps, type WrfDataTableColumn } from './WrfDataTable';
export { WrfGradientHero, type WrfGradientHeroProps, type WrfGradientHeroVariant } from './WrfGradientHero';

// Trust & Safety
export {
  WrfCapabilityReadinessBadge,
  type WrfCapabilityReadinessBadgeProps,
} from './WrfCapabilityReadinessBadge';
export {
  WrfProtocolTransitionBanner,
  type WrfProtocolTransitionBannerProps,
} from './WrfProtocolTransitionBanner';
export {
  WrfRiskyActionConfirmation,
  type WrfRiskyActionConfirmationProps,
  type ActionSeverity,
  type PreflightCheck,
} from './WrfRiskyActionConfirmation';
export {
  WrfVerificationTimeline,
  type WrfVerificationTimelineProps,
} from './WrfVerificationTimeline';
export type {
  VerificationStepName,
  VerificationStepStatus,
  VerificationEvidence,
  VerificationTimelineStep,
} from '../../types/verification';
export {
  WrfPreflightSimulation,
  type WrfPreflightSimulationProps,
  type StateTransition,
  type RiskFactor,
} from './WrfPreflightSimulation';
export {
  WrfApiReliabilityBadge,
  type WrfApiReliabilityBadgeProps,
  type ApiReliabilityInfo,
  type ResponseFreshness,
} from './WrfApiReliabilityBadge';
export {
  WrfWebhookDeliveryStatus,
  type WrfWebhookDeliveryStatusProps,
  type WebhookDeliveryEntry,
  type WebhookState,
} from './WrfWebhookDeliveryStatus';

// Animation
export {
  Animate,
  StaggerChildren,
  useReducedMotion,
  type AnimationPreset,
  type AnimateProps,
  type StaggerChildrenProps,
} from './AnimationSystem';

// Accessibility
export {
  AccessibilityProvider,
  useAccessibility,
  type AccessibilityProviderProps,
} from './AccessibilityProvider';
