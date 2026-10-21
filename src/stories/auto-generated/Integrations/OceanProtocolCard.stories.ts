import type { Meta, StoryObj } from '@storybook/react';
import OceanProtocolCard from '../../components/Integrations/OceanProtocolCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof OceanProtocolCard> = {
  title: 'Integrations/OceanProtocolCard',
  component: OceanProtocolCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for OceanProtocolCard component from Integrations.',
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
    devLog('OceanProtocolCard rendered successfully');
  },
};
