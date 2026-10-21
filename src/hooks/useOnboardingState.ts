import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'wrfcoin_onboarding';

export const ONBOARDING_STEPS = [
  { label: 'Wallet Setup', key: 'wallet' },
  { label: 'Fund Wallet', key: 'fund' },
  { label: 'Hardware Wallet', key: 'hardware', optional: true },
  { label: 'Complete', key: 'complete' },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingPersistedState {
  currentStep: number;
  completedSteps: Record<number, Record<string, unknown>>;
  walletAddress: string | null;
}

export interface UseOnboardingStateResult {
  /** Current step index (0-based) */
  currentStep: number;
  /** Per-step completion data keyed by step index */
  completedSteps: Record<number, Record<string, unknown>>;
  /** Wallet address once created (extracted from step data) */
  walletAddress: string | null;
  /** Total number of onboarding steps */
  totalSteps: number;
  /** The ONBOARDING_STEPS array */
  steps: typeof ONBOARDING_STEPS;
  /** Mark a step as complete with associated data, advances to next step */
  completeStep: (step: number, data: Record<string, unknown>) => void;
  /** Skip a step (marks as { skipped: true }), advances to next step */
  skipStep: (step: number) => void;
  /** Reset all state and clear localStorage */
  reset: () => void;
  /** True when the final step has been completed */
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadState(): OnboardingPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPersistedState;
  } catch {
    return null;
  }
}

function saveState(state: OnboardingPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore localStorage write failures (e.g. quota exceeded)
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboardingState(): UseOnboardingStateResult {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = loadState();
    return saved?.currentStep ?? 0;
  });

  const [completedSteps, setCompletedSteps] = useState<
    Record<number, Record<string, unknown>>
  >(() => {
    const saved = loadState();
    return saved?.completedSteps ?? {};
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    const saved = loadState();
    return saved?.walletAddress ?? null;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    saveState({ currentStep, completedSteps, walletAddress });
  }, [currentStep, completedSteps, walletAddress]);

  const completeStep = useCallback(
    (step: number, data: Record<string, unknown>) => {
      setCompletedSteps((prev) => ({ ...prev, [step]: data }));

      // Extract walletAddress from data if present
      if (typeof data.walletAddress === 'string') {
        setWalletAddress(data.walletAddress);
      }

      // Advance to next step (clamped to max step index)
      setCurrentStep((prev) =>
        Math.min(prev + 1, ONBOARDING_STEPS.length - 1),
      );
    },
    [],
  );

  const skipStep = useCallback((step: number) => {
    setCompletedSteps((prev) => ({ ...prev, [step]: { skipped: true } }));
    setCurrentStep((prev) =>
      Math.min(prev + 1, ONBOARDING_STEPS.length - 1),
    );
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps({});
    setWalletAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const lastStepIndex = ONBOARDING_STEPS.length - 1;
  const isComplete = completedSteps[lastStepIndex] !== undefined &&
    !(completedSteps[lastStepIndex] as Record<string, unknown>)?.skipped;

  return {
    currentStep,
    completedSteps,
    walletAddress,
    totalSteps: ONBOARDING_STEPS.length,
    steps: ONBOARDING_STEPS,
    completeStep,
    skipStep,
    reset,
    isComplete,
  };
}

export default useOnboardingState;
