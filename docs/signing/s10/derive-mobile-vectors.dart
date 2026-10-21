import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:wrfcoin_mobile/services/crypto/station_signing.dart';
import 'package:wrfcoin_mobile/services/crypto/governance_vote_signing.dart';
import 'package:wrfcoin_mobile/services/crypto/signed_transfer.dart';

void main() { test('derive S10 vectors from mobile production code', () async {
  String hex(List<int> b) => b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  final a = await Ed25519TransferSigner.fromSeedHex(List.filled(32, '07').join());
  final b = await Ed25519TransferSigner.fromSeedHex(List.filled(32, '08').join());
  final from = chainAddressFromEd25519PublicKey(a.publicKey);
  final to = chainAddressFromEd25519PublicKey(b.publicKey);
  final body = StationTransferBody(chainId: '777', networkId: 'testnet', stationId: 'station-s10-test', fromOwnerAddress: from, toOwnerAddress: to, toOwnerPubkey: hex(b.publicKey), transferNonce: 7, expiresAtHeight: 21000);
  final vectors = <Map<String, Object>>[];
  Future<void> add(String kind, List<int> message, Ed25519TransferSigner signer, Map<String, Object> fields) async {
    vectors.add({'kind': kind, 'fields': fields, 'publicKey': hex(signer.publicKey), 'preimageHex': hex(message), 'signatureHex': hex(await signer.sign(message))});
  }
  for (final approve in [true, false]) {
    await add('vote', governanceVoteV1Message('proposal_s10-1', approve), a, {'proposalId': 'proposal_s10-1', 'approve': approve});
  }
  final common = <String, Object>{'chainId': '777', 'networkId': 'testnet', 'stationId': 'station-s10-test', 'expiresAtHeight': '21000'};
  for (final action in StationOwnerAction.values) {
    await add('stationSecurity', stationOwnerActionMessage(chainId: '777', networkId: 'testnet', stationId: 'station-s10-test', ownerAddress: from, action: action, actionNonce: 7, expiresAtHeight: 21000), a, {...common, 'ownerAddress': from, 'action': action.wireName, 'actionNonce': '7'});
  }
  final fields = <String, Object>{...common, 'fromOwnerAddress': from, 'toOwnerAddress': to, 'toOwnerPubkey': hex(b.publicKey), 'transferNonce': '7'};
  final senderSig = hex(await a.sign(stationOwnerTransferMessage(body)));
  await add('stationTransfer', stationOwnerTransferMessage(body), a, fields);
  await add('stationAccept', stationOwnerTransferAcceptMessage(body), b, {...fields, 'senderPublicKey': hex(a.publicKey), 'senderSignature': senderSig});
  File('/tmp/sol-s10-mobile-vectors.json').writeAsStringSync(JsonEncoder.withIndent('  ').convert(vectors));
  expect(vectors.length, 8);
}); }
