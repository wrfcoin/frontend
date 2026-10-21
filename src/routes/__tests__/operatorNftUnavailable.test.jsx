/** @jest-environment jsdom */
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const flags = { demoSurfaces: false, fullStudio: true, publicReadonly: false };
await jest.unstable_mockModule('../../config/features', () => ({ default: flags, FEATURES: flags, isMvpMode: () => false }));
const socket = { isConnected: false, connect: jest.fn(), on: jest.fn(), off: jest.fn() };
await jest.unstable_mockModule('../../utils/computationalWebsocket', () => ({ default: socket, NFT_EXECUTION_EVENTS: { START:'start', COMPLETE:'complete', ERROR:'error', PROGRESS:'progress' } }));
const { default: nftRoutes } = await import('../nftRoutes');
const { default: MPCPrivacyControls } = await import('../../components/ComputationalNFT/MPCPrivacyControls');
const { isPublicTestnetPath } = await import('../../config/contractSurfacePolicy');
const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const json = (status, body) => new Response(JSON.stringify(body), { status, headers:{'content-type':'application/json'} });
beforeEach(() => {
  flags.demoSurfaces = false;
  socket.connect.mockClear(); socket.on.mockClear(); socket.off.mockClear();
  global.fetch = jest.fn(async input => {
    const path = new URL(String(input),'https://fixture.invalid').pathname;
    return path === '/api/nft' ? json(200,{success:true,data:[],pagination:{total:5}}) : json(404,{error:'not mounted'});
  });
  setAuthToken('fake-nft-preview-token');
  jest.spyOn(console,'error').mockImplementation(() => {});
  jest.spyOn(console,'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); clearAuthToken(); jest.restoreAllMocks(); });
async function showRoute(path) {
  await act(async () => { render(<MemoryRouter initialEntries={[path]}><Suspense fallback={<p>Loading route</p>}><Routes>{nftRoutes()}<Route path="/nfts/computational" element={<p>Back destination</p>} /></Routes></Suspense></MemoryRouter>); });
}
const mpcReads = () => global.fetch.mock.calls.filter(([u]) => String(u).includes('/mpc/'));
it('actual NFT paths require operator preview; never-public integrations remain hidden', () => {
  for (const path of ['/nfts/details/:id','/nfts/enhanced']) {
    expect(isPublicTestnetPath(path,true,false,true)).toBe(true);
    expect(isPublicTestnetPath(path,true,false,false)).toBe(false);
  }
  expect(isPublicTestnetPath('/integrations',true,false,true)).toBe(false);
});
it('actual detail route shows unavailable before websocket or unsupported controls', async () => {
  await showRoute('/nfts/details/fixture-id');
  expect(await screen.findByTestId('computational-execution-not-live')).not.toBeNull();
  expect(socket.connect).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByText('Invalid NFT identifier.')).toBeNull();
  expect(screen.getByRole('button',{name:'Back to NFT List'})).not.toBeNull();
});
it('actual detail route labels the preserved body in explicit demo mode', async () => {
  flags.demoSurfaces=true; await showRoute('/nfts/details/fixture-id');
  expect(await screen.findByTestId('computational-execution-sample-badge')).not.toBeNull();
  expect(screen.queryByTestId('computational-execution-not-live')).toBeNull();
  expect(socket.connect).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Invalid NFT identifier.')).not.toBeNull();
});
it('actual enhanced parent Privacy tab is unavailable and retains served NFT count', async () => {
  await showRoute('/nfts/enhanced');
  expect(await screen.findByTestId('nft-header-total')).not.toBeNull();
  fireEvent.click(screen.getByRole('tab',{name:'Privacy'}));
  expect(await screen.findByTestId('mpc-privacy-not-live')).not.toBeNull();
  expect(screen.getByTestId('nft-header-total').textContent).toBe('5Minted NFTs');
  expect(mpcReads()).toHaveLength(0);
  expect(screen.queryByText('Connection Issues')).toBeNull();
  expect(screen.queryByText('Standard Privacy')).toBeNull();
});
it('actual enhanced parent labels the explicit demo Privacy tab', async () => {
  flags.demoSurfaces=true; await showRoute('/nfts/enhanced');
  fireEvent.click(screen.getByRole('tab',{name:'Privacy'}));
  expect(await screen.findByTestId('mpc-privacy-sample-badge')).not.toBeNull();
  expect(screen.queryByTestId('mpc-privacy-not-live')).toBeNull();
  expect(mpcReads()).toHaveLength(2);
});
it.each([false,true])('direct MPC leaf has its own boundary demo=%s', async enabled => {
  flags.demoSurfaces=enabled;
  await act(async () => { render(<MPCPrivacyControls nftId="fixture-id" />); });
  expect(await screen.findByTestId(`mpc-privacy-${enabled?'sample-badge':'not-live'}`)).not.toBeNull();
  expect(mpcReads()).toHaveLength(enabled?2:0);
});
