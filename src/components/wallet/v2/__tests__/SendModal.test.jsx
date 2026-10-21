/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

const featuresMock = { walletSend: true };

await jest.unstable_mockModule('../../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

await jest.unstable_mockModule('../../../DesignSystem', () => ({
  WrfButton: ({ children, disabled, href, onClick, target, rel }) => {
    if (href) {
      return (
        <a href={href} target={target} rel={rel}>
          {children}
        </a>
      );
    }

    return (
      <button type="button" disabled={disabled} onClick={onClick}>
        {children}
      </button>
    );
  },
}));

await jest.unstable_mockModule('../SendModal.css', () => ({}));

const { default: SendModal } = await import('../SendModal.jsx');

describe('SendModal launch wallet send flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['0x465230af3383c16d024c5f4b87ed2d1b595be148', 'wrf465230af3383c16d024c5f4b87ed2d1b595be148'])('never offers ordinary Send to the known legacy recipient %s', recipient => {
    const send = jest.fn();
    render(<SendModal onClose={jest.fn()} activeProvider="custom" receiveOnly={false}
      senderAddress={'0x' + '1'.repeat(40)} sendWalletTransaction={send} />);
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.change(screen.getByPlaceholderText('0x… or wrf…'), { target: { value: recipient } });
    expect(screen.getByRole('alert')).toHaveTextContent('Ordinary Send is blocked');
    expect(screen.getByRole('button', { name: /Review/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Confirm & Send/i })).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it('opens without an injected API method after the legacy method is removed', () => {
    render(
      <SendModal
        onClose={jest.fn()}
        activeProvider="custom"
        receiveOnly={false}
        senderAddress="0x1111111111111111111111111111111111111111"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('submits through the wallet API boundary and renders the backend transaction hash', async () => {
    const sendWalletTransaction = jest.fn().mockResolvedValue({
      txHash: '0xrealbackendhash123',
      status: 'pending',
    });

    const senderAddress = '0x1111111111111111111111111111111111111111';
    const recipientAddress = '0x2222222222222222222222222222222222222222';

    render(
      <SendModal
        onClose={jest.fn()}
        activeProvider="custom"
        receiveOnly={false}
        senderAddress={senderAddress}
        sendWalletTransaction={sendWalletTransaction}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '12.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    fireEvent.change(screen.getByPlaceholderText('0x… or wrf…'), {
      target: { value: recipientAddress },
    });
    fireEvent.click(screen.getByRole('button', { name: /Review/i }));

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Send/i }));

    await waitFor(() => {
      expect(sendWalletTransaction).toHaveBeenCalledWith({
        from: senderAddress,
        to: recipientAddress,
        amount: '12.5',
      });
    });

    expect(
      await screen.findByText('0xrealbackendhash123'),
    ).toBeInTheDocument();
  });

  it('normalizes wrf… sender and recipient to 0x… before hitting the backend', async () => {
    const sendWalletTransaction = jest.fn().mockResolvedValue({
      txHash: '0xhashfromwrfpath',
      status: 'pending',
    });

    // Custom "Wrfcoin Wallet" accounts surface the same 40 hex bytes under a
    // `wrf` prefix. Same hex as the 0x test above so the expected normalized
    // output is identical.
    const wrfSender = 'wrf1111111111111111111111111111111111111111';
    const wrfRecipient = 'wrf2222222222222222222222222222222222222222';

    render(
      <SendModal
        onClose={jest.fn()}
        activeProvider="custom"
        receiveOnly={false}
        senderAddress={wrfSender}
        sendWalletTransaction={sendWalletTransaction}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '7.25' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // A wrf… recipient must satisfy the recipient validator and reach Review.
    fireEvent.change(screen.getByPlaceholderText('0x… or wrf…'), {
      target: { value: wrfRecipient },
    });
    fireEvent.click(screen.getByRole('button', { name: /Review/i }));

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Send/i }));

    await waitFor(() => {
      expect(sendWalletTransaction).toHaveBeenCalledWith({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '7.25',
      });
    });

    expect(
      await screen.findByText('0xhashfromwrfpath'),
    ).toBeInTheDocument();
  });
});
