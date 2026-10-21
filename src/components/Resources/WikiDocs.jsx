import React, { useState } from 'react';
import { Link } from 'react-router';
import './Resources.css';
import { devLog } from '../../utils/logger';

const WikiDocs = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedSections, setExpandedSections] = useState(['modules']);

  const handleSectionClick = section => {
    setActiveSection(section);
  };

  const toggleSectionExpand = section => {
    devLog(`Toggling section: ${section}`);
    devLog(`Current expanded sections: ${expandedSections}`);

    setExpandedSections(prev => {
      if (prev.includes(section)) {
        devLog(`Removing section ${section} from expanded sections`);
        return prev.filter(s => s !== section);
      } else {
        devLog(`Adding section ${section} to expanded sections`);
        return [...prev, section];
      }
    });
  };

  return (
    <div className="resources" style={{ paddingTop: '20px' }}>
      <div className="wiki-wrapper">
        <div className="wiki-header">
          <div className="wiki-title">
            <h3>Wrfcoin Docs</h3>
            <p className="subtitle">Official Documentation for v2</p>
          </div>
          <div className="wiki-search">
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input type="text" placeholder="Search..." />
            </div>
          </div>
        </div>

        <div className="wiki-content">
          <div className="wiki-sidebar">
            <div className="table-of-contents">
              <h4>TABLE OF CONTENTS</h4>
              <div
                className={`toc-item ${activeSection === 'getting-started' ? 'active' : ''}`}
                onClick={() => handleSectionClick('getting-started')}
              >
                <i className="bi bi-chevron-right"></i>
                <span>Getting Started</span>
              </div>
              <div
                className={`toc-item ${activeSection === 'administration' ? 'active' : ''}`}
                onClick={() => handleSectionClick('administration')}
              >
                <i className="bi bi-chevron-right"></i>
                <span>Administration</span>
              </div>
              <div
                className={`toc-item with-submenu ${activeSection.startsWith('module') ? 'active' : ''}`}
                onClick={() => toggleSectionExpand('modules')}
              >
                <i
                  className={`bi ${expandedSections.includes('modules') ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                ></i>
                <span>Modules</span>
              </div>
              {expandedSections.includes('modules') && (
                <div className="toc-submenu">
                  {/* Layer 1 Features */}
                  <div className="toc-subheader">Layer 1 Core Features</div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-mining' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-mining')}
                  >
                    <span>Mining</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-sharding' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-sharding')}
                  >
                    <span>Sharding</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-achievements' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-achievements')}
                  >
                    <span>Achievement System</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-consensus' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-consensus')}
                  >
                    <span>Consensus Mechanism</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-governance' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-governance')}
                  >
                    <span>Governance</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-privacy' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-privacy')}
                  >
                    <span>Privacy Features</span>
                  </div>

                  {/* Layer 2 Features */}
                  <div className="toc-subheader">Layer 2 and Extensions</div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-cross-chain' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-cross-chain')}
                  >
                    <span>Cross-Chain Bridge</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-computational' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-computational')}
                  >
                    <span>Computational NFTs</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-oracle' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-oracle')}
                  >
                    <span>Oracle System</span>
                  </div>
                  <div
                    className={`toc-subitem ${activeSection === 'modules-scaling' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('modules-scaling')}
                  >
                    <span>Scaling Solutions</span>
                  </div>
                </div>
              )}
              <div
                className={`toc-item ${activeSection === 'user-guide' ? 'active' : ''}`}
                onClick={() => handleSectionClick('user-guide')}
              >
                <i className="bi bi-chevron-right"></i>
                <span>User Guide</span>
              </div>
              <div
                className={`toc-item ${activeSection === 'developers' ? 'active' : ''}`}
                onClick={() => handleSectionClick('developers')}
              >
                <i className="bi bi-chevron-right"></i>
                <span>Developers</span>
              </div>
              <div
                className={`toc-item ${activeSection === 'api-reference' ? 'active' : ''}`}
                onClick={() => handleSectionClick('api-reference')}
              >
                <i className="bi bi-chevron-right"></i>
                <span>API Reference</span>
              </div>
            </div>

            <div className="wiki-last-edited">
              <h4>LAST EDITED BY</h4>
              <p>Administrator</p>
              <p className="timestamp">05/11/2025</p>
            </div>

            <div className="wiki-rating">
              <h4>RATING</h4>
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-half"></i>
                <i className="bi bi-star"></i>
              </div>
              <p className="rating-count">5 votes</p>
            </div>

            <div className="wiki-actions">
              <button className="wiki-action-btn">
                <i className="bi bi-bookmark"></i>
              </button>
              <button className="wiki-action-btn">
                <i className="bi bi-share"></i>
              </button>
              <button className="wiki-action-btn">
                <i className="bi bi-printer"></i>
              </button>
            </div>
          </div>

          <div className="wiki-main-content">
            <div className="wiki-alert">
              <i className="bi bi-exclamation-triangle"></i>
              <p>
                Documentation is being worked on! Some pages may be incomplete
                or not exist yet.
              </p>
            </div>

            {activeSection === 'getting-started' && (
              <div className="wiki-section">
                <h2>Getting Started</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin Core is quick and easy to install. You should be up
                  and running in no time.
                </p>

                <div className="wiki-steps">
                  <div className="wiki-step">
                    <i className="bi bi-check-circle"></i>
                    <p>
                      Make sure you have read the{' '}
                      <Link to="#" className="wiki-link">
                        server requirements
                      </Link>
                      .
                    </p>
                  </div>

                  <div className="wiki-step">
                    <i className="bi bi-check-circle"></i>
                    <p>
                      Follow the quick and simple{' '}
                      <Link to="#" className="wiki-link">
                        installation guide
                      </Link>
                      .
                    </p>
                  </div>

                  <div className="wiki-step">
                    <i className="bi bi-check-circle"></i>
                    <p>
                      Using Docker? Use the{' '}
                      <Link to="#" className="wiki-link">
                        Docker installation guide
                      </Link>{' '}
                      instead.
                    </p>
                  </div>

                  <div className="wiki-step">
                    <i className="bi bi-check-circle"></i>
                    <p>
                      Using Heroku? Use the{' '}
                      <Link to="#" className="wiki-link">
                        Heroku installation guide
                      </Link>{' '}
                      instead.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'administration' && (
              <div className="wiki-section">
                <h2>Administration</h2>
                <hr className="wiki-divider" />

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-globe"></i>
                    <div>
                      <strong>Locales:</strong> Display the wiki in a different
                      language or enable multilingual capabilities.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-people"></i>
                    <div>
                      <strong>User Groups:</strong> Permissions and access
                      rights.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-graph-up"></i>
                    <div>
                      <strong>Telemetry:</strong> Help Wrfcoin developers
                      understand crashes by enabling anonymous telemetry.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-tools"></i>
                    <div>
                      <strong>Troubleshooting:</strong> Solutions to common
                      issues.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'modules-main' && (
              <div className="wiki-section">
                <h2>Modules</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin Core is built with a modular architecture, allowing
                  for flexible configuration and extension.
                </p>

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-box"></i>
                    <div>
                      <strong>Mining Module:</strong> Configure mining
                      parameters, hardware utilization, and reward distribution
                      for solo and pool mining operations.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-grid-3x3"></i>
                    <div>
                      <strong>Sharding Module:</strong> Manage shard allocation,
                      cross-shard transactions, and shard synchronization
                      settings.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-currency-exchange"></i>
                    <div>
                      <strong>Bridge Module:</strong> Configure cross-chain
                      bridges, define security parameters, and manage asset
                      mappings between blockchains.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-journal-code"></i>
                    <div>
                      <strong>Smart Contract Module:</strong> Deploy, monitor,
                      and manage smart contracts with EVM compatibility and
                      Rust-based execution.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-wallet2"></i>
                    <div>
                      <strong>Wallet Module:</strong> Create, import, and manage
                      wallets with advanced security features including
                      multi-signature support.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-graph-up"></i>
                    <div>
                      <strong>Analytics Module:</strong> View detailed
                      blockchain metrics, node performance, and network
                      statistics in real-time.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'modules-mining' && (
              <div className="wiki-section">
                <h2>Mining Module</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin offers multiple mining methods to maximize
                  decentralization and accessibility.
                </p>

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-cpu"></i>
                    <div>
                      <strong>CPU Mining:</strong> Uses your computer's
                      processor(s) to mine WRF coins. Configure thread count,
                      priority, and algorithm optimizations through the Miner
                      Dashboard.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-gpu-card"></i>
                    <div>
                      <strong>GPU Mining:</strong> Leverages graphics card
                      processing power for higher hashrates. Supports multiple
                      GPUs with individual overclocking profiles and power
                      settings.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-diagram-3"></i>
                    <div>
                      <strong>Pool Mining:</strong> Join mining pools to combine
                      hashpower with other miners and receive more consistent
                      rewards. Built-in pool manager allows easy switching
                      between pools.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-award"></i>
                    <div>
                      <strong>Achievement System:</strong> Earn badges and
                      rewards for mining milestones, such as mining your first
                      block, contributing continuously for set periods, or
                      reaching hashrate thresholds.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'modules-sharding' && (
              <div className="wiki-section">
                <h2>Sharding Module</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin's sharding system is a horizontal scaling solution
                  that divides the blockchain into multiple interconnected
                  shards.
                </p>

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-layers"></i>
                    <div>
                      <strong>Shard Architecture:</strong> Each shard processes
                      a subset of transactions based on account ranges, allowing
                      for parallel transaction processing across the network.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-arrow-left-right"></i>
                    <div>
                      <strong>Cross-Shard Transactions:</strong> The system
                      supports transactions between accounts on different
                      shards, coordinated through atomic commit protocols.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-shield-shaded"></i>
                    <div>
                      <strong>Security Model:</strong> Each shard maintains its
                      own validator set while also being secured by the main
                      chain's security mechanisms.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'modules-cross-chain' && (
              <div className="wiki-section">
                <h2>Cross-Chain Bridge Module</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin's cross-chain bridges allow seamless transfer of
                  assets between Wrfcoin and other popular blockchains.
                </p>

                <h3>Supported Blockchains</h3>
                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-ethereum"></i>
                    <div>
                      <strong>Ethereum:</strong> Transfer ERC-20 tokens and
                      ERC-721 NFTs between Ethereum and Wrfcoin with full
                      compatibility.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-currency-bitcoin"></i>
                    <div>
                      <strong>Solana:</strong> Fast transfers of SPL tokens and
                      NFTs with Solana's high throughput and low fees.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-currency-exchange"></i>
                    <div>
                      <strong>BNB Chain:</strong> Bridge BEP-20 tokens and NFTs
                      from BNB Chain to Wrfcoin and back.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'modules-achievements' && (
              <div className="wiki-section">
                <h2>Achievement System</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin's Achievement System recognizes and rewards miners for
                  their contributions to the network through a badge-based
                  system. Achievements are automatically tracked and awarded as
                  miners meet specific criteria.
                </p>

                <h3>Achievement Types</h3>
                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-trophy"></i>
                    <div>
                      <strong>Milestones:</strong> Achievements for reaching
                      specific mining targets such as number of blocks mined,
                      hashrate levels, or total time spent mining.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-calendar-check"></i>
                    <div>
                      <strong>Consistency:</strong> Rewards for consistent
                      mining over time, including uninterrupted daily mining
                      streaks and regular participation.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-lightning-charge"></i>
                    <div>
                      <strong>Performance:</strong> Special recognition for
                      exceptional mining performance, such as finding blocks
                      with particularly high difficulty or contributing to
                      network security during critical periods.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-people"></i>
                    <div>
                      <strong>Community:</strong> Achievements for participating
                      in mining pools, introducing new miners to the network, or
                      contributing to network decentralization.
                    </div>
                  </div>
                </div>

                <h3>Viewing Your Achievements</h3>
                <p>
                  Your earned achievements can be viewed in the{' '}
                  <strong>Miner Dashboard</strong> under the{' '}
                  <strong>Achievements</strong> tab. Each achievement displays:
                </p>
                <ul className="wiki-list">
                  <li>Achievement name and description</li>
                  <li>Date and time awarded</li>
                  <li>Associated badge or visual indicator</li>
                  <li>Any related statistics or progress metrics</li>
                </ul>

                <h3>Technical Implementation</h3>
                <p>
                  The achievement system works through a backend tracking
                  service that monitors miner activities in real-time.
                  Achievements are stored in the database and synchronized
                  across the network to ensure consistency.
                </p>
                <div className="wiki-code-block">
                  <pre>
                    <code>
                      {`// Example achievement definition
{
  id: "first-block",
  name: "Block Pioneer",
  description: "Mine your first block on the Wrfcoin network",
  criteria: "blocks_mined >= 1",
  badge: "pioneer-badge.svg",
  rarity: "common"
}`}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {activeSection === 'user-guide' && (
              <div className="wiki-section">
                <h2>User Guide</h2>
                <hr className="wiki-divider" />

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-wallet2"></i>
                    <div>
                      <strong>Wallet Management:</strong> Create, import, and
                      secure your Wrfcoin wallet with advanced backup and
                      recovery options.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-currency-exchange"></i>
                    <div>
                      <strong>Transactions:</strong> Send and receive WRF with
                      customizable fee settings and transaction privacy options.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-shield-lock"></i>
                    <div>
                      <strong>Security Features:</strong> Enable multi-signature
                      verification, time-locked transactions, and hardware
                      wallet support.
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-tags"></i>
                    <div>
                      <strong>NFT Management:</strong> Create, trade, and view
                      your NFT collection with advanced metadata and category
                      management.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'developers' && (
              <div className="wiki-section">
                <h2>Developers Guide</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin is designed to be developer-friendly with multiple
                  integration options, comprehensive APIs, and support for
                  various programming languages.
                </p>

                <h3>Development Environment Setup</h3>

                <div className="wiki-features">
                  <div className="wiki-feature">
                    <i className="bi bi-tools"></i>
                    <div>
                      <strong>Prerequisites:</strong> Rust (1.60+), Node.js
                      (16+), PostgreSQL (14+), Cargo and npm package managers
                    </div>
                  </div>

                  <div className="wiki-feature">
                    <i className="bi bi-download"></i>
                    <div>
                      <strong>Source Code:</strong> Clone the GitHub repository{' '}
                      <code>
                        git clone https://github.com/wrfcoin/wrfcoin-core.git
                      </code>
                    </div>
                  </div>
                </div>

                <div className="wiki-code-section">
                  <h3>Example: Mining Module Integration</h3>
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`// Import the mining module

// Initialize with your node configuration
const miner = new MiningModule({
  threads: 4,
  algorithm: 'sha256d',
  walletAddress: 'Wrf1AbCdEfGhIjKlMnOpQrStUvWxYz12345678'
});

// Start mining
await miner.start();

// Listen for block found events
miner.on('blockFound', (block) => {
  devLog(\`Block found at height \${block.height}\`);
  devLog(\`Reward: \${block.reward} WRF\`);
});`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'api-reference' && (
              <div className="wiki-section">
                <h2>API Reference</h2>
                <hr className="wiki-divider" />

                <p className="wiki-intro">
                  Wrfcoin provides a comprehensive set of APIs for both web and
                  command-line interfaces. This documentation covers the CLI
                  commands and API endpoints that developers can use.
                </p>

                <h3>CLI Reference</h3>
                <div className="wiki-code-section">
                  <h4>Command Line Interface</h4>
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`wrfcoin-cli [global options] command [command options] [arguments...]

GLOBAL OPTIONS:
  --network value      Network to connect to: mainnet, testnet, devnet (default: "mainnet")
  --config value       Path to config file (default: "~/.wrfcoin/config.json")
  --rpc-url value      RPC URL (default: "http://localhost:8545")
  --wallet value       Path to wallet file
  --password value     Wallet password (will prompt if not provided)
  --json               Output in JSON format
  --verbose            Enable verbose output
  --help, -h           Show help
  --version, -v        Print the version`}
                      </code>
                    </pre>
                  </div>
                </div>

                <h3>Basic Commands</h3>
                <div className="wiki-code-section">
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`# Get network information
wrfcoin-cli network info

# Get account balance
wrfcoin-cli wallet balance

# Send tokens
wrfcoin-cli wallet send --to <ADDRESS> --amount <AMOUNT>

# View transaction history
wrfcoin-cli wallet history

# Get block information
wrfcoin-cli blockchain get-block --height <HEIGHT>
wrfcoin-cli blockchain get-block --hash <HASH>`}
                      </code>
                    </pre>
                  </div>
                </div>

                <h3>Mining Commands</h3>
                <div className="wiki-code-section">
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`# Start mining with specified number of threads
wrfcoin-cli mining start --threads <NUM_THREADS>

# Stop mining
wrfcoin-cli mining stop

# Show mining status
wrfcoin-cli mining status

# Show mining rewards
wrfcoin-cli mining rewards`}
                      </code>
                    </pre>
                  </div>
                </div>

                <h3>Cross-Chain Commands</h3>
                <div className="wiki-code-section">
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`# List supported networks
wrfcoin-cli bridge networks

# Bridge tokens from Wrfcoin to another network
wrfcoin-cli bridge send --to-network <NETWORK> --to-address <ADDRESS> --amount <AMOUNT>

# Check bridge transaction status
wrfcoin-cli bridge status --tx-hash <HASH>

# List recent bridge transactions
wrfcoin-cli bridge history`}
                      </code>
                    </pre>
                  </div>
                </div>

                <h3>Computational NFT Commands</h3>
                <div className="wiki-code-section">
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`# Create computational NFT
wrfcoin-cli nft create-computational --name "My Computation" --script /path/to/script.py --params-file /path/to/params.json

# Run computation on NFT
wrfcoin-cli nft compute --id <NFT_ID> --input-data /path/to/input.json

# Get NFT computation results
wrfcoin-cli nft results --id <NFT_ID> --run-id <RUN_ID>`}
                      </code>
                    </pre>
                  </div>
                </div>

                <h3>API Authentication</h3>
                <p>
                  Command line requests to private API endpoints require
                  authentication. You can authenticate using:
                </p>
                <div className="wiki-code-section">
                  <div className="wiki-code">
                    <pre>
                      <code>
                        {`# Generate new API key (saves to config file)
wrfcoin-cli auth generate-key

# Use existing API key
wrfcoin-cli --api-key YOUR_API_KEY command

# Export environment variable (alternative method)
export WRFCOIN_API_KEY=YOUR_API_KEY
wrfcoin-cli command`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiDocs;
