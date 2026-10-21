import type { Meta, StoryObj } from '@storybook/react';
import NFTOracle from '../../components/Integrations/StoryProtocol/NFTOracle.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof NFTOracle> = {
  title: 'Integrations/StoryProtocol/NFTOracle',
  component: NFTOracle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for NFTOracle component from Integrations/StoryProtocol.',
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
    devLog('NFTOracle rendered successfully');
  },
};
