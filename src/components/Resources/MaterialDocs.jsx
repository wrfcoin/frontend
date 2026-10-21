import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import './Resources.css';
import { devLog } from '../../utils/logger';

/**
 * Simple markdown to HTML converter
 * Converts basic Markdown syntax to HTML
 */
const convertMarkdownToHTML = markdownText => {
  if (!markdownText) return '';

  let html = markdownText;

  // Convert headings (# Heading 1, ## Heading 2, etc.)
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');

  // Convert bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert lists (- item)
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');

  // Convert numbered lists (1. item)
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ol>$&</ol>');

  // Convert links [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Convert code blocks (```code```)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

  // Convert inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert paragraphs (blank lines between text)
  html = html.replace(/\n\n/g, '</p><p>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  return html;
};

/**
 * Extract headings from markdown content for table of contents
 */
const extractHeadings = markdownText => {
  if (!markdownText) return [];

  const headings = [];
  const lines = markdownText.split('\n');

  lines.forEach(line => {
    const h1Match = line.match(/^# (.*$)/);
    const h2Match = line.match(/^## (.*$)/);
    const h3Match = line.match(/^### (.*$)/);

    if (h1Match) {
      const text = h1Match[1];
      const id = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ text, id, level: 1 });
    } else if (h2Match) {
      const text = h2Match[1];
      const id = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ text, id, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1];
      const id = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ text, id, level: 3 });
    }
  });

  return headings;
};

/**
 * Material Design inspired documentation component with left sidebar navigation
 * Displays documentation content from markdown files in a clean, modern interface
 */
const MaterialDocsSample = ({ docId }) => {
  const [docContent, setDocContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [headings, setHeadings] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  // Use document.body.classList to check for dark-mode
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains('dark-mode'),
  );
  const searchInputRef = useRef(null);

  // Fetch list of available documents from the doc_center folder using API
  useEffect(() => {
    const fetchAvailableDocs = async () => {
      try {
        // Attempt to fetch the document list from the API
        const response = await fetch('/api/documentation/list');

        if (!response.ok) {
          throw new Error(`Failed to fetch document list: ${response.status}`);
        }

        const result = await response.json();

        if (
          result.success &&
          result.documents &&
          Array.isArray(result.documents)
        ) {
          setAvailableDocs(result.documents);
        } else {
          // Fallback to static list if API fails or returns unexpected data
          const docs = [
            {
              id: 'introduction',
              title: 'Introduction to Wrfcoin',
              path: 'doc_center/introduction.md',
              description:
                'A comprehensive overview of the Wrfcoin blockchain ecosystem',
              updated: 'May 18, 2025',
              sections: [
                'Core Features',
                'Network Participants',
                'Technical Architecture',
                'Token Economics',
              ],
            },
            {
              id: 'computational-nfts',
              title: 'Computational NFTs',
              path: 'doc_center/computational-nfts.md',
              description:
                'Explore the revolutionary concept of Computational Non-Fungible Tokens',
              updated: 'May 18, 2025',
              sections: [
                'What are Computational NFTs?',
                'Use Cases',
                'Creating CNFTs',
              ],
            },
            {
              id: 'node-operation',
              title: 'Node Operation Guide',
              path: 'doc_center/node-operation.md',
              description:
                'Instructions for setting up and running a Wrfcoin node',
              updated: 'May 18, 2025',
              sections: [
                'Requirements',
                'Installation',
                'Configuration',
                'Troubleshooting',
              ],
            },
            {
              id: 'weather-data-protocol',
              title: 'Weather Data Protocol',
              path: 'doc_center/weather-data-protocol.md',
              description:
                'Technical specification of the Weather Data Protocol used by Wrfcoin',
              updated: 'May 18, 2025',
              sections: [
                'Data Models',
                'Validation Rules',
                'Data Submission',
                'Verification',
              ],
            },
            {
              id: 'governance',
              title: 'Governance Framework',
              path: 'doc_center/governance.md',
              description:
                'Understanding the decentralized governance structure of Wrfcoin',
              updated: 'May 18, 2025',
              sections: [
                'Governance Philosophy',
                'Voting System',
                'Treasury Management',
                'Proposal System',
              ],
            },
          ];

          setAvailableDocs(docs);
          console.warn('Using fallback document list due to API error');
        }
      } catch (error) {
        console.error('Error fetching available docs:', error);

        // Fallback to static list if API fails
        const docs = [
          {
            id: 'introduction',
            title: 'Introduction to Wrfcoin',
            path: 'doc_center/introduction.md',
            description:
              'A comprehensive overview of the Wrfcoin blockchain ecosystem',
            updated: 'May 18, 2025',
            sections: [
              'Core Features',
              'Network Participants',
              'Technical Architecture',
              'Token Economics',
            ],
          },
          {
            id: 'computational-nfts',
            title: 'Computational NFTs',
            path: 'doc_center/computational-nfts.md',
            description:
              'Explore the revolutionary concept of Computational Non-Fungible Tokens',
            updated: 'May 18, 2025',
            sections: [
              'What are Computational NFTs?',
              'Use Cases',
              'Creating CNFTs',
            ],
          },
          {
            id: 'node-operation',
            title: 'Node Operation Guide',
            path: 'doc_center/node-operation.md',
            description:
              'Instructions for setting up and running a Wrfcoin node',
            updated: 'May 18, 2025',
            sections: [
              'Requirements',
              'Installation',
              'Configuration',
              'Troubleshooting',
            ],
          },
          {
            id: 'weather-data-protocol',
            title: 'Weather Data Protocol',
            path: 'doc_center/weather-data-protocol.md',
            description:
              'Technical specification of the Weather Data Protocol used by Wrfcoin',
            updated: 'May 18, 2025',
            sections: [
              'Data Models',
              'Validation Rules',
              'Data Submission',
              'Verification',
            ],
          },
          {
            id: 'governance',
            title: 'Governance Framework',
            path: 'doc_center/governance.md',
            description:
              'Understanding the decentralized governance structure of Wrfcoin',
            updated: 'May 18, 2025',
            sections: [
              'Governance Philosophy',
              'Voting System',
              'Treasury Management',
              'Proposal System',
            ],
          },
        ];

        setAvailableDocs(docs);
        setError('Failed to load document list from API, using fallback data');
      }
    };

    fetchAvailableDocs();
  }, []);

  // Handle search functionality
  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };

  // Listen for changes to the app's theme system
  useEffect(() => {
    // Setup a mutation observer to detect theme changes in the document body
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const darkModeEnabled = document.body.classList.contains('dark-mode');
          setIsDarkMode(darkModeEnabled);
        }
      });
    });

    // Start observing the document body for class changes
    observer.observe(document.body, { attributes: true });

    // Cleanup the observer when component unmounts
    return () => observer.disconnect();
  }, []);

  // Handle section selection
  const scrollToSection = sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle document selection
  const selectDocument = selectedDocId => {
    if (selectedDocId !== docId) {
      window.history.pushState({}, '', `/resources/docs/${selectedDocId}`);
      setSearchTerm('');
      setLoading(true);
      setError(null);

      const selectedDoc = availableDocs.find(doc => doc.id === selectedDocId);
      if (selectedDoc) {
        if (docData[selectedDocId]) {
          // Use existing data if already loaded
          setDocContent(docData[selectedDocId]);
          setHeadings(extractHeadings(docData[selectedDocId].content));
          setLoading(false);
        } else {
          // First try to get the content from the API
          fetch(`/api/documentation/content/${selectedDocId}`)
            .then(response => {
              if (!response.ok) {
                console.error(
                  `Failed to fetch document content from API: ${response.status}`,
                );
                // Fall back to fetching the file directly
                return fetch(`/docs/${selectedDoc.path}`);
              }
              return response.json().then(data => {
                if (data.success && data.document) {
                  return data.document.content;
                }
                throw new Error('Invalid API response format');
              });
            })
            .catch(error => {
              console.error('API fetch failed:', error);
              // Fall back to fetching the file directly
              return fetch(`/docs/${selectedDoc.path}`).then(response =>
                response.text(),
              );
            })
            .then(responseOrContent => {
              // If it's a Response object (from the second fetch), get the text
              if (responseOrContent instanceof Response) {
                if (!responseOrContent.ok) {
                  console.error(
                    `Failed to fetch markdown file /docs/${selectedDoc.path}: ${responseOrContent.status}`,
                  );
                  // Try without the /docs prefix
                  return fetch(`/${selectedDoc.path}`).then(response =>
                    response.text(),
                  );
                }
                return responseOrContent.text();
              }
              // If it's already the content (from the API), just return it
              return responseOrContent;
            })
            .catch(error => {
              console.error('Second fetch attempt failed:', error);
              // Try without the /docs prefix
              return fetch(`/${selectedDoc.path}`).then(response =>
                response.text(),
              );
            })
            .catch(error => {
              console.error('Third fetch attempt failed:', error);
              // Try other possible locations
              return fetch(selectedDoc.path).then(response => response.text());
            })
            .then(markdownContent => {
              const docInfo = {
                title: selectedDoc.title,
                subtitle: selectedDoc.description,
                content: markdownContent,
                updated: selectedDoc.updated,
              };

              // Cache the content
              docData[selectedDocId] = docInfo;

              setDocContent(docInfo);
              setHeadings(extractHeadings(markdownContent));
              setLoading(false);
            })
            .catch(err => {
              console.error('Error loading markdown file:', err);
              setError(`Failed to load documentation: ${err.message}`);
              setLoading(false);
            });
        }
      }
    }
  };

  // Mock document data (will be replaced by actual markdown content)
  const docData = {
    introduction: {
      title: 'Introduction to Wrfcoin',
      subtitle: 'A comprehensive overview of the Wrfcoin blockchain ecosystem',
      content: `
# Introduction to Wrfcoin

Wrfcoin is a revolutionary layer 1 blockchain designed specifically for weather, research, and forecasting (WRF) data. Our mission is to create a decentralized ecosystem that incentivizes the collection, validation, and utilization of meteorological data while fostering innovation in climate science and environmental research.

## Core Features

- **Weather Data Blockchain**: A purpose-built blockchain optimized for meteorological data storage and validation
- **Proof of Location**: A novel consensus mechanism that validates data based on geographic coordinates
- **Computational NFTs**: Non-fungible tokens that contain executable code for data processing
- **Cross-Chain Interoperability**: Seamless integration with major blockchain ecosystems
- **Incentive Layer**: Token economics designed to reward high-quality data contributions

## Network Participants

- **Data Providers**: Weather stations, satellites, and IoT devices that submit raw meteorological data
- **Validators**: Nodes that verify data accuracy and maintain network consensus
- **Computational Nodes**: Specialized hardware that processes complex weather models
- **Developers**: Creators of applications and services built on the Wrfcoin ecosystem
- **End Users**: Consumers of weather data, forecasts, and derived insights

## Technical Architecture

Wrfcoin employs a hybrid architecture with multiple layers:

1. **Core Blockchain Layer**: Built in Rust for performance and security
2. **Smart Contract Layer**: For programmable data interactions
3. **Data Protocol Layer**: Standardized formats for weather data encoding
4. **API Layer**: Easy access points for applications and services
5. **Application Layer**: End-user facing tools and platforms

## Token Economics

The native WRF token serves multiple purposes in the ecosystem:

- Network transaction fees
- Staking for validators
- Computational resources allocation
- Data access rights
- Governance participation

## Getting Started

To begin contributing to or building on the Wrfcoin network, explore our developer resources, join our community channels, or set up a node to participate in the network.
      `,
      updated: 'May 18, 2025',
    },
    'computational-nfts': {
      title: 'Computational NFTs',
      subtitle:
        'Explore the revolutionary concept of Computational Non-Fungible Tokens',
      content: `
# Computational NFTs

Computational NFTs represent a paradigm shift in how we think about non-fungible tokens. Unlike traditional NFTs which simply point to static content, Computational NFTs contain executable code that can process data, perform calculations, and generate new outputs.

## What Makes Computational NFTs Different?

Traditional NFTs are essentially digital certificates of ownership for a specific piece of content. Computational NFTs extend this concept by incorporating:

- **Executable Code**: JavaScript, Python, or WebAssembly code embedded in the token
- **Input Parameters**: Configuration options that affect the execution
- **Computational Logic**: Algorithms that transform input data into meaningful outputs
- **Resource Requirements**: Specifications for CPU, memory, and storage needs

## Use Cases in the Wrfcoin Ecosystem

Computational NFTs serve several critical functions in the Wrfcoin network:

### Weather Model NFTs

These NFTs contain the code for specific weather prediction models. When executed against current weather data, they generate forecasts with different specialties:

- Hurricane trajectory prediction models
- Precipitation forecasting models
- Temperature trend analysis models
- Wind pattern predictors

### Data Processing NFTs

These NFTs transform raw meteorological data into standardized formats or derive higher-order insights:

- Data normalization algorithms
- Quality control processors
- Statistical analysis models
- Feature extraction algorithms

### Visualization NFTs

These NFTs take weather data and render it into visual formats:

- Heat map generators
- Animated weather pattern visualizers
- Interactive forecast displays
- Data comparison tools

## Creating a Computational NFT

Developers can create Computational NFTs through the Wrfcoin Core application by:

1. Defining the computational logic in a supported language
2. Specifying resource requirements
3. Setting input parameters and their constraints
4. Defining the output format and validation rules
5. Minting the NFT on the Wrfcoin blockchain

## Executing Computational NFTs

When a Computational NFT is executed, the following process occurs:

1. The code is retrieved from decentralized storage
2. Input data is validated against requirements
3. The execution environment is prepared based on resource specifications
4. The code runs in a sandboxed environment
5. Results are validated and returned to the caller
6. Execution metrics are recorded on-chain

## Economics of Computational NFTs

Computational NFTs introduce new economic models to the blockchain ecosystem:

- **Usage-Based Pricing**: NFT owners can charge based on execution time or complexity
- **Subscription Models**: Regular access to computational capabilities
- **Result Quality Incentives**: Rewards based on the accuracy of outputs
- **Collaborative Development**: Revenue sharing for improvements to existing models

## Future Directions

The Computational NFT standard is evolving to include:

- Cross-chain execution capabilities
- AI model integration
- Federated learning protocols
- On-chain result verification
- Decentralized computation marketplaces
      `,
      updated: 'May 18, 2025',
    },
    'developer-guide': {
      title: 'Developer Guide',
      subtitle:
        'Comprehensive resources for building on the Wrfcoin blockchain',
      content: `
# Developer Guide

This guide provides essential information for developers interested in building applications, services, or integrations with the Wrfcoin blockchain ecosystem.

## Development Environment Setup

### Prerequisites

- Rust 1.65 or higher
- Node.js 18 or higher
- Python 3.9 or higher (for data science applications)
- Docker and Docker Compose
- Git

### Installing the SDK

\`\`\`bash
# JavaScript/TypeScript SDK
npm install @wrfcoin/sdk

# Rust SDK
cargo add wrfcoin-sdk

# Python SDK
pip install wrfcoin-sdk
\`\`\`

## Core Concepts

### Node Types

Wrfcoin supports several types of nodes with different roles:

- **Full Nodes**: Maintain a complete copy of the blockchain
- **Validator Nodes**: Participate in consensus and block validation
- **API Nodes**: Provide RPC endpoints for applications
- **Computational Nodes**: Execute Computational NFTs and process data
- **Light Clients**: Access blockchain data without storing the full chain

### Data Structures

Key data structures in the Wrfcoin ecosystem:

- **WeatherData**: The core data type for meteorological measurements
- **GeographicPoint**: Location data with latitude, longitude, and altitude
- **DataQualityMetrics**: Measurements of data reliability and accuracy
- **ComputationalTask**: Specification for data processing jobs
- **ValidationProof**: Evidence of data accuracy verification

### APIs and Interfaces

The Wrfcoin network provides several API interfaces:

- **JSON-RPC API**: Core blockchain interaction
- **GraphQL API**: Flexible data querying
- **REST API**: Simplified access for common operations
- **WebSocket API**: Real-time updates and notifications
- **IPFS Gateway**: Access to decentralized storage

## Smart Contract Development

Wrfcoin supports multiple smart contract environments:

### Rust Smart Contracts

\`\`\`rust
use wrfcoin_contract::prelude::*;

#[contract]
mod weather_data_validator {
    #[state]
    struct ValidatorState {
        owner: Address,
        validators: Vec<Address>,
        threshold: u32,
    }

    #[constructor]
    fn init(ctx: ConstructorContext, threshold: u32) -> Result<ValidatorState, ContractError> {
        Ok(ValidatorState {
            owner: ctx.sender,
            validators: vec![],
            threshold,
        })
    }

    #[message(writable)]
    fn add_validator(&mut self, validator: Address) -> Result<(), ContractError> {
        // Implementation details
    }

    #[message(readonly)]
    fn validate_data(&self, data: WeatherData) -> Result<bool, ContractError> {
        // Implementation details
    }
}
\`\`\`

### JavaScript Smart Contracts

\`\`\`javascript

export class WeatherDataAggregator extends Contract {
  constructor() {
    super();
    this.measurements = [];
    this.providers = new Map();
    this.minReportThreshold = 3;
  }

  @action
  registerProvider(address, credentials) {
    // Verify credentials
    // Add to providers map
  }

  @action
  submitMeasurement(data) {
    // Validate measurement data
    // Store in measurements array
  }

  @view
  getAggregatedData(location, timeRange) {
    // Filter and aggregate measurements
    // Return processed data
  }
}
\`\`\`

## Wrfcoin SDK

The Wrfcoin SDK provides comprehensive tools for interacting with the network:

\`\`\`javascript

// Initialize client
const client = new WrfcoinClient({
  network: 'testnet',
  apiKey: process.env.WRFCOIN_API_KEY
});

// Get current blockchain status
const status = await client.getNetworkStatus();
devLog(\`Current block height: \${status.blockHeight}\`);

// Submit weather data
const result = await client.submitWeatherData({
  latitude: 37.7749,
  longitude: -122.4194,
  temperature: 18.5,
  humidity: 73,
  pressure: 1013.2,
  timestamp: Date.now(),
  source: 'station-sf-001'
});

// Execute a Computational NFT
const computeResult = await client.executeNFT({
  nftId: 'comp-nft-12345',
  inputs: {
    region: 'north-america',
    parameters: ['temperature', 'precipitation'],
    resolution: '0.5deg'
  }
});
\`\`\`

## Testing and Debugging

Wrfcoin provides several tools for testing and debugging applications:

- **Local Development Network**: Run a local instance of the Wrfcoin blockchain
- **Mock Weather Data Generator**: Create synthetic weather data for testing
- **Contract Debugger**: Step-by-step execution of smart contract code
- **Transaction Tracer**: Analyze the execution path of transactions
- **Performance Profiler**: Identify bottlenecks in application code

## Deployment

When your application is ready for deployment, you can:

1. **Testnet Deployment**: Deploy to the Wrfcoin testnet for final validation
2. **Mainnet Deployment**: Move to production on the Wrfcoin mainnet
3. **CI/CD Integration**: Automate deployment with GitHub Actions or similar tools
4. **Monitoring Setup**: Configure alerts and dashboards for production monitoring

## Resources

- **Documentation**: Comprehensive guides and API references
- **Sample Applications**: Example code demonstrating key features
- **Community Forums**: Connect with other developers
- **Developer Discord**: Get real-time assistance from the Wrfcoin team
- **Monthly Webinars**: Learn about new features and best practices
      `,
      updated: 'May 18, 2025',
    },
    'node-operation': {
      title: 'Node Operation Guide',
      subtitle: 'Instructions for setting up and running a Wrfcoin node',
      content: `
# Node Operation Guide

This guide provides instructions for setting up and running a Wrfcoin node, whether as a validator, API provider, or computational node.

## Hardware Requirements

### Minimum Requirements

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 500 GB SSD
- **Network**: 10 Mbps dedicated connection
- **Operating System**: Ubuntu 22.04 LTS, Debian 11, or similar Linux distribution

### Recommended Specifications

- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 1+ TB NVMe SSD
- **Network**: 100+ Mbps dedicated connection
- **Operating System**: Ubuntu 22.04 LTS, Debian 11, or similar Linux distribution

### Validator Node Additional Requirements

- **Hardware Security Module (HSM)**: For secure key management (recommended)
- **Redundant power supply**: To ensure uptime
- **Backup internet connection**: To maintain network connectivity

## Installation

### Using Docker (Recommended)

1. Install Docker and Docker Compose:
   \`\`\`bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose
   \`\`\`

2. Clone the Wrfcoin Node repository:
   \`\`\`bash
   git clone https://github.com/wrfcoin/node.git
   cd node
   \`\`\`

3. Configure your node:
   \`\`\`bash
   cp .env.example .env
   nano .env
   \`\`\`
   Edit the configuration parameters as needed.

4. Start the node:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

### Binary Installation

1. Download the latest release from the GitHub releases page.

2. Extract the archive:
   \`\`\`bash
   tar -xzvf wrfcoin-node-v1.2.3-linux-amd64.tar.gz
   cd wrfcoin-node
   \`\`\`

3. Run the installation script:
   \`\`\`bash
   ./install.sh
   \`\`\`

4. Configure your node:
   \`\`\`bash
   nano ~/.wrfcoin/config.toml
   \`\`\`

5. Start the node:
   \`\`\`bash
   wrfcoin-node start
   \`\`\`

## Node Types and Configuration

### Full Node

A full node maintains a complete copy of the blockchain but does not participate in consensus.

\`\`\`toml
# ~/.wrfcoin/config.toml
[node]
type = "full"
network = "mainnet"
moniker = "my-full-node"

[p2p]
seeds = ["seed1.wrfcoin.network:26656", "seed2.wrfcoin.network:26656"]
persistent_peers = ["peer1.wrfcoin.network:26656"]
\`\`\`

### Validator Node

A validator node participates in consensus by proposing and validating blocks.

\`\`\`toml
# ~/.wrfcoin/config.toml
[node]
type = "validator"
network = "mainnet"
moniker = "my-validator-node"

[p2p]
seeds = ["seed1.wrfcoin.network:26656", "seed2.wrfcoin.network:26656"]
persistent_peers = ["peer1.wrfcoin.network:26656"]

[validator]
consensus_key = "file:///home/user/.wrfcoin/consensus_key.json"
\`\`\`

You will need to create a validator key:

\`\`\`bash
wrfcoin-node keys create validator --keyring-backend file
\`\`\`

### Computational Node

A computational node executes Computational NFTs and processes data.

\`\`\`toml
# ~/.wrfcoin/config.toml
[node]
type = "computational"
network = "mainnet"
moniker = "my-compute-node"

[p2p]
seeds = ["seed1.wrfcoin.network:26656", "seed2.wrfcoin.network:26656"]
persistent_peers = ["peer1.wrfcoin.network:26656"]

[computational]
max_concurrent_tasks = 4
supported_frameworks = ["javascript", "python", "wasm"]
resource_limits = { cpu = 8, memory = "16GB", storage = "100GB" }
\`\`\`

## Node Management

### Monitoring

It's essential to monitor your node's performance and status:

1. Install Prometheus and Grafana:
   \`\`\`bash
   docker-compose -f monitoring/docker-compose.yml up -d
   \`\`\`

2. Access the Grafana dashboard at http://your-server-ip:3000
   Default credentials: admin/admin

### Updating

To update your node to a new version:

\`\`\`bash
# For Docker installation
git pull
docker-compose down
docker-compose up -d

# For binary installation
wrfcoin-node update
\`\`\`

### Backing Up

Regularly back up your node's data and configuration:

\`\`\`bash
# Back up data directory
tar -czvf wrfcoin-data-backup-$(date +%Y%m%d).tar.gz ~/.wrfcoin/data

# Back up configuration
cp ~/.wrfcoin/config.toml ~/.wrfcoin/config.toml.backup

# Back up keys (very important!)
tar -czvf wrfcoin-keys-backup-$(date +%Y%m%d).tar.gz ~/.wrfcoin/keys
\`\`\`

## Validator Operations

### Staking and Delegation

To register as a validator:

\`\`\`bash
wrfcoin-node tx staking create-validator \
  --amount=1000000wrf \
  --pubkey=$(wrfcoin-node tendermint show-validator) \
  --moniker="my-validator-node" \
  --website="https://example.com" \
  --details="Description of your validator" \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --from=validator \
  --chain-id=wrfcoin-mainnet-1
\`\`\`

### Slashing Risks

Be aware of the behaviors that can result in slashing:

- Double signing: Running the same validator on multiple machines
- Downtime: Being offline for too long
- Invalid transactions: Proposing blocks with invalid transactions

To minimize these risks:
- Use a Sentry Node Architecture
- Implement proper monitoring and alerting
- Regularly update your node software

## Troubleshooting

### Common Issues

1. **Node won't start**
   Check logs with:
   \`\`\`bash
   docker-compose logs -f
   # or
   journalctl -u wrfcoin-node.service -f
   \`\`\`

2. **Node is not syncing**
   Verify your network configuration and peer connections:
   \`\`\`bash
   wrfcoin-node status
   wrfcoin-node net_info
   \`\`\`

3. **Out of disk space**
   Clean up old data:
   \`\`\`bash
   wrfcoin-node prune-data
   \`\`\`

4. **Validator is jailed**
   Unjail your validator:
   \`\`\`bash
   wrfcoin-node tx slashing unjail --from validator
   \`\`\`

## Community and Support

- **Wrfcoin Node Operators Telegram**: Join other node operators for advice and support
- **GitHub Issues**: Report bugs or suggest improvements
- **Wrfcoin Forum**: Discuss governance and network updates
- **Wrfcoin Discord**: Get real-time assistance from the Wrfcoin team
      `,
      updated: 'May 18, 2025',
    },
    'weather-data-protocol': {
      title: 'Weather Data Protocol',
      subtitle:
        'Technical specification of the Weather Data Protocol used by Wrfcoin',
      content: `
# Weather Data Protocol

The Weather Data Protocol (WDP) is a standardized format for encoding, validating, and exchanging meteorological data on the Wrfcoin blockchain. This protocol ensures data consistency, reliability, and interoperability across the network.

## Data Models

### WeatherObservation

The core data structure for weather measurements:

\`\`\`json
{
  "stationId": "KSFO-001",
  "timestamp": 1715962800,
  "geoLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 16.0,
    "locationType": "FIXED",
    "accuracy": 0.00001
  },
  "measurements": {
    "temperature": {
      "value": 18.5,
      "unit": "CELSIUS",
      "precision": 0.1,
      "instrument": "DIGITAL_THERMOMETER"
    },
    "humidity": {
      "value": 73.0,
      "unit": "RELATIVE_PERCENT",
      "precision": 1.0,
      "instrument": "HYGROMETER"
    },
    "pressure": {
      "value": 1013.2,
      "unit": "HPA",
      "precision": 0.1,
      "instrument": "DIGITAL_BAROMETER"
    },
    "windSpeed": {
      "value": 12.3,
      "unit": "KMH",
      "precision": 0.1,
      "instrument": "ANEMOMETER"
    },
    "windDirection": {
      "value": 270.0,
      "unit": "DEGREES",
      "precision": 1.0,
      "instrument": "WIND_VANE"
    },
    "precipitation": {
      "value": 2.5,
      "unit": "MM",
      "precision": 0.1,
      "instrument": "RAIN_GAUGE",
      "periodHours": 6
    }
  },
  "metaData": {
    "stationType": "AUTOMATED_WEATHER_STATION",
    "stationOwner": "NOAA",
    "stationCertification": "WMO-12345",
    "firmwareVersion": "1.2.3",
    "lastCalibration": 1714348800,
    "tags": ["coastal", "urban", "research-grade"]
  },
  "signature": {
    "publicKey": "WRF1pubkey...",
    "timestamp": 1715962805,
    "hash": "..."
  }
}
\`\`\`

### WeatherForecast

The structure for forecast data:

\`\`\`json
{
  "forecastId": "WRF-FORECAST-001",
  "timestamp": 1715962800,
  "issuedBy": "model-gfs-001",
  "targetRegion": {
    "type": "BOUNDING_BOX",
    "northEast": {"latitude": 38.5, "longitude": -121.5},
    "southWest": {"latitude": 37.0, "longitude": -123.0}
  },
  "forecastPeriod": {
    "start": 1715962800,
    "end": 1716049200,
    "intervalHours": 1
  },
  "parameters": [
    "temperature",
    "precipitation",
    "humidity",
    "windSpeed",
    "windDirection"
  ],
  "dataPoints": {
    "temperature": [
      {
        "timestamp": 1715962800,
        "location": {"latitude": 37.7749, "longitude": -122.4194},
        "value": 19.0,
        "unit": "CELSIUS"
      },
      // Additional data points
    ],
    // Additional parameters
  },
  "metadata": {
    "modelName": "GFS",
    "modelVersion": "15.0.0",
    "resolution": "0.25deg",
    "ensembleMember": 0,
    "confidenceMetrics": {
      "temperature": 0.85,
      "precipitation": 0.78
    }
  },
  "signature": {
    "publicKey": "WRF1pubkey...",
    "timestamp": 1715962805,
    "hash": "..."
  }
}
\`\`\`

## Validation Rules

### Common Validation Rules

- All timestamps must be in UTC and encoded as Unix timestamps (seconds since epoch)
- Geographic coordinates must use the WGS84 datum
- All numeric values must include a specified unit and precision
- All data must be signed by the originating entity

### Measurement-Specific Rules

1. **Temperature**
   - Range: -100°C to +100°C for standard stations
   - Precision: Minimum 0.1°C
   - Required calibration within the last 365 days

2. **Humidity**
   - Range: 0% to 100%
   - Precision: Minimum 1%
   - Required calibration within the last 180 days

3. **Pressure**
   - Range: 800 hPa to 1100 hPa for sea-level stations
   - Must include altitude correction if not at sea level
   - Precision: Minimum 0.1 hPa

4. **Wind**
   - Speed range: 0 to 200 km/h
   - Direction range: 0° to 360°
   - Sampling: Minimum 1-minute average

5. **Precipitation**
   - Precision: Minimum 0.1 mm
   - Must specify measurement period (hourly, daily, etc.)

## Data Submission

### Submission Process

1. **Data Collection**: Weather station collects measurements
2. **Local Validation**: Station performs initial validation checks
3. **Digital Signing**: Data is signed using the station's private key
4. **Submission**: Data is submitted to the Wrfcoin network via:
   - Direct API call to a node
   - MQTT broker integration
   - Wrfcoin Core application

### Submission Frequency

- Automated weather stations: Every 5-15 minutes
- Manual observations: At least daily
- High-frequency research stations: Up to once per minute

## Verification

Data on the Wrfcoin network undergoes a multi-stage verification process:

1. **Formal Verification**: Checking data structure, required fields, and value ranges
2. **Cryptographic Verification**: Validating the digital signature
3. **Consensus Verification**: Comparing with nearby stations for consistency
4. **Historical Verification**: Checking against historical trends and patterns

## Data Access

### Query Patterns

Weather data can be queried using several patterns:

1. **Geographic**: Data for a specific location or region
2. **Temporal**: Data for a specific time period
3. **Parameter**: Data for specific weather parameters
4. **Station**: Data from specific stations
5. **Combined**: Any combination of the above

### Access Control

Data access can be controlled through:

1. **Public Data**: Free for anyone to access
2. **Token-Gated**: Requires WRF tokens to access
3. **Subscription**: Requires an ongoing subscription
4. **Permission-Based**: Requires explicit permission from the data owner

## Incentive Model

The WDP includes an incentive model to reward data providers:

1. **Base Rewards**: For submitting valid data
2. **Quality Rewards**: For high-precision, well-calibrated data
3. **Consistency Rewards**: For reliable, continuous data streams
4. **Uniqueness Rewards**: For data from underrepresented regions

## Implementation

### Client Libraries

- **JavaScript**: \`npm install @wrfcoin/weather-data-protocol\`
- **Python**: \`pip install wrfcoin-weather-data-protocol\`
- **Rust**: \`cargo add wrfcoin-weather-data-protocol\`

### Example: Data Submission in JavaScript

\`\`\`javascript

// Create a new weather observation
const observation = new WeatherObservation({
  stationId: 'MY-STATION-001',
  timestamp: Math.floor(Date.now() / 1000),
  geoLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 16.0,
    locationType: 'FIXED',
    accuracy: 0.00001
  },
  measurements: {
    temperature: {
      value: 18.5,
      unit: 'CELSIUS',
      precision: 0.1,
      instrument: 'DIGITAL_THERMOMETER'
    },
    // Additional measurements
  },
  // Additional fields
});

// Sign the observation with station's key
observation.sign(privateKey);

// Submit to the network
const client = new WrfcoinClient({
  network: 'mainnet',
  apiKey: process.env.WRFCOIN_API_KEY
});

const result = await client.submitWeatherData(observation);
devLog(\`Data submitted with hash: \${result.hash}\`);
\`\`\`

## Future Protocol Extensions

The Weather Data Protocol is designed to evolve, with planned extensions for:

1. **Advanced Sensor Types**: Support for LIDAR, radar, satellite data
2. **Machine Learning Integration**: In-protocol validation using ML models
3. **Privacy-Preserving Methods**: Zero-knowledge proofs for sensitive data
4. **Cross-Chain Verification**: Verification across multiple blockchain networks
5. **IoT Device Attestation**: Secure identity for IoT weather devices
      `,
      updated: 'May 18, 2025',
    },
    governance: {
      title: 'Governance Framework',
      subtitle:
        'Understanding the decentralized governance structure of Wrfcoin',
      content: `
# Governance Framework

The Wrfcoin governance framework establishes the rules and processes by which the network evolves. It is designed to balance decentralization with effective decision-making, ensuring the long-term sustainability and innovation of the ecosystem.

## Governance Philosophy

Wrfcoin governance is guided by several core principles:

1. **Inclusivity**: All stakeholders should have the opportunity to participate
2. **Transparency**: Decision-making processes should be open and visible
3. **Effectiveness**: Governance should facilitate timely and effective decisions
4. **Reputation**: Governance weight should consider contribution quality, not just token quantity
5. **Long-term Vision**: Decisions should prioritize the long-term health of the ecosystem

## Governance Structure

### Wrfcoin Foundation

During the first ten years, the Wrfcoin Foundation will play a central role:

- **Responsibilities**: Protocol maintenance, ecosystem funding, regulatory compliance
- **Composition**: 5-9 board members with expertise in meteorology, blockchain, and governance
- **Appointment**: Initial board appointed by founders, with staggered elections thereafter
- **Veto Power**: Ability to veto proposals that threaten protocol security or long-term viability

After the initial ten-year period, the Foundation's role will transition to a purely advisory capacity, with all governance powers transferring to the DAO.

### Wrfcoin DAO

The Decentralized Autonomous Organization (DAO) represents the community of stakeholders:

- **Membership**: All WRF token holders and network participants
- **Responsibilities**: Protocol upgrades, parameter changes, funding allocations
- **Decision Making**: On-chain voting with quadratic weighting
- **Working Groups**: Specialized committees focused on technical, ecological, and community aspects

## Proposal System

### Proposal Types

1. **Parameter Change**: Modifications to network parameters (e.g., block time, rewards)
2. **Protocol Upgrade**: Changes to the underlying protocol code
3. **Funding Request**: Requests for ecosystem funding
4. **Governance Update**: Changes to the governance system itself

### Proposal Lifecycle

1. **Ideation**: Discussion in community forums
2. **Formalization**: Creation of a formal proposal document
3. **Submission**: On-chain submission with deposit
4. **Discussion Period**: 14-day period for community discussion
5. **Voting Period**: 7-day period for voting
6. **Execution**: Automatic execution if passed (for parameter changes) or implementation by core developers (for protocol upgrades)

## Voting System

### Vote Weighting

Wrfcoin uses a sophisticated vote weighting system that considers multiple factors:

1. **Token Holdings**: Base voting power derived from WRF tokens (with quadratic scaling)
2. **Reputation Score**: Additional weight based on positive contributions to the network
3. **Validator Status**: Additional weight for active validators
4. **Data Provider Status**: Additional weight for active data providers
5. **Development Contributions**: Additional weight for contributors to the codebase

### Quadratic Voting

To prevent plutocracy, Wrfcoin implements quadratic voting:

- Voting power scales with the square root of token holdings
- This gives users with fewer tokens relatively more influence
- Formula: Voting Power = √(Token Holdings) × (1 + Reputation Multiplier)

### Delegation

Token holders can delegate their voting power to:

- **Validators**: Network operators who maintain infrastructure
- **Champions**: Governance specialists who focus on proposal analysis
- **Technical Experts**: For technically complex proposals

## Treasury Management

### Revenue Sources

The Wrfcoin DAO Treasury receives funds from:

1. **Network Fees**: Percentage of transaction fees
2. **Data Access Fees**: Fees paid for accessing premium weather data
3. **Computational Fees**: Fees paid for executing Computational NFTs
4. **Initial Allocation**: Initial token allocation for ecosystem development

### Expenditure Categories

Treasury funds can be allocated to:

1. **Core Development**: Funding for protocol maintenance and upgrades
2. **Research Grants**: Support for meteorological and climate research
3. **Infrastructure Grants**: Funding for critical infrastructure (validators, data providers)
4. **Education**: Materials and programs to increase adoption
5. **Marketing**: Promoting the Wrfcoin ecosystem

## Special Governance Features

### Weather Data Quality Committee

A specialized committee focused on data quality standards:

- **Composition**: Meteorologists, data scientists, and network operators
- **Responsibilities**: Setting data quality standards, reviewing data provider applications
- **Authority**: Can propose changes to data validation rules

### Climate Impact Fund

A dedicated fund for climate-positive initiatives:

- **Allocation**: 10% of treasury funds
- **Focus Areas**: Climate research, environmental monitoring, disaster prediction
- **Governance**: Special proposal track with emphasis on scientific review

## Governance Phases

Wrfcoin governance will evolve through several phases:

1. **Foundation Control** (Years 1-10):
   - Foundation has veto power
   - DAO vote is required for all changes
   - Foundation board has 5-9 members

2. **Transition Phase** (Years 11-12):
   - Foundation veto power gradually decreases
   - DAO authority increases
   - Foundation transitions to advisory role

3. **Full DAO Governance** (Year 13+):
   - Complete community governance
   - Foundation serves purely advisory role
   - Mature working group structure

## Participation Guide

### How to Participate

1. **Hold WRF Tokens**: Acquire and hold WRF tokens to gain base voting rights
2. **Delegate or Vote Directly**: Choose to vote directly or delegate to experts
3. **Join Working Groups**: Participate in specialized governance working groups
4. **Build Reputation**: Contribute positively to gain additional voting weight
5. **Submit Proposals**: Identify improvements and submit formal proposals

### Governance Tools

- **Wrfcoin Governance Portal**: Web interface for proposal submission and voting
- **Governance Forum**: Discussion platform for proposal ideation
- **Simulation Tool**: Test potential parameter changes before formal proposal
- **Mobile Voting App**: Vote on proposals from your mobile device
- **Analytics Dashboard**: Track proposal status and voting patterns

## Future Governance Roadmap

The governance system will continue to evolve, with planned improvements including:

1. **Prediction Markets**: For assessing proposal impacts
2. **Conviction Voting**: Time-weighted voting system for treasury allocations
3. **Governance NFTs**: Reputation-based governance rights that can be delegated
4. **Cross-Chain Governance**: Coordination with other climate-focused blockchain projects
5. **AI-Assisted Governance**: Tools to help analyze proposal impacts
      `,
      updated: 'May 18, 2025',
    },
  };

  // Initialize with the current document or the first document
  useEffect(() => {
    // If docId is provided, load that document
    if (docId && docData[docId]) {
      setDocContent(docData[docId]);
      setHeadings(extractHeadings(docData[docId].content));
      setError(null);
    }
    // Otherwise, load the first document
    else if (availableDocs.length > 0) {
      const firstDocId = availableDocs[0].id;
      const firstDoc = docData[firstDocId];
      if (firstDoc) {
        setDocContent(firstDoc);
        setHeadings(extractHeadings(firstDoc.content));
        setError(null);
      } else {
        setError('Documentation content not found');
      }
    }

    setLoading(false);
  }, [docId, availableDocs]);

  return (
    <div className={`material-docs ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header with document title and theme toggle */}
      <div className="docs-header">
        <div className="docs-header-content">
          <div className="docs-title">
            <h1>{docContent?.title || 'Documentation'}</h1>
            <p className="subtitle">{docContent?.subtitle || ''}</p>
          </div>

          {/* Add the buttons container wrapper for proper responsive behavior */}
          <div className="docs-header-buttons">
            <div
              className="sidebar-toggle"
              onClick={() =>
                document
                  .querySelector('.docs-sidebar')
                  .classList.toggle('collapsed')
              }
            >
              <i className="bi bi-layout-sidebar"></i>
            </div>
            <div
              className="dark-mode-toggle"
              onClick={() => document.body.classList.toggle('dark-mode')}
            >
              <i className={`bi ${isDarkMode ? 'bi-sun' : 'bi-moon'}`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar and documentation */}
      <div className="docs-container">
        {/* Sidebar with document navigation */}
        <div className="docs-sidebar">
          <div className="docs-sidebar-inner">
            {/* Search box */}
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search documentation... (Ctrl+K)"
                value={searchTerm}
                onChange={handleSearch}
                ref={searchInputRef}
              />
            </div>

            {/* Document list */}
            <div className="docs-navigation">
              {availableDocs
                .filter(
                  doc =>
                    searchTerm === '' ||
                    doc.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    doc.description
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                )
                .map(doc => (
                  <div
                    key={doc.id}
                    className={`docs-nav-section ${doc.id === (docId || availableDocs[0].id) ? 'active' : ''}`}
                    onClick={() => selectDocument(doc.id)}
                  >
                    <div className="docs-nav-section-title">{doc.title}</div>
                    <div className="docs-nav-section-description">
                      {doc.description}
                    </div>
                  </div>
                ))}
            </div>

            {/* Last updated information */}
            <div className="docs-last-edited">
              <p>Last updated: {docContent?.updated || ''}</p>
            </div>
          </div>
        </div>

        {/* Main documentation content */}
        <div className="docs-content">
          {loading && (
            <div className="docs-loading">
              <p>Loading documentation...</p>
            </div>
          )}

          {error && (
            <div className="docs-error">
              <h2>Error</h2>
              <p>{error}</p>
            </div>
          )}

          {docContent && !loading && !error && (
            <div
              className="docs-content-main"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  convertMarkdownToHTML(docContent.content),
                ),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const MaterialDocs = (props) => (
  <DemoSurfaceGate
    testId="material-docs"
    title="Documentation preview is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <MaterialDocsSample {...props} />
  </DemoSurfaceGate>
);

export default MaterialDocs;
