/**
 * @jest-environment jsdom
 *
 * F1/F2/F7 (review 2026-11-14): pick which Ambient station to connect when the account has several,
 * Verify Keys never stays stuck after a key edit, and Confirm has a way back. Fake MACs and coordinates.
 */
import { jest } from '@jest/globals';
import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

const registerStationMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const verifyStationKeyMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

await jest.unstable_mockModule('react-router', () => ({ useNavigate: () => jest.fn() }));

const passthrough = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
await jest.unstable_mockModule('@mui/material', () => ({
  Box: passthrough,
  Stepper: passthrough,
  Step: passthrough,
  StepLabel: passthrough,
  Typography: ({ children, ...rest }: { children?: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': (rest as Record<string, unknown>)['data-testid'] }, children),
  CircularProgress: () => React.createElement('span', null, 'Loading'),
  Chip: ({ label }: { label?: React.ReactNode }) => React.createElement('span', null, label),
}));

await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  WrfCard: passthrough,
  WrfInput: ({ label, value, onChange }: { label?: string; value?: string; onChange?: (e: unknown) => void }) =>
    React.createElement('input', { 'aria-label': label, value: value ?? '', onChange }),
  WrfAlert: ({ children, title }: { children?: React.ReactNode; title?: string }) =>
    React.createElement('div', { role: 'alert' }, title && React.createElement('strong', null, title), children),
}));

await jest.unstable_mockModule('../../services/apiClient', () => ({
  FAUCET_DISCLAIMER: 'Experimental testnet only.',
  // The page's own-wallet hook (W28) loads the wallet provider manager, which imports walletService.
  walletService: {},
  stationRegistrationService: {
    requestFaucetChallenge: jest.fn(),
    claimFaucet: jest.fn(),
    registerStation: registerStationMock,
    verifyStationKey: verifyStationKeyMock,
    getStationRewardProgress: jest.fn(async () => {
      throw new Error('not under test');
    }),
  },
}));

const { ConfirmStep, StationStep } = await import('../ConnectStationPage');
type Form = Parameters<typeof StationStep>[0]['form'];
type Device = { name: string; mac?: string; latitude?: number | null; longitude?: number | null };

const EMPTY: Form = { name: '', latitude: '', longitude: '', location: '', apiKey: 'fake-api', appKey: 'fake-app', hardware: '' };
const A: Device = { name: 'Fake Garden', mac: 'AA:AA:AA:AA:AA:01', latitude: 10.1, longitude: -20.1 };
const B: Device = { name: 'Fake Roof', mac: 'BB:BB:BB:BB:BB:02', latitude: 11.2, longitude: -21.2 };

/** Holds form, verified and devices like the page does, and can unmount the step (as going to Confirm does). */
function Harness({ onForm, show = true }: { onForm: (f: Form) => void; show?: boolean }) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [verified, setVerified] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  onForm(form);
  return show ? (
    <StationStep
      form={form}
      setForm={setForm}
      verified={verified}
      setVerified={setVerified}
      devices={devices}
      setDevices={setDevices}
      onContinue={jest.fn()}
    />
  ) : null;
}

const review = () => screen.getByRole('button', { name: /Review & Register/ });

beforeEach(() => {
  registerStationMock.mockReset();
  verifyStationKeyMock.mockReset();
});

describe('F1: an Ambient account with several stations', () => {
  it('asks which station, sends the MAC of the one picked, and fills its name and coords', async () => {
    verifyStationKeyMock.mockResolvedValue({ valid: true, devices: [A, B] });
    let latest = EMPTY;
    render(<Harness onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    expect(screen.getByTestId('ambient-device-picker')).toHaveTextContent('2 stations');
    // Nothing is chosen for the owner: no MAC, and no way on until they pick.
    expect(latest.mac).toBeUndefined();
    expect(review()).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByLabelText(`Fake Roof (${B.mac})`));
    });
    expect(latest.mac).toBe(B.mac);
    expect(latest.name).toBe('Fake Roof');
    expect(latest.latitude).toBe('11.2');
    expect(review()).toBeEnabled();

    // Switching replaces what the previous pick filled in.
    await act(async () => {
      fireEvent.click(screen.getByLabelText(`Fake Garden (${A.mac})`));
    });
    expect(latest.mac).toBe(A.mac);
    expect(latest.name).toBe('Fake Garden');
    expect(latest.longitude).toBe('-20.1');
  });

  it('keeps a name the owner typed when they switch station', async () => {
    verifyStationKeyMock.mockResolvedValue({ valid: true, devices: [A, B] });
    let latest = EMPTY;
    render(<Harness onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText(`Fake Roof (${B.mac})`));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Station name'), { target: { value: 'My own name' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText(`Fake Garden (${A.mac})`));
    });
    expect(latest.mac).toBe(A.mac);
    expect(latest.name).toBe('My own name');
  });

  it('one station: no picker, and that station is used as before', async () => {
    verifyStationKeyMock.mockResolvedValue({ valid: true, devices: [A] });
    let latest = EMPTY;
    render(<Harness onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    expect(screen.queryByTestId('ambient-device-picker')).not.toBeInTheDocument();
    expect(latest.mac).toBe(A.mac);
    expect(latest.name).toBe('Fake Garden');
    expect(screen.getByText(/Detected device/)).toHaveTextContent(A.mac as string);
    expect(review()).toBeEnabled();
  });

  it('the picked station survives leaving the step and coming back (Back from Confirm)', async () => {
    verifyStationKeyMock.mockResolvedValue({ valid: true, devices: [A, B] });
    let latest = EMPTY;
    const { rerender } = render(<Harness onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText(`Fake Roof (${B.mac})`));
    });
    rerender(<Harness onForm={(f) => { latest = f; }} show={false} />);
    rerender(<Harness onForm={(f) => { latest = f; }} />);
    expect(verifyStationKeyMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(`Fake Roof (${B.mac})`)).toBeChecked();
    expect(latest.mac).toBe(B.mac);
    expect(review()).toBeEnabled();
  });

  it('Confirm shows the MAC that will be registered', () => {
    render(<ConfirmStep address={`0x${'a'.repeat(40)}`} form={{ ...EMPTY, name: 'Fake Roof', latitude: '11.2', longitude: '-21.2', mac: B.mac }} />);
    expect(screen.getByTestId('confirm-device-mac')).toHaveTextContent(B.mac as string);
  });

  it('a MAC already taken is refused in plain words, with Register off and a way back', async () => {
    const taken = Object.assign(new Error('MAC_TAKEN'), { status: 409 });
    registerStationMock.mockRejectedValue(taken);
    const onBack = jest.fn();
    render(
      <ConfirmStep
        address={`0x${'a'.repeat(40)}`}
        form={{ ...EMPTY, name: 'Fake Garden', latitude: '10.1', longitude: '-20.1', mac: A.mac }}
        onBack={onBack}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Register Station' }));
    });
    expect(screen.getByText('This station is already connected')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('MAC_TAKEN');
    expect(screen.getByRole('button', { name: 'Register Station' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Back to edit details' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('F2: editing a key while Verify Keys is running', () => {
  it('leaves Verify Keys usable (the stale request no longer holds the spinner)', async () => {
    verifyStationKeyMock.mockReturnValue(new Promise(() => {}));
    render(<Harness onForm={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    expect(screen.getByRole('button', { name: 'Verify Keys' })).toBeDisabled();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Ambient API Key'), { target: { value: '' } });
    });
    expect(screen.getByRole('button', { name: 'Verify Keys' })).toBeEnabled();
  });
});

describe('F7: Confirm has a way back', () => {
  it('Back to edit details calls back without registering', () => {
    const onBack = jest.fn();
    render(<ConfirmStep address={`0x${'a'.repeat(40)}`} form={{ ...EMPTY, name: 'Fake', latitude: '10.1', longitude: '-20.1' }} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to edit details' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(registerStationMock).not.toHaveBeenCalled();
  });
});
