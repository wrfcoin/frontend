import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState } from 'react';
import { Link } from 'react-router';
import './Resources.css';

import SecurityDocs from './SecurityDocs';
import MaterialDocs from './MaterialDocs';
import EIP712Demo from '../Governance/EIP712Demo';
// SimpleTutorialDocs was removed - inline placeholder used instead

const ResourcesSample = () => {
  const [activeTab, setActiveTab] = useState('tutorials'); // Set tutorials as default since that's what you want to show
  const [activeDoc, setActiveDoc] = useState('introduction');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeTutorial, setActiveTutorial] = useState('setup');
  const [expandedSections, setExpandedSections] = useState(['modules']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSectionClick = section => {
    setActiveSection(section);
  };

  const toggleSectionExpand = section => {
    setExpandedSections(prev => {
      if (prev.includes(section)) {
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  };

  return (
    <div className="resources" style={{ paddingTop: '20px' }}>
      {/* Tab Navigation */}
      <div className="resources-tabs">
        <button
          className={`tab-button ${activeTab === 'documentation' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentation')}
        >
          <i className="bi bi-book"></i>
          Documentation
        </button>
        <button
          className={`tab-button ${activeTab === 'wiki' ? 'active' : ''}`}
          onClick={() => setActiveTab('wiki')}
        >
          <i className="bi bi-journal-text"></i>
          Wiki
        </button>
        <button
          className={`tab-button ${activeTab === 'tutorials' ? 'active' : ''}`}
          onClick={() => setActiveTab('tutorials')}
        >
          <i className="bi bi-play-circle"></i>
          Tutorials
        </button>
        <button
          className={`tab-button ${activeTab === 'eip712' ? 'active' : ''}`}
          onClick={() => setActiveTab('eip712')}
        >
          <i className="bi bi-pen"></i>
          EIP-712 Signing
        </button>
      </div>

      {/* Documentation Tab Content */}
      {activeTab === 'documentation' && <MaterialDocs docId={activeDoc} />}

      {/* Wiki Tab Content */}
      {activeTab === 'wiki' && (
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
            <div
              className={`wiki-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
              <div className="sidebar-header">
                <div className="sidebar-controls">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="sidebar-search"
                    style={{ display: sidebarCollapsed ? 'none' : 'block' }}
                  />
                  <button
                    className="sidebar-pin-button"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={
                      sidebarCollapsed
                        ? 'Expand Articles Panel'
                        : 'Collapse Articles Panel'
                    }
                  >
                    <i
                      className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}
                    ></i>
                    {!sidebarCollapsed && <span>Pin/Unpin</span>}
                  </button>
                </div>
                <h4 style={{ display: sidebarCollapsed ? 'none' : 'block' }}>
                  TABLE OF CONTENTS
                </h4>
              </div>
              <div className="table-of-contents">
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
                  className={`toc-item with-submenu ${activeSection.startsWith('standards') ? 'active' : ''}`}
                  onClick={() => toggleSectionExpand('standards')}
                >
                  <i
                    className={`bi ${expandedSections.includes('standards') ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  ></i>
                  <span>Blockchain Standards</span>
                </div>
                {expandedSections.includes('standards') && (
                  <div className="submenu">
                    <div
                      className={`toc-item submenu-item ${activeSection === 'standards-overview' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('standards-overview')}
                    >
                      <span>Overview</span>
                    </div>
                    <div
                      className={`toc-item submenu-item ${activeSection === 'standards-ethereum' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('standards-ethereum')}
                    >
                      <span>Ethereum Standards</span>
                    </div>
                    <div
                      className={`toc-item submenu-item ${activeSection === 'standards-cross-chain' ? 'active' : ''}`}
                      onClick={() =>
                        handleSectionClick('standards-cross-chain')
                      }
                    >
                      <span>Cross-Chain Standards</span>
                    </div>
                    <div
                      className={`toc-item submenu-item ${activeSection === 'standards-data' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('standards-data')}
                    >
                      <span>Data Standards</span>
                    </div>
                    <div
                      className={`toc-item submenu-item ${activeSection === 'standards-iso' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('standards-iso')}
                    >
                      <span>ISO Compliance</span>
                    </div>
                  </div>
                )}
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
                  <div className="submenu">
                    <div
                      className={`toc-item submenu-item ${activeSection === 'modules-mining' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('modules-mining')}
                    >
                      <span>Mining</span>
                    </div>
                    <div
                      className={`toc-item submenu-item ${activeSection === 'modules-cross-chain' ? 'active' : ''}`}
                      onClick={() => handleSectionClick('modules-cross-chain')}
                    >
                      <span>Cross-Chain Bridge</span>
                    </div>
                  </div>
                )}
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
                        <strong>Locales:</strong> Display the wiki in a
                        different language or enable multilingual capabilities.
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
                        <strong>Pool Mining:</strong> Join mining pools to
                        combine hashpower with other miners and receive more
                        consistent rewards. Built-in pool manager allows easy
                        switching between pools.
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

              {activeSection === 'standards-overview' && (
                <div className="wiki-section">
                  <h2>Blockchain Standards Overview</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Standards define the interoperability, compatibility, and
                    implementation guidelines for blockchain systems. Wrfcoin
                    implements comprehensive standards to ensure seamless
                    integration across networks.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-shield-check"></i>
                      <div>
                        <strong>Interoperability:</strong> Ensures seamless
                        communication between different blockchain networks and
                        protocols.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-gear"></i>
                      <div>
                        <strong>Compatibility:</strong> Maintains backward and
                        forward compatibility with existing and future
                        blockchain implementations.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-check-circle"></i>
                      <div>
                        <strong>Quality Assurance:</strong> Provides consistent
                        behavior and predictable outcomes across different
                        environments.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-people"></i>
                      <div>
                        <strong>Adoption:</strong> Facilitates widespread
                        adoption by providing clear, well-documented
                        implementation guidelines.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'standards-ethereum' && (
                <div className="wiki-section">
                  <h2>Ethereum Standards</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Wrfcoin implements key Ethereum Improvement Proposals (EIPs)
                    and Ethereum Request for Comments (ERCs) to ensure full
                    compatibility with the Ethereum ecosystem.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-file-text"></i>
                      <div>
                        <strong>EIP-712: Typed Data Signing</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Enables structured data signing for improved security
                        and user experience in DApps.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-bank"></i>
                      <div>
                        <strong>ERC-4626: Tokenized Vaults</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Standard for yield-bearing token vaults, enabling DeFi
                        composability.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-image"></i>
                      <div>
                        <strong>ERC-721: Non-Fungible Tokens</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Standard for unique digital assets and computational
                        NFTs.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-collection"></i>
                      <div>
                        <strong>ERC-1155: Multi-Token Standard</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Supports both fungible and non-fungible tokens in a
                        single contract.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'standards-cross-chain' && (
                <div className="wiki-section">
                  <h2>Cross-Chain Standards</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Cross-chain standards enable seamless asset transfers and
                    communication between different blockchain networks.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-arrows-expand"></i>
                      <div>
                        <strong>IBC Protocol</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Inter-Blockchain Communication protocol for secure
                        cross-chain asset transfers and data exchange.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-network-wired"></i>
                      <div>
                        <strong>XCMP (Polkadot)</strong>
                        <br />
                        <span style={{ color: '#ffc107' }}>🔄 IN PROGRESS</span>
                        <br />
                        Cross-Consensus Message Passing for communication within
                        the Polkadot ecosystem.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-bridge"></i>
                      <div>
                        <strong>Multi-Protocol Bridge Support</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Support for 13+ bridge protocols including LayerZero,
                        Axelar, and Wormhole.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'standards-data' && (
                <div className="wiki-section">
                  <h2>Data Standards</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Wrfcoin implements specialized data standards for weather,
                    climate, and environmental data processing.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-cloud-sun"></i>
                      <div>
                        <strong>WrfML Data Format</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Machine learning optimized format for weather and
                        climate data with built-in validation.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-broadcast"></i>
                      <div>
                        <strong>WXM Protocol</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Weather eXchange Message protocol for real-time weather
                        data distribution and validation.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-geo-alt"></i>
                      <div>
                        <strong>Geographic Metadata</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        ISO 19115 compliant geographic information metadata for
                        spatial data management.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'standards-iso' && (
                <div className="wiki-section">
                  <h2>ISO Compliance Standards</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Wrfcoin maintains compliance with international ISO
                    standards for security, quality management, and
                    environmental practices.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-shield-lock"></i>
                      <div>
                        <strong>ISO 27001 - Information Security</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ CERTIFIED</span>
                        <br />
                        Comprehensive information security management system.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-award"></i>
                      <div>
                        <strong>ISO 9001 - Quality Management</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ CERTIFIED</span>
                        <br />
                        Quality management system ensuring consistent service
                        delivery.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-tree"></i>
                      <div>
                        <strong>ISO 14001 - Environmental Management</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ COMPLIANT</span>
                        <br />
                        Environmental management for sustainable blockchain
                        operations.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-graph-up"></i>
                      <div>
                        <strong>ISO 8000 - Data Quality</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>✅ IMPLEMENTED</span>
                        <br />
                        Data quality management for climate and weather data
                        validation.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-geo"></i>
                      <div>
                        <strong>ISO 19115 - Geographic Information</strong>
                        <br />
                        <span style={{ color: '#28a745' }}>
                          ✅ IMPLEMENTED (96% compliant)
                        </span>
                        <br />
                        Geographic data metadata standards for location-based
                        climate data.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-speedometer2"></i>
                      <div>
                        <strong>
                          ISO 19156 - Observations and Measurements
                        </strong>
                        <br />
                        <span style={{ color: '#28a745' }}>
                          ✅ IMPLEMENTED (94% compliant)
                        </span>
                        <br />
                        Weather and climate observation standardization
                        framework.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'modules-cross-chain' && (
                <div className="wiki-section">
                  <h2>Cross-Chain Bridge</h2>
                  <hr className="wiki-divider" />

                  <p className="wiki-intro">
                    Wrfcoin's cross-chain bridge enables seamless asset
                    transfers across 13+ blockchain networks.
                  </p>

                  <div className="wiki-features">
                    <div className="wiki-feature">
                      <i className="bi bi-arrows-expand"></i>
                      <div>
                        <strong>Multi-Protocol Support:</strong> Compatible with
                        Ethereum, Polygon, BSC, Avalanche, and more through
                        various bridge protocols.
                      </div>
                    </div>

                    <div className="wiki-feature">
                      <i className="bi bi-shield-check"></i>
                      <div>
                        <strong>Security:</strong> Advanced security measures
                        including multi-signature validation and time-locked
                        transactions.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tutorials Tab Content - Enhanced with Functional Components */}
      {activeTab === 'tutorials' && (
        <div className="tutorials-wrapper">
          <div className="tutorials-header">
            <div className="tutorials-title">
              <h3>Wrfcoin Tutorials</h3>
              <p className="subtitle">Step-by-step guides to get you started</p>
            </div>
            <div className="tutorials-search">
              <div className="search-wrapper">
                <i className="bi bi-search"></i>
                <input type="text" placeholder="Search tutorials..." />
              </div>
            </div>
          </div>

          <div className="tutorials-content">
            <div
              className={`tutorials-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
              <div className="sidebar-header">
                <div className="sidebar-controls">
                  <input
                    type="text"
                    placeholder="Search tutorials..."
                    className="sidebar-search"
                    style={{ display: sidebarCollapsed ? 'none' : 'block' }}
                  />
                  <button
                    className="sidebar-pin-button"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={
                      sidebarCollapsed
                        ? 'Expand Tutorials Panel'
                        : 'Collapse Tutorials Panel'
                    }
                  >
                    <i
                      className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}
                    ></i>
                    {!sidebarCollapsed && <span>Pin/Unpin</span>}
                  </button>
                </div>
                <h4 style={{ display: sidebarCollapsed ? 'none' : 'block' }}>
                  CATEGORIES
                </h4>
              </div>
              <div className="tutorial-categories">
                <div
                  className={`tutorial-item ${activeTutorial === 'setup' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('setup')}
                >
                  <i className="bi bi-gear"></i>
                  <span>Initial Setup</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'mining' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('mining')}
                >
                  <i className="bi bi-cpu"></i>
                  <span>Mining Guide</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'wallet' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('wallet')}
                >
                  <i className="bi bi-wallet2"></i>
                  <span>Wallet Management</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'cross-chain' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('cross-chain')}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Cross-Chain Bridge</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'nft' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('nft')}
                >
                  <i className="bi bi-image"></i>
                  <span>Computational NFTs</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'governance' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('governance')}
                >
                  <i className="bi bi-people"></i>
                  <span>Governance</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'standards' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('standards')}
                >
                  <i className="bi bi-check2-square"></i>
                  <span>Blockchain Standards</span>
                </div>
                <div
                  className={`tutorial-item ${activeTutorial === 'iso-compliance' ? 'active' : ''}`}
                  onClick={() => setActiveTutorial('iso-compliance')}
                >
                  <i className="bi bi-award"></i>
                  <span>ISO Compliance</span>
                </div>
              </div>

              <div className="tutorial-progress">
                <h4>YOUR PROGRESS</h4>
                <div className="progress-item">
                  <span>Completed Tutorials</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: '65%' }}
                    ></div>
                  </div>
                  <span className="progress-text">4/6</span>
                </div>
              </div>
            </div>

            <div className="tutorials-main-content">
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                <h3>Tutorial: {activeTutorial}</h3>
                <p>Tutorial content is being integrated into the main documentation.</p>
                <p>Visit the Wiki section for comprehensive guides.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EIP-712 Signing Demo Tab */}
      {activeTab === 'eip712' && <EIP712Demo />}
    </div>
  );
};

const Resources = (props) => (
  <DemoSurfaceGate
    testId="resources"
    title="Resources preview is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <ResourcesSample {...props} />
  </DemoSurfaceGate>
);

export default Resources;
