/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
await jest.unstable_mockModule('../../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: {on(){},off(){},getAvailableProviders(){return [];},connect:async()=>null,disconnect:async()=>{}} }));
const { default: JobQueue } = await import('../JobQueue');
const json = (status, body) => new Response(JSON.stringify(body), {status,headers:{'content-type':'application/json'}});
const job = extra => ({id:'JOB-4821',type:'Fixture task',submitter:'fixture-public-key',model:'Fixture model',status:'running',priority:'standard',progress:25,eta:'Pending',costWrf:7,gpu:1,cpu:2,submitted:'2026-01-01',...extra});
let response;
beforeEach(() => {
  response=async()=>json(200,{jobs:[job()]});
  global.fetch=jest.fn((input,init)=>response(String(input),init));
});
afterEach(cleanup);
async function expand() {
  const label=await screen.findByText('JOB-4821');fireEvent.click(label);
}
function noSyntheticLogs() {
  expect(screen.queryByText(/Epoch 34\/50|Throughput: 847|Checkpoint saved|Resources: .*requested|waiting in queue - position/)).toBeNull();
}
it('real HTTP jobs with missing logs show unavailable, never the matching sample corpus',async()=>{
  render(<JobQueue />);await expand();
  expect(screen.getByText('Logs unavailable.')).not.toBeNull();noSyntheticLogs();
  expect(screen.getByText('Resource utilization unavailable.')).not.toBeNull();
  expect(global.fetch.mock.calls.map(([u])=>u)).toEqual(['/api/compute/jobs']);
});
it('an unknown real job cannot manufacture timestamped queue events',async()=>{
  response=async()=>json(200,{jobs:[job({id:'REAL-QUEUE-9',status:'queued'})]});
  render(<JobQueue />);fireEvent.click(await screen.findByText('REAL-QUEUE-9'));
  expect(screen.getByText('Logs unavailable.')).not.toBeNull();noSyntheticLogs();
});
it('actual supplied log text is rendered without sample events',async()=>{
  response=async()=>json(200,{jobs:[job({logs:['Fixture worker admitted task','Fixture execution completed']})]});
  render(<JobQueue />);await expand();
  expect(screen.getByText('Fixture worker admitted task')).not.toBeNull();noSyntheticLogs();
  expect(screen.queryByText('Logs unavailable.')).toBeNull();
});
it('a supplied empty log list is distinct from unavailable logs',async()=>{
  response=async()=>json(200,{jobs:[job({logs:[]})]});render(<JobQueue />);await expand();
  expect(screen.getByText('No logs yet.')).not.toBeNull();noSyntheticLogs();
});
it.each([null,'sample',[{}]])('malformed logs %j show unavailable',async logs=>{
  response=async()=>json(200,{jobs:[job({logs})]});render(<JobQueue />);await expand();
  expect(screen.getByText('Logs unavailable.')).not.toBeNull();noSyntheticLogs();
});
it('an actual failed job read cannot turn into a successful empty queue',async()=>{
  response=async()=>json(404,{error:'not mounted'});render(<JobQueue />);
  expect(await screen.findByText('Jobs unavailable.')).not.toBeNull();
  expect(screen.queryByText(/Showing 0 of 0 jobs|Total cost: 0/)).toBeNull();
});
it('pending job reads cannot render inferred zero counts',async()=>{
  response=()=>new Promise(()=>{});render(<JobQueue />);
  expect(await screen.findByText('Loading jobs…')).not.toBeNull();
  expect(screen.queryByText(/Showing 0 of 0 jobs/)).toBeNull();
});
it('actual empty HTTP queue is labelled as empty',async()=>{
  response=async()=>json(200,{jobs:[]});render(<JobQueue />);
  expect(await screen.findByText('No jobs.')).not.toBeNull();
  expect(screen.getByText('Showing 0 of 0 jobs')).not.toBeNull();
});
it.each([null,{}, {jobs:'bad'}])('malformed successful job response %j is unavailable',async body=>{
  response=async()=>json(200,body);render(<JobQueue />);
  expect(await screen.findByText('Jobs unavailable.')).not.toBeNull();
  expect(screen.queryByText('Showing 0 of 0 jobs')).toBeNull();
});

it('Retry recovers a refused read to an actual empty queue',async()=>{
  response=async()=>json(404,{error:'not mounted'});render(<JobQueue />);
  expect(await screen.findByText('Jobs unavailable.')).not.toBeNull();
  response=async()=>json(200,{jobs:[]});fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  expect(await screen.findByText('No jobs.')).not.toBeNull();
});
it.each([null,job({id:''}),job({costWrf:null}),job({progress:'25'})])('incomplete job row %j cannot produce metrics',async row=>{
  response=async()=>json(200,{jobs:[row]});render(<JobQueue />);
  expect(await screen.findByText('Jobs unavailable.')).not.toBeNull();
  expect(screen.queryByText(/Total cost:/)).toBeNull();
});
