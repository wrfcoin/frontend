import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { jest } from '@jest/globals';

globalThis.__VITE_ENV__ = { VITE_ENABLE_FULL_STUDIO: 'true', VITE_ENABLE_OPERATOR_PREVIEW: 'true' };
await jest.unstable_mockModule('../../../config/features', () => ({ default: new Proxy({}, { get: () => true }) }));
await jest.unstable_mockModule('../../../services/websocketService', () => ({ getWebSocketClient: () => ({ on: () => () => {}, subscribe: () => () => {} }) }));
await jest.unstable_mockModule('../../Search/SearchBar', () => ({ default: () => null }));
const { default: StartMenu } = await import('../StartMenu');
const { default: usePageNavigation } = await import('../../../hooks/usePageNavigation');
afterEach(cleanup);

it.each([false, true])('start menu and sequential navigation follow capability availability=%s', enabled => {
  const predicate = () => enabled;
  function NavProbe() {
    const nav = usePageNavigation(predicate);
    return <output data-testid="next">{nav.nextPage.path}</output>;
  }
  const { container } = render(<MemoryRouter initialEntries={['/map']}><StartMenu isFeatureEnabled={predicate} /><NavProbe /></MemoryRouter>);
  fireEvent.click(container.querySelector('.start-button'));
  for (const name of ['Identity', 'Leaderboard']) {
    expect(Boolean(screen.queryByTestId(`start-menu-item-${name}`))).toBe(enabled);
  }
  expect(screen.getByTestId('start-menu-item-Settings')).toBeTruthy();
  fireEvent.click(screen.getByTestId('start-menu-item-Settings'));
  expect(Boolean(screen.queryByText('Notifications'))).toBe(enabled);
  fireEvent.click(screen.getByTestId('start-menu-item-Weather Hub'));
  expect(Boolean(screen.queryByText('Fleet Management'))).toBe(enabled);
  expect(screen.getByTestId('next').textContent).toBe(enabled ? '/identity' : '/explorer');
});
