/**
 * @jest-environment jsdom
 *
 * W20 (owner ruling 2026-10-01, frontend#437): a web station registration
 * sends its position at 0.1 degree, like the phones. The exact position never
 * leaves the browser: the device's location, the detected Ambient device's
 * location and anything typed are shown and sent rounded. Obviously fake
 * coordinates.
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

const { ConfirmStep, StationStep, STATION_LOCATION_ROUNDING_NOTICE } = await import('../ConnectStationPage');
type Form = Parameters<typeof StationStep>[0]['form'];

const EMPTY: Form = { name: '', latitude: '', longitude: '', location: '', apiKey: '', appKey: '', hardware: '' };

function StationHarness({ initial, onForm }: { initial: Form; onForm: (f: Form) => void }) {
  const [form, setForm] = useState<Form>(initial);
  const [verified, setVerified] = useState(false);
  onForm(form);
  return <StationStep form={form} setForm={setForm} verified={verified} setVerified={setVerified} onContinue={jest.fn()} />;
}

const FINE = /10\.123456|20\.987654|10\.12\b|20\.98\b/;

beforeEach(() => {
  registerStationMock.mockReset();
  verifyStationKeyMock.mockReset();
});

describe('web station registration at 0.1 degree (W20)', () => {
  it('"Use my device\'s location" fills the form at 0.1 degree and asks for no high-accuracy reading', async () => {
    let options: PositionOptions | undefined;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback, _err: PositionErrorCallback, opts?: PositionOptions) => {
          options = opts;
          ok({ coords: { latitude: 10.123456, longitude: -20.987654 } } as GeolocationPosition);
        },
      },
    });
    let latest = EMPTY;
    render(<StationHarness initial={EMPTY} onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use my device\'s location' }));
    });
    expect(latest.latitude).toBe('10.1');
    expect(latest.longitude).toBe('-21.0');
    expect(options?.enableHighAccuracy).toBe(false);
    expect(screen.getByLabelText('Latitude')).toHaveValue('10.1');
    expect(document.body.innerHTML).not.toMatch(FINE);
    expect(screen.getByTestId('station-location-rounding-notice')).toHaveTextContent(STATION_LOCATION_ROUNDING_NOTICE);
  });

  it('the detected Ambient device\'s location is shown and filled at 0.1 degree', async () => {
    verifyStationKeyMock.mockResolvedValue({
      valid: true,
      devices: [{ name: 'Fake Ambient', mac: 'AA:BB:CC:DD:EE:FF', latitude: 10.123456, longitude: -20.987654 }],
    });
    let latest = EMPTY;
    render(<StationHarness initial={{ ...EMPTY, apiKey: 'fake-api', appKey: 'fake-app' }} onForm={(f) => { latest = f; }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Verify Keys' }));
    });
    expect(latest.latitude).toBe('10.1');
    expect(latest.longitude).toBe('-21.0');
    expect(screen.getByText(/Reported location \(rounded to 0\.1°\)/)).toHaveTextContent('10.1, -21.0');
    expect(document.body.innerHTML).not.toMatch(FINE);
  });

  it('a typed fine position is shown rounded at confirm and sent rounded', async () => {
    registerStationMock.mockResolvedValue({ stationId: 'station-w20', ownerAddress: `0x${'a'.repeat(40)}` });
    render(
      <ConfirmStep
        address={`0x${'a'.repeat(40)}`}
        form={{ ...EMPTY, name: 'Fake', latitude: '10.123456', longitude: '-20.987654', apiKey: 'k', appKey: 'a' }}
      />,
    );
    expect(screen.getByText(/rounded to 0\.1°/)).toHaveTextContent('10.1, -21.0');
    expect(document.body.innerHTML).not.toMatch(FINE);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Register Station' }));
    });
    expect(registerStationMock).toHaveBeenCalledTimes(1);
    const sent = registerStationMock.mock.calls[0][0] as { latitude: number; longitude: number };
    expect(sent.latitude).toBe(10.1);
    expect(sent.longitude).toBe(-21);
  });
});
