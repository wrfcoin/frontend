import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicPolicyPage from '../PublicPolicyPage';

const renderPath = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <PublicPolicyPage />
  </MemoryRouter>,
);

describe('PublicPolicyPage', () => {
  it.each([
    ['/terms', 'Testnet Terms of Use'],
    ['/privacy', 'Testnet Privacy Notice'],
    ['/api-terms', 'Public API Terms'],
    ['/security', 'Security & Vulnerability Disclosure'],
  ])('renders the direct public route %s', (path, heading) => {
    renderPath(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Public policies' })).toBeInTheDocument();
  });

  it('warns users never to submit wallet secrets', () => {
    renderPath('/terms');
    expect(screen.getByText(/Never submit an existing seed phrase, private key/i)).toBeInTheDocument();
  });

  it('does not direct vulnerability details into a public issue', () => {
    renderPath('/security');
    expect(screen.getByText(/Do not include exploit details/i)).toBeInTheDocument();
    const reportLink = screen.getByRole('link', { name: /email the security team privately/i });
    expect(reportLink).toHaveAttribute('href', 'mailto:security@wrfcoin.com');
    // The disclosure channel must be private — never a public issue tracker.
    expect(reportLink.getAttribute('href')).not.toMatch(/github\.com|issues/i);
  });
});
