import type { Meta, StoryObj } from '@storybook/react-vite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import { WrfStatCard } from '../components/DesignSystem';

const meta = {
  title: 'DesignSystem/WrfStatCard',
  component: WrfStatCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WrfStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Temperature',
    value: '24.5 C',
    trend: 3.2,
    trendLabel: 'vs last hour',
    icon: ThermostatIcon,
  },
};

export const NegativeTrend: Story = {
  args: {
    label: 'Active Miners',
    value: '1,247',
    trend: -5.1,
    trendLabel: 'vs yesterday',
    icon: PeopleIcon,
    color: '#8B5CF6',
  },
};

export const WithSparkline: Story = {
  args: {
    label: 'Wallet Balance',
    value: '12,450 WRF',
    trend: 8.7,
    trendLabel: '7d change',
    icon: AccountBalanceWalletIcon,
    sparklineData: [10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 22, 21],
    color: '#10B981',
  },
};

export const NoTrend: Story = {
  args: {
    label: 'Network Hash Rate',
    value: '1.2 TH/s',
  },
};
