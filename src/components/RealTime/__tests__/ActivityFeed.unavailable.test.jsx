/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

const get = jest.fn(async () => { throw new Error('HTTP 404'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
const { default: ActivityFeed } = await import('../ActivityFeed');
afterEach(() => { cleanup(); get.mockClear(); });
it('reports an unmounted activity API without claiming an empty feed or polling', () => {
  render(<ActivityFeed />);
  expect(screen.getByText('Activity feed is unavailable')).toBeInTheDocument();
  expect(screen.getByText(/activity API is not served/)).toBeInTheDocument();
  expect(screen.queryByText(/No activities/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Pause|Play|Load more/i })).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
