/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

const { useOnboardingState, ONBOARDING_STEPS } = await import('../useOnboardingState');

const STORAGE_KEY = 'wrfcoin_onboarding';

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string | null => store[key] ?? null),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    clear: jest.fn((): void => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number): string | null => Object.keys(store)[index] ?? null),
    _getStore: () => store,
  };
}

let mockStorage: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  mockStorage = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
});

describe('useOnboardingState', () => {
  it('starts at step 0 with empty completedSteps', () => {
    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.currentStep).toBe(0);
    expect(result.current.completedSteps).toEqual({});
    expect(result.current.walletAddress).toBeNull();
    expect(result.current.isComplete).toBe(false);
    expect(result.current.totalSteps).toBe(ONBOARDING_STEPS.length);
    expect(result.current.steps).toBe(ONBOARDING_STEPS);
  });

  it('completeStep(0, { walletAddress: "0xabc" }) advances to step 1 and records completion', () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.completeStep(0, { walletAddress: '0xabc' });
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.completedSteps[0]).toEqual({ walletAddress: '0xabc' });
    expect(result.current.walletAddress).toBe('0xabc');
    expect(result.current.isComplete).toBe(false);
  });

  it('skipStep(2) advances to step 3 and records { skipped: true }', () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.completeStep(0, { walletAddress: '0xabc' });
    });
    act(() => {
      result.current.completeStep(1, { funded: true });
    });

    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.skipStep(2);
    });

    expect(result.current.currentStep).toBe(3);
    expect(result.current.completedSteps[2]).toEqual({ skipped: true });
  });

  it('persists state to localStorage after completeStep', () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.completeStep(0, { walletAddress: '0xdef' });
    });

    const calls = (mockStorage.setItem as ReturnType<typeof jest.fn>).mock.calls.filter(
      (call) => call[0] === STORAGE_KEY,
    );
    expect(calls.length).toBeGreaterThan(0);

    const lastCall = calls[calls.length - 1];
    const saved = JSON.parse(lastCall[1] as string);
    expect(saved.currentStep).toBe(1);
    expect(saved.completedSteps[0]).toEqual({ walletAddress: '0xdef' });
    expect(saved.walletAddress).toBe('0xdef');
  });

  it('restores state from localStorage on mount', () => {
    const savedState = {
      currentStep: 2,
      completedSteps: {
        0: { walletAddress: '0xresume' },
        1: { funded: true },
      },
      walletAddress: '0xresume',
    };

    (mockStorage.getItem as ReturnType<typeof jest.fn>).mockImplementation(
      (key: string): string | null => {
        if (key === STORAGE_KEY) return JSON.stringify(savedState);
        return null;
      },
    );

    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.currentStep).toBe(2);
    expect(result.current.completedSteps[0]).toEqual({ walletAddress: '0xresume' });
    expect(result.current.completedSteps[1]).toEqual({ funded: true });
    expect(result.current.walletAddress).toBe('0xresume');
    expect(result.current.isComplete).toBe(false);
  });

  it('reset() clears state and removes localStorage', () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.completeStep(0, { walletAddress: '0xabc' });
    });
    act(() => {
      result.current.completeStep(1, { funded: true });
    });

    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.completedSteps).toEqual({});
    expect(result.current.walletAddress).toBeNull();
    expect(result.current.isComplete).toBe(false);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('isComplete is true when final step has been completed', () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.completeStep(0, { walletAddress: '0xabc' });
    });
    act(() => {
      result.current.completeStep(1, { funded: true });
    });
    act(() => {
      result.current.skipStep(2);
    });
    act(() => {
      result.current.completeStep(3, { done: true });
    });

    expect(result.current.isComplete).toBe(true);
  });
});
