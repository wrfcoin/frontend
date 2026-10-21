/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
const flags = { demoSurfaces: false };
const get = jest.fn(async () => { throw new Error('404: IoT unavailable'); });
const post = jest.fn(async () => { throw new Error('404: IoT unavailable'); });
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get, post } }));
const { default: Wizard } = await import('../AutoDetectWizard');
afterEach(() => { cleanup(); flags.demoSurfaces = false; jest.clearAllMocks(); });
it('unsupported IoT discovery is unavailable without authentication or device controls', () => {
  render(<Wizard />);
  expect(screen.getByText('IoT device discovery is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Authenticate')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled(); expect(post).not.toHaveBeenCalled();
});
it('an explicit illustrative wizard is labelled', () => {
  flags.demoSurfaces = true; render(<Wizard />);
  expect(screen.getByTestId('iot-detection-sample-badge')).toHaveTextContent('Sample data');
  expect(screen.getByText('Auto-Detect Wizard')).toBeInTheDocument();
});
