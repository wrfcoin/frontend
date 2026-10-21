/** @jest-environment jsdom */
import React from 'react';
import {jest} from '@jest/globals';
import {act,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
for(const name of ['ApiKeyManager','UsageAnalytics','ApiDocumentation','SDKDownloads','RealTimeApiDashboard'])await jest.unstable_mockModule(`../../components/developer/${name}`,()=>({default:()=>null}));
const {default:DeveloperPortal}=await import('../DeveloperPortal');
it('renders honest compute availability without a fiat purchase control',async()=>{
  const open=jest.spyOn(window,'open').mockImplementation(()=>null);
  let view;await act(async()=>{view=render(<MemoryRouter><DeveloperPortal/></MemoryRouter>);});
  expect(screen.getByText('Compute Credits')).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/Purchase WRF|Buy WRF|Post-testnet/);
  expect(screen.getByText(/WRF cannot be purchased with fiat/)).toBeTruthy();
  expect(view.container.innerHTML).not.toMatch(/ramp\.network|userAddress=/);expect(open).not.toHaveBeenCalled();open.mockRestore();
});
