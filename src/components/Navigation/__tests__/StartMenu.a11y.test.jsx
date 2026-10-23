import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../../services/websocketService', () => ({ getWebSocketClient: () => ({ on: () => () => {}, subscribe: () => () => {} }) }));
await jest.unstable_mockModule('../../Search/SearchBar', () => ({ default: () => null }));
const { default: StartMenu } = await import('../StartMenu');
afterEach(cleanup);

// axe baseline 2026-10-23: the Start control was a <div onClick>, unreachable from the keyboard, and the
// taskbar sat outside every landmark.
it('Start is a real button that reports whether the menu is open, inside a labelled taskbar landmark', () => {
  render(<MemoryRouter initialEntries={['/map']}><StartMenu isFeatureEnabled={() => false} /></MemoryRouter>);
  const taskbar = screen.getByRole('navigation', { name: 'Taskbar' });
  const start = screen.getByRole('button', { name: 'Start' });
  expect(taskbar.contains(start)).toBe(true);
  expect(start.tagName).toBe('BUTTON');
  expect(start).toHaveAttribute('type', 'button');
  expect(start).toHaveAttribute('aria-expanded', 'false');
  expect(start).toHaveAttribute('aria-haspopup', 'true');
  fireEvent.click(start);
  expect(start).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getAllByTestId(/^start-menu-item-/).length).toBeGreaterThan(0);
  fireEvent.click(start);
  expect(start).toHaveAttribute('aria-expanded', 'false');
});
