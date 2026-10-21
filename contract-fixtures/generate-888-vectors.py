"""Independent Python framing/Ed25519 oracle; synthetic public test keys only.
Run with Python cryptography installed. Existing 777 vectors are inputs only.
"""
import hashlib
import hmac
import json
import struct
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

ROOT = Path(__file__).resolve().parent.parent
frame = lambda text: struct.pack('<I', len(text.encode())) + text.encode()
u64 = lambda value: struct.pack('<Q', int(value))
old = json.loads((ROOT / 'contract-fixtures/transparent-transfer-auth-vector-777.json').read_text())
v = json.loads(json.dumps(old))
c = v['case']
c['chain_id'] = '888'
message = v['domain_tag'].encode() + b''.join(frame(c[k]) for k in ('chain_id', 'network_id', 'from', 'to')) + u64(c['amount']) + u64(c['nonce'])
seed = hashlib.pbkdf2_hmac('sha512', v['signer']['mnemonic'].encode(), b'mnemonic', 2048)
key = Ed25519PrivateKey.from_private_bytes(hmac.new(b'ed25519 seed', seed, hashlib.sha512).digest()[:32])
c['preimage_hex'] = message.hex()
c['signature_hex'] = key.sign(message).hex()
v['producer'] = 'generate-888-vectors.py: Python struct and cryptography Ed25519, synthetic BIP39 mnemonic'
v['verified_by'] = 'frontend tests; no node acceptance claim'
(ROOT / 'contract-fixtures/transparent-transfer-auth-vector-888.json').write_text(json.dumps(v, indent=2) + '\n')
old = json.loads((ROOT / 'src/services/walletCrypto/__tests__/s10-mobile-vectors.json').read_text())
rows = []
for v in old:
    if v['kind'] == 'vote':
        continue
    f = v['fields']; f['chainId'] = '888'
    domain = b''.join(frame(f[k]) for k in ('chainId', 'networkId', 'stationId'))
    if v['kind'] == 'stationSecurity':
        action = ['report_stolen', 'unfreeze', 'deactivate', 'reactivate'].index(f['action']) + 1
        message = b'wrfcoin_station_owner_action_v1' + domain + frame(f['ownerAddress']) + bytes([action]) + u64(f['actionNonce']) + u64(f['expiresAtHeight'])
    else:
        tag = b'wrfcoin_station_owner_transfer_v1' if v['kind'] == 'stationTransfer' else b'wrfcoin_station_owner_transfer_accept_v1'
        message = tag + domain + b''.join(frame(f[k]) for k in ('fromOwnerAddress', 'toOwnerAddress', 'toOwnerPubkey')) + u64(f['transferNonce']) + u64(f['expiresAtHeight'])
        if v['kind'] == 'stationAccept':
            f['senderSignature'] = next(r['signatureHex'] for r in rows if r['kind'] == 'stationTransfer')
    key = Ed25519PrivateKey.from_private_bytes(bytes([8 if v['kind'] == 'stationAccept' else 7]) * 32)
    v['preimageHex'] = message.hex(); v['signatureHex'] = key.sign(message).hex()
    rows.append(v)
(ROOT / 'src/services/walletCrypto/__tests__/s10-888-vectors.json').write_text(json.dumps(rows, indent=2) + '\n')
print('888 vectors generated with independent Python framing and Ed25519')
