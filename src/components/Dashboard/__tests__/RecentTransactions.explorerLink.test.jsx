import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';

// The hash link must come from the shared helper (config/network.ts), never from the raw build value:
// VITE_EXPLORER_URL=self is not a URL prefix, and a raw read built "self/tx/<hash>".
const explorerTxUrl = jest.fn();
jest.unstable_mockModule('../../../config/network', () => ({ explorerTxUrl }));
const { TransactionHash } = await import('../RecentTransactions');

const HASH = '0x' + 'ab'.repeat(32);

describe('RecentTransactions hash link', () => {
  beforeEach(() => explorerTxUrl.mockReset());

  it('links to what the helper returns ("self" -> /explore/tx/<hash>)', () => {
    explorerTxUrl.mockReturnValue(`/explore/tx/${HASH}`);
    render(<TransactionHash hash={HASH} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', `/explore/tx/${HASH}`);
    expect(explorerTxUrl).toHaveBeenCalledWith(HASH);
  });

  it('shows plain text when no explorer is configured', () => {
    explorerTxUrl.mockReturnValue(null);
    render(<TransactionHash hash={HASH} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(HASH)).toBeInTheDocument();
  });
});
