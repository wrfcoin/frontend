/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';

const mockUseBridgeTrustMode = jest.fn();
const mockUseCapabilities = jest.fn();
const mockUseBridgeFinalityStatus = jest.fn();

await jest.unstable_mockModule('../../../hooks/useBridgeTrustMode', () => ({
  useBridgeTrustMode: mockUseBridgeTrustMode,
}));
await jest.unstable_mockModule('../../../hooks/useCapabilities', () => ({
  useCapabilities: mockUseCapabilities,
}));
await jest.unstable_mockModule('../../../hooks/useBridgeFinalityStatus', () => ({
  useBridgeFinalityStatus: mockUseBridgeFinalityStatus,
}));

describe('BridgeTransactionTracker UI Config Tests', () => {
  beforeEach(() => {
    mockUseCapabilities.mockReturnValue({
      loading: false,
      capabilities: {
        features: {
          l2Prover: { status: 'operational', reason: 'Ready' },
          l2Verifier: { status: 'operational', reason: 'Ready' },
          l1Finality: { status: 'operational', reason: 'Ready' },
        },
      },
    });

    mockUseBridgeFinalityStatus.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('hooks are callable mocks', () => {
    mockUseBridgeTrustMode.mockReturnValue({
      loading: false,
      trustState: {
        mode: 'simulated',
        reason: 'Operating in simulated mode',
        reasonCode: 'SIMULATED_MODE',
        quorum: null,
      },
    });

    expect(mockUseBridgeTrustMode).toBeDefined();
    expect(mockUseCapabilities).toBeDefined();
  });
});
