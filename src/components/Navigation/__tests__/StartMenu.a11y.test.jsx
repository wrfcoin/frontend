import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../../services/websocketService', () => ({ getWebSocketClient: () => ({ on: () => () => {}, subscribe: () => () => {} }) }));
await jest.unstable_mockModule('../../Search/SearchBar', () => ({ default: () => null }));
const { default: StartMenu } = await import('../StartMenu');
afterEach(cleanup);

const mount = () => render(<MemoryRouter initialEntries={['/map']}><StartMenu isFeatureEnabled={() => false} /></MemoryRouter>);
const menuItems = () => screen.queryAllByTestId(/^start-menu-item-/);

// axe baseline 2026-10-23: the Start control was a <div onClick>, unreachable from the keyboard, and the
// taskbar sat outside every landmark.
it('Start is a real button that reports whether the menu is open, inside a labelled taskbar landmark', () => {
  mount();
  const taskbar = screen.getByRole('navigation', { name: 'Taskbar' });
  const start = screen.getByRole('button', { name: 'Start' });
  expect(taskbar.contains(start)).toBe(true);
  expect(start.tagName).toBe('BUTTON');
  expect(start).toHaveAttribute('type', 'button');
  expect(start).toHaveAttribute('aria-expanded', 'false');
  expect(start).toHaveAttribute('aria-haspopup', 'true');
  fireEvent.click(start);
  expect(start).toHaveAttribute('aria-expanded', 'true');
  expect(menuItems().length).toBeGreaterThan(0);
  fireEvent.click(start);
  expect(start).toHaveAttribute('aria-expanded', 'false');
});

// user-event activates a focused native button on Enter and Space the way a browser does.
it.each([['Enter', '{Enter}'], ['Space', ' ']])('the keyboard opens the menu with %s after tabbing to Start', async (_name, key) => {
  const user = userEvent.setup();
  mount();
  const start = screen.getByRole('button', { name: 'Start' });
  await user.tab();
  expect(start).toHaveFocus();
  await user.keyboard(key);
  expect(start).toHaveAttribute('aria-expanded', 'true');
  expect(menuItems().length).toBeGreaterThan(0);
});

it('Escape closes the menu and keeps focus on Start', async () => {
  const user = userEvent.setup();
  mount();
  const start = screen.getByRole('button', { name: 'Start' });
  await user.tab();
  await user.keyboard('{Enter}');
  expect(start).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Escape}');
  expect(start).toHaveAttribute('aria-expanded', 'false');
  expect(menuItems()).toHaveLength(0);
  expect(start).toHaveFocus();
});

it('Escape from a focused menu item closes the menu and returns focus to Start', async () => {
  const user = userEvent.setup();
  mount();
  const start = screen.getByRole('button', { name: 'Start' });
  await user.click(start);
  const first = menuItems()[0];
  first.focus();
  expect(first).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(start).toHaveAttribute('aria-expanded', 'false');
  expect(menuItems()).toHaveLength(0);
  expect(start).toHaveFocus();
});

it('Escape does nothing while the menu is closed', async () => {
  const user = userEvent.setup();
  mount();
  const start = screen.getByRole('button', { name: 'Start' });
  await user.keyboard('{Escape}');
  expect(start).toHaveAttribute('aria-expanded', 'false');
  expect(start).not.toHaveFocus();
});
