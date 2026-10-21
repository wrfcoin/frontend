/** @jest-environment jsdom */
import React, {Suspense} from 'react';
import {jest} from '@jest/globals';
import {act,render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const flags={demoSurfaces:false};
const features=new Proxy(flags,{get:(t,p)=>p in t?t[p]:true});
await jest.unstable_mockModule('../../config/features',()=>({default:features,FEATURES:features,isMvpMode:()=>false}));
const {default:communityRoutes}=await import('../communityRoutes');
const {default:NearbyStations}=await import('../../components/Leaderboard/NearbyStations');
const {default:CooperativeHub}=await import('../../components/Leaderboard/CooperativeHub');
const {default:NotificationCenter}=await import('../../components/Notifications/NotificationCenter');
function routes(node,out=new Map()) {if(!React.isValidElement(node))return out;if(node.props.path)out.set(node.props.path,node.props.element);React.Children.forEach(node.props.children,n=>routes(n,out));return out;}
beforeEach(()=>{global.fetch=jest.fn(async()=>({ok:true,json:async()=>({stations:[]})}));jest.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{cleanup();flags.demoSurfaces=false;jest.restoreAllMocks();});
const leaves=[['nearby-stations',NearbyStations],['cooperative-hub',CooperativeHub],['notification-center',NotificationCenter]];
for(const enabled of [false,true])describe(`operator preview on, demoSurfaces=${enabled}`,()=>{
  it.each(leaves)('%s gates direct rendering',async(id,Component)=>{
    flags.demoSurfaces=enabled;await act(async()=>{render(<MemoryRouter><Component/></MemoryRouter>);});
    expect(await screen.findByTestId(`${id}-${enabled?'sample-badge':'not-live'}`)).toBeTruthy();
    if(!enabled)expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([['/leaderboard/nearby','nearby-stations'],['/leaderboard/cooperatives','cooperative-hub']])('%s traverses the real route',async(path,id)=>{
    flags.demoSurfaces=enabled;const tree=routes(communityRoutes({ isFeatureEnabled: () => true }));expect(tree.has('/leaderboard')).toBe(true);expect(tree.has(path)).toBe(true);
    await act(async()=>{render(<MemoryRouter><Suspense fallback={null}>{tree.get(path)}</Suspense></MemoryRouter>);});
    expect(await screen.findByTestId(`${id}-${enabled?'sample-badge':'not-live'}`)).toBeTruthy();
    if(!enabled)expect(global.fetch).not.toHaveBeenCalled();
  });
});
it('station of the day remains off operator preview without demos',()=>{expect(routes(communityRoutes({ isFeatureEnabled: () => true })).has('/leaderboard/station-of-the-day')).toBe(false);flags.demoSurfaces=true;expect(routes(communityRoutes({ isFeatureEnabled: () => true })).has('/leaderboard/station-of-the-day')).toBe(true);});
// frontend#427 review P2-1: the App-shell mount uses the compact `shell`
// variant. It must never render the in-flow not-live card or sample strip.
describe('NotificationCenter shell variant', () => {
  it('demoSurfaces off: renders nothing at all',async()=>{
    flags.demoSurfaces=false;let view;await act(async()=>{view=render(<MemoryRouter><NotificationCenter shell/></MemoryRouter>);});
    expect(view.container.innerHTML).toBe('');
    expect(screen.queryByTestId('notification-center-not-live')).toBeNull();
  });
  it('demoSurfaces on: labels the fixed bell without an in-flow sample strip',async()=>{
    flags.demoSurfaces=true;await act(async()=>{render(<MemoryRouter><NotificationCenter shell/></MemoryRouter>);});
    const badge=await screen.findByTestId('notification-center-sample-badge');
    expect(badge.closest('[data-testid="notification-center-shell"]')).not.toBeNull();
    expect(screen.queryByTestId('notification-center-sample')).toBeNull();
    expect(screen.queryByTestId('notification-center-not-live')).toBeNull();
  });
});
