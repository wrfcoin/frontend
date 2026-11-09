/**
 * Station ownership proof: the message bytes match core4's station_ownership_message (checked against a
 * signature core4 produced), and the signer only ever signs "this wallet owns this website station on
 * this chain". Made-up wallet and station ids.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, deriveAccount } from '../firstPartyKeys';
import { signStationOwnership, stationOwnershipMessage, STATION_OWNERSHIP_DOMAIN } from '../stationOwnership';

const hex = (s: string) => Uint8Array.from(s.match(/../g)!.map((b) => parseInt(b, 16)));
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const account = deriveAccount(MNEMONIC);
const CHAIN = { chainId: '888', networkId: 'testnet' };
const STATION = 'pws-0123456789abcdef';

describe('stationOwnershipMessage', () => {
  it('matches core4: a signature core4 made over the ownership message verifies over these bytes', () => {
    // core4 golden vector (also pinned in the backend's phone export test).
    const golden = {
      publicKeyHex: 'ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c',
      ownerAddress: '0x791026e25cc1ba461167ffb5c6dc095c284bd92c',
      stationId: 'mob-0123456789abcdef0123456789abcdef',
      signatureHex:
        '4983b317ac64e109c15426fa4378452bd0053838a27e12608a4c1242280fd9c0b5fe97437f65bce97b8e24876ea81da33e8b9eae5f8ab173bbd8ebd597e4210a',
    };
    const message = stationOwnershipMessage({
      chainId: '777', networkId: 'testnet', stationId: golden.stationId, ownerAddress: golden.ownerAddress,
    });
    expect(ed25519.verify(hex(golden.signatureHex), message, hex(golden.publicKeyHex))).toBe(true);
    // Any other chain gives other bytes.
    const other = stationOwnershipMessage({
      chainId: '888', networkId: 'testnet', stationId: golden.stationId, ownerAddress: golden.ownerAddress,
    });
    expect(ed25519.verify(hex(golden.signatureHex), other, hex(golden.publicKeyHex))).toBe(false);
  });

  it('is the raw domain tag, then each field as u32 little-endian length + UTF-8', () => {
    const message = stationOwnershipMessage({ ...CHAIN, stationId: 'ab', ownerAddress: 'c' });
    const tag = new TextEncoder().encode(STATION_OWNERSHIP_DOMAIN);
    expect(bytesToHex(message.slice(0, tag.length))).toBe(bytesToHex(tag));
    expect(bytesToHex(message.slice(tag.length))).toBe(
      '03000000' + '383838' + '07000000' + bytesToHex(new TextEncoder().encode('testnet')) +
      '02000000' + '6162' + '01000000' + '63',
    );
  });
});

describe('signStationOwnership', () => {
  it('signs for the account\'s own lowercase address, and the proof verifies', () => {
    const proof = signStationOwnership(account, STATION, CHAIN);
    expect(proof.owner_pubkey).toBe(bytesToHex(account.publicKey));
    expect(proof.owner_signature).toMatch(/^[0-9a-f]{128}$/);
    const message = stationOwnershipMessage({ ...CHAIN, stationId: STATION, ownerAddress: account.address.toLowerCase() });
    expect(ed25519.verify(hex(proof.owner_signature), message, account.publicKey)).toBe(true);
  });

  it('is bound to the station and the chain', () => {
    const proof = signStationOwnership(account, STATION, CHAIN);
    for (const other of [
      { ...CHAIN, stationId: 'pws-ffffffffffffffff' },
      { chainId: '777', networkId: 'testnet', stationId: STATION },
      { chainId: '888', networkId: 'mainnet', stationId: STATION },
    ]) {
      const message = stationOwnershipMessage({ ...other, ownerAddress: account.address.toLowerCase() });
      expect(ed25519.verify(hex(proof.owner_signature), message, account.publicKey)).toBe(false);
    }
  });

  it('refuses a phone station id, a malformed id and a site with no chain, before the key is used', () => {
    let signed = 0;
    const counting = { ...account, sign: (m: Uint8Array) => { signed += 1; return account.sign(m); } };
    for (const id of ['mob-' + '0'.repeat(32), '', 'has space', 'a/b', 'x'.repeat(65)]) {
      expect(() => signStationOwnership(counting, id, CHAIN)).toThrow();
    }
    expect(() => signStationOwnership(counting, STATION, { chainId: '', networkId: 'testnet' })).toThrow();
    expect(() => signStationOwnership(counting, STATION, { chainId: '888', networkId: '' })).toThrow();
    expect(() => signStationOwnership({ ...counting, address: 'not-an-address' }, STATION, CHAIN)).toThrow();
    expect(signed).toBe(0);
  });
});
