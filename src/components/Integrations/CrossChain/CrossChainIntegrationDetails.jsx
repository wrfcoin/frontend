import { useState, useEffect } from 'react';
import './CrossChainIntegrationDetails.css';

const CrossChainIntegrationDetails = ({ integrationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [bridgeData, setBridgeData] = useState([]);
  const [networkData, setNetworkData] = useState({});
  const [stats, setStats] = useState({
    bridgesActive: 0,
    totalValueBridged: 0,
    transactionsToday: 0,
    avgConfirmationTime: 0,
  });
  const [bridgeForm, setBridgeForm] = useState({
    sourceChain: '',
    destChain: '',
    asset: 'WRF',
    amount: '',
    recipient: '',
    fee: '0.0',
  });

  // Simulated data for cross-chain integrations
  const integrationDetails = {
    layerzero: {
      name: 'LayerZero',
      description:
        'Ultra-light cross-chain messaging protocol designed for secure and reliable interoperability.',
      icon: 'bi-link-45deg',
      color: '#6C5CE7',
      website: 'https://layerzero.network/',
      documentation: 'https://docs.layerzero.network/',
      supportedChains: [
        'Ethereum',
        'Binance Smart Chain',
        'Avalanche',
        'Polygon',
        'Arbitrum',
        'Optimism',
        'Base',
      ],
      technology: 'Ultra-light Nodes (ULNs)',
      status: 'Connected',
      lastSync: '3 minutes ago',
    },
    wormhole: {
      name: 'Wormhole',
      description:
        'Generic cross-chain messaging protocol with composable token and NFT transfers.',
      icon: 'bi-infinity',
      color: '#FF3366',
      website: 'https://wormhole.com/',
      documentation: 'https://docs.wormhole.com/',
      supportedChains: [
        'Ethereum',
        'Solana',
        'BSC',
        'Polygon',
        'Avalanche',
        'Oasis',
        'Fantom',
      ],
      technology: 'Guardian Network',
      status: 'Connected',
      lastSync: '10 minutes ago',
    },
    axelar: {
      name: 'Axelar Network',
      description:
        'Proof-of-stake blockchain and secure cross-chain communication protocol.',
      icon: 'bi-hexagon',
      color: '#0AE2FF',
      website: 'https://axelar.network/',
      documentation: 'https://docs.axelar.dev/',
      supportedChains: [
        'Ethereum',
        'Cosmos',
        'Avalanche',
        'Fantom',
        'Polygon',
        'Moonbeam',
      ],
      technology: 'Cross-chain Gateway Protocol',
      status: 'Connected',
      lastSync: '5 minutes ago',
    },
    cosmos: {
      name: 'Cosmos IBC',
      description:
        'Inter-Blockchain Communication protocol for cross-chain transfers in the Cosmos ecosystem.',
      icon: 'bi-globe',
      color: '#2E3148',
      website: 'https://cosmos.network/',
      documentation: 'https://docs.cosmos.network/v0.45/ibc/overview.html',
      supportedChains: [
        'Cosmos Hub',
        'Osmosis',
        'Juno',
        'Secret Network',
        'Akash',
        'Stargaze',
      ],
      technology: 'Inter-Blockchain Communication (IBC)',
      status: 'Update Required',
      lastSync: '3 days ago',
    },
    polkadot: {
      name: 'Polkadot',
      description:
        'Multi-chain network enabling cross-chain transfers and interoperability between parachains.',
      icon: 'bi-circle-fill',
      color: '#E6007A',
      website: 'https://polkadot.network/',
      documentation: 'https://wiki.polkadot.network/',
      supportedChains: [
        'Polkadot',
        'Kusama',
        'Acala',
        'Moonbeam',
        'Astar',
        'Interlay',
      ],
      technology: 'Cross-Consensus Message Format (XCM)',
      status: 'Configuration Required',
      lastSync: 'Never',
    },
    near: {
      name: 'NEAR Rainbow Bridge',
      description:
        'Trustless bridge between NEAR Protocol and Ethereum for token and data transfers.',
      icon: 'bi-rainbow',
      color: '#000000',
      website: 'https://near.org/',
      documentation: 'https://near.org/bridge/',
      supportedChains: ['NEAR Protocol', 'Ethereum', 'Aurora'],
      technology: 'Light Client Relayers',
      status: 'Connected',
      lastSync: '25 minutes ago',
    },
    stargate: {
      name: 'Stargate Finance',
      description:
        'Unified liquidity transfer protocol built on LayerZero to solve the bridging trilemma.',
      icon: 'bi-stars',
      color: '#00BCD4',
      website: 'https://stargate.finance/',
      documentation: 'https://stargateprotocol.gitbook.io/',
      supportedChains: [
        'Ethereum',
        'BSC',
        'Avalanche',
        'Polygon',
        'Arbitrum',
        'Optimism',
        'Fantom',
      ],
      technology: 'Composable Uniform Liquidity Pools',
      status: 'Connected',
      lastSync: '17 minutes ago',
    },
    multichain: {
      name: 'Multichain',
      description:
        'Cross-chain router protocol for asset and data interoperability between multiple chains.',
      icon: 'bi-intersect',
      color: '#3375BB',
      website: 'https://multichain.org/',
      documentation: 'https://docs.multichain.org/',
      supportedChains: [
        'Ethereum',
        'BSC',
        'Fantom',
        'Polygon',
        'Avalanche',
        'Arbitrum',
        'Harmony',
      ],
      technology: 'SMPC (Secure Multi-Party Computation)',
      status: 'Not Connected',
      lastSync: 'Never',
    },
    bearmint: {
      name: 'Bearmint',
      description:
        'WRF Ecosystem custom bridge for high-throughput weather data validation.',
      icon: 'bi-cloud-lightning',
      color: '#795548',
      website: 'https://wrfcoin.org/bearmint-bridge',
      documentation: 'https://docs.wrfcoin.org/bridges/bearmint',
      supportedChains: [
        'WRF Mainnet',
        'WRF Testnet',
        'Ethereum',
        'Polygon',
        'Avalanche',
      ],
      technology: 'Custom Weather-Data Validators',
      status: 'Connected',
      lastSync: '8 minutes ago',
    },
  };

  // Simulated network/chain data
  const networkDetails = {
    layerzero: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 12,
          lastBlock: 18723442,
        },
        {
          name: 'Binance Smart Chain',
          chainId: '56',
          status: 'active',
          gasPrice: '5 GWEI',
          confirmations: 15,
          lastBlock: 33985212,
        },
        {
          name: 'Avalanche',
          chainId: '43114',
          status: 'active',
          gasPrice: '28 NAVO',
          confirmations: 12,
          lastBlock: 42856752,
        },
        {
          name: 'Polygon',
          chainId: '137',
          status: 'active',
          gasPrice: '78 GWEI',
          confirmations: 80,
          lastBlock: 52369874,
        },
        {
          name: 'Arbitrum',
          chainId: '42161',
          status: 'active',
          gasPrice: '0.1 GWEI',
          confirmations: 12,
          lastBlock: 145875201,
        },
        {
          name: 'Optimism',
          chainId: '10',
          status: 'active',
          gasPrice: '0.001 GWEI',
          confirmations: 12,
          lastBlock: 112458963,
        },
        {
          name: 'Base',
          chainId: '8453',
          status: 'active',
          gasPrice: '0.001 GWEI',
          confirmations: 15,
          lastBlock: 8526974,
        },
      ],
      messageDelay: '10-30 mins',
      securityModel: 'Ultra-Light Nodes with Oracle backup',
      feeModel: 'Fixed fee per message based on destination chain',
      transactionFees: {
        Ethereum: '0.0120 ETH',
        'Binance Smart Chain': '0.0050 BNB',
        Avalanche: '0.5000 AVAX',
        Polygon: '2.5000 MATIC',
        Arbitrum: '0.0010 ETH',
        Optimism: '0.0010 ETH',
        Base: '0.0010 ETH',
      },
    },
    wormhole: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 15,
          lastBlock: 18723442,
        },
        {
          name: 'Solana',
          chainId: '1399811149',
          status: 'active',
          gasPrice: '0.000005 SOL',
          confirmations: 32,
          lastBlock: 198654723,
        },
        {
          name: 'BSC',
          chainId: '56',
          status: 'active',
          gasPrice: '5 GWEI',
          confirmations: 15,
          lastBlock: 33985212,
        },
        {
          name: 'Polygon',
          chainId: '137',
          status: 'active',
          gasPrice: '78 GWEI',
          confirmations: 80,
          lastBlock: 52369874,
        },
        {
          name: 'Avalanche',
          chainId: '43114',
          status: 'active',
          gasPrice: '28 NAVO',
          confirmations: 12,
          lastBlock: 42856752,
        },
        {
          name: 'Oasis',
          chainId: '42262',
          status: 'active',
          gasPrice: '0.0000021 ROSE',
          confirmations: 10,
          lastBlock: 18563421,
        },
        {
          name: 'Fantom',
          chainId: '250',
          status: 'active',
          gasPrice: '180 GWEI',
          confirmations: 5,
          lastBlock: 65782145,
        },
      ],
      messageDelay: '15-45 mins',
      securityModel: 'Guardian Network (19 validators)',
      feeModel: 'Varies by token, chain, and size of transfer',
      transactionFees: {
        Ethereum: '0.0100 ETH',
        Solana: '0.0010 SOL',
        BSC: '0.0040 BNB',
        Polygon: '2.0000 MATIC',
        Avalanche: '0.4000 AVAX',
        Oasis: '1.0000 ROSE',
        Fantom: '1.0000 FTM',
      },
    },
    axelar: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 15,
          lastBlock: 18723442,
        },
        {
          name: 'Cosmos',
          chainId: 'cosmoshub-4',
          status: 'active',
          gasPrice: '0.025 ATOM',
          confirmations: 5,
          lastBlock: 16325478,
        },
        {
          name: 'Avalanche',
          chainId: '43114',
          status: 'active',
          gasPrice: '28 NAVO',
          confirmations: 12,
          lastBlock: 42856752,
        },
        {
          name: 'Fantom',
          chainId: '250',
          status: 'active',
          gasPrice: '180 GWEI',
          confirmations: 5,
          lastBlock: 65782145,
        },
        {
          name: 'Polygon',
          chainId: '137',
          status: 'active',
          gasPrice: '78 GWEI',
          confirmations: 80,
          lastBlock: 52369874,
        },
        {
          name: 'Moonbeam',
          chainId: '1284',
          status: 'active',
          gasPrice: '100 GWEI',
          confirmations: 10,
          lastBlock: 3215647,
        },
      ],
      messageDelay: '20-60 mins',
      securityModel: 'Proof-of-Stake Validators',
      feeModel: 'Gas fee on source chain + routing fee',
      transactionFees: {
        Ethereum: '0.0080 ETH',
        Cosmos: '0.0500 ATOM',
        Avalanche: '0.3000 AVAX',
        Fantom: '0.8000 FTM',
        Polygon: '1.8000 MATIC',
        Moonbeam: '0.0500 GLMR',
      },
    },
    cosmos: {
      networkStatus: 'degraded',
      chains: [
        {
          name: 'Cosmos Hub',
          chainId: 'cosmoshub-4',
          status: 'active',
          gasPrice: '0.025 ATOM',
          confirmations: 5,
          lastBlock: 16325478,
        },
        {
          name: 'Osmosis',
          chainId: 'osmosis-1',
          status: 'active',
          gasPrice: '0.0025 OSMO',
          confirmations: 5,
          lastBlock: 11236984,
        },
        {
          name: 'Juno',
          chainId: 'juno-1',
          status: 'active',
          gasPrice: '0.075 JUNO',
          confirmations: 5,
          lastBlock: 9852147,
        },
        {
          name: 'Secret Network',
          chainId: 'secret-4',
          status: 'degraded',
          gasPrice: '0.15 SCRT',
          confirmations: 5,
          lastBlock: 6954123,
        },
        {
          name: 'Akash',
          chainId: 'akashnet-2',
          status: 'active',
          gasPrice: '0.02 AKT',
          confirmations: 5,
          lastBlock: 8541236,
        },
        {
          name: 'Stargaze',
          chainId: 'stargaze-1',
          status: 'active',
          gasPrice: '0.025 STARS',
          confirmations: 5,
          lastBlock: 7584123,
        },
      ],
      messageDelay: '1-5 mins',
      securityModel: 'IBC Protocol with relayers',
      feeModel: 'Gas fee on source and destination chain + relayer fee',
      transactionFees: {
        'Cosmos Hub': '0.0025 ATOM',
        Osmosis: '0.0010 OSMO',
        Juno: '0.0050 JUNO',
        'Secret Network': '0.1000 SCRT',
        Akash: '0.0100 AKT',
        Stargaze: '0.0150 STARS',
      },
    },
    polkadot: {
      networkStatus: 'not_configured',
      chains: [],
      messageDelay: null,
      securityModel: null,
      feeModel: null,
      transactionFees: null,
    },
    near: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'NEAR Protocol',
          chainId: 'mainnet',
          status: 'active',
          gasPrice: '0.0001 NEAR',
          confirmations: 2,
          lastBlock: 98541236,
        },
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 15,
          lastBlock: 18723442,
        },
        {
          name: 'Aurora',
          chainId: '1313161554',
          status: 'active',
          gasPrice: '0.00000001 ETH',
          confirmations: 5,
          lastBlock: 114287546,
        },
      ],
      messageDelay: '30-90 mins',
      securityModel: 'Light Client Relayers',
      feeModel: 'Gas on both chains + Rainbow Bridge fees',
      transactionFees: {
        'NEAR Protocol': '0.0100 NEAR',
        Ethereum: '0.0150 ETH',
        Aurora: '0.0005 ETH',
      },
    },
    stargate: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 15,
          lastBlock: 18723442,
        },
        {
          name: 'BSC',
          chainId: '56',
          status: 'active',
          gasPrice: '5 GWEI',
          confirmations: 15,
          lastBlock: 33985212,
        },
        {
          name: 'Avalanche',
          chainId: '43114',
          status: 'active',
          gasPrice: '28 NAVO',
          confirmations: 12,
          lastBlock: 42856752,
        },
        {
          name: 'Polygon',
          chainId: '137',
          status: 'active',
          gasPrice: '78 GWEI',
          confirmations: 80,
          lastBlock: 52369874,
        },
        {
          name: 'Arbitrum',
          chainId: '42161',
          status: 'active',
          gasPrice: '0.1 GWEI',
          confirmations: 12,
          lastBlock: 145875201,
        },
        {
          name: 'Optimism',
          chainId: '10',
          status: 'active',
          gasPrice: '0.001 GWEI',
          confirmations: 12,
          lastBlock: 112458963,
        },
        {
          name: 'Fantom',
          chainId: '250',
          status: 'active',
          gasPrice: '180 GWEI',
          confirmations: 5,
          lastBlock: 65782145,
        },
      ],
      messageDelay: '10-30 mins',
      securityModel: 'Relies on LayerZero security',
      feeModel: 'Swap fee and bridge fee combined',
      transactionFees: {
        Ethereum: '0.0150 ETH',
        BSC: '0.0055 BNB',
        Avalanche: '0.5500 AVAX',
        Polygon: '2.7500 MATIC',
        Arbitrum: '0.0012 ETH',
        Optimism: '0.0012 ETH',
        Fantom: '1.2000 FTM',
      },
    },
    multichain: {
      networkStatus: 'not_connected',
      chains: [],
      messageDelay: null,
      securityModel: null,
      feeModel: null,
      transactionFees: null,
    },
    bearmint: {
      networkStatus: 'operational',
      chains: [
        {
          name: 'WRF Mainnet',
          chainId: 'wrf-1',
          status: 'active',
          gasPrice: '0.001 WRF',
          confirmations: 1,
          lastBlock: 1568974,
        },
        {
          name: 'WRF Testnet',
          chainId: 'wrf-test-1',
          status: 'active',
          gasPrice: '0.0005 WRF',
          confirmations: 1,
          lastBlock: 1091845,
        },
        {
          name: 'Ethereum',
          chainId: '1',
          status: 'active',
          gasPrice: '21 GWEI',
          confirmations: 15,
          lastBlock: 18723442,
        },
        {
          name: 'Polygon',
          chainId: '137',
          status: 'active',
          gasPrice: '78 GWEI',
          confirmations: 80,
          lastBlock: 52369874,
        },
        {
          name: 'Avalanche',
          chainId: '43114',
          status: 'active',
          gasPrice: '28 NAVO',
          confirmations: 12,
          lastBlock: 42856752,
        },
      ],
      messageDelay: '5-20 mins',
      securityModel: 'Weather Data Validators + MPC',
      feeModel: 'Fixed fee + gas cost adjusted by data size',
      transactionFees: {
        'WRF Mainnet': '0.1000 WRF',
        'WRF Testnet': '0.0100 WRF',
        Ethereum: '0.0060 ETH',
        Polygon: '1.0000 MATIC',
        Avalanche: '0.2000 AVAX',
      },
    },
  };

  // Simulated bridge transaction data
  const mockBridgeData = {
    layerzero: [
      {
        id: 'lz-tx-123',
        sourceChain: 'Ethereum',
        destChain: 'Polygon',
        asset: 'USDC',
        amount: '500',
        status: 'completed',
        timestamp: '2025-05-19T00:15:22Z',
        fee: '0.007 ETH',
        hash: '0x123...456',
      },
      {
        id: 'lz-tx-124',
        sourceChain: 'BSC',
        destChain: 'Avalanche',
        asset: 'WRF',
        amount: '250',
        status: 'completed',
        timestamp: '2025-05-18T23:42:11Z',
        fee: '0.002 BNB',
        hash: '0x789...012',
      },
      {
        id: 'lz-tx-125',
        sourceChain: 'Polygon',
        destChain: 'Arbitrum',
        asset: 'USDT',
        amount: '1200',
        status: 'in_progress',
        timestamp: '2025-05-19T00:35:56Z',
        fee: '1.2 MATIC',
        hash: '0x345...678',
      },
    ],
    wormhole: [
      {
        id: 'wh-tx-456',
        sourceChain: 'Ethereum',
        destChain: 'Solana',
        asset: 'USDC',
        amount: '750',
        status: 'completed',
        timestamp: '2025-05-18T22:30:10Z',
        fee: '0.009 ETH',
        hash: '0xabc...def',
      },
      {
        id: 'wh-tx-457',
        sourceChain: 'Solana',
        destChain: 'BSC',
        asset: 'Wrapped SOL',
        amount: '12.5',
        status: 'completed',
        timestamp: '2025-05-19T00:10:32Z',
        fee: '0.0009 SOL',
        hash: '3XYZ...789',
      },
      {
        id: 'wh-tx-458',
        sourceChain: 'BSC',
        destChain: 'Ethereum',
        asset: 'BUSD',
        amount: '1000',
        status: 'failed',
        timestamp: '2025-05-18T21:22:45Z',
        fee: '0.003 BNB',
        hash: '0x567...890',
        failReason: 'Insufficient relayer fee',
      },
    ],
    axelar: [
      {
        id: 'ax-tx-789',
        sourceChain: 'Ethereum',
        destChain: 'Cosmos',
        asset: 'USDC',
        amount: '2500',
        status: 'completed',
        timestamp: '2025-05-18T18:15:35Z',
        fee: '0.006 ETH',
        hash: '0xghi...jkl',
      },
      {
        id: 'ax-tx-790',
        sourceChain: 'Cosmos',
        destChain: 'Avalanche',
        asset: 'ATOM',
        amount: '15',
        status: 'completed',
        timestamp: '2025-05-18T20:45:22Z',
        fee: '0.02 ATOM',
        hash: '4MNO...PQR',
      },
      {
        id: 'ax-tx-791',
        sourceChain: 'Moonbeam',
        destChain: 'Polygon',
        asset: 'axlUSDC',
        amount: '3500',
        status: 'completed',
        timestamp: '2025-05-19T00:05:18Z',
        fee: '0.04 GLMR',
        hash: '0xstu...vwx',
      },
    ],
    cosmos: [
      {
        id: 'ibc-tx-012',
        sourceChain: 'Cosmos Hub',
        destChain: 'Osmosis',
        asset: 'ATOM',
        amount: '5',
        status: 'completed',
        timestamp: '2025-05-19T00:22:12Z',
        fee: '0.0025 ATOM',
        hash: '5ABC...DEF',
      },
      {
        id: 'ibc-tx-013',
        sourceChain: 'Osmosis',
        destChain: 'Juno',
        asset: 'OSMO',
        amount: '25',
        status: 'in_progress',
        timestamp: '2025-05-19T00:38:44Z',
        fee: '0.001 OSMO',
        hash: '6GHI...JKL',
      },
      {
        id: 'ibc-tx-014',
        sourceChain: 'Secret Network',
        destChain: 'Cosmos Hub',
        asset: 'SCRT',
        amount: '10',
        status: 'failed',
        timestamp: '2025-05-18T22:55:32Z',
        fee: '0.075 SCRT',
        hash: '7MNO...PQR',
        failReason: 'IBC timeout',
      },
    ],
    near: [
      {
        id: 'rb-tx-345',
        sourceChain: 'NEAR',
        destChain: 'Ethereum',
        asset: 'NEAR',
        amount: '100',
        status: 'completed',
        timestamp: '2025-05-18T21:05:12Z',
        fee: '0.01 NEAR',
        hash: '8STU...VWX',
      },
      {
        id: 'rb-tx-346',
        sourceChain: 'Ethereum',
        destChain: 'Aurora',
        asset: 'ETH',
        amount: '0.5',
        status: 'completed',
        timestamp: '2025-05-18T23:18:32Z',
        fee: '0.005 ETH',
        hash: '0xijk...lmn',
      },
    ],
    stargate: [
      {
        id: 'sg-tx-678',
        sourceChain: 'Ethereum',
        destChain: 'BSC',
        asset: 'USDC',
        amount: '5000',
        status: 'completed',
        timestamp: '2025-05-18T19:28:14Z',
        fee: '0.014 ETH',
        hash: '0xopq...rst',
      },
      {
        id: 'sg-tx-679',
        sourceChain: 'Arbitrum',
        destChain: 'Optimism',
        asset: 'USDT',
        amount: '2750',
        status: 'completed',
        timestamp: '2025-05-19T00:02:38Z',
        fee: '0.0008 ETH',
        hash: '0xuvw...xyz',
      },
      {
        id: 'sg-tx-680',
        sourceChain: 'Avalanche',
        destChain: 'Polygon',
        asset: 'USDC',
        amount: '1800',
        status: 'in_progress',
        timestamp: '2025-05-19T00:30:22Z',
        fee: '0.25 AVAX',
        hash: '0x123...456',
      },
    ],
    bearmint: [
      {
        id: 'bm-tx-901',
        sourceChain: 'WRF Mainnet',
        destChain: 'Ethereum',
        asset: 'WRF',
        amount: '500',
        status: 'completed',
        timestamp: '2025-05-18T22:15:48Z',
        fee: '0.08 WRF',
        hash: '0x789...012',
      },
      {
        id: 'bm-tx-902',
        sourceChain: 'Polygon',
        destChain: 'WRF Mainnet',
        asset: 'MATIC',
        amount: '1000',
        status: 'completed',
        timestamp: '2025-05-18T23:45:12Z',
        fee: '0.8 MATIC',
        hash: '0x345...678',
      },
      {
        id: 'bm-tx-903',
        sourceChain: 'Ethereum',
        destChain: 'WRF Testnet',
        asset: 'WRF Weather Data',
        amount: 'N/A',
        status: 'completed',
        timestamp: '2025-05-19T00:18:33Z',
        fee: '0.006 ETH',
        hash: '0xabc...def',
        dataType: 'Weather Station Data',
        dataSize: '2.4 MB',
      },
    ],
  };

  // Simulated bridge stats
  const calculateStats = provider => {
    switch (provider) {
    case 'layerzero':
      return {
        bridgesActive: 15,
        totalValueBridged: 12500000,
        transactionsToday: 652,
        avgConfirmationTime: 28,
        tvlByChain: [
          { chain: 'Ethereum', value: 4500000 },
          { chain: 'BSC', value: 2800000 },
          { chain: 'Avalanche', value: 1900000 },
          { chain: 'Polygon', value: 1650000 },
          { chain: 'Arbitrum', value: 1050000 },
          { chain: 'Optimism', value: 350000 },
          { chain: 'Base', value: 250000 },
        ],
      };
    case 'wormhole':
      return {
        bridgesActive: 12,
        totalValueBridged: 9800000,
        transactionsToday: 435,
        avgConfirmationTime: 35,
        tvlByChain: [
          { chain: 'Ethereum', value: 3750000 },
          { chain: 'Solana', value: 2200000 },
          { chain: 'BSC', value: 1850000 },
          { chain: 'Avalanche', value: 950000 },
          { chain: 'Polygon', value: 750000 },
          { chain: 'Fantom', value: 300000 },
        ],
      };
    case 'axelar':
      return {
        bridgesActive: 8,
        totalValueBridged: 7500000,
        transactionsToday: 304,
        avgConfirmationTime: 42,
        tvlByChain: [
          { chain: 'Ethereum', value: 3100000 },
          { chain: 'Cosmos', value: 1650000 },
          { chain: 'Polygon', value: 1200000 },
          { chain: 'Avalanche', value: 850000 },
          { chain: 'Moonbeam', value: 450000 },
          { chain: 'Fantom', value: 250000 },
        ],
      };
    case 'cosmos':
      return {
        bridgesActive: 10,
        totalValueBridged: 3200000,
        transactionsToday: 587,
        avgConfirmationTime: 8,
        tvlByChain: [
          { chain: 'Cosmos Hub', value: 1050000 },
          { chain: 'Osmosis', value: 850000 },
          { chain: 'Juno', value: 450000 },
          { chain: 'Secret Network', value: 350000 },
          { chain: 'Akash', value: 250000 },
          { chain: 'Stargaze', value: 250000 },
        ],
      };
    case 'polkadot':
      return {
        bridgesActive: 0,
        totalValueBridged: 0,
        transactionsToday: 0,
        avgConfirmationTime: 0,
        tvlByChain: [],
      };
    case 'near':
      return {
        bridgesActive: 3,
        totalValueBridged: 2100000,
        transactionsToday: 168,
        avgConfirmationTime: 45,
        tvlByChain: [
          { chain: 'NEAR', value: 950000 },
          { chain: 'Ethereum', value: 850000 },
          { chain: 'Aurora', value: 300000 },
        ],
      };
    case 'stargate':
      return {
        bridgesActive: 10,
        totalValueBridged: 6800000,
        transactionsToday: 423,
        avgConfirmationTime: 32,
        tvlByChain: [
          { chain: 'Ethereum', value: 2300000 },
          { chain: 'BSC', value: 1400000 },
          { chain: 'Avalanche', value: 950000 },
          { chain: 'Polygon', value: 850000 },
          { chain: 'Arbitrum', value: 750000 },
          { chain: 'Optimism', value: 350000 },
          { chain: 'Fantom', value: 200000 },
        ],
      };
    case 'multichain':
      return {
        bridgesActive: 0,
        totalValueBridged: 0,
        transactionsToday: 0,
        avgConfirmationTime: 0,
        tvlByChain: [],
      };
    case 'bearmint':
      return {
        bridgesActive: 5,
        totalValueBridged: 1200000,
        transactionsToday: 214,
        avgConfirmationTime: 15,
        tvlByChain: [
          { chain: 'WRF Mainnet', value: 450000 },
          { chain: 'Ethereum', value: 350000 },
          { chain: 'Polygon', value: 250000 },
          { chain: 'Avalanche', value: 150000 },
        ],
        dataTransfersToday: 85,
        totalDataBridged: '15.8 TB',
        dataTypes: {
          'Weather Station Data': 65,
          'Forecast Models': 25,
          'Climate Simulations': 10,
        },
      };
    default:
      return {
        bridgesActive: 0,
        totalValueBridged: 0,
        transactionsToday: 0,
        avgConfirmationTime: 0,
      };
    }
  };

  // Load data based on selected integration
  useEffect(() => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (integrationId) {
        setBridgeData(mockBridgeData[integrationId] || []);
        setNetworkData(networkDetails[integrationId] || {});
        setStats(calculateStats(integrationId));

        if (
          integrationId &&
          networkDetails[integrationId]?.chains?.length > 0
        ) {
          setBridgeForm(prev => ({
            ...prev,
            sourceChain: networkDetails[integrationId].chains[0].name,
            destChain: networkDetails[integrationId].chains[1]?.name || '',
          }));
        }
      }

      setLoading(false);
    }, 800);
  }, [integrationId]);

  // Handle form changes
  const handleBridgeFormChange = e => {
    const { name, value } = e.target;
    setBridgeForm({
      ...bridgeForm,
      [name]: value,
    });

    // Simulate fee calculation when amount changes
    if (name === 'amount' || name === 'sourceChain' || name === 'destChain') {
      // Get the source chain's fee if available
      const sourceFee = networkData.transactionFees?.[bridgeForm.sourceChain];
      if (sourceFee) {
        const [value, currency] = sourceFee.split(' ');
        setBridgeForm(prev => ({
          ...prev,
          fee: value,
        }));
      }
    }
  };

  // Handle bridge transaction
  const handleBridgeSubmit = e => {
    e.preventDefault();

    // In a real app, this would submit the bridge transaction
    alert(`Bridge request submitted:
Source: ${bridgeForm.sourceChain}
Destination: ${bridgeForm.destChain}
Asset: ${bridgeForm.asset}
Amount: ${bridgeForm.amount}
Recipient: ${bridgeForm.recipient}
Fee: ${bridgeForm.fee}`);
  };

  // Format the dollar amount with commas
  const formatDollarAmount = amount => {
    return '$' + amount.toLocaleString();
  };

  // Get details for current integration
  const details = integrationId ? integrationDetails[integrationId] : null;

  if (loading) {
    return (
      <div className="cc-integration-loading">
        <div className="cc-spinner" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p>Loading cross-chain integration data...</p>
      </div>
    );
  }

  return (
    <div className="cc-integration-container">
      {details ? (
        <>
          <div className="cc-integration-header">
            <div
              className="integration-icon"
              style={{ backgroundColor: details.color }}
            >
              <i className={`bi ${details.icon}`}></i>
            </div>
            <div className="integration-info">
              <h2>{details.name}</h2>
              <p>{details.description}</p>
              <div className="integration-meta">
                <span className="technology-type">
                  <i className="bi bi-gear"></i> {details.technology}
                </span>
                <span
                  className={`status ${details.status.toLowerCase().replace(' ', '-')}`}
                >
                  <i className="bi bi-circle-fill"></i> {details.status}
                </span>
                {details.lastSync !== 'Never' && (
                  <span className="last-sync">
                    <i className="bi bi-arrow-repeat"></i> Last synced:{' '}
                    {details.lastSync}
                  </span>
                )}
                <span className="documentation">
                  <i className="bi bi-file-earmark-text"></i>{' '}
                  <a
                    href={details.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </span>
              </div>
            </div>
          </div>

          <div className="cc-tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </button>
            <button
              className={activeTab === 'networks' ? 'active' : ''}
              onClick={() => setActiveTab('networks')}
            >
              <i className="bi bi-diagram-3"></i> Networks
              <WrfBadge color="primary">
                {details.supportedChains.length}
              </WrfBadge>
            </button>
            <button
              className={activeTab === 'transactions' ? 'active' : ''}
              onClick={() => setActiveTab('transactions')}
            >
              <i className="bi bi-arrow-left-right"></i> Transactions
              <WrfBadge color="primary">{bridgeData.length}</WrfBadge>
            </button>
            <button
              className={activeTab === 'bridge' ? 'active' : ''}
              onClick={() => setActiveTab('bridge')}
            >
              <i className="bi bi-send"></i> Bridge Assets
            </button>
            <button
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <i className="bi bi-gear"></i> Settings
            </button>
          </div>

          <div className="cc-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-link"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.bridgesActive}</h3>
                      <p>Active Bridges</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-currency-dollar"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{formatDollarAmount(stats.totalValueBridged)}</h3>
                      <p>Total Value Bridged</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-arrow-repeat"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.transactionsToday}</h3>
                      <p>Transactions Today</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-stopwatch"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.avgConfirmationTime} mins</h3>
                      <p>Avg. Confirmation Time</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.avgConfirmationTime <= 15
                            ? 'good'
                            : stats.avgConfirmationTime <= 45
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.avgConfirmationTime <= 15
                          ? 'Fast'
                          : stats.avgConfirmationTime <= 45
                            ? 'Average'
                            : 'Slow'}
                      </span>
                    </div>
                  </div>
                </div>

                {networkData.networkStatus === 'operational' && (
                  <>
                    <div className="tvl-section">
                      <h3>Total Value Locked by Chain</h3>
                      {stats.tvlByChain && stats.tvlByChain.length > 0 ? (
                        <div className="tvl-chart">
                          {stats.tvlByChain.map((item, index) => (
                            <div key={index} className="tvl-bar">
                              <div className="chain-name">{item.chain}</div>
                              <div className="tvl-bar-container">
                                <div
                                  className="tvl-bar-value"
                                  style={{
                                    width: `${(item.value / Math.max(...stats.tvlByChain.map(i => i.value))) * 100}%`,
                                  }}
                                ></div>
                                <div className="tvl-amount">
                                  {formatDollarAmount(item.value)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data-message">
                          <i className="bi bi-exclamation-circle"></i>
                          <p>No TVL data available</p>
                        </div>
                      )}
                    </div>

                    {integrationId === 'bearmint' && (
                      <div className="data-transfers-section">
                        <h3>Data Transfers Overview</h3>
                        <div className="data-transfers-stats">
                          <div className="data-stat-card">
                            <div className="data-stat-icon">
                              <i className="bi bi-cloud-arrow-up-fill"></i>
                            </div>
                            <div className="data-stat-info">
                              <h4>{stats.dataTransfersToday}</h4>
                              <p>Transfers Today</p>
                            </div>
                          </div>
                          <div className="data-stat-card">
                            <div className="data-stat-icon">
                              <i className="bi bi-database"></i>
                            </div>
                            <div className="data-stat-info">
                              <h4>{stats.totalDataBridged}</h4>
                              <p>Total Data Bridged</p>
                            </div>
                          </div>
                        </div>

                        <div className="data-types-chart">
                          <h4>Data Types Distribution</h4>
                          <div className="data-type-bars">
                            {Object.entries(stats.dataTypes).map(
                              ([type, percentage], index) => (
                                <div key={index} className="data-type-item">
                                  <div className="data-type-label">{type}</div>
                                  <div className="data-type-bar-container">
                                    <div
                                      className="data-type-bar"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                    <span className="data-type-percentage">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="network-info-section">
                      <h3>Network Information</h3>
                      <div className="network-info-grid">
                        <div className="network-info-card">
                          <div className="network-info-label">
                            Security Model
                          </div>
                          <div className="network-info-value">
                            {networkData.securityModel}
                          </div>
                        </div>
                        <div className="network-info-card">
                          <div className="network-info-label">
                            Message Delay
                          </div>
                          <div className="network-info-value">
                            {networkData.messageDelay}
                          </div>
                        </div>
                        <div className="network-info-card">
                          <div className="network-info-label">Fee Model</div>
                          <div className="network-info-value">
                            {networkData.feeModel}
                          </div>
                        </div>
                        <div className="network-info-card">
                          <div className="network-info-label">
                            Supported Chains
                          </div>
                          <div className="network-info-value">
                            {details.supportedChains.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {networkData.networkStatus === 'degraded' && (
                  <div className="status-alert warning">
                    <i className="bi bi-exclamation-triangle"></i>
                    <div className="status-message">
                      <h4>Degraded Performance</h4>
                      <p>
                        This network is currently experiencing degraded
                        performance. Some transactions may be delayed. Please
                        check the network status before initiating critical
                        transfers.
                      </p>
                    </div>
                  </div>
                )}

                {networkData.networkStatus === 'not_configured' && (
                  <div className="status-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <div className="status-message">
                      <h4>Configuration Required</h4>
                      <p>
                        This cross-chain integration requires configuration
                        before use. Please complete the setup in the Settings
                        tab.
                      </p>
                      <button
                        className="configure-button"
                        onClick={() => setActiveTab('settings')}
                      >
                        <i className="bi bi-gear"></i> Configure Now
                      </button>
                    </div>
                  </div>
                )}

                {networkData.networkStatus === 'not_connected' && (
                  <div className="status-alert error">
                    <i className="bi bi-x-circle"></i>
                    <div className="status-message">
                      <h4>Not Connected</h4>
                      <p>
                        This cross-chain integration is not currently connected.
                        Enable it in the settings to start using this bridge.
                      </p>
                      <button
                        className="configure-button"
                        onClick={() => setActiveTab('settings')}
                      >
                        <i className="bi bi-power"></i> Connect Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'networks' && (
              <div className="networks-tab">
                <div className="networks-header">
                  <h3>Supported Networks</h3>
                  <div className="network-search">
                    <input type="text" placeholder="Search networks..." />
                  </div>
                </div>

                {networkData.networkStatus === 'not_configured' ||
                networkData.networkStatus === 'not_connected' ? (
                    <div className="no-networks-msg">
                      <i className="bi bi-diagram-3"></i>
                      <p>
                        {networkData.networkStatus === 'not_configured'
                          ? 'Please configure this integration to view supported networks'
                          : 'Connect this integration to view supported networks'}
                      </p>
                      <button
                        className="configure-button"
                        onClick={() => setActiveTab('settings')}
                      >
                        <i className="bi bi-gear"></i>{' '}
                        {networkData.networkStatus === 'not_configured'
                          ? 'Configure Now'
                          : 'Connect Now'}
                      </button>
                    </div>
                  ) : (
                    <div className="networks-grid">
                      {networkData.chains.map((chain, index) => (
                        <div
                          key={index}
                          className={`network-card ${chain.status}`}
                        >
                          <div className="network-header">
                            <h4 className="network-name">{chain.name}</h4>
                            <span className={`network-status ${chain.status}`}>
                              <i className="bi bi-circle-fill"></i>
                              {chain.status === 'active' ? 'Active' : 'Degraded'}
                            </span>
                          </div>
                          <div className="network-details">
                            <div className="network-detail">
                              <span className="detail-label">Chain ID:</span>
                              <span className="detail-value">
                                {chain.chainId}
                              </span>
                            </div>
                            <div className="network-detail">
                              <span className="detail-label">Gas Price:</span>
                              <span className="detail-value">
                                {chain.gasPrice}
                              </span>
                            </div>
                            <div className="network-detail">
                              <span className="detail-label">Confirmations:</span>
                              <span className="detail-value">
                                {chain.confirmations}
                              </span>
                            </div>
                            <div className="network-detail">
                              <span className="detail-label">Last Block:</span>
                              <span className="detail-value">
                                {chain.lastBlock.toLocaleString()}
                              </span>
                            </div>
                            {networkData.transactionFees && (
                              <div className="network-detail">
                                <span className="detail-label">Bridge Fee:</span>
                                <span className="detail-value">
                                  {networkData.transactionFees[chain.name] ||
                                  'N/A'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="network-actions">
                            <button
                              className="bridge-to-btn"
                              onClick={() => {
                                setActiveTab('bridge');
                                setBridgeForm(prev => ({
                                  ...prev,
                                  sourceChain: chain.name,
                                }));
                              }}
                            >
                              <i className="bi bi-arrow-right-square"></i> Bridge
                            from {chain.name}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="transactions-tab">
                <div className="transactions-header">
                  <h3>Recent Bridge Transactions</h3>
                  <div className="transactions-filter">
                    <select defaultValue="all">
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button className="refresh-button">
                      <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                  </div>
                </div>

                {bridgeData.length === 0 ? (
                  <div className="no-transactions">
                    <i className="bi bi-arrow-left-right"></i>
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <div className="transactions-list">
                    {bridgeData.map((tx, index) => (
                      <div
                        key={index}
                        className={`transaction-item status-${tx.status}`}
                      >
                        <div className="transaction-icon">
                          {tx.status === 'completed' ? (
                            <i className="bi bi-check-circle-fill"></i>
                          ) : tx.status === 'in_progress' ? (
                            <i className="bi bi-arrow-repeat"></i>
                          ) : (
                            <i className="bi bi-x-circle-fill"></i>
                          )}
                        </div>
                        <div className="transaction-content">
                          <div className="transaction-header">
                            <div className="transaction-id">
                              <i className="bi bi-hash"></i> {tx.id}
                            </div>
                            <div className="transaction-time">
                              <i className="bi bi-clock"></i>{' '}
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-path">
                              <span className="source-chain">
                                {tx.sourceChain}
                              </span>
                              <i className="bi bi-arrow-right"></i>
                              <span className="dest-chain">{tx.destChain}</span>
                            </div>
                            <div className="transaction-asset">
                              <span className="asset-amount">{tx.amount}</span>
                              <span className="asset-symbol">{tx.asset}</span>
                            </div>
                          </div>
                          <div className="transaction-meta">
                            <div className="transaction-fee">
                              <i className="bi bi-coin"></i> Fee: {tx.fee}
                            </div>
                            <div className="transaction-hash">
                              <i className="bi bi-fingerprint"></i> Hash:{' '}
                              {tx.hash}
                            </div>
                            {tx.dataType && (
                              <div className="transaction-data-type">
                                <i className="bi bi-file-earmark-binary"></i>{' '}
                                {tx.dataType} ({tx.dataSize})
                              </div>
                            )}
                          </div>
                          {tx.status === 'failed' && tx.failReason && (
                            <div className="transaction-error">
                              <i className="bi bi-exclamation-triangle"></i>{' '}
                              {tx.failReason}
                            </div>
                          )}
                        </div>
                        <div className="transaction-status">
                          <span className={`status-badge ${tx.status}`}>
                            {tx.status === 'completed'
                              ? 'Completed'
                              : tx.status === 'in_progress'
                                ? 'In Progress'
                                : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bridge' && (
              <div className="bridge-tab">
                <div className="bridge-header">
                  <h3>Bridge Assets</h3>
                </div>

                {networkData.networkStatus === 'not_configured' ||
                networkData.networkStatus === 'not_connected' ? (
                    <div className="bridge-unconfigured">
                      <i className="bi bi-exclamation-triangle"></i>
                      <h4>
                      Integration{' '}
                        {networkData.networkStatus === 'not_configured'
                          ? 'Configuration'
                          : 'Connection'}{' '}
                      Required
                      </h4>
                      <p>
                      Please{' '}
                        {networkData.networkStatus === 'not_configured'
                          ? 'configure'
                          : 'connect'}{' '}
                      this cross-chain integration before attempting to bridge
                      assets.
                      </p>
                      <button
                        className="configure-button"
                        onClick={() => setActiveTab('settings')}
                      >
                        <i className="bi bi-gear"></i>{' '}
                        {networkData.networkStatus === 'not_configured'
                          ? 'Configure'
                          : 'Connect'}{' '}
                      Now
                      </button>
                    </div>
                  ) : (
                    <div className="bridge-container">
                      <div className="bridge-form-container">
                        <form onSubmit={handleBridgeSubmit}>
                          <div className="bridge-form-row">
                            <div className="form-group">
                              <label>Source Network</label>
                              <select
                                name="sourceChain"
                                value={bridgeForm.sourceChain}
                                onChange={handleBridgeFormChange}
                                className="expanded-dropdown"
                                required
                              >
                                <option value="">Select Source Chain</option>
                                {networkData.chains.map((chain, index) => (
                                  <option key={index} value={chain.name}>
                                    {chain.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="network-swap">
                              <button
                                type="button"
                                onClick={() => {
                                  setBridgeForm(prev => ({
                                    ...prev,
                                    sourceChain: bridgeForm.destChain,
                                    destChain: bridgeForm.sourceChain,
                                  }));
                                }}
                              >
                                <i className="bi bi-arrow-left-right"></i>
                              </button>
                            </div>

                            <div className="form-group">
                              <label>Destination Network</label>
                              <select
                                name="destChain"
                                value={bridgeForm.destChain}
                                onChange={handleBridgeFormChange}
                                className="expanded-dropdown"
                                required
                              >
                                <option value="">Select Destination Chain</option>
                                {networkData.chains.map(
                                  (chain, index) =>
                                    chain.name !== bridgeForm.sourceChain && (
                                      <option key={index} value={chain.name}>
                                        {chain.name}
                                      </option>
                                    ),
                                )}
                              </select>
                            </div>
                          </div>

                          <div className="bridge-form-row">
                            <div className="form-group">
                              <label>Asset</label>
                              <select
                                name="asset"
                                value={bridgeForm.asset}
                                onChange={handleBridgeFormChange}
                                className="expanded-dropdown"
                                required
                              >
                                <option value="WRF">WRF</option>
                                <option value="USDC">USDC</option>
                                <option value="USDT">USDT</option>
                                <option value="ETH">ETH</option>
                                <option value="MATIC">MATIC</option>
                                <option value="AVAX">AVAX</option>
                                {integrationId === 'bearmint' && (
                                  <option value="WRF Weather Data">
                                  WRF Weather Data
                                  </option>
                                )}
                              </select>
                            </div>

                            <div className="form-group">
                              <label>Amount</label>
                              <input
                                type="number"
                                name="amount"
                                value={bridgeForm.amount}
                                onChange={handleBridgeFormChange}
                                placeholder="Enter amount"
                                required
                                min="0.000001"
                                step="0.000001"
                                disabled={bridgeForm.asset === 'WRF Weather Data'}
                              />
                              {bridgeForm.asset === 'WRF Weather Data' && (
                                <small className="form-hint">
                                Weather data transfers are measured by size, not
                                amount
                                </small>
                              )}
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Recipient Address</label>
                            <input
                              type="text"
                              name="recipient"
                              value={bridgeForm.recipient}
                              onChange={handleBridgeFormChange}
                              placeholder="Enter recipient address"
                              required
                            />
                          </div>

                          <div className="bridge-summary">
                            <div className="bridge-fee">
                              <span>Estimated Fee:</span>
                              <span className="fee-value">
                                {bridgeForm.sourceChain &&
                              networkData.transactionFees?.[
                                bridgeForm.sourceChain
                              ]
                                  ? networkData.transactionFees[
                                    bridgeForm.sourceChain
                                  ]
                                  : 'Select source chain'}
                              </span>
                            </div>

                            <div className="bridge-time">
                              <span>Estimated Time:</span>
                              <span>{networkData.messageDelay || 'Unknown'}</span>
                            </div>
                          </div>

                          <div className="bridge-actions">
                            <button
                              type="submit"
                              className="execute-bridge-btn"
                              disabled={
                                !bridgeForm.sourceChain ||
                              !bridgeForm.destChain ||
                              (!bridgeForm.amount &&
                                bridgeForm.asset !== 'WRF Weather Data') ||
                              !bridgeForm.recipient
                              }
                            >
                              <i className="bi bi-send"></i> Send{' '}
                              {bridgeForm.asset === 'WRF Weather Data'
                                ? 'Data'
                                : 'Assets'}
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="bridge-info">
                        <div className="bridge-info-header">
                          <h4>About {details.name} Bridge</h4>
                        </div>

                        <div className="bridge-info-content">
                          <p className="bridge-description">
                          The {details.name} bridge allows secure transfer of{' '}
                            {bridgeForm.asset === 'WRF Weather Data'
                              ? 'data and assets'
                              : 'assets'}{' '}
                          between {details.supportedChains.length} blockchains.
                            {integrationId === 'bearmint'
                              ? ' Bearmint provides specialized support for weather data bridging and cross-chain validation.'
                              : ''}
                          </p>

                          <div className="bridge-key-points">
                            <h5>Key Information</h5>
                            <ul>
                              <li>
                                <strong>Security Model:</strong>{' '}
                                {networkData.securityModel}
                              </li>
                              <li>
                                <strong>Average Time:</strong>{' '}
                                {networkData.messageDelay}
                              </li>
                              <li>
                                <strong>Fee Structure:</strong>{' '}
                                {networkData.feeModel}
                              </li>
                            </ul>
                          </div>

                          <div className="bridge-tips">
                            <h5>Tips</h5>
                            <ul>
                              <li>
                              Ensure you're sending to the correct address
                              format for the destination chain.
                              </li>
                              <li>
                              Always test with a small amount first if you're
                              not familiar with this bridge.
                              </li>
                              <li>
                              Bridging times can vary based on network
                              congestion.
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h3>Integration Settings</h3>

                <div className="settings-section">
                  <h4>Connection Settings</h4>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>API Key</label>
                      <div className="api-key-field">
                        <input
                          type="password"
                          value={
                            details.status.toLowerCase() !== 'not connected' &&
                            details.status.toLowerCase() !==
                              'configuration required'
                              ? '••••••••••••••••••••••••'
                              : ''
                          }
                          placeholder="Enter your API key..."
                        />
                        <button className="show-key-btn">
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>RPC Endpoint</label>
                      <input
                        type="text"
                        value={`https://rpc.${integrationId.toLowerCase()}.network`}
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>Default Gas Multiplier</label>
                      <div className="slider-container">
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          defaultValue="1.2"
                        />
                        <span className="slider-value">1.2x</span>
                      </div>
                      <div className="slider-labels">
                        <span>Economical</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    <div className="settings-actions">
                      <button className="test-connection-btn">
                        <i className="bi bi-lightning-charge"></i> Test
                        Connection
                      </button>
                      <button className="save-settings-btn">
                        <i className="bi bi-save"></i> Save Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Chain Configuration</h4>
                  <div className="settings-form">
                    {details.supportedChains.slice(0, 4).map((chain, index) => (
                      <div key={index} className="chain-config-item">
                        <div className="chain-name-toggle">
                          <span>{chain}</span>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              defaultChecked={networkData.chains?.some(
                                c => c.name === chain,
                              )}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        {networkData.chains?.some(c => c.name === chain) && (
                          <div className="chain-settings">
                            <div className="chain-setting-field">
                              <label>Custom RPC</label>
                              <input
                                type="text"
                                placeholder={`https://rpc.${chain.toLowerCase().replace(' ', '')}.network`}
                              />
                            </div>
                            <div className="chain-setting-field">
                              <label>Confirmation Blocks</label>
                              <input
                                type="number"
                                defaultValue={
                                  networkData.chains?.find(
                                    c => c.name === chain,
                                  )?.confirmations || 1
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {details.supportedChains.length > 4 && (
                      <button className="show-more-btn">
                        <i className="bi bi-three-dots"></i> Show{' '}
                        {details.supportedChains.length - 4} More Chains
                      </button>
                    )}
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Advanced Options</h4>
                  <div className="toggle-option">
                    <span>Enable Transaction Tracking</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-option">
                    <span>Auto-approve Trusted Bridges</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-option">
                    <span>Enable Bridge Notifications</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {integrationId === 'bearmint' && (
                    <div className="toggle-option">
                      <span>Weather Data Bridge</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  )}

                  <div className="danger-zone">
                    <h5>Danger Zone</h5>
                    <button className="reset-settings-btn">
                      <i className="bi bi-arrow-counterclockwise"></i> Reset
                      Settings
                    </button>
                    <button className="disconnect-btn">
                      <i className="bi bi-x-circle"></i> Disconnect{' '}
                      {details.name}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-integration-selected">
          <i className="bi bi-link-45deg"></i>
          <h3>Select a Cross-Chain Integration</h3>
          <p>Choose an integration from the grid to view details</p>
        </div>
      )}
    </div>
  );
};

export default CrossChainIntegrationDetails;
