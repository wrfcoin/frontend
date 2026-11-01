/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import React from 'react';

jest.unstable_mockModule('../../config/features', () => {
  const flags = new Proxy({}, { get: () => false });
  return { default: flags, FEATURES: flags };
});

const { default: platformRoutes } = await import('../platformRoutes');

const publicPolicyPaths = ['/terms', '/privacy', '/api-terms', '/security'];

function collectRoutePaths(node, paths = []) {
  if (!React.isValidElement(node)) return paths;
  if (typeof node.props.path === 'string') paths.push(node.props.path);
  React.Children.forEach(node.props.children, child => collectRoutePaths(child, paths));
  return paths;
}

describe('public policy surfaces', () => {
  it('keeps every public policy route unconditional and directly reachable', () => {
    const paths = collectRoutePaths(platformRoutes());
    expect(paths).toContain('/resources');
    expect(paths).toEqual(expect.arrayContaining(publicPolicyPaths));
  });

  it('ships an RFC 9116 discovery file with current required fields', () => {
    const securityTxt = readFileSync('public/.well-known/security.txt', 'utf8');
    // RFC 9116 Contact must be a private channel, never a public issue tracker.
    expect(securityTxt).toContain('Contact: mailto:security@wrfcoin.com');
    expect(securityTxt).not.toMatch(/Contact:.*(github\.com|issues)/i);
    expect(securityTxt).toContain('Expires: 2027-08-01T00:00:00Z');
    expect(securityTxt).toContain(
      'Canonical: https://wrfcoin.com/.well-known/security.txt',
    );
    expect(securityTxt).toContain(
      'Policy: https://wrfcoin.com/security',
    );
  });
});
