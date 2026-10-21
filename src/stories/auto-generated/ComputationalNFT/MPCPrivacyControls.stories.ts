import type { Meta, StoryObj } from '@storybook/react';
import MPCPrivacyControls from '../../components/ComputationalNFT/MPCPrivacyControls.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof MPCPrivacyControls> = {
  title: 'ComputationalNFT/MPCPrivacyControls',
  component: MPCPrivacyControls,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for MPCPrivacyControls component from ComputationalNFT.',
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
    devLog('MPCPrivacyControls rendered successfully');
  },
};
