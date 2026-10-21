/**
 * HardwareWalletSection Component
 *
 * Hardware wallet integration is not available for the testnet launch.
 * Shows an honest "coming soon" panel instead of a simulated connect flow.
 * The Ledger/Trezor/Keystone SDK wiring will be added post-testnet.
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import ComingSoonPanel from './ComingSoonPanel';
import './HardwareWalletSection.css';

const HardwareWalletSection = () => (
  <div className="hardware-wallet-section">
    <ComingSoonPanel
      icon={Cpu}
      title="Hardware wallet support coming soon"
      description="Ledger, Trezor, and Keystone integration will be available after the testnet launch. Private-key operations currently run through the WRFCoin custom wallet."
    />
  </div>
);

export default HardwareWalletSection;
