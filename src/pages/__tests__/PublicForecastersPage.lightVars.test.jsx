/**
 * @jest-environment jsdom
 *
 * The forecaster pages hand their CSS the light token set when the theme is light and the dark set
 * otherwise, through the shared public-page helper (the forecast, governance and downloads pages do the
 * same). Without it the light theme drew slate-50 text on a white card.
 */
import React from 'react';
import { jest, it, expect, afterEach, beforeEach } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { textPrimary, textPrimaryLight, bgSecondary, bgSecondaryLight } from '../../theme/tokens';

let isDark = true;
const actualTheme = await import('../../theme/ThemeProvider');
await jest.unstable_mockModule('../../theme/ThemeProvider', () => ({ ...actualTheme, useIsDarkTheme: () => isDark }));
const { default: ListPage } = await import('../PublicForecastersPage');
const { default: RecordPage } = await import('../PublicForecasterPage');
beforeEach(() => { globalThis.fetch = jest.fn(() => new Promise(() => {})); });
afterEach(cleanup);

const pages = [
  ['leaderboard', 'public-forecasters', () => render(<MemoryRouter><ListPage /></MemoryRouter>)],
  ['track record', 'public-forecaster', () => render(
    <MemoryRouter initialEntries={['/forecasters/c_0123456789abcdef01234567']}>
      <Routes><Route path="/forecasters/:profileKey" element={<RecordPage />} /></Routes>
    </MemoryRouter>,
  )],
];

it.each(pages)('the %s uses the light surface and text tokens in light mode', (_name, testId, mount) => {
  isDark = false; mount();
  const main = screen.getByTestId(testId);
  expect(main.style.getPropertyValue('--fc-text')).toBe(textPrimaryLight);
  expect(main.style.getPropertyValue('--fc-bg-secondary')).toBe(bgSecondaryLight);
});
it.each(pages)('the %s keeps the dark tokens in dark mode', (_name, testId, mount) => {
  isDark = true; mount();
  const main = screen.getByTestId(testId);
  expect(main.style.getPropertyValue('--fc-text')).toBe(textPrimary);
  expect(main.style.getPropertyValue('--fc-bg-secondary')).toBe(bgSecondary);
});
