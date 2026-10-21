> **Retired:** `HSMSecurityDashboard` is a static notice. The backend HSM signer was retired (backend#1445), `hsmService` no longer exists, and the sections below describe the removed implementation.

# HSM Security Dashboard

A comprehensive security monitoring and management interface for Hardware Security Modules (HSM) in
the WRFCoin platform.

## Overview

The HSM Security Dashboard provides real-time monitoring and management capabilities for:

- **HSM Status & Health**: Monitor connected HSM devices, health metrics, and operational status
- **Key Management**: Track key lifecycle, rotations, and certificate status
- **Compliance Monitoring**: SOC2, GDPR, ISO27001, and PCI DSS compliance tracking
- **Multi-Signature Operations**: Manage pending transactions and signature workflows

## Features

### 🔐 HSM Device Monitoring

- Real-time device status and health metrics
- Temperature monitoring with color-coded alerts
- Uptime tracking and firmware version information
- Operations per second and success rate metrics

### 🔑 Advanced Key Management

- Key distribution visualization by type (master signing, weather validation, governance, etc.)
- Recent key rotation history and scheduling
- Certificate status monitoring with expiration alerts
- Automated key lifecycle management

### 🛡️ Compliance Dashboard

- Multi-framework compliance tracking (SOC2, GDPR, ISO27001, PCI DSS)
- Vulnerability assessment and severity tracking
- Security incident management and resolution tracking
- Automated compliance reporting

### ⚖️ Multi-Signature Operations

- Pending transaction monitoring with progress tracking
- Signature threshold visualization
- Signer status management
- Transaction history and audit trails

## Usage

### Basic Implementation

```jsx
import React from 'react';
import { HSMSecurityDashboard } from '../components/Security';

function SecurityPage() {
  return (
    <div>
      <HSMSecurityDashboard />
    </div>
  );
}

export default SecurityPage;
```

### With Custom Theme

```jsx
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HSMSecurityDashboard } from '../components/Security';

const customTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
  },
});

function SecurityPage() {
  return (
    <ThemeProvider theme={customTheme}>
      <HSMSecurityDashboard />
    </ThemeProvider>
  );
}

export default SecurityPage;
```

## Configuration

### Environment Variables

The component uses the following environment variables:

```bash
# HSM API Configuration
REACT_APP_HSM_API_URL=http://localhost:4001/api/hsm

# Development Mode (enables mock data)
NODE_ENV=development
```

### Backend Integration

The dashboard connects to HSM services through the `hsmService` module:

```javascript
// services/hsmService.js
const hsmService = {
  getHSMStatus(),      // Device status and metrics
  getKeyManagement(),  // Key lifecycle data
  getComplianceStatus(), // Compliance frameworks
  getMultiSigData(),   // Multi-signature transactions
  getAuditLog(limit)   // Security audit events
};
```

## API Endpoints

The dashboard expects the following HSM API endpoints:

### Device Status

```
GET /api/hsm/status
Response: {
  devices: [...],
  totalKeys: number,
  activeKeys: number,
  operationsPerSecond: number,
  successRate: number,
  alertCount: number
}
```

### Key Management

```
GET /api/hsm/keys
Response: {
  keysByType: { masterSigning: 5, weatherValidation: 15, ... },
  recentRotations: [...],
  certificates: [...]
}
```

### Compliance Status

```
GET /api/hsm/compliance
Response: {
  frameworks: { soc2: {...}, gdpr: {...}, ... },
  vulnerabilities: { critical: 0, high: 1, ... },
  incidents: [...]
}
```

### Multi-Signature Data

```
GET /api/hsm/multisig
Response: {
  pendingTransactions: [...],
  recentTransactions: [...]
}
```

### Audit Log

```
GET /api/hsm/audit?limit=50
Response: [
  {
    id, timestamp, event, details, user, ip, success, keyId
  },
  ...
]
```

## Security Considerations

### Data Protection

- All sensitive data is transmitted over HTTPS
- API authentication tokens are required for all requests
- Private keys never leave the HSM hardware
- Audit logging captures all security-related events

### Access Control

- Role-based access control for different dashboard sections
- Session-based authentication with timeout
- Multi-factor authentication for critical operations
- IP-based access restrictions

### Compliance

- Supports SOC2 Type II compliance requirements
- GDPR data protection and privacy controls
- ISO 27001 security management standards
- PCI DSS requirements for payment card data

## Customization

### Styling

The component uses Material-UI with custom CSS classes:

```css
.hsm-dashboard {
  /* Main container */
}
.hsm-device-card {
  /* HSM device status cards */
}
.security-metric-card {
  /* Metrics display cards */
}
.audit-log-entry {
  /* Audit log entries */
}
.compliance-score {
  /* Compliance scoring */
}
.multi-sig-progress {
  /* Transaction progress bars */
}
```

### Themes

Supports both light and dark themes:

```jsx
// Light theme (default)
const lightTheme = createTheme({ palette: { mode: 'light' } });

// Dark theme
const darkTheme = createTheme({ palette: { mode: 'dark' } });
```

### Custom Colors

Color coding for different states:

- 🟢 **Green**: Active, Compliant, Valid, Completed
- 🟡 **Yellow**: Warning, Expiring Soon, In Progress
- 🔴 **Red**: Error, Failed, Expired, Critical
- ⚪ **Gray**: Standby, Pending, Inactive

## Testing

### Unit Tests

```bash
npm test -- HSMSecurityDashboard
```

### Integration Tests

```bash
npm run test:integration
```

### Storybook

View component stories:

```bash
npm run storybook
```

Stories available:

- Default view
- High activity period
- Security alerts active
- Compliance issues
- Key rotation activity
- Mobile responsive
- Dark theme

## Performance

### Optimization Features

- Auto-refresh every 30 seconds
- Efficient data fetching with Promise.all()
- Lazy loading of heavy components
- Memoized calculations for metrics
- Responsive design for mobile devices

### Monitoring

- Real-time WebSocket connections for live updates
- Performance metrics tracking
- Error boundary protection
- Graceful degradation for offline scenarios

## Troubleshooting

### Common Issues

1. **Loading Issues**

   - Verify HSM service endpoints are accessible
   - Check network connectivity and CORS settings
   - Ensure authentication tokens are valid

2. **Data Not Updating**

   - Check auto-refresh interval settings
   - Verify WebSocket connections are active
   - Review browser console for errors

3. **Theme Issues**
   - Ensure Material-UI theme provider is properly configured
   - Clear browser cache for CSS updates
   - Verify custom theme overrides

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('hsm_debug', 'true');
```

## Dependencies

### Core Dependencies

- React 18+
- Material-UI 7+
- TypeScript 5+

### Security Dependencies

- HSM hardware drivers (production)
- PKCS#11 libraries
- Certificate management tools

## License

Part of the WRFCoin platform - see main project license.

## Support

For technical support:

- Email: security@wrfcoin.org
- Documentation: [WRFCoin Security Docs](../../../docs/)
- Issues: [GitHub Issues](https://github.com/wrfcoin/wrfcoin/issues)

---

_This dashboard is designed for enterprise-grade security monitoring and should only be deployed in
secure environments with proper access controls._
