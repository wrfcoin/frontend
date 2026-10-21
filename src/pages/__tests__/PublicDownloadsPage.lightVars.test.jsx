/**
 * @jest-environment jsdom
 *
 * The downloads page hands its CSS themed row, inset, code and accent colours when the theme is
 * light; dark keeps the original values.
 */
import React from 'react';
import { jest, it, expect, afterEach } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let isDark = true;
const actualTheme = await import('../../theme/ThemeProvider');
await jest.unstable_mockModule('../../theme/ThemeProvider', () => ({ ...actualTheme, useIsDarkTheme: () => isDark }));
const { default: PublicDownloadsPage } = await import('../PublicDownloadsPage');
afterEach(cleanup);
const mount = () => render(<MemoryRouter><PublicDownloadsPage /></MemoryRouter>);

it('uses the light row, inset, code and accent colours in light mode', () => {
  isDark = false; mount();
  const main = screen.getByTestId('public-downloads');
  expect(main.style.getPropertyValue('--dl-row-bg')).toBe('#F1F5F9');
  expect(main.style.getPropertyValue('--dl-inset-bg')).toBe('#F1F5F9');
  expect(main.style.getPropertyValue('--dl-code')).toBe('#1E3A8A');
  expect(main.style.getPropertyValue('--dl-primary-light')).toBe('#1D4ED8');
});
it('keeps the dark values in dark mode', () => {
  isDark = true; mount();
  const main = screen.getByTestId('public-downloads');
  expect(main.style.getPropertyValue('--dl-row-bg')).toBe('rgba(51, 65, 85, 0.3)');
  expect(main.style.getPropertyValue('--dl-code')).toBe('#BFDBFE');
  expect(main.style.getPropertyValue('--dl-primary-light')).toBe('#60A5FA');
});
