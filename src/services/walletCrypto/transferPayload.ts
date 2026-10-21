import { bytesToHex, type FirstPartyAccount } from './firstPartyKeys';

const encoder = new TextEncoder();
const DOMAIN = encoder.encode('wrfcoin_transparent_transfer_auth_v2');

function u32le(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function u64le(value: bigint): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, value, true);
  return out;
}

function framed(value: string): Uint8Array {
  const bytes = encoder.encode(value);
  return concat(u32le(bytes.length), bytes);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export function transparentTransferMessage(input: {
  chainId: string;
  networkId: string;
  from: string;
  to: string;
  amountBaseUnits: bigint;
  nonce: bigint;
}): Uint8Array {
  return concat(
    DOMAIN,
    framed(input.chainId),
    framed(input.networkId),
    framed(input.from),
    framed(input.to),
    u64le(input.amountBaseUnits),
    u64le(input.nonce),
  );
}

export function buildSignedTransfer(input: {
  from: string;
  to: string;
  amountBaseUnits: bigint;
  nonce: bigint;
  chainId: string;
  networkId: string;
}, account: FirstPartyAccount) {
  if (input.from.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error('Signing account does not match transfer sender');
  }
  const message = transparentTransferMessage(input);
  return {
    from: input.from,
    to: input.to,
    // The wire value must be the exact integer included in the signature.
    // Display-unit conversion belongs before signing, never in the relay.
    amount: input.amountBaseUnits.toString(),
    nonce: input.nonce.toString(),
    auth_pubkey: bytesToHex(account.publicKey),
    auth_signature: bytesToHex(account.sign(message)),
  };
}

export function wrfToBaseUnits(amount: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(amount.trim());
  if (!match) throw new Error('Amount must have at most 8 decimal places');
  return BigInt(match[1]) * 100000000n + BigInt((match[2] ?? '').padEnd(8, '0'));
}
