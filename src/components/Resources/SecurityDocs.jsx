import React from 'react';
import './Resources.css';

/**
 * Security Documentation Component
 * Displays security best practices and guidelines for Wrfcoin
 */
const SecurityDocs = () => {
  return (
    <div className="security-docs">
      <div className="security-header">
        <h3>Security Guidelines</h3>
        <p className="subtitle">
          Best practices and security guidelines for Wrfcoin users and
          developers
        </p>
      </div>

      <div className="security-alert">
        <i className="bi bi-shield-exclamation"></i>
        <p>
          The Wrfcoin team will never ask for your private keys or seed phrase.
          Be vigilant against phishing attempts and always verify you're
          interacting with official Wrfcoin resources.
        </p>
      </div>

      <div className="security-section">
        <h4>Wallet Security</h4>
        <p>
          Protecting your Wrfcoin wallet is crucial. Follow these best
          practices:
        </p>

        <div className="security-grid">
          <div className="security-card">
            <div className="icon">
              <i className="bi bi-file-earmark-lock"></i>
            </div>
            <h5>Backup Your Seed Phrase</h5>
            <p>
              Write down your seed phrase and store it in a secure, offline
              location. Consider using a metal backup for fire and water
              resistance.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-shield-lock"></i>
            </div>
            <h5>Use Strong Passwords</h5>
            <p>
              Create unique, complex passwords for your wallet and any related
              accounts. Consider using a password manager.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-upc-scan"></i>
            </div>
            <h5>Enable Two-Factor Authentication</h5>
            <p>
              Add an extra layer of security by enabling 2FA on exchange
              accounts and web wallets.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-laptop"></i>
            </div>
            <h5>Use Hardware Wallets</h5>
            <p>
              For significant holdings, use a hardware wallet to keep your
              private keys offline and protected from malware.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-eye-slash"></i>
            </div>
            <h5>Guard Your Privacy</h5>
            <p>
              Avoid publicly sharing wallet addresses or transaction details
              that could be linked to your identity.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-layers"></i>
            </div>
            <h5>Separate Wallets</h5>
            <p>
              Use different wallets for daily transactions and long-term storage
              to minimize exposure.
            </p>
          </div>
        </div>
      </div>

      <div className="security-section">
        <h4>Node Security</h4>
        <p>When running a Wrfcoin node, keep these practices in mind:</p>

        <div className="security-grid">
          <div className="security-card">
            <div className="icon">
              <i className="bi bi-hdd-network"></i>
            </div>
            <h5>Dedicated Hardware</h5>
            <p>
              Run your node on dedicated hardware rather than a multipurpose
              computer to minimize attack surface.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-arrow-repeat"></i>
            </div>
            <h5>Keep Software Updated</h5>
            <p>
              Regularly update your node software to benefit from the latest
              security fixes and features.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-bricks"></i>
            </div>
            <h5>Firewall Configuration</h5>
            <p>
              Configure your firewall to only allow necessary connections to
              your node on the required ports.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-lock"></i>
            </div>
            <h5>Secure RPC Access</h5>
            <p>
              If enabling RPC, use strong authentication and TLS encryption, and
              limit access to trusted IP addresses.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-journal-code"></i>
            </div>
            <h5>Monitor Logs</h5>
            <p>
              Regularly review your node's logs for suspicious activity or
              connection attempts.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-backup"></i>
            </div>
            <h5>Backup Node Data</h5>
            <p>
              Regularly backup your node's configuration and key files to
              prevent data loss.
            </p>
          </div>
        </div>
      </div>

      <div className="security-section">
        <h4>Smart Contract Security</h4>
        <p>When developing or interacting with smart contracts on Wrfcoin:</p>

        <div className="security-grid">
          <div className="security-card">
            <div className="icon">
              <i className="bi bi-clipboard-check"></i>
            </div>
            <h5>Code Audits</h5>
            <p>
              Have your smart contract code audited by security professionals
              before deployment.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-bug"></i>
            </div>
            <h5>Test Extensively</h5>
            <p>
              Implement thorough testing including unit tests, integration
              tests, and formal verification when possible.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <h5>Follow Best Practices</h5>
            <p>
              Adhere to established smart contract development patterns and
              avoid known anti-patterns.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-clock-history"></i>
            </div>
            <h5>Upgrade Mechanism</h5>
            <p>
              Implement secure upgrade mechanisms for contracts that may need
              future updates.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h5>Emergency Procedures</h5>
            <p>
              Have documented procedures for responding to potential security
              incidents or vulnerabilities.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-currency-exchange"></i>
            </div>
            <h5>Economic Security</h5>
            <p>
              Consider economic attack vectors and ensure incentives are
              properly aligned.
            </p>
          </div>
        </div>
      </div>

      <div className="security-section">
        <h4>Computational NFT Security</h4>
        <p>Special considerations for creating and using Computational NFTs:</p>

        <div className="security-grid">
          <div className="security-card">
            <div className="icon">
              <i className="bi bi-cpu"></i>
            </div>
            <h5>Sandboxed Execution</h5>
            <p>
              Ensure computational code executes in a secure, sandboxed
              environment to prevent malicious behavior.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-speedometer"></i>
            </div>
            <h5>Resource Limitations</h5>
            <p>
              Implement strict resource bounds for CPU, memory, and network
              usage of computational tasks.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <h5>Time Constraints</h5>
            <p>
              Set appropriate timeouts for computational tasks to prevent
              denial-of-service attacks.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-key"></i>
            </div>
            <h5>Access Control</h5>
            <p>
              Implement appropriate access controls for data accessed by
              computational NFTs.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-fingerprint"></i>
            </div>
            <h5>Input Validation</h5>
            <p>
              Thoroughly validate all inputs to computational tasks to prevent
              injection attacks.
            </p>
          </div>

          <div className="security-card">
            <div className="icon">
              <i className="bi bi-patch-check"></i>
            </div>
            <h5>Code Verification</h5>
            <p>
              Verify the integrity and authenticity of computational code before
              execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDocs;
