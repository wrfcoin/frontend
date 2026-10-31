/**
 * @jest-environment jsdom
 *
 * The 12 words are a cold backup: shown again only behind a warning, a typed confirmation and the browser
 * password, and hidden again on their own.
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const address = '0x' + 'a'.repeat(40);
const words = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
let vault: { address: string } | null;
const unlockVault = jest.fn<(password: string) => Promise<{ mnemonic: string; address: string }>>();
await jest.unstable_mockModule('../../../services/walletVault', () => ({
  readVault: () => vault,
  unlockVault: (password: string) => unlockVault(password),
}));
const { default: RecoveryPhraseBackup, REVEAL_CONFIRM_TEXT, REVEAL_SECONDS, REVEAL_WARNINGS } = await import('../RecoveryPhraseBackup');

beforeEach(() => {
  vault = { address };
  unlockVault.mockReset();
  unlockVault.mockImplementation(async (password: string) => {
    if (password !== 'correct horse') throw new Error('Wrong password');
    return { mnemonic: words, address };
  });
});
afterEach(() => { cleanup(); jest.useRealTimers(); });

const open = () => {
  render(<RecoveryPhraseBackup address={address} />);
  fireEvent.click(screen.getByTestId('phrase-backup-open'));
};
const passWarning = () => {
  fireEvent.click(screen.getByTestId('phrase-reveal-alone'));
  fireEvent.change(screen.getByTestId('phrase-reveal-typed'), { target: { value: REVEAL_CONFIRM_TEXT.toUpperCase() } });
  fireEvent.click(screen.getByTestId('phrase-reveal-continue'));
};

describe('RecoveryPhraseBackup', () => {
  it('warns first: anyone with the words can take everything, and WRFCoin never asks for them', () => {
    open();
    const warning = screen.getByTestId('phrase-reveal-warning');
    for (const w of REVEAL_WARNINGS) expect(warning).toHaveTextContent(w);
    expect(screen.queryByRole('list', { name: 'Recovery words' })).toBeNull();
  });

  it('Continue stays off until the box is ticked AND the exact words are typed', () => {
    open();
    const next = screen.getByTestId('phrase-reveal-continue');
    expect(next).toBeDisabled();
    fireEvent.change(screen.getByTestId('phrase-reveal-typed'), { target: { value: REVEAL_CONFIRM_TEXT } });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByTestId('phrase-reveal-alone'));
    expect(next).toBeEnabled();
    fireEvent.change(screen.getByTestId('phrase-reveal-typed'), { target: { value: 'show phrase' } });
    expect(next).toBeDisabled();
  });

  it('a wrong password shows nothing', async () => {
    open(); passWarning();
    fireEvent.change(screen.getByTestId('phrase-reveal-password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByTestId('phrase-reveal-show'));
    expect(await screen.findByText('Wrong password. Nothing was shown.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Recovery words' })).toBeNull();
  });

  it('the right password shows the 12 words in order, which hide on their own', async () => {
    open(); passWarning();
    fireEvent.change(screen.getByTestId('phrase-reveal-password'), { target: { value: 'correct horse' } });
    jest.useFakeTimers();
    fireEvent.click(screen.getByTestId('phrase-reveal-show'));
    await waitFor(() => expect(screen.getByRole('list', { name: 'Recovery words' })).toBeInTheDocument());
    const items = screen.getAllByRole('listitem').map(li => li.textContent);
    expect(items).toEqual(words.split(' '));
    for (let i = 0; i <= REVEAL_SECONDS; i += 1) await act(async () => { jest.advanceTimersByTime(1000); });
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Recovery words' })).toBeNull());
  });

  it('refuses when this browser holds the words for a different address', async () => {
    vault = { address: '0x' + 'b'.repeat(40) };
    open(); passWarning();
    fireEvent.change(screen.getByTestId('phrase-reveal-password'), { target: { value: 'correct horse' } });
    fireEvent.click(screen.getByTestId('phrase-reveal-show'));
    expect(await screen.findByText('This browser does not hold the words for this address.')).toBeInTheDocument();
    expect(unlockVault).not.toHaveBeenCalled();
  });
});
