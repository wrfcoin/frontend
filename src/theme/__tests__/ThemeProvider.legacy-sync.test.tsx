/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { WrfThemeProvider, useThemeMode } from '../ThemeProvider';

const ThemeProbe = () => {
  const { isDark, toggleMode } = useThemeMode();
  return (
    <button type="button" onClick={toggleMode}>
      {isDark ? 'dark' : 'light'}
    </button>
  );
};

describe('WrfThemeProvider legacy theme sync', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('initializes from legacy darkMode key when new key is absent', () => {
    localStorage.setItem('darkMode', 'false');

    render(
      <WrfThemeProvider>
        <ThemeProbe />
      </WrfThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
  });

  it('prioritizes wrfcoin-theme-mode over legacy darkMode when both exist', () => {
    localStorage.setItem('wrfcoin-theme-mode', 'light');
    localStorage.setItem('darkMode', 'true');

    render(
      <WrfThemeProvider>
        <ThemeProbe />
      </WrfThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
  });

  it('updates both storage keys and body classes when toggled', () => {
    localStorage.setItem('wrfcoin-theme-mode', 'dark');

    render(
      <WrfThemeProvider>
        <ThemeProbe />
      </WrfThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(localStorage.getItem('wrfcoin-theme-mode')).toBe('light');
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);
  });

  it('keeps runtime theme toggle functional when localStorage throws', () => {
    const getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage blocked');
      });
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage blocked');
      });

    render(
      <WrfThemeProvider>
        <ThemeProbe />
      </WrfThemeProvider>,
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.body.classList.contains('light-mode')).toBe(false);
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.body.classList.contains('light-mode')).toBe(true);

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
