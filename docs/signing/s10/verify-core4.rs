use wrfcoin_shared_protocol::blockchain::station_owner::{StationOwnerActionPayload, StationOwnerTransferPayload};
#[test]
fn web_s10_payloads_verify_in_core4() {
    let path = std::env::var("S10_WEB_PAYLOADS").expect("S10_WEB_PAYLOADS path");
    let values: Vec<serde_json::Value> = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let mut actions = 0;
    let mut transfers = 0;
    for value in values {
        if value["tx_kind"] == "station_owner_action_v1" {
            let mut p: StationOwnerActionPayload = serde_json::from_value(value).unwrap();
            assert!(p.verify_stateless_with_domain("777", "testnet", 16000).is_ok());
            assert!(p.verify_stateless_with_domain("778", "testnet", 16000).is_err());
            p.action_nonce += 1;
            assert!(p.verify_stateless_with_domain("777", "testnet", 16000).is_err());
            actions += 1;
        } else {
            let mut p: StationOwnerTransferPayload = serde_json::from_value(value).unwrap();
            assert!(p.verify_stateless_with_domain("777", "testnet", 16000).is_ok());
            assert!(p.verify_stateless_with_domain("777", "other", 16000).is_err());
            p.to_owner_signature = p.from_owner_signature.clone();
            assert!(p.verify_stateless_with_domain("777", "testnet", 16000).is_err());
            transfers += 1;
        }
    }
    assert_eq!((actions, transfers), (4, 1));
    println!("CORE4_S10_PASS: 4 security actions and 1 dual-signed transfer verified; changed domain/nonce/accept signature refused");
}
