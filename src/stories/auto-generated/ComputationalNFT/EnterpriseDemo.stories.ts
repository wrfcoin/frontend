import type { Meta, StoryObj } from '@storybook/react';
import EnterpriseDemo from '../../components/ComputationalNFT/EnterpriseDemo.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnterpriseDemo> = {
  title: 'ComputationalNFT/EnterpriseDemo',
  component: EnterpriseDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnterpriseDemo component from ComputationalNFT.',
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
    devLog('EnterpriseDemo rendered successfully');
  },
};
