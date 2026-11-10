/**
 * Station ownership proof for a station connected on the website.
 *
 * A station earns only once it is registered on chain, and that registration carries the owner's own
 * proof: the owner key's signature over core4 `station_ownership_message`
 * (shared-protocol transaction.rs):
 *   "wrfcoin_station_ownership_v1" || u32le|chain_id || u32le|network_id || u32le|station_id
 *   || u32le|owner_address
 * The domain tag is raw bytes (not length-prefixed); every other field is u32 little-endian length + UTF-8.
 *
 * The key that signs here also authorizes transfers, so this never signs bytes it was handed. It builds
 * the message itself from a station id, the signer's own address and the site's chain, and refuses a
 * station id that is not a website station id. The result says "this wallet owns this station on this
 * chain" and nothing else; it moves no coins and registers nothing by itself.
 */
import { bytesToHex, type FirstPartyAccount } from './firstPartyKeys';

const encoder = new TextEncoder();

export const STATION_OWNERSHIP_DOMAIN = 'wrfcoin_station_ownership_v1';
/** Phone stations (`mob-` ids) prove ownership in the phone app, never here. */
const WEBSITE_STATION_ID = /^(?!mob-)[A-Za-z0-9_-]{1,64}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/;

function framed(text: string): Uint8Array {
  const bytes = encoder.encode(text);
  const out = new Uint8Array(4 + bytes.length);
  new DataView(out.buffer).setUint32(0, bytes.length, true);
  out.set(bytes, 4);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

export interface StationOwnershipChain {
  chainId: string;
  networkId: string;
}

/** core4 station_ownership_message. */
export function stationOwnershipMessage(input: StationOwnershipChain & { stationId: string; ownerAddress: string }): Uint8Array {
  return concat(
    encoder.encode(STATION_OWNERSHIP_DOMAIN),
    framed(input.chainId),
    framed(input.networkId),
    framed(input.stationId),
    framed(input.ownerAddress),
  );
}

export interface StationOwnershipProof {
  owner_pubkey: string;
  owner_signature: string;
}

/**
 * Sign the ownership message for `stationId` with `account`. The owner address in the message is always
 * the account's own lowercase address: this cannot be made to sign for another wallet.
 */
export function signStationOwnership(
  account: FirstPartyAccount,
  stationId: string,
  chain: StationOwnershipChain,
): StationOwnershipProof {
  const ownerAddress = String(account.address).toLowerCase();
  if (!ADDRESS.test(ownerAddress)) throw new Error('This wallet cannot sign for a station.');
  if (!WEBSITE_STATION_ID.test(stationId)) throw new Error('Not a website station id.');
  if (!/^[1-9]\d*$/.test(chain.chainId) || !/^[A-Za-z0-9._-]{1,64}$/.test(chain.networkId)) {
    throw new Error('Signing chain is not configured on this site.');
  }
  const message = stationOwnershipMessage({ ...chain, stationId, ownerAddress });
  return {
    owner_pubkey: bytesToHex(account.publicKey),
    owner_signature: bytesToHex(account.sign(message)),
  };
}
