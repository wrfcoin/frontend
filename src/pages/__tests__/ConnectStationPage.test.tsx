/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const registerStationMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const requestFaucetChallengeMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const claimFaucetMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getStationRewardProgressMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const navigateMock = jest.fn();

await jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => navigateMock,
}));

await jest.unstable_mockModule('@mui/material', () => ({
  Box: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  Stepper: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  Step: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  StepLabel: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  Typography: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', null, children),
  CircularProgress: () => React.createElement('span', null, 'Loading'),
  Chip: ({ label }: { label?: React.ReactNode }) =>
    React.createElement('span', null, label),
}));

await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({
    children,
    onClick,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => React.createElement('button', { onClick, disabled }, children),
  WrfCard: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  WrfInput: () => React.createElement('input'),
  WrfAlert: ({
    children,
    title,
    severity,
  }: {
    children?: React.ReactNode;
    title?: string;
    severity?: string;
  }) =>
    React.createElement(
      'div',
      { role: 'alert', 'data-severity': severity },
      title && React.createElement('strong', null, title),
      children,
    ),
}));

await jest.unstable_mockModule('../../services/apiClient', () => ({
  FAUCET_DISCLAIMER:
    'Experimental testnet only — WRF coins are valueless and have no monetary value.',
  // The page's own-wallet hook (W28) loads the wallet provider manager, which imports walletService.
  walletService: {},
  stationRegistrationService: {
    requestFaucetChallenge: requestFaucetChallengeMock,
    claimFaucet: claimFaucetMock,
    registerStation: registerStationMock,
    getStationRewardProgress: getStationRewardProgressMock,
  },
}));

const { ConfirmStep, FundStep } = await import('../ConnectStationPage');

// W28 (frontend#437): the Fund step follows the build's VITE_FAUCET_OPEN like /onboarding. Only the exact
// string `true` opens the claim; the amount comes from the service, never a hard-coded number.
const withFaucetEnv = (value: string | undefined, run: () => void) => {
  const g = globalThis as { __VITE_ENV__?: Record<string, string> };
  const previous = g.__VITE_ENV__;
  g.__VITE_ENV__ = { ...(previous ?? {}) };
  if (value === undefined) delete g.__VITE_ENV__.VITE_FAUCET_OPEN;
  else g.__VITE_ENV__.VITE_FAUCET_OPEN = value;
  try { run(); } finally { g.__VITE_ENV__ = previous; }
};

describe('ConnectStationPage faucet step', () => {
  it('open (VITE_FAUCET_OPEN=true): the valueless-testnet warning comes before a claim with no fixed amount', () => {
    withFaucetEnv('true', () => {
      render(<FundStep address={`0x${'a'.repeat(40)}`} onContinue={jest.fn()} />);
      const warning = screen.getAllByRole('alert')[0];
      expect(warning).toHaveAttribute('data-severity', 'warning');
      expect(warning).toHaveTextContent(
        'Experimental testnet only — WRF coins are valueless and have no monetary value.',
      );
      expect(screen.getByText('Claim test WRF from the faucet')).toBeInTheDocument();
      // No amount is known before a claim (the challenge carries none), so none is shown.
      expect(document.body.textContent).not.toMatch(/\d+(\.\d+)?\s*WRF/);
      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });
  });

  it('after a claim, the amount shown is exactly the one the faucet reported', async () => {
    requestFaucetChallengeMock.mockResolvedValue({ challengeId: 'c1', question: 'What is 2 + 3?' });
    claimFaucetMock.mockResolvedValue({ success: true, amount: '10', txHash: '0x' + 'ab'.repeat(32) });
    const g = globalThis as { __VITE_ENV__?: Record<string, string> };
    const previous = g.__VITE_ENV__;
    g.__VITE_ENV__ = { ...(previous ?? {}), VITE_FAUCET_OPEN: 'true' };
    try {
      render(<FundStep address={`0x${'a'.repeat(40)}`} onContinue={jest.fn()} />);
      fireEvent.click(screen.getByText('Claim test WRF from the faucet'));
      await waitFor(() => expect(screen.getByText('Amount: 10 WRF')).toBeInTheDocument());
      expect(claimFaucetMock).toHaveBeenCalledWith(`0x${'a'.repeat(40)}`, 'c1', '5');
      expect(document.body.textContent).not.toMatch(/100 WRF/);
    } finally {
      g.__VITE_ENV__ = previous;
    }
  });

  it.each([undefined, '', 'TRUE', '1', 'false'])('closed (VITE_FAUCET_OPEN=%p): no claim, says why, lets you continue', (value) => {
    withFaucetEnv(value, () => {
      const onContinue = jest.fn();
      render(<FundStep address={`0x${'a'.repeat(40)}`} onContinue={onContinue} />);
      expect(screen.queryByText('Claim test WRF from the faucet')).toBeNull();
      expect(screen.getByText('The faucet is not funded yet')).toBeInTheDocument();
      expect(screen.queryByText(/Claim some free testnet WRF/)).toBeNull();
      fireEvent.click(screen.getByText('Continue without test tokens'));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });
});

describe('ConnectStationPage registration evidence boundary', () => {
  beforeEach(() => {
    registerStationMock.mockReset();
    getStationRewardProgressMock.mockReset();
    navigateMock.mockReset();
  });

  it('renders registration and awaiting-observation facts without claiming earnings', async () => {
    registerStationMock.mockResolvedValue({
      stationId: 'station-2456',
      ownerAddress: `0x${'a'.repeat(40)}`,
      ingestionStatus: 'active',
    });
    getStationRewardProgressMock.mockResolvedValue({
      schemaVersion: 1,
      stationId: 'station-2456',
      ownerAddress: `0x${'a'.repeat(40)}`,
      state: 'AWAITING_OBSERVATION',
      asOf: '2026-07-28T12:00:00.000Z',
      evidenceFresh: true,
      registration: {
        state: 'REGISTERED',
        registeredAt: '2026-07-28T11:59:00.000Z',
      },
      chain: null,
      observation: null,
      contribution: null,
      reward: null,
      diagnostic: null,
    });

    render(
      <ConfirmStep
        address={`0x${'a'.repeat(40)}`}
        form={{
          name: 'Backyard Station',
          latitude: '37.7749',
          longitude: '-122.4194',
          location: 'San Francisco',
          apiKey: 'not-rendered',
          appKey: 'not-rendered',
          hardware: 'WS-2902',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Register Station' }));

    expect(await screen.findByText('Station registered')).toBeInTheDocument();
    expect(
      await screen.findByText('Awaiting first observation'),
    ).toBeInTheDocument();
    expect(screen.getByText('station-2456')).toBeInTheDocument();
    expect(screen.queryByText(/you.re earning/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contributing weather data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/see your earnings/i)).not.toBeInTheDocument();
    expect(getStationRewardProgressMock).toHaveBeenCalledWith('station-2456');
  });

  it('renders an accepted observation as pipeline evidence, not a reward', async () => {
    registerStationMock.mockResolvedValue({
      stationId: 'station-observed',
      ownerAddress: `0x${'a'.repeat(40)}`,
      ingestionStatus: 'active',
    });
    getStationRewardProgressMock.mockResolvedValue({
      schemaVersion: 1,
      stationId: 'station-observed',
      ownerAddress: `0x${'a'.repeat(40)}`,
      state: 'OBSERVATION_RECEIVED',
      asOf: '2026-07-28T12:00:00.000Z',
      evidenceFresh: true,
      registration: {
        state: 'REGISTERED',
        registeredAt: '2026-07-28T11:50:00.000Z',
      },
      chain: null,
      observation: {
        id: 'observation-1',
        digest: 'a'.repeat(64),
        observedAt: '2026-07-28T11:55:00.000Z',
        acceptedAt: '2026-07-28T11:55:01.000Z',
      },
      contribution: null,
      reward: null,
      diagnostic: null,
    });

    render(
      <ConfirmStep
        address={`0x${'a'.repeat(40)}`}
        form={{
          name: 'Backyard Station',
          latitude: '37.7749',
          longitude: '-122.4194',
          location: 'San Francisco',
          apiKey: 'not-rendered',
          appKey: 'not-rendered',
          hardware: 'WS-2902',
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Register Station' }));

    expect(await screen.findByText('Observation received')).toBeInTheDocument();
    expect(screen.getByText(/not a reward/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Rewarded$/i)).not.toBeInTheDocument();
  });

  it('fails closed when the evidence projection cannot be loaded', async () => {
    registerStationMock.mockResolvedValue({
      stationId: 'station-unavailable',
      ownerAddress: `0x${'a'.repeat(40)}`,
      ingestionStatus: 'active',
    });
    getStationRewardProgressMock.mockRejectedValue(
      new Error('private topology must not be rendered'),
    );

    render(
      <ConfirmStep
        address={`0x${'a'.repeat(40)}`}
        form={{
          name: 'Backyard Station',
          latitude: '37.7749',
          longitude: '-122.4194',
          location: 'San Francisco',
          apiKey: 'not-rendered',
          appKey: 'not-rendered',
          hardware: 'WS-2902',
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Register Station' }));

    expect(
      await screen.findByText('Reward progress unavailable'),
    ).toBeInTheDocument();
    expect(screen.getByText(/No reward is claimed/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/private topology must not be rendered/i),
    ).not.toBeInTheDocument();
  });
});
