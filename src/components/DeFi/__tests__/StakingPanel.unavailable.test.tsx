/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
const get = jest.fn<(...args: any[]) => Promise<any>>();
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
// jsdom has no canvas; the actual staking read/state boundary is retained.
jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null }));
const { default: StakingPanel } = await import('../StakingPanel');
const summary = { totalStaked: 42, totalStakedUsd: 420, totalRewards: 7, totalRewardsUsd: 70, avgApy: 3, stWrfBalance: 10, stWrfExchangeRate: 1.1 };
afterEach(() => { cleanup(); get.mockReset(); });
it.each(['all', 'positions', 'history'])('failed required staking reads (%s) cannot show zero or partial figures', async mode => {
  get.mockImplementation(async (path: string) => {
    if (mode === 'all' || (mode === 'positions' && path.includes('/positions')) || (mode === 'history' && path.includes('history'))) throw new Error('404: staking unavailable');
    return path.endsWith('/summary') ? summary : [];
  });
  render(<StakingPanel />);
  expect(await screen.findByText('Staking data is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Total Staked')).not.toBeInTheDocument();
  expect(screen.queryByText('Average APY')).not.toBeInTheDocument();
  expect(screen.queryByText('stWRF Exchange Rate History')).not.toBeInTheDocument();
});
it('a complete served response displays real summary values', async () => {
  get.mockImplementation(async (path: string) => path.endsWith('/summary') ? summary : []);
  render(<StakingPanel />);
  expect(await screen.findByText('42 WRF')).toBeInTheDocument();
  expect(screen.getByText('Total Staked')).toBeInTheDocument();
  expect(screen.queryByText('Staking data is unavailable')).not.toBeInTheDocument();
});

it.each([null, {}, { ...summary, avgApy: undefined }, { ...summary, totalStaked: NaN }])('an incomplete summary cannot manufacture a zero metric', async badSummary => {
  get.mockImplementation(async (path: string) => path.endsWith('/summary') ? badSummary : []);
  render(<StakingPanel />);
  expect(await screen.findByText('Staking data is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Total Staked')).not.toBeInTheDocument();
});

it('a transient read failure can retry to complete served data', async () => {
  get.mockRejectedValue(new Error('503: temporarily unavailable'));
  render(<StakingPanel />);
  expect(await screen.findByText('Staking data is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Total Staked')).not.toBeInTheDocument();
  const retry = screen.getByRole('button', { name: 'Retry' });
  get.mockImplementation(async (path: string) => path.endsWith('/summary') ? summary : []);
  fireEvent.click(retry);
  expect(screen.queryByText('Total Staked')).not.toBeInTheDocument();
  expect(await screen.findByText('42 WRF')).toBeInTheDocument();
  expect(screen.queryByText('Staking data is unavailable')).not.toBeInTheDocument();
});
