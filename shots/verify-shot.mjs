import fs from 'fs';
import { p256 } from '/home/tony/wrfcoin/frontend/node_modules/@noble/curves/nist.js';
import { sha256 } from '/home/tony/wrfcoin/frontend/node_modules/@noble/hashes/sha2.js';
import { sha3_256 } from '/home/tony/wrfcoin/frontend/node_modules/@noble/hashes/sha3.js';
const h = (x) => Buffer.from(x, 'hex'); const hex = (b) => Buffer.from(b).toString('hex');
const res = JSON.parse(fs.readFileSync(process.argv[2]));
let ok = 0;
for (const { tag, address, body } of res) {
  const a = body.passkey_auth;
  const addr = '0x' + hex(sha3_256(Buffer.concat([Buffer.from('wrfcoin.passkey_address.v1'), h(a.rp_id_hash), Buffer.from([4]), h(a.public_key_p256)])).slice(0, 20));
  const cd = JSON.parse(h(a.client_data_json).toString());
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }; const fr = (s) => Buffer.concat([u32(s.length), Buffer.from(s)]);
  const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
  const msg = Buffer.concat([Buffer.from('wrfcoin_passkey_transfer_auth_v1'), fr('888'), fr('testnet'), fr(body.from), fr(body.to), u64(body.amount), u64(body.nonce)]);
  const challenge = Buffer.from(sha3_256(msg)).toString('base64url');
  const signed = Buffer.concat([h(a.authenticator_data), Buffer.from(sha256(h(a.client_data_json)))]);
  const flags = h(a.authenticator_data)[32];
  const checks = {
    addressDerives: addr === body.from && addr === address,
    rpHash: hex(sha256(Buffer.from('localhost'))) === a.rp_id_hash,
    type: cd.type === 'webauthn.get', challenge: cd.challenge === challenge,
    uvUp: (flags & 5) === 5,
    lowSVerifies: p256.verify(h(a.signature), signed, Buffer.concat([Buffer.from([4]), h(a.public_key_p256)]), { format: 'der', lowS: true }),
    amount: body.amount === '150000000' && body.nonce === '7',
  };
  const pass = Object.values(checks).every(Boolean); if (pass) ok++;
  console.log(tag, pass ? 'PASS' : 'FAIL', JSON.stringify(checks));
}
console.log(`${ok}/${res.length} captured passkey_auth bodies verify under core4's rules`);
