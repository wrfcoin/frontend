import React, { useState } from 'react';
import './Settings.css';
import { devLog } from '../../utils/logger';

const NetworkPage = () => {
  const [settings, setSettings] = useState({
    peers: 25,
    maxConnections: 50,
    discoveryEnabled: true,
    upnpEnabled: true,
    natTraversalEnabled: true,
    port: 8333,
    rpcPort: 8334,
    bandwidth: {
      uploadLimit: 1024,
      downloadLimit: 2048,
    },
    networkType: 'testnet',
    syncMode: 'full',
    allowIncoming: true,
    preferredNodes: '',
    blacklistedNodes: '',
    seedNodesEnabled: true,
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested object properties (like bandwidth.uploadLimit)
      const [parent, child] = name.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent],
          [child]: type === 'number' ? Number(value) : value,
        },
      });
    } else {
      setSettings({
        ...settings,
        [name]:
          type === 'checkbox'
            ? checked
            : type === 'number'
              ? Number(value)
              : value,
      });
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Save network settings - in a real app, this would connect to an API
    devLog('Saving network settings:', settings);
    alert('Network settings saved!');
  };

  const handleReset = () => {
    setSettings({
      peers: 25,
      maxConnections: 50,
      discoveryEnabled: true,
      upnpEnabled: true,
      natTraversalEnabled: true,
      port: 8333,
      rpcPort: 8334,
      bandwidth: {
        uploadLimit: 1024,
        downloadLimit: 2048,
      },
      networkType: 'testnet',
      syncMode: 'full',
      allowIncoming: true,
      preferredNodes: '',
      blacklistedNodes: '',
      seedNodesEnabled: true,
    });
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-globe"></i> Network Settings
        </h2>
        <p className="settings-description">
          Configure your node's network settings and connection preferences.
          These settings affect how your node interacts with the Wrfcoin network
          and other peers.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-section-divider">
            <h3>Network Configuration</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="networkType">Network Type</label>
              <select
                id="networkType"
                name="networkType"
                value={settings.networkType}
                onChange={handleChange}
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
              <div className="form-hint">
                Type of Wrfcoin network to connect to
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="syncMode">Synchronization Mode</label>
              <select
                id="syncMode"
                name="syncMode"
                value={settings.syncMode}
                onChange={handleChange}
              >
                <option value="full">Full Node</option>
                <option value="light">Light Client</option>
                <option value="archive">Archive Node</option>
              </select>
              <div className="form-hint">
                Determines how much blockchain data is stored
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="port">P2P Port</label>
              <input
                type="number"
                id="port"
                name="port"
                min="1024"
                max="65535"
                value={settings.port}
                onChange={handleChange}
              />
              <div className="form-hint">
                Port used for peer-to-peer communication
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rpcPort">RPC Port</label>
              <input
                type="number"
                id="rpcPort"
                name="rpcPort"
                min="1024"
                max="65535"
                value={settings.rpcPort}
                onChange={handleChange}
              />
              <div className="form-hint">
                Port used for remote procedure calls
              </div>
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Connection Settings</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxConnections">Maximum Connections</label>
              <input
                type="number"
                id="maxConnections"
                name="maxConnections"
                min="1"
                max="1000"
                value={settings.maxConnections}
                onChange={handleChange}
              />
              <div className="form-hint">
                Maximum number of peers to connect to
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="peers">Current Peers</label>
              <input
                type="number"
                id="peers"
                name="peers"
                min="0"
                max="1000"
                value={settings.peers}
                onChange={handleChange}
                disabled
              />
              <div className="form-hint">
                Number of currently connected peers
              </div>
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Bandwidth Settings</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bandwidth.uploadLimit">
                Upload Bandwidth Limit (KB/s)
              </label>
              <input
                type="number"
                id="bandwidth.uploadLimit"
                name="bandwidth.uploadLimit"
                min="0"
                value={settings.bandwidth.uploadLimit}
                onChange={handleChange}
              />
              <div className="form-hint">0 = unlimited</div>
            </div>

            <div className="form-group">
              <label htmlFor="bandwidth.downloadLimit">
                Download Bandwidth Limit (KB/s)
              </label>
              <input
                type="number"
                id="bandwidth.downloadLimit"
                name="bandwidth.downloadLimit"
                min="0"
                value={settings.bandwidth.downloadLimit}
                onChange={handleChange}
              />
              <div className="form-hint">0 = unlimited</div>
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Network Features</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="discoveryEnabled"
                name="discoveryEnabled"
                checked={settings.discoveryEnabled}
                onChange={handleChange}
              />
              <label htmlFor="discoveryEnabled">Enable Peer Discovery</label>
            </div>
            <div className="form-hint">
              Automatically discover and connect to new peers on the network
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="seedNodesEnabled"
                name="seedNodesEnabled"
                checked={settings.seedNodesEnabled}
                onChange={handleChange}
              />
              <label htmlFor="seedNodesEnabled">Connect to Seed Nodes</label>
            </div>
            <div className="form-hint">
              Connect to official seed nodes to bootstrap your node
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="upnpEnabled"
                name="upnpEnabled"
                checked={settings.upnpEnabled}
                onChange={handleChange}
              />
              <label htmlFor="upnpEnabled">Enable UPnP</label>
            </div>
            <div className="form-hint">
              Automatically configure port forwarding on compatible routers
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="natTraversalEnabled"
                name="natTraversalEnabled"
                checked={settings.natTraversalEnabled}
                onChange={handleChange}
              />
              <label htmlFor="natTraversalEnabled">Enable NAT Traversal</label>
            </div>
            <div className="form-hint">
              Use techniques to establish connections through NAT
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="allowIncoming"
                name="allowIncoming"
                checked={settings.allowIncoming}
                onChange={handleChange}
              />
              <label htmlFor="allowIncoming">Allow Incoming Connections</label>
            </div>
            <div className="form-hint">
              Accept connection requests from other nodes
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Advanced Node Configuration</h3>
          </div>

          <div className="form-group">
            <label htmlFor="preferredNodes">
              Preferred Nodes (comma-separated)
            </label>
            <textarea
              id="preferredNodes"
              name="preferredNodes"
              value={settings.preferredNodes}
              onChange={handleChange}
              placeholder="node1.example.com:8333, node2.example.com:8333"
              rows="3"
            />
            <div className="form-hint">
              Your node will prioritize connections to these peers
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="blacklistedNodes">
              Blacklisted Nodes (comma-separated)
            </label>
            <textarea
              id="blacklistedNodes"
              name="blacklistedNodes"
              value={settings.blacklistedNodes}
              onChange={handleChange}
              placeholder="badnode1.example.com:8333, badnode2.example.com:8333"
              rows="3"
            />
            <div className="form-hint">
              Your node will refuse connections from these peers
            </div>
          </div>

          <div className="settings-action-buttons">
            <button type="submit" className="save-button">
              <i className="bi bi-save"></i> Save Network Settings
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={handleReset}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NetworkPage;
