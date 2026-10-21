/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
await jest.unstable_mockModule('../../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: {on(){},off(){},getAvailableProviders(){return [];},connect:async()=>null,disconnect:async()=>{}} }));
const { default: GlobalLeaderboard } = await import('../GlobalLeaderboard');
const json = (status, body) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const row = name => ({displayName:name,address:'fixture-public-address',stations:2,earnings:123,quality:90,consistency:4,riseScore:1});
let response;
beforeEach(() => {
  response=async()=>json(404,{error:'not mounted'});
  global.fetch=jest.fn((input,init)=>response(String(input),init));
});
afterEach(() => { cleanup(); });
function noSummary() {
  expect(screen.queryByText('WRF Distributed')).toBeNull();
  expect(screen.queryByText('Total Contributors')).toBeNull();
  expect(screen.queryByText(/Rankings update every/)).toBeNull();
}
it('actual ApiClient404 fallbacks show unavailable without zero summaries or freshness',async()=>{
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  noSummary();
  expect(global.fetch.mock.calls.map(([u])=>u)).toEqual(['/api/leaderboard/contributors?period=30d','/api/weather/leaderboard?metric=earnings&period=30d&limit=30']);
});
it('pending HTTP read reports loading without inferred zero values',async()=>{
  response=()=>new Promise(()=>{});render(<GlobalLeaderboard />);
  expect(await screen.findByText('Loading leaderboard…')).not.toBeNull();noSummary();
});
it('a successful empty HTTP list may report real zero totals',async()=>{
  response=async()=>json(200,{contributors:[]});render(<GlobalLeaderboard />);
  expect(await screen.findByText('Total Contributors')).not.toBeNull();
  expect(screen.getByText('WRF Distributed')).not.toBeNull();
  expect(screen.queryByText('Not live on the testnet yet')).toBeNull();
});
it('successful populated response retains the real contributor and reward value',async()=>{
  response=async()=>json(200,{contributors:[row('Fixture Alice')]});render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Alice')).not.toBeNull();expect(screen.getByText('123 WRF')).not.toBeNull();
});
it('real ApiClient fallback can recover from the unmounted first endpoint',async()=>{
  response=async url=>url.includes('/leaderboard/contributors')?json(404,{error:'not mounted'}):json(200,{entries:[row('Fixture Bob')]});
  render(<GlobalLeaderboard />);expect(await screen.findByText('Fixture Bob')).not.toBeNull();expect(global.fetch).toHaveBeenCalledTimes(2);
});
it.each([null,{}, {contributors:'not-an-array'}])('malformed successful body %j is unavailable',async body=>{
  response=async()=>json(200,body);render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();noSummary();
});
it('Retry can recover from actual failed reads to a successful empty list',async()=>{
  render(<GlobalLeaderboard />);expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  response=async()=>json(200,{contributors:[]});fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  expect(await screen.findByText('Total Contributors')).not.toBeNull();expect(screen.queryByText('Not live on the testnet yet')).toBeNull();
});
it('a new period clears the prior summary while its next response is pending',async()=>{
  response=async()=>json(200,{contributors:[row('Fixture Alice')]});render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Alice')).not.toBeNull();
  let release;
  response=()=>new Promise(r=>{release=()=>r(json(200,{contributors:[row('Fixture Bob')]}));});
  fireEvent.click(screen.getByRole('button',{name:'7d'}));
  expect(await screen.findByText('Loading leaderboard…')).not.toBeNull();noSummary();expect(screen.queryByText('Fixture Alice')).toBeNull();
  await waitFor(()=>expect(release).toBeDefined());await act(async()=>{release();});
  expect(await screen.findByText('Fixture Bob')).not.toBeNull();
});

it('current backend weather metric-only payload cannot imply reward totals',async()=>{
  response=async url=>url.includes('/leaderboard/contributors')?json(404,{error:'not mounted'}):json(200,{success:true,metric:'submissions',period:'30d',entries:[{rank:1,walletAddress:'short-address',profileKey:'fixture-key',isYou:false,displayName:'Fixture Weather',value:90,badgeLevel:'silver',streak:null,country:null,city:null}]});
  render(<GlobalLeaderboard />);expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();noSummary();
});
it.each([null,'', 'Infinity'])('missing or invalid reward metric %j cannot become zero',async earnings=>{
  response=async()=>json(200,{contributors:[{...row('Fixture Alice'),earnings}]});render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();noSummary();
});
