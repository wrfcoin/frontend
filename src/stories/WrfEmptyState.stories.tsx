import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { WrfEmptyState } from '../components/DesignSystem';

const meta = {
  title: 'DesignSystem/WrfEmptyState',
  component: WrfEmptyState,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 480, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WrfEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const SearchNoResults: Story = {
  args: {
    variant: 'search',
  },
};

export const ErrorState: Story = {
  args: {
    variant: 'error',
    actionLabel: 'Retry',
    onAction: fn(),
  },
};

export const NoData: Story = {
  args: {
    variant: 'no-data',
  },
};

export const CustomContent: Story = {
  args: {
    icon: CloudOffIcon,
    title: 'Station Offline',
    description: 'This weather station has not reported data in over 24 hours.',
    actionLabel: 'View Station Details',
    onAction: fn(),
  },
};
