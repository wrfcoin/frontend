/**
 * The RP ID a new passkey is created with. The account address is derived from it, so every wrfcoin.com
 * host must give the same RP ID (and the same account), while any other host keeps its own hostname.
 */
import { passkeyRpId, passkeyRecordAddress, isWrfcoinPasskeyRpId } from '../passkey';

describe('passkeyRpId', () => {
  it.each(['wrfcoin.com', 'www.wrfcoin.com', 'next.wrfcoin.com', 'WWW.WRFCOIN.COM', 'wrfcoin.com.'])(
    '%s -> wrfcoin.com', (host) => {
      expect(passkeyRpId(host)).toBe('wrfcoin.com');
    },
  );

  it.each(['wrfcoin-n5.tail1234.ts.net', 'localhost', '127.0.0.1', 'preview.example.org'])(
    '%s keeps its own hostname', (host) => {
      expect(passkeyRpId(host)).toBe(host);
    },
  );

  it.each(['evilwrfcoin.com', 'wrfcoin.com.evil.net', 'wrfcoin.co', 'xwrfcoin.com', 'wrfcoin.com-evil.net', 'wrfcoincom'])(
    'look-alike %s does not map to wrfcoin.com', (host) => {
      expect(passkeyRpId(host)).not.toBe('wrfcoin.com');
      expect(passkeyRpId(host)).toBe(host);
    },
  );

  it('www and the bare domain now derive the same account address', () => {
    const publicKeyXY = new Uint8Array(64).fill(9);
    const credentialId = new Uint8Array(16).fill(7);
    const bare = passkeyRecordAddress({ credentialId, publicKeyXY, rpId: passkeyRpId('wrfcoin.com') });
    const www = passkeyRecordAddress({ credentialId, publicKeyXY, rpId: passkeyRpId('www.wrfcoin.com') });
    const tailnet = passkeyRecordAddress({ credentialId, publicKeyXY, rpId: passkeyRpId('wrfcoin-n5.tail1234.ts.net') });
    expect(www).toBe(bare);
    expect(tailnet).not.toBe(bare);
  });

  it('isWrfcoinPasskeyRpId is exact', () => {
    expect(isWrfcoinPasskeyRpId('wrfcoin.com')).toBe(true);
    expect(isWrfcoinPasskeyRpId('www.wrfcoin.com')).toBe(false);
    expect(isWrfcoinPasskeyRpId('localhost')).toBe(false);
  });
});
