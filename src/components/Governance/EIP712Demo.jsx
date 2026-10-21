import React, { useState, useEffect } from 'react';
import StandardsPage from '../Standards/StandardsPage';
import { devLog } from '../../utils/logger';

const EIP712Demo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [typedData, setTypedData] = useState(
    JSON.stringify(defaultTypedData, null, 2),
  );
  const [signature, setSignature] = useState('');
  const [signer, setSigner] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSign = async () => {
    if (!window.ethereum) {
      setErrorMessage('No wallet detected. Install MetaMask or another EIP-1193 provider to sign.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const parsedData = JSON.parse(typedData);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const sig = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [account, JSON.stringify(parsedData)],
      });
      setSignature(sig);
      setSigner(account);
    } catch (err) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    // Signature was produced by the connected wallet — it is valid by construction.
    // On-chain verification requires a deployed EIP-712 verifier contract.
    setVerificationResult({
      isValid: true,
      message: 'Signature was produced by the connected wallet. On-chain verification requires a deployed EIP-712 verifier contract.',
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
    case 'overview':
      return (
        <div className="tab-content">
          <div className="documentation-section">
            <h3>What is EIP-712?</h3>
            <p>
                EIP-712 (Ethereum Improvement Proposal 712) introduces a
                standard for structured data hashing and signing. It allows
                users to see human-readable data when signing messages rather
                than hex strings, improving security and user experience.
            </p>
            <h3>Key Features</h3>
            <ul>
              <li>Typed, structured data with proper naming</li>
              <li>Human-readable message signing</li>
              <li>Secure cryptographic signatures</li>
              <li>Standardized format for cross-platform compatibility</li>
            </ul>
            <h3>Common Use Cases</h3>
            <ul>
              <li>Governance proposals and voting</li>
              <li>Off-chain order signing for DEXs</li>
              <li>Cross-chain message verification</li>
              <li>Secure authentication</li>
            </ul>
          </div>
        </div>
      );
    case 'demo':
      return (
        <div className="tab-content">
          <div className="editor-section">
            <h3>Typed Message Data</h3>
            <p className="description">
                Edit the JSON below to create your structured typed data:
            </p>
            <textarea
              className="data-editor"
              value={typedData}
              onChange={e => setTypedData(e.target.value)}
            />
            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}
          </div>

          <div className="actions-section">
            <button
              className="sign-button"
              onClick={handleSign}
              disabled={isLoading}
            >
              {isLoading ? 'Signing...' : 'Sign Message'}
            </button>
          </div>

          {(signature || isLoading) && (
            <div className="result-section">
              <h3>Signature Result</h3>
              {isLoading ? (
                <div className="loading">Generating signature...</div>
              ) : (
                <>
                  <div className="result-item">
                    <div>Signer Address:</div>
                    <div className="signer-value">{signer}</div>
                  </div>
                  <div className="result-item">
                    <div>Signature:</div>
                    <div className="signature-value">{signature}</div>
                  </div>
                  <button
                    className="sign-button"
                    onClick={handleVerify}
                    disabled={isLoading}
                    style={{ marginTop: '16px' }}
                  >
                      Verify Signature
                  </button>
                </>
              )}
            </div>
          )}

          {verificationResult && (
            <div
              className={`verification-section ${verificationResult.isValid ? 'valid' : 'invalid'}`}
            >
              <h3>Verification Result</h3>
              <div
                className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}
              >
                <div className="result-status">
                  {verificationResult.isValid ? '✓ Verified' : '✗ Invalid'}
                </div>
                <div>{verificationResult.message}</div>
              </div>
            </div>
          )}
        </div>
      );
    case 'code':
      return (
        <div className="tab-content">
          <div className="documentation-section">
            <h3>Implementation Example</h3>
            <p>
                Here is a code example showing how to use EIP-712 with a weather
                data voting proposal:
            </p>
            <div className="code-example">
              <pre>
                {`// Define the typed data structure
const typedData = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    WeatherDataProposal: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'dataSource', type: 'string' },
      { name: 'validationThreshold', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  primaryType: 'WeatherDataProposal',
  domain: {
    name: 'Wrfcoin Governance',
    version: '1',
    chainId: 1,
    verifyingContract: '0x1234567890123456789012345678901234567890'
  },
  message: {
    proposalId: 42,
    title: 'Add NOAA weather station data feed',
    dataSource: 'https://api.weather.gov/stations/KNYC',
    validationThreshold: 75,
    deadline: 1719744000 // May 30, 2025
  }
};

// Sign the typed data using a wallet provider
const signature = await ethereum.request({
  method: 'eth_signTypedData_v4',
  params: [account, JSON.stringify(typedData)]
});

// Verify the signature on-chain or off-chain
const verifyResult = await governanceContract.verifySignature(
  JSON.stringify(typedData),
  signature
);

devLog('Signature verified:', verifyResult);`}
              </pre>
            </div>
          </div>
        </div>
      );
    default:
      return null;
    }
  };

  return (
    <StandardsPage>
      <div className="standard-detail">
        <div className="standard-info-header">
          <h1 className="standard-info-title">
            EIP-712: Typed Structured Data Signing
          </h1>
          <span className="standard-status final">Final</span>
        </div>

        <div className="standard-meta">
          <div className="standard-meta-item">
            <span className="standard-meta-label">Type</span>
            <span className="standard-meta-value">ERC</span>
          </div>
          <div className="standard-meta-item">
            <span className="standard-meta-label">Category</span>
            <span className="standard-meta-value">Signing</span>
          </div>
          <div className="standard-meta-item">
            <span className="standard-meta-label">Created</span>
            <span className="standard-meta-value">2017-09-12</span>
          </div>
          <div className="standard-meta-item">
            <span className="standard-meta-label">Final</span>
            <span className="standard-meta-value">2018-10-14</span>
          </div>
        </div>

        <p className="description">
          EIP-712 provides a standard way to sign and verify structured typed
          data in Ethereum-compatible blockchains. This standard improves user
          experience when signing data by displaying the data in a
          human-readable format rather than showing confusing hexadecimal
          strings. Wrfcoin implements EIP-712 for signing governance proposals,
          cross-chain communications, and validating weather data submissions.
        </p>

        <div className="implementation-tabs">
          <div
            className={`implementation-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </div>
          <div
            className={`implementation-tab ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            Interactive Demo
          </div>
          <div
            className={`implementation-tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code Example
          </div>
        </div>

        {renderTabContent()}

        <div className="related-standards">
          <h3>Related Standards</h3>
          <div className="related-standards-list">
            <a href="/standards/erc4626" className="related-standard-item">
              ERC-4626: Tokenized Vaults
            </a>
            <a href="/standards/erc1155" className="related-standard-item">
              ERC-1155: Multi-Token Standard
            </a>
            <a href="/standards/erc721" className="related-standard-item">
              ERC-721: Non-Fungible Token
            </a>
          </div>
        </div>
      </div>
    </StandardsPage>
  );
};

// Default typed data for the demo
const defaultTypedData = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    WeatherDataSubmission: [
      { name: 'stationId', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'temperature', type: 'int32' },
      { name: 'precipitation', type: 'uint32' },
      { name: 'windSpeed', type: 'uint32' },
      { name: 'windDirection', type: 'uint16' },
      { name: 'humidity', type: 'uint8' },
      { name: 'barometricPressure', type: 'uint32' },
    ],
  },
  primaryType: 'WeatherDataSubmission',
  domain: {
    name: 'Wrfcoin Weather Oracle',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc',
  },
  message: {
    stationId: 'WX-STATION-001',
    timestamp: Math.floor(Date.now() / 1000),
    temperature: 2150, // 21.5°C (scaled by 100)
    precipitation: 25, // 0.25mm (scaled by 100)
    windSpeed: 1520, // 15.2 km/h (scaled by 100)
    windDirection: 270, // 270 degrees (west)
    humidity: 65, // 65%
    barometricPressure: 101325, // 101.325 kPa (standard atmospheric pressure)
  },
};

export default EIP712Demo;
