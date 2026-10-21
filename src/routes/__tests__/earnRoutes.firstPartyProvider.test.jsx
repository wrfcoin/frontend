/**
 * @jest-environment jsdom
 */
// W28: /earn and /connect-station render inside the ACTIVE first-party wallet provider (frontend#457). The public
// build's app-wide provider is passive, so without this wrapper the page could never see the visitor's
// signed-in wallet and would only ever send them to wallet setup.
import React from 'react';
import earnRoutes from '../earnRoutes.jsx';
import FirstPartyWalletProvider from '../../components/wallet/FirstPartyWalletProvider';

function findType(node, type) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === type) return true;
  const children = React.Children.toArray(node.props?.children);
  return children.some(child => findType(child, type));
}

describe('earnRoutes (W28)', () => {
  const routes = React.Children.toArray(earnRoutes().props.children);

  it('mounts exactly /earn and /connect-station', () => {
    expect(routes.map(route => route.props.path).sort()).toEqual(['/connect-station', '/earn']);
  });

  it.each(['/earn', '/connect-station'])('%s renders inside FirstPartyWalletProvider', path => {
    const route = routes.find(r => r.props.path === path);
    expect(findType(route.props.element, FirstPartyWalletProvider)).toBe(true);
  });
});
