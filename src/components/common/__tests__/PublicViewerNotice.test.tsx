/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicViewerNotice from '../PublicViewerNotice';

describe('PublicViewerNotice', () => {
  it('defaults to the wallet-scoped copy', () => {
    render(<PublicViewerNotice />);
    expect(screen.getByText('This view is live on the testnet')).toBeInTheDocument();
    expect(screen.getByText('Sign in with a wallet to see it.')).toBeInTheDocument();
  });

  it('uses the not-live copy when the reason is a missing data source, not auth', () => {
    render(<PublicViewerNotice reason="not-live" />);
    expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    expect(
      screen.getByText('This view will populate once its data source is connected.'),
    ).toBeInTheDocument();
  });

  it('never renders a numeric placeholder in place of real data', () => {
    render(<PublicViewerNotice reason="not-live" />);
    expect(screen.queryByText(/^\$?\d/)).not.toBeInTheDocument();
  });
});
