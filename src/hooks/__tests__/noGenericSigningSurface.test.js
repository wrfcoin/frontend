import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';

// frontend#374: the generic sign hooks were removed so a future caller cannot make an oracle of the wallet key.
describe('no generic signing surface on useWallet / useWalletConnection', () => {
  it.each(['src/contexts/WalletContext.jsx', 'src/hooks/useWalletConnection.js'])('%s exposes no signMessage/sign action', file => {
    const src = readFileSync(file, 'utf8');
    expect(src).not.toMatch(/const signMessage\b|signMessage:\s|^\s+signMessage,$|const sign = /m);
  });
});
