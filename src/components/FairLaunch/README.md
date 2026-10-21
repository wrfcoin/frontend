# WRFCoin Fair Launch Registration Components

A simplified, user-friendly React interface for the WRFCoin fair launch system. Designed to make
blockchain registration as simple as "download app, press button, start earning" while maintaining
security and decentralization.

## Overview

The Fair Launch system implements Bitcoin-style decentralization with zero admin controls and three
simple registration pathways:

- **BASIC PATH**: Simple ETH staking (0.1 ETH minimum, like Bitcoin mining)
- **COMMUNITY PATH**: Peer-sponsored registration with 5+ vouchers (25% discount)
- **MERIT PATH**: Contribution-based discounts (up to 50% reduction)

## Components

### 1. FairLaunchRegistration (Main Component)

The complete 3-step registration flow:

```jsx
import { FairLaunchRegistration } from './components/FairLaunch';

function App() {
  return <FairLaunchRegistration />;
}
```

**Features:**

- Complete 3-step registration process
- Multi-language support (10+ languages)
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1 AA)
- Error handling and gas optimization

### 2. PathSelector

Interactive decision tree to help users choose the best registration path:

```jsx
import { PathSelector } from './components/FairLaunch';

function PathSelection() {
  const handlePathSelected = (path, details) => {
    console.log('Selected path:', path, details);
  };

  return <PathSelector onPathSelected={handlePathSelected} />;
}
```

**Features:**

- 2-3 simple questions maximum
- Recommends optimal path based on user answers
- Clear cost and requirement display
- One-click path selection

### 3. StakeCalculator

Real-time cost calculator with multi-currency support:

```jsx
import { StakeCalculator } from './components/FairLaunch';

function CostCalculation() {
  return <StakeCalculator selectedPath="BASIC" meritDiscount={0} communityVouchers={0} />;
}
```

**Features:**

- Real-time ETH price updates
- Multi-currency display (USD, EUR, CNY, INR, etc.)
- Gas cost estimation
- Discount calculations
- Transparent cost breakdown

### 4. VoucherSystem

Community vouching interface for the Community Path:

```jsx
import { VoucherSystem } from './components/FairLaunch';

function CommunityVouching() {
  const handleVouchersUpdated = vouchers => {
    console.log('Vouchers updated:', vouchers);
  };

  return <VoucherSystem onVouchersUpdated={handleVouchersUpdated} requiredVouchers={5} />;
}
```

**Features:**

- Address validation and verification
- Community member lookup with suggestions
- Progress tracking (5 vouchers required)
- Sybil attack prevention

### 5. ProgressTracker

Simple 3-step progress indicator:

```jsx
import { ProgressTracker } from './components/FairLaunch';

function Registration() {
  return (
    <ProgressTracker
      currentStep={2}
      totalSteps={3}
      stepNames={['Choose Path', 'Configure', 'Complete']}
      onStepClick={step => console.log('Go to step', step)}
    />
  );
}
```

### 6. GlobalAccessibility

Multi-language and accessibility controls:

```jsx
import { GlobalAccessibility } from './components/FairLaunch';

function App() {
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [accessibility, setAccessibility] = useState({});

  return (
    <GlobalAccessibility
      language={language}
      onLanguageChange={setLanguage}
      currency={currency}
      onCurrencyChange={setCurrency}
      accessibility={accessibility}
      onAccessibilityChange={setAccessibility}
    />
  );
}
```

## Key Features

### 🌍 Global Accessibility

- **10+ Languages**: English, Chinese, Spanish, Hindi, Arabic, French, German, Japanese, Korean,
  Portuguese
- **12+ Currencies**: USD, EUR, GBP, CNY, INR, JPY, KRW, AUD, CAD, BRL, RUB, TRY
- **Accessibility Options**: High contrast, large text, reduced motion, screen reader support

### 📱 Mobile-First Design

- Works on $50 smartphones with slow internet
- Optimized for low bandwidth connections
- Touch-friendly interfaces
- Progressive web app capabilities

### 🔒 Security & Privacy

- No admin controls - fully decentralized
- Client-side validation before transactions
- Economic security through staking
- Community-driven dispute resolution

### ⚡ Performance Optimized

- Lighthouse score 90+ on mobile
- Lazy loading for better performance
- Efficient state management
- Minimal dependencies

## Smart Contract Integration

The components integrate with the `DecentralizedFairLaunch.sol` contract:

```javascript
// Contract addresses (example - use actual deployed addresses)
const CONTRACT_ADDRESSES = {
  fairLaunch: '0x...',
  economicEngine: '0x...',
  governance: '0x...',
};

// Key contract functions used:
// - registerBasicPath()
// - registerCommunityPath(voucherAddresses)
// - registerMeritPath(contributionProof, contributionType)
// - getParticipant(address)
// - getSystemStats()
```

## Registration Paths Explained

### Basic Path (⚡)

- **Cost**: 0.1 ETH
- **Time**: 2-3 minutes
- **Requirements**: Just connect wallet and stake
- **Benefits**: Immediate activation, no verification needed

### Community Path (👥)

- **Cost**: 0.075 ETH (25% discount)
- **Time**: 10-15 minutes
- **Requirements**: 5 community vouchers
- **Benefits**: Lower cost, community support, faster dispute resolution

### Merit Path (🏆)

- **Cost**: 0.05-0.075 ETH (up to 50% discount)
- **Time**: 5-10 minutes
- **Requirements**: Contribution proof (GitHub, Research, Community)
- **Benefits**: Significant discounts, recognition, reputation building

## Development Setup

### Prerequisites

- Node.js 20+
- React 18+
- Web3 wallet (MetaMask, WalletConnect)

### Installation

```bash
# Install dependencies
npm install ethers@^6.8.0 zustand@^4.4.6

# Copy components to your project
cp -r components/FairLaunch/ src/components/

# Import and use
import { FairLaunchRegistration } from './components/FairLaunch';
```

### Environment Variables

```env
# Optional - for real price feeds
REACT_APP_COINGECKO_API_KEY=your_api_key
REACT_APP_INFURA_PROJECT_ID=your_project_id
```

## Customization

### Theming

All components support CSS custom properties:

```css
:root {
  --fair-launch-primary: #4facfe;
  --fair-launch-secondary: #00f2fe;
  --fair-launch-success: #48bb78;
  --fair-launch-error: #e53e3e;
  --fair-launch-warning: #ed8936;
}
```

### Language Support

Add new languages by extending the translations object:

```javascript
const translations = {
  en: {
    /* English translations */
  },
  fr: {
    /* French translations */
  },
  // Add your language here
};
```

### Currency Support

Add new currencies to the currencies object:

```javascript
const currencies = {
  USD: { name: 'US Dollar', symbol: '$', rate: 1 },
  // Add your currency here
};
```

## Testing

### Unit Tests

```bash
npm test -- components/FairLaunch
```

### E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npm run test:e2e
```

### Accessibility Testing

```bash
# Install axe-core
npm install -D @axe-core/react

# Run accessibility tests
npm run test:a11y
```

## Performance Benchmarks

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 150KB gzipped
- **Lighthouse Mobile Score**: 90+

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile browsers**: iOS Safari 14+, Chrome Android 90+

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Ensure accessibility compliance
4. Test on mobile devices
5. Update documentation

## Security Considerations

- Never store private keys in localStorage
- Validate all user inputs client-side
- Use proper HTTPS in production
- Implement proper error handling
- Monitor for unusual transaction patterns

## Support

- **Documentation**: `/docs/fair-launch`
- **Discord**: `https://discord.gg/wrfcoin`
- **GitHub Issues**: Create issues for bugs or features
- **Email**: `support@wrfcoin.io`

---

Built with ❤️ for global accessibility and Bitcoin-style decentralization.
