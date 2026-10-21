/** @jest-environment jsdom */
/**
 * Owner ruling 2026-09-27 (Stage 1.5 Q4 = A): owner-typed station names stay
 * public (the anonymous map and station page show them verbatim), so every
 * form that sets the name tells the owner so, on the name field itself.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

await jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => jest.fn(),
}));

const { StationStep } = await import('../ConnectStationPage');
const { StationNamer } = await import('../../components/Onboarding/ManualSetupFlow');
const { STATION_NAME_PUBLIC_NOTICE } = await import('../../config/stationNamePublicNotice');

const EMPTY_FORM = {
  name: '',
  latitude: '',
  longitude: '',
  location: '',
  apiKey: '',
  appKey: '',
  hardware: '',
};

/** The notice must be the name input's accessible description, not loose text. */
function expectNoticeDescribes(input: HTMLElement) {
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  const described = describedBy
    .split(/\s+/)
    .map(id => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(described).toContain(STATION_NAME_PUBLIC_NOTICE);
}

describe('station name is public notice', () => {
  afterEach(() => cleanup());

  it('says the name is public and warns against an address', () => {
    expect(STATION_NAME_PUBLIC_NOTICE).toMatch(/public/i);
    expect(STATION_NAME_PUBLIC_NOTICE).toMatch(/address/i);
  });

  it('ConnectStationPage station step: on the "Station name" field', () => {
    render(
      <StationStep
        form={EMPTY_FORM}
        setForm={() => undefined}
        verified={false}
        setVerified={() => undefined}
        onContinue={() => undefined}
      />,
    );
    expect(screen.getByText(STATION_NAME_PUBLIC_NOTICE)).toBeTruthy();
    expectNoticeDescribes(screen.getByLabelText('Station name'));
  });

  it('Manual setup flow: on the station-naming field', () => {
    render(<StationNamer name="" onNameChange={() => undefined} />);
    expect(screen.getByText(STATION_NAME_PUBLIC_NOTICE)).toBeTruthy();
    expectNoticeDescribes(screen.getByPlaceholderText('e.g., Rooftop Weather Station'));
  });
});
