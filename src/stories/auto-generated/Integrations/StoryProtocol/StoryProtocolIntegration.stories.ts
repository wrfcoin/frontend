import type { Meta, StoryObj } from '@storybook/react';
import StoryProtocolIntegration from '../../components/Integrations/StoryProtocol/StoryProtocolIntegration.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof StoryProtocolIntegration> = {
  title: 'Integrations/StoryProtocol/StoryProtocolIntegration',
  component: StoryProtocolIntegration,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for StoryProtocolIntegration component from Integrations/StoryProtocol.',
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
    devLog('StoryProtocolIntegration rendered successfully');
  },
};
