/**
 * @jest-environment jsdom
 *
 * The forecast page hands its CSS the light token set when the theme is light and the dark set
 * otherwise (frontend light-mode legibility). Governance and downloads use the same helper.
 */
import React from 'react';
import { jest, it, expect, afterEach } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { textPrimary, textPrimaryLight, bgSecondary, bgSecondaryLight } from '../../theme/tokens';

let isDark = true;
const actualTheme = await import('../../theme/ThemeProvider');
await jest.unstable_mockModule('../../theme/ThemeProvider', () => ({ ...actualTheme, useIsDarkTheme: () => isDark }));
const { default: PublicForecastPage } = await import('../PublicForecastPage');
afterEach(cleanup);
const mount = () => render(<MemoryRouter><PublicForecastPage /></MemoryRouter>);

it('uses the light surface and text tokens in light mode', () => {
  isDark = false; mount();
  const main = screen.getByTestId('public-forecast');
  expect(main.style.getPropertyValue('--pf-text')).toBe(textPrimaryLight);
  expect(main.style.getPropertyValue('--pf-bg-secondary')).toBe(bgSecondaryLight);
});
it('keeps the dark tokens in dark mode', () => {
  isDark = true; mount();
  const main = screen.getByTestId('public-forecast');
  expect(main.style.getPropertyValue('--pf-text')).toBe(textPrimary);
  expect(main.style.getPropertyValue('--pf-bg-secondary')).toBe(bgSecondary);
});
