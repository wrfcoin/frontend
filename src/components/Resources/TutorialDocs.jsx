import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TutorialDocs = ({ tutorialId }) => {
  const [tutorialContent, setTutorialContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tutorial metadata mapping
  const tutorialMetadata = {
    setup: {
      title: 'Initial Setup',
      file: 'setup-guide.md',
      description:
        'Get started with Wrfcoin Core by following these essential setup steps.',
      actions: [
        {
          label: 'Download Now',
          type: 'primary',
          action: () =>
            window.open('https://releases.wrfcoin.network/latest', '_blank'),
        },
        {
          label: 'View Requirements',
          type: 'secondary',
          action: () => scrollToSection('prerequisites'),
        },
      ],
    },
    mining: {
      title: 'Mining Guide',
      file: 'mining-guide.md',
      description:
        'Learn how to mine WRF tokens and earn rewards by contributing weather data.',
      actions: [
        {
          label: 'Start CPU Mining',
          type: 'primary',
          action: () => scrollToSection('getting-started-with-mining'),
        },
        {
          label: 'Configure GPU',
          type: 'secondary',
          action: () => scrollToSection('computational-mining'),
        },
        {
          label: 'Find Pools',
          type: 'outline',
          action: () => scrollToSection('mining-pool-integration'),
        },
      ],
    },
    wallet: {
      title: 'Wallet Management',
      file: 'wallet-management.md',
      description:
        'Master wallet operations including sending, receiving, and securing your WRF tokens.',
      actions: [
        {
          label: 'Create Wallet',
          type: 'primary',
          action: () => scrollToSection('creating-your-first-wallet'),
        },
        {
          label: 'Security Guide',
          type: 'secondary',
          action: () => scrollToSection('wallet-security-best-practices'),
        },
      ],
    },
    'cross-chain': {
      title: 'Cross-Chain Bridge',
      file: 'cross-chain-bridge.md',
      description:
        'Transfer WRF tokens across different blockchain networks safely and efficiently.',
      actions: [
        {
          label: 'Start Bridge',
          type: 'primary',
          action: () => scrollToSection('getting-started'),
        },
        {
          label: 'View Networks',
          type: 'secondary',
          action: () => scrollToSection('supported-networks'),
        },
      ],
    },
    nft: {
      title: 'Computational NFTs',
      file: 'computational-nfts.md',
      description:
        'Create and manage NFTs with executable code for weather data processing.',
      actions: [
        {
          label: 'Create CNFT',
          type: 'primary',
          action: () => scrollToSection('creating-your-first-cnft'),
        },
        {
          label: 'Browse Marketplace',
          type: 'secondary',
          action: () => scrollToSection('cnft-marketplace'),
        },
      ],
    },
    governance: {
      title: 'Governance',
      file: 'governance.md',
      description:
        'Participate in decentralized governance and help shape the future of Wrfcoin.',
      actions: [
        {
          label: 'Join Governance',
          type: 'primary',
          action: () => scrollToSection('getting-started-with-governance'),
        },
        {
          label: 'View Proposals',
          type: 'secondary',
          action: () => scrollToSection('voting-on-proposals'),
        },
      ],
    },
  };

  const scrollToSection = sectionId => {
    const element = document.getElementById(
      sectionId.toLowerCase().replace(/\s+/g, '-'),
    );
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Built-in tutorial content to avoid loading issues
  const tutorialContent_builtin = {
    setup: `# Initial Setup

Get started with Wrfcoin Core by following these essential setup steps.

## Prerequisites

Before installing Wrfcoin Core, ensure your system meets these requirements:

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+ recommended)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: At least 50GB free space for blockchain data
- **Network**: Stable internet connection
- **Ports**: Port 8333 for mainnet, 18333 for testnet

## Download and Installation

### Step 1: Download Wrfcoin Core

Visit our official releases page and download the latest version for your operating system:
- [Download for Windows](https://releases.wrfcoin.network/latest/windows)
- [Download for macOS](https://releases.wrfcoin.network/latest/macos)
- [Download for Linux](https://releases.wrfcoin.network/latest/linux)

### Step 2: Install the Application

**Windows:**
1. Run the downloaded .exe file as administrator
2. Follow the installation wizard
3. Choose installation directory (default recommended)

**macOS:**
1. Open the downloaded .dmg file
2. Drag Wrfcoin Core to Applications folder
3. Allow the app in Security & Privacy settings

**Linux:**
\`\`\`bash
chmod +x wrfcoin-core-linux.AppImage
./wrfcoin-core-linux.AppImage
\`\`\`

### Step 3: First Launch

1. Launch Wrfcoin Core
2. Choose your data directory
3. Allow firewall access if prompted
4. Wait for initial blockchain sync (may take several hours)

## Configuration

### Basic Configuration

Create a configuration file at:
- **Windows**: \`%APPDATA%\\Wrfcoin\\wrfcoin.conf\`
- **macOS**: \`~/Library/Application Support/Wrfcoin/wrfcoin.conf\`
- **Linux**: \`~/.wrfcoin/wrfcoin.conf\`

Example configuration:
\`\`\`
# Network settings
listen=1
server=1
rpcuser=your_username
rpcpassword=your_secure_password

# Mining settings (optional)
gen=1
genproclimit=4
\`\`\`

### Security Best Practices

1. **Backup your wallet**: Always backup wallet.dat before making changes
2. **Use strong passwords**: Enable wallet encryption with a strong password
3. **Update regularly**: Keep Wrfcoin Core updated to the latest version
4. **Firewall rules**: Configure proper firewall rules for P2P communication

## Troubleshooting

### Common Issues

**Slow sync**: 
- Ensure stable internet connection
- Check available disk space
- Consider using bootstrap files

**Connection issues**:
- Verify firewall settings
- Check network connectivity
- Ensure ports 8333/18333 are accessible

**High memory usage**:
- Increase virtual memory
- Close unnecessary applications
- Consider using pruned mode

For additional help, visit our [community forum](https://forum.wrfcoin.network) or [documentation](https://docs.wrfcoin.network).`,

    mining: `# Mining Guide

Learn how to mine WRF tokens and earn rewards by contributing to the Wrfcoin network.

## Getting Started with Mining

### What is WRF Mining?

Wrfcoin uses a unique Proof-of-Weather consensus mechanism that combines traditional computational mining with weather data verification. Miners earn rewards by:

1. **Processing transactions** like traditional blockchains
2. **Validating weather data** from sensor networks
3. **Running computational models** for weather predictions

### Mining Requirements

**Minimum Requirements:**
- 4GB RAM
- 50GB free storage
- Stable internet connection
- Modern CPU (2+ cores)

**Recommended Setup:**
- 16GB+ RAM for optimal performance
- SSD storage for faster sync
- High-speed internet (100+ Mbps)
- Multi-core CPU or GPU for computational mining

## Solo Mining

### CPU Mining Setup

1. **Configure Mining Settings**
\`\`\`bash
# In wrfcoin.conf
gen=1
genproclimit=4  # Number of CPU threads
genweatherdata=1  # Enable weather data processing
\`\`\`

2. **Start Mining**
\`\`\`bash
wrfcoin-cli setgenerate true 4
\`\`\`

3. **Monitor Mining Status**
\`\`\`bash
wrfcoin-cli getmininginfo
\`\`\`

### GPU Mining (Advanced)

For computational weather modeling, GPU mining provides significant performance benefits:

\`\`\`bash
# Install GPU mining software
git clone https://github.com/wrfcoin/gpu-miner
cd gpu-miner
make install

# Configure GPU settings
./wrf-gpu-miner --gpu-threads=1024 --gpu-intensity=8
\`\`\`

## Pool Mining

### Joining a Mining Pool

Pool mining provides more consistent rewards by combining hashpower with other miners.

**Popular WRF Mining Pools:**
- WRFPool.com - 1% fee, global servers
- WeatherMine.net - 0.5% fee, PPLNS rewards
- ClimatePool.org - 2% fee, includes carbon credits

### Pool Configuration

\`\`\`bash
# Example pool configuration
stratum+tcp://pool.wrfpool.com:4444
username: your_wallet_address.worker_name
password: x
\`\`\`

## Mining Pool Integration

### Setting Up Pool Mining

1. **Choose a Pool**: Research pool fees, payout methods, and server locations
2. **Configure Miner**: Set pool server, username (wallet address), and worker name
3. **Monitor Performance**: Track hashrate, accepted shares, and earnings

### Pool Mining Software

**CPU Mining:**
\`\`\`bash
./cpuminer -a wrf-sha256 -o stratum+tcp://pool.com:4444 -u wallet.worker
\`\`\`

**GPU Mining:**
\`\`\`bash
./gpu-miner -o stratum+tcp://pool.com:4444 -u wallet.worker -p x
\`\`\`

## Computational Mining

### Weather Data Processing

Wrfcoin miners contribute to global weather prediction by processing meteorological data:

1. **Sensor Data Validation**: Verify temperature, humidity, pressure readings
2. **Model Computation**: Run weather prediction algorithms
3. **Consensus Participation**: Vote on data accuracy and model results

### Earning Weather Rewards

Additional rewards are available for:
- **Data Quality**: Accurate sensor readings
- **Model Accuracy**: Successful weather predictions
- **Network Participation**: Active consensus participation

## Optimizing Mining Performance

### Hardware Optimization

**CPU Optimization:**
- Enable all available cores
- Adjust thread priority
- Monitor temperature and throttling

**GPU Optimization:**
- Overclock memory and core clocks
- Optimize power limits
- Use mining-specific GPU drivers

### Software Optimization

**Mining Software Settings:**
\`\`\`bash
# Optimal settings for most hardware
intensity=8
threads=auto
worksize=256
lookup-gap=2
\`\`\`

**System Optimization:**
- Disable Windows visual effects
- Close unnecessary applications
- Use high-performance power plan

## Mining Rewards and Economics

### Reward Structure

**Block Rewards:**
- Base reward: 50 WRF per block
- Weather bonus: Up to 25 WRF for data processing
- Transaction fees: Variable based on network activity

**Halving Schedule:**
Block rewards halve every 210,000 blocks (approximately 4 years).

### Profitability Calculation

Consider these factors:
- Hardware costs and electricity
- Mining difficulty and network hashrate
- WRF price and market conditions
- Pool fees and payout methods

Use our [profitability calculator](https://calc.wrfcoin.network) for estimates.

## Troubleshooting

### Common Mining Issues

**Low Hashrate:**
- Check hardware configuration
- Verify mining software settings
- Monitor system temperature

**Rejected Shares:**
- Check pool connection
- Verify wallet address
- Update mining software

**High Power Consumption:**
- Optimize GPU settings
- Use efficient mining software
- Consider undervolting hardware

For technical support, join our [Mining Discord](https://discord.gg/wrfcoin-mining) or visit the [mining forum](https://forum.wrfcoin.network/mining).`,

    wallet: `# Wallet Management

Master wallet operations including sending, receiving, and securing your WRF tokens.

## Creating Your First Wallet

### Desktop Wallet Setup

1. **Download Wrfcoin Core**
   - Visit [wrfcoin.network/download](https://wrfcoin.network/download)
   - Choose your operating system
   - Verify download signatures

2. **Initial Setup**
   - Launch Wrfcoin Core
   - Choose data directory
   - Create strong passphrase
   - Backup seed phrase (write down 12-24 words)

3. **First Sync**
   - Wait for blockchain sync (may take hours)
   - Verify connection to network
   - Check wallet status

### Mobile Wallet Options

**WRF Wallet (Official Mobile App):**
- iOS and Android support
- Built-in exchange features
- Biometric security
- Weather data integration

**Third-Party Wallets:**
- Trust Wallet (multi-currency support)
- MetaMask (for WRF ERC-20 tokens)
- Hardware wallet integration

## Sending and Receiving

### Receiving WRF Tokens

1. **Generate Receiving Address**
\`\`\`bash
wrfcoin-cli getnewaddress "label"
\`\`\`

2. **Share Your Address**
   - Copy address exactly (case-sensitive)
   - Use QR codes for mobile transactions
   - Verify address before sharing

3. **Monitor Incoming Transactions**
\`\`\`bash
wrfcoin-cli listtransactions
\`\`\`

### Sending WRF Tokens

1. **Basic Send Transaction**
\`\`\`bash
wrfcoin-cli sendtoaddress "recipient_address" amount
\`\`\`

2. **Advanced Send Options**
\`\`\`bash
# Send with custom fee
wrfcoin-cli sendtoaddress "address" amount "" "" false true fee_rate

# Send to multiple addresses
wrfcoin-cli sendmany "" {"addr1":amount1,"addr2":amount2}
\`\`\`

3. **Transaction Confirmation**
   - Wait for network confirmations (typically 6)
   - Monitor transaction status
   - Save transaction ID for records

## Wallet Security Best Practices

### Backup Strategies

**Seed Phrase Backup:**
- Write down 12-24 word seed phrase
- Store in multiple secure locations
- Never store digitally or take photos
- Test recovery process

**Wallet File Backup:**
\`\`\`bash
# Backup wallet.dat file
cp ~/.wrfcoin/wallet.dat /secure/backup/location/
\`\`\`

**Automated Backups:**
\`\`\`bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
cp ~/.wrfcoin/wallet.dat ~/backups/wallet_$DATE.dat
\`\`\`

### Security Features

**Wallet Encryption:**
\`\`\`bash
# Encrypt wallet with passphrase
wrfcoin-cli encryptwallet "your_secure_passphrase"
\`\`\`

**Two-Factor Authentication:**
- Enable 2FA on exchange accounts
- Use hardware security keys
- Set up backup authentication methods

**Cold Storage:**
- Generate offline addresses
- Use air-gapped computers
- Hardware wallet integration

## Advanced Wallet Features

### Multi-Signature Wallets

Create wallets requiring multiple signatures for transactions:

\`\`\`bash
# Create 2-of-3 multisig address
wrfcoin-cli createmultisig 2 ["pubkey1","pubkey2","pubkey3"]
\`\`\`

### HD Wallets

Hierarchical Deterministic wallets generate unlimited addresses from a single seed:

\`\`\`bash
# Generate HD wallet seed
wrfcoin-cli getnewseed

# Derive addresses from seed
wrfcoin-cli deriveaddress "seed" "m/44'/0'/0'/0/0"
\`\`\`

### Watch-Only Wallets

Monitor addresses without spending capability:

\`\`\`bash
# Import watch-only address
wrfcoin-cli importaddress "address" "label" false
\`\`\`

## Transaction Management

### Fee Estimation

**Dynamic Fee Calculation:**
\`\`\`bash
# Estimate fee for next block
wrfcoin-cli estimatesmartfee 1

# Estimate fee for 6 blocks
wrfcoin-cli estimatesmartfee 6
\`\`\`

**Custom Fee Settings:**
- Low priority: 1-5 sat/byte
- Normal priority: 10-20 sat/byte
- High priority: 50+ sat/byte

### Transaction Privacy

**Coin Selection:**
\`\`\`bash
# Use specific UTXOs for privacy
wrfcoin-cli createrawtransaction [...] {...}
\`\`\`

**Address Reuse Prevention:**
- Generate new address for each transaction
- Use HD wallet features
- Implement address labeling system

## Wallet Recovery

### Seed Phrase Recovery

1. **Install Fresh Wallet Software**
2. **Select "Restore from Seed"**
3. **Enter 12-24 Word Phrase**
4. **Set New Passphrase**
5. **Wait for Sync and Scan**

### File-Based Recovery

\`\`\`bash
# Restore from backup
cp /backup/location/wallet.dat ~/.wrfcoin/
wrfcoin-cli -rescan
\`\`\```

### Recovery Troubleshooting

**Common Issues:**
- Incorrect seed word order
- Wrong derivation path
- Network sync problems
- Corrupted wallet files

**Recovery Tools:**
- Wallet repair utilities
- Seed phrase validators
- Professional recovery services

## Integration with Weather Features

### Weather Data Rewards

Your wallet automatically receives rewards for:
- Sensor data contribution
- Weather prediction accuracy
- Network participation

### Climate Credits

Earn carbon offset credits through:
- Green mining participation
- Environmental data validation
- Sustainable network practices

For additional wallet support, visit our [wallet guide](https://docs.wrfcoin.network/wallet) or contact [support](mailto:support@wrfcoin.network).`,

    'cross-chain': `# Cross-Chain Bridge

Transfer WRF tokens across different blockchain networks safely and efficiently.

## Getting Started

### Supported Networks

Wrfcoin's cross-chain bridge connects to 13+ major blockchain networks:

**Primary Networks:**
- Ethereum (ETH) - ERC-20 WRF tokens
- Binance Smart Chain (BSC) - BEP-20 WRF tokens  
- Polygon (MATIC) - Polygon WRF tokens
- Avalanche (AVAX) - Avalanche WRF tokens

**Layer 2 Solutions:**
- Arbitrum - Optimized for low fees
- Optimism - Fast transaction finality
- Polygon zkEVM - Zero-knowledge proofs

**Other Networks:**
- Solana - High-performance blockchain
- Cardano - Academic blockchain platform
- Polkadot - Interoperability protocol
- Cosmos - Internet of blockchains
- Near Protocol - Developer-friendly platform
- Fantom - Fast and secure platform

### Bridge Features

**Security Features:**
- Multi-signature validation
- Time-locked transactions
- Fraud proof mechanisms
- Automated security monitoring

**Performance:**
- 5-15 minute transfer times
- Low transaction fees
- High throughput capacity
- 24/7 operation

## How to Bridge Tokens

### Step 1: Connect Your Wallet

1. **Visit Bridge Interface**: [bridge.wrfcoin.network](https://bridge.wrfcoin.network)
2. **Connect Source Wallet**: MetaMask, WalletConnect, or Wrfcoin Core
3. **Connect Destination Wallet**: Wallet on target network
4. **Verify Balances**: Check WRF balance on source network

### Step 2: Select Networks

1. **Choose Source Network**: Where your WRF tokens currently exist
2. **Choose Destination Network**: Where you want to transfer tokens
3. **Review Bridge Route**: Verify the transfer path
4. **Check Fees**: Review bridge fees and gas costs

### Step 3: Initiate Transfer

\`\`\`javascript
// Example bridge transaction
const bridgeTransfer = {
  fromNetwork: 'ethereum',
  toNetwork: 'polygon', 
  amount: '100.0',
  recipient: '0x742D35Cc6634C0532925a3b8D4A4C07f9962a9D9'
};

await wrfBridge.transfer(bridgeTransfer);
\`\`\`

### Step 4: Monitor Progress

1. **Track Transaction**: Use provided transaction hash
2. **Wait for Confirmations**: Typically 6-12 confirmations required
3. **Verify Receipt**: Check destination wallet for tokens
4. **Save Records**: Keep transaction hashes for reference

## Bridge Protocols

### LayerZero Integration

LayerZero provides omnichain interoperability:

\`\`\`solidity
// LayerZero message format
struct LzMessage {
    uint16 dstChainId;
    bytes dstAddress;
    uint256 amount;
    bytes payload;
}
\`\`\`

**Benefits:**
- Ultra-light nodes
- Trustless validation
- Configurable security
- Unified user experience

### Wormhole Integration

Wormhole enables cross-chain communication:

**Network Support:**
- Ethereum ↔ Solana
- BSC ↔ Polygon  
- Avalanche ↔ Fantom
- Terra ↔ Near

**Security Model:**
- Guardian network validation
- 19 independent validators
- Consensus-based verification
- Slashing mechanisms

### Axelar Integration

Axelar provides universal web3 interoperability:

\`\`\`bash
# Axelar bridge command
axelar-cli bridge transfer \
  --source-chain ethereum \
  --dest-chain polygon \
  --amount 100 \
  --token WRF
\`\`\`

## Security Considerations

### Bridge Risks

**Common Risks:**
- Smart contract vulnerabilities
- Validator compromise
- Front-end attacks
- Slippage and MEV

**Mitigation Strategies:**
- Multi-signature requirements
- Time delays for large transfers
- Insurance fund coverage
- Regular security audits

### Best Practices

**Before Bridging:**
1. Verify bridge URL authenticity
2. Check network status and congestion
3. Review gas fee estimates
4. Start with small test amounts

**During Transfer:**
1. Double-check recipient addresses
2. Monitor transaction progress
3. Don't close browser during transfer
4. Save all transaction hashes

**After Transfer:**
1. Verify token receipt
2. Check balance accuracy
3. Report any issues immediately
4. Update your records

## Troubleshooting

### Common Issues

**Slow Transfer Times:**
- Check network congestion
- Verify sufficient gas fees
- Monitor validator status
- Contact bridge support if delayed

**Failed Transactions:**
- Check gas limit settings
- Verify token allowances
- Ensure sufficient balance
- Retry with higher gas price

**Missing Tokens:**
- Check destination wallet address
- Verify network selection
- Look for pending transactions
- Contact support with transaction hash

### Emergency Procedures

**Stuck Transactions:**
1. Check transaction status on both chains
2. Verify bridge validator health
3. Contact emergency support
4. Provide all transaction details

**Security Incidents:**
1. Immediately stop all bridge activity
2. Report suspicious activity
3. Move remaining funds to secure wallets
4. Monitor official announcements

## Advanced Features

### Automated Bridging

Set up automated cross-chain transfers:

\`\`\`javascript
// Automated bridge configuration
const autoBridge = {
  trigger: 'balance_threshold',
  threshold: 1000,
  sourceNetwork: 'ethereum',
  destNetwork: 'polygon',
  percentage: 50
};
\`\`\`

### Bridge APIs

Integrate bridge functionality into applications:

\`\`\`javascript
// Bridge API example
const bridgeAPI = new WrfBridgeAPI({
  apiKey: 'your_api_key',
  network: 'mainnet'
});

const quote = await bridgeAPI.getQuote({
  from: 'ethereum',
  to: 'polygon',
  amount: '100'
});
\`\`\`

### Cross-Chain DeFi

Access DeFi protocols across networks:
- Cross-chain lending platforms
- Multi-network yield farming
- Cross-chain DEX aggregation
- Unified liquidity pools

For bridge support and updates, visit [bridge.wrfcoin.network](https://bridge.wrfcoin.network) or join our [Telegram support](https://t.me/wrfcoin_bridge).`,

    nft: `# Computational NFTs

Create and manage NFTs with executable code for weather data processing.

## Introduction to CNFTs

### What are Computational NFTs?

Computational NFTs (CNFTs) are unique digital assets that combine traditional NFT ownership with executable code functionality. In the Wrfcoin ecosystem, CNFTs can:

1. **Process Weather Data**: Execute algorithms on meteorological datasets
2. **Generate Predictions**: Run machine learning models for forecasting
3. **Validate Sensor Data**: Verify authenticity of environmental readings
4. **Earn Rewards**: Generate passive income through computation

### CNFT Use Cases

**Weather Modeling:**
- Climate prediction algorithms
- Storm tracking systems
- Temperature forecasting models
- Precipitation probability calculators

**Environmental Monitoring:**
- Air quality assessment tools
- Pollution tracking systems
- Biodiversity monitoring scripts
- Carbon footprint calculators

**Data Processing:**
- Sensor data validation
- Statistical analysis tools
- Data visualization generators
- Real-time alerting systems

## Creating Your First CNFT

### Prerequisites

**Technical Requirements:**
- Basic programming knowledge (Python/JavaScript)
- Understanding of weather data formats
- Familiarity with blockchain concepts
- Access to development tools

**Setup Environment:**
\`\`\`bash
# Install CNFT development kit
npm install -g @wrfcoin/cnft-sdk

# Initialize new CNFT project
cnft-cli init my-weather-nft
cd my-weather-nft
\`\`\`

### CNFT Structure

**Basic CNFT Components:**

\`\`\`javascript
// cnft-config.json
{
  "name": "Weather Prediction Model",
  "description": "ML model for 7-day temperature forecasting",
  "version": "1.0.0",
  "runtime": "python3.9",
  "inputs": ["temperature", "humidity", "pressure"],
  "outputs": ["forecast_temp", "confidence"],
  "compute_requirements": {
    "cpu": 2,
    "memory": "4GB",
    "execution_time": "300s"
  }
}
\`\`\`

**Computation Script:**

\`\`\`python
# main.py - CNFT computation logic
import numpy as np
from wrfcoin_sdk import WeatherData, MLModel

class TemperatureForecast:
    def __init__(self):
        self.model = MLModel.load('temperature_model.pkl')
    
    def process(self, weather_data):
        # Process input weather data
        features = self.extract_features(weather_data)
        
        # Generate prediction
        forecast = self.model.predict(features)
        confidence = self.calculate_confidence(features)
        
        return {
            'forecast_temp': forecast,
            'confidence': confidence,
            'timestamp': weather_data.timestamp
        }
    
    def extract_features(self, data):
        return np.array([
            data.temperature,
            data.humidity, 
            data.pressure,
            data.wind_speed
        ])
\`\`\`

### Minting Your CNFT

1. **Test Locally:**
\`\`\`bash
# Test CNFT computation
cnft-cli test --input sample_data.json
\`\`\`

2. **Deploy to Network:**
\`\`\`bash
# Deploy CNFT to Wrfcoin network
cnft-cli deploy --network mainnet --gas-price 20
\`\`\`

3. **Mint NFT:**
\`\`\`bash
# Mint CNFT with metadata
cnft-cli mint \
  --contract 0x123... \
  --to your_wallet_address \
  --metadata ipfs://QmHash...
\`\`\`

## CNFT Marketplace

### Browsing CNFTs

**Marketplace Categories:**
- Weather Prediction Models
- Climate Analysis Tools
- Environmental Sensors
- Data Visualization Scripts
- Scientific Research Models

**Search and Filter:**
- Performance metrics
- Computation cost
- User ratings
- Recent activity
- Price range

### Buying CNFTs

1. **Research CNFT Performance:**
   - Check historical accuracy
   - Review user feedback
   - Analyze earning potential
   - Verify code audit status

2. **Purchase Process:**
\`\`\`javascript
// Purchase CNFT through marketplace
const marketplace = new CNFTMarketplace();
const listing = await marketplace.getListing(tokenId);

const purchase = await marketplace.buyNFT({
  tokenId: listing.tokenId,
  price: listing.price,
  buyer: wallet.address
});
\`\`\`

3. **Transfer and Setup:**
   - Verify NFT ownership
   - Download computation code
   - Configure execution environment
   - Start earning rewards

### Selling CNFTs

**Listing Process:**
\`\`\`javascript
// List CNFT for sale
const listing = {
  tokenId: 123,
  price: ethers.utils.parseEther("10.0"),
  duration: 7 * 24 * 3600, // 7 days
  royalty: 250 // 2.5%
};

await marketplace.createListing(listing);
\`\`\`

**Pricing Strategies:**
- Performance-based pricing
- Computational complexity
- Market demand analysis
- Competitive benchmarking

## Running CNFTs

### Execution Environment

**Local Execution:**
\`\`\`bash
# Run CNFT locally
cnft-executor run \
  --nft-id 123 \
  --input weather_data.json \
  --output results.json
\`\`\`

**Cloud Execution:**
- Distributed computing networks
- Auto-scaling infrastructure
- Cost-optimized execution
- High availability deployment

**Edge Computing:**
- IoT device integration
- Real-time processing
- Low-latency execution
- Offline capability

### Earning Mechanisms

**Computation Rewards:**
- Payment per execution
- Data processing fees
- Model accuracy bonuses
- Network participation rewards

**Staking Rewards:**
- Stake CNFTs for passive income
- Validator node operation
- Liquidity provision
- Governance participation

**Performance Incentives:**
- High-accuracy bonuses
- Efficiency improvements
- User satisfaction ratings
- Long-term consistency

## Advanced CNFT Development

### Machine Learning Integration

**Model Training:**
\`\`\`python
# Train weather prediction model
from wrfcoin_ml import WeatherPredictor

predictor = WeatherPredictor()
predictor.train(
    data_source='global_weather_db',
    model_type='lstm',
    features=['temp', 'humidity', 'pressure'],
    target='temperature_24h'
)

predictor.save('weather_model.pkl')
\`\`\`

**Real-time Learning:**
- Continuous model updates
- Federated learning integration
- Performance monitoring
- Automated retraining

### IoT Integration

**Sensor Data Processing:**
\`\`\`python
# Process IoT sensor data
class SensorDataProcessor:
    def process_reading(self, sensor_data):
        # Validate data quality
        if self.validate_reading(sensor_data):
            # Process and analyze
            processed = self.analyze_data(sensor_data)
            
            # Submit to network
            self.submit_results(processed)
            
            return processed
        else:
            raise ValueError("Invalid sensor reading")
\`\`\`

**Edge Deployment:**
- Raspberry Pi integration
- Weather station connectivity
- Real-time data streaming
- Offline processing capability

### API Integration

**External Data Sources:**
\`\`\`javascript
// Integrate with weather APIs
const weatherAPI = new WeatherDataAPI({
  provider: 'openweather',
  apiKey: process.env.WEATHER_API_KEY
});

const currentWeather = await weatherAPI.getCurrentWeather({
  latitude: 40.7128,
  longitude: -74.0060
});
\`\`\`

**Data Publishing:**
- Public API endpoints
- Real-time data feeds
- Historical data access
- Commercial data licensing

## CNFT Governance

### Community Voting

Participate in CNFT ecosystem decisions:
- New feature proposals
- Algorithm improvements
- Fee structure changes
- Network upgrades

### Quality Assurance

**Code Review Process:**
- Peer review requirements
- Automated testing
- Security audits
- Performance benchmarks

**Certification Programs:**
- Official CNFT verification
- Academic partnerships
- Industry standards compliance
- Professional certifications

For CNFT development resources, visit [cnft.wrfcoin.network](https://cnft.wrfcoin.network) or join our [developer community](https://discord.gg/wrfcoin-dev).`,

    governance: `# Governance

Participate in decentralized governance and help shape the future of Wrfcoin.

## Getting Started with Governance

### Understanding WRF Governance

Wrfcoin operates as a decentralized autonomous organization (DAO) where WRF token holders can:

1. **Vote on Proposals**: Shape network development and policy
2. **Submit Proposals**: Suggest improvements and changes
3. **Delegate Voting Power**: Allow trusted representatives to vote
4. **Earn Rewards**: Receive incentives for active participation

### Governance Tokens

**WRF Token Voting Power:**
- 1 WRF = 1 vote
- Minimum 100 WRF required for proposal submission
- Tokens must be staked to participate
- Voting power accumulates with holding duration

**Governance Staking:**
\`\`\`bash
# Stake WRF tokens for governance
wrfcoin-cli governance stake 1000

# Check staking status
wrfcoin-cli governance status
\`\`\`

## Voting on Proposals

### Types of Proposals

**Technical Proposals:**
- Protocol upgrades
- Algorithm improvements
- Security enhancements
- Performance optimizations

**Economic Proposals:**
- Fee structure changes
- Reward distributions
- Inflation parameters
- Treasury allocations

**Governance Proposals:**
- Voting mechanism changes
- Proposal requirements
- Community guidelines
- Partnership approvals

### Voting Process

1. **Review Proposal Details:**
   - Read full proposal text
   - Check implementation timeline
   - Review budget requirements
   - Assess community impact

2. **Cast Your Vote:**
\`\`\`bash
# Vote on proposal
wrfcoin-cli governance vote proposal_id "yes" --weight 500

# View voting results
wrfcoin-cli governance results proposal_id
\`\`\`

3. **Monitor Progress:**
   - Track voting participation
   - Check proposal status
   - Receive outcome notifications
   - Monitor implementation

### Voting Strategies

**Informed Voting:**
- Research proposal thoroughly
- Participate in community discussions
- Consult technical documentation
- Consider long-term implications

**Delegation Options:**
\`\`\`bash
# Delegate voting power
wrfcoin-cli governance delegate validator_address 1000

# Revoke delegation
wrfcoin-cli governance undelegate validator_address
\`\`\`

## Creating Proposals

### Proposal Requirements

**Minimum Requirements:**
- 100 WRF staked tokens
- Clear problem statement
- Detailed solution description
- Implementation timeline
- Budget breakdown (if applicable)

**Proposal Categories:**
- Network Improvement Proposals (NIPs)
- Weather Data Standards (WDS)
- Economic Improvement Proposals (EIPs)
- Community Proposals (CPs)

### Proposal Submission

1. **Draft Proposal:**
\`\`\`markdown
# WIP-001: Weather Data Quality Improvement

## Summary
Proposal to implement enhanced weather data validation algorithms.

## Motivation
Current validation has 5% error rate. New algorithm reduces to 1%.

## Specification
- Implement machine learning validation
- Add real-time anomaly detection
- Create data quality scoring system

## Implementation
- Phase 1: Algorithm development (2 months)
- Phase 2: Testing and validation (1 month)  
- Phase 3: Network deployment (1 month)

## Budget
- Development: 50,000 WRF
- Testing: 15,000 WRF
- Deployment: 10,000 WRF
\`\`\`

2. **Submit Proposal:**
\`\`\`bash
# Submit governance proposal
wrfcoin-cli governance propose \
  --title "Weather Data Quality Improvement" \
  --description "proposal_text.md" \
  --budget 75000 \
  --duration 30
\`\`\`

3. **Community Engagement:**
   - Share in governance forums
   - Present at community calls
   - Respond to feedback
   - Refine based on input

### Proposal Lifecycle

**Stages:**
1. **Draft Period** (7 days): Community review and feedback
2. **Voting Period** (14 days): Token holder voting
3. **Implementation** (Variable): Development and deployment
4. **Review** (Ongoing): Monitor results and effectiveness

## Governance Participation

### Community Forums

**Primary Channels:**
- [Governance Forum](https://gov.wrfcoin.network)
- [Discord #governance](https://discord.gg/wrfcoin-gov)
- [Telegram Governance](https://t.me/wrfcoin_governance)
- [Reddit r/WrfcoinGov](https://reddit.com/r/WrfcoinGov)

**Discussion Guidelines:**
- Respectful and constructive dialogue
- Fact-based arguments
- Consider all stakeholders
- Focus on network benefits

### Working Groups

**Technical Working Group:**
- Protocol development
- Security reviews
- Performance optimization
- Research coordination

**Economic Working Group:**
- Tokenomics design
- Fee structure analysis
- Treasury management
- Economic modeling

**Community Working Group:**
- Governance process improvement
- Community outreach
- Educational content
- Partnership development

### Governance Rewards

**Participation Incentives:**
\`\`\`bash
# Check governance rewards
wrfcoin-cli governance rewards

# Claim accumulated rewards
wrfcoin-cli governance claim
\`\`\`

**Reward Structure:**
- Voting participation: 0.1% APY bonus
- Proposal submission: 50 WRF per accepted proposal
- Working group participation: Monthly stipends
- Delegate performance: Performance-based rewards

## Advanced Governance Features

### Quadratic Voting

For important decisions, quadratic voting ensures fair representation:

\`\`\`bash
# Quadratic voting (cost increases quadratically)
# 1 vote = 1 WRF, 4 votes = 4 WRF, 9 votes = 9 WRF
wrfcoin-cli governance vote-quadratic proposal_id 9 --cost 9
\`\`\`

### Conviction Voting

Long-term commitment increases voting power:

\`\`\`bash
# Lock tokens for conviction voting
wrfcoin-cli governance conviction-lock 1000 --duration 365

# Vote with conviction multiplier
wrfcoin-cli governance conviction-vote proposal_id "yes"
\`\`\`

### Futarchy

Prediction markets for governance outcomes:

\`\`\`bash
# Create prediction market for proposal
wrfcoin-cli futarchy create-market proposal_id \
  --outcome-metric "network_value" \
  --duration 90
\`\`\`

## Governance Security

### Proposal Validation

**Security Checks:**
- Code review requirements
- Security audit mandates
- Economic impact analysis
- Community consensus thresholds

**Emergency Procedures:**
- Fast-track security fixes
- Emergency pause mechanisms
- Rollback procedures
- Incident response protocols

### Sybil Resistance

**Anti-Sybil Measures:**
- Minimum token holdings
- Identity verification (optional)
- Reputation systems
- Time-based restrictions

**Vote Buying Prevention:**
- Token time-locks
- Delegation restrictions
- Transparency requirements
- Economic disincentives

## Governance Analytics

### Participation Metrics

Track governance health:
- Voter turnout rates
- Proposal success rates
- Community engagement levels
- Token distribution analysis

### Dashboard Features

**Governance Dashboard:**
- Active proposals
- Voting history
- Delegation status
- Reward tracking
- Performance metrics

**Analytics Tools:**
\`\`\`bash
# Governance statistics
wrfcoin-cli governance stats --period 30days

# Voting pattern analysis
wrfcoin-cli governance analyze --type participation
\`\`\`

## Future Governance Evolution

### Planned Improvements

**Short Term (6 months):**
- Mobile governance app
- Simplified proposal process
- Enhanced delegation features
- Improved UI/UX

**Medium Term (1-2 years):**
- Cross-chain governance
- AI-assisted proposal analysis
- Advanced voting mechanisms
- Governance token evolution

**Long Term (3+ years):**
- Fully autonomous governance
- AI governance advisors
- Predictive governance models
- Self-evolving protocols

For governance support and participation, visit [gov.wrfcoin.network](https://gov.wrfcoin.network) or join our [governance community](https://discord.gg/wrfcoin-governance).`,
  };

  useEffect(() => {
    setLoading(true);

    // Use built-in content to avoid loading issues
    const tutorial = tutorialMetadata[tutorialId];
    if (tutorial && tutorialContent_builtin[tutorialId]) {
      setTutorialContent(tutorialContent_builtin[tutorialId]);
      setError(null);
    } else {
      setError('Tutorial not found');
    }

    setLoading(false);
  }, [tutorialId]);

  const currentTutorial = tutorialMetadata[tutorialId];

  if (loading) {
    return (
      <div className="tutorial-loading">
        <div className="loading-spinner"></div>
        <p>Loading tutorial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutorial-error">
        <i className="bi bi-exclamation-triangle"></i>
        <h3>Error Loading Tutorial</h3>
        <p>{error}</p>
        <div className="tutorial-fallback">
          <h2>{currentTutorial?.title || 'Tutorial'}</h2>
          <p>
            {currentTutorial?.description ||
              'Tutorial content is being prepared.'}
          </p>
          {currentTutorial?.actions && (
            <div className="tutorial-actions">
              {currentTutorial.actions.map((action, index) => (
                <button
                  key={index}
                  className={`btn-${action.type}`}
                  onClick={action.action}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-docs">
      {/* Tutorial Header */}
      <div className="tutorial-header">
        <h1>{currentTutorial?.title}</h1>
        <p className="tutorial-description">{currentTutorial?.description}</p>

        {/* Quick Action Buttons */}
        {currentTutorial?.actions && (
          <div className="tutorial-quick-actions">
            {currentTutorial.actions.map((action, index) => (
              <button
                key={index}
                className={`btn-${action.type}`}
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tutorial Content */}
      <div className="tutorial-content">
        <ReactMarkdown
          components={{
            code(props) {
              const { node, inline, className, children, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            },
            h1({ children }) {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h1 id={id}>{children}</h1>;
            },
            h2({ children }) {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h2 id={id}>{children}</h2>;
            },
            h3({ children }) {
              const id = String(children).toLowerCase().replace(/\s+/g, '-');
              return <h3 id={id}>{children}</h3>;
            },
            a({ href, children }) {
              if (href?.startsWith('http')) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              }
              return <a href={href}>{children}</a>;
            },
          }}
        >
          {tutorialContent}
        </ReactMarkdown>
      </div>

      {/* Tutorial Navigation */}
      <div className="tutorial-navigation">
        <button className="btn-outline" onClick={() => window.history.back()}>
          ← Back to Tutorials
        </button>

        {currentTutorial?.actions && (
          <div className="tutorial-nav-actions">
            {currentTutorial.actions.map((action, index) => (
              <button
                key={index}
                className={`btn-${action.type}`}
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialDocs;
