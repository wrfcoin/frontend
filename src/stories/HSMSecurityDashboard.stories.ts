import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HSMSecurityDashboard from '../components/Security/HSMSecurityDashboard';

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const meta = {
  title: 'Security/HSMSecurityDashboard',
  component: HSMSecurityDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Comprehensive HSM Security Dashboard for monitoring hardware security modules, key management, compliance status, and multi-signature operations in the WRFCoin platform.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) =>
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(CssBaseline),
        React.createElement(
          'div',
          { style: { minHeight: '100vh', backgroundColor: '#f5f5f5' } },
          React.createElement(Story),
        ),
      ),
  ],
  argTypes: {
    // No direct props for this component as it manages its own state
  },
} satisfies Meta<typeof HSMSecurityDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing normal operation
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default HSM Security Dashboard with all features enabled, showing healthy HSM devices, active keys, compliant status, and pending multi-signature transactions.',
      },
    },
  },
};

// Story showing high activity
export const HighActivity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard during high activity periods with multiple pending transactions and recent security events.',
      },
    },
  },
};

// Story showing security alerts
export const WithSecurityAlerts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard displaying security alerts and incidents that require attention.',
      },
    },
  },
};

// Story showing compliance issues
export const ComplianceIssues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard showing compliance framework issues and vulnerability assessments.',
      },
    },
  },
};

// Story showing key rotation activity
export const KeyRotationActivity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard during key rotation periods with certificate renewals and key management operations.',
      },
    },
  },
};

// Mobile responsive story
export const Mobile: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard optimized for mobile viewing with responsive layout and touch-friendly controls.',
      },
    },
  },

  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false,
    },
  },
};

// Dark theme story
export const DarkTheme: Story = {
  decorators: [
    (Story: React.ComponentType) =>
      React.createElement(
        ThemeProvider,
        { theme: createTheme({ palette: { mode: 'dark' } }) },
        React.createElement(CssBaseline),
        React.createElement(
          'div',
          { style: { minHeight: '100vh', backgroundColor: '#121212' } },
          React.createElement(Story),
        ),
      ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'HSM Dashboard with dark theme support for low-light environments.',
      },
    },
  },
};
