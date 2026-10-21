import type { Meta, StoryObj } from '@storybook/react';
import PartnerDashboard from '../../components/partner/PartnerDashboard.tsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof PartnerDashboard> = {
  title: 'partner/PartnerDashboard',
  component: PartnerDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for PartnerDashboard component from partner.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};

export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('PartnerDashboard rendered successfully');
  },
};
