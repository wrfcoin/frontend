/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import axios from 'axios';
import NASStoragePage from '../NASStoragePage';
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
it('the absent NAS APIs cannot show earnings, collector status or device controls', async () => {
  const read = jest.spyOn(axios, 'get').mockRejectedValue(new Error('404: NAS unavailable'));
  const write = jest.spyOn(axios, 'post').mockRejectedValue(new Error('404: NAS unavailable'));
  render(<NASStoragePage />);
  expect(await screen.findByText('NAS storage is unavailable')).toBeInTheDocument();
  expect(screen.getByText(/NAS storage API is not served/)).toBeInTheDocument();
  expect(screen.queryByText(/Total Earnings|Monthly Earnings|Auto-Collector|Earning Potential/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
