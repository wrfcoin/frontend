/**
 * @jest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, afterEach } from '@jest/globals';
import { render, screen, cleanup } from '@testing-library/react';
import { WrfThemeProvider, useIsDarkTheme } from '../ThemeProvider';
import { publicPageSurfaceVars } from '../publicPageTheme';
import { contrastRatio, hexToRgb } from '../contrast';
import {
  bgSecondary, bgSecondaryLight, textPrimary, textPrimaryLight, textSecondaryLight, borders,
  primaryLight, info, successLight, errorLight,
} from '../tokens';

afterEach(() => { cleanup(); document.body.className = ''; });

const WHITE = hexToRgb('#FFFFFF');

describe('publicPageSurfaceVars', () => {
  it('maps the dark token set and the light token set under the page prefix', () => {
    const dark = publicPageSurfaceVars('pf', true);
    const light = publicPageSurfaceVars('pf', false);
    expect(dark['--pf-text']).toBe(textPrimary);
    expect(dark['--pf-bg-secondary']).toBe(bgSecondary);
    expect(light['--pf-text']).toBe(textPrimaryLight);
    expect(light['--pf-text-secondary']).toBe(textSecondaryLight);
    expect(light['--pf-bg-secondary']).toBe(bgSecondaryLight);
    expect(light['--pf-border']).toBe(borders.defaultLight);
    expect(Object.keys(dark)).toEqual(Object.keys(light));
  });

  it('keeps the dark accent values the pages and stylesheets already used', () => {
    const dark = publicPageSurfaceVars('dl', true);
    expect(dark['--dl-primary-light']).toBe(primaryLight);
    expect(dark['--dl-info']).toBe(info);
    expect(dark['--dl-success-light']).toBe(successLight);
    expect(dark['--dl-error-light']).toBe(errorLight);
    expect(dark['--dl-code']).toBe('#BFDBFE');
    expect(dark['--dl-row-bg']).toBe('rgba(51, 65, 85, 0.3)');
    expect(dark['--dl-inset-bg']).toBe('rgba(15, 23, 42, 0.6)');
  });

  it('gives every light accent at least 4.5:1 on white and on the light row and inset surfaces', () => {
    const light = publicPageSurfaceVars('dl', false);
    const row = hexToRgb(light['--dl-row-bg']);
    const inset = hexToRgb(light['--dl-inset-bg']);
    for (const key of ['primary-light', 'info', 'success-light', 'error-light', 'sky-text', 'night-text', 'purple-text', 'code']) {
      const rgb = hexToRgb(light[`--dl-${key}`]);
      expect(contrastRatio(rgb, WHITE)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(rgb, row)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(rgb, inset)).toBeGreaterThanOrEqual(4.5);
    }
    // The themed secondary text on the light row (platform filter chips).
    expect(contrastRatio(hexToRgb(textSecondaryLight), row)).toBeGreaterThanOrEqual(4.5);
  });
});

const Probe = () => <output>{useIsDarkTheme() ? 'dark' : 'light'}</output>;

describe('useIsDarkTheme', () => {
  it('is dark without a provider and follows the provider when there is one', () => {
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('dark');
    cleanup();
    render(<WrfThemeProvider defaultMode="light"><Probe /></WrfThemeProvider>);
    expect(screen.getByRole('status').textContent).toBe('light');
  });
});
