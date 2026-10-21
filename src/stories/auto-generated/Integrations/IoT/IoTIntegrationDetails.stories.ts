import type { Meta, StoryObj } from '@storybook/react';
import IoTIntegrationDetails from '../../components/Integrations/IoT/IoTIntegrationDetails.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof IoTIntegrationDetails> = {
  title: 'Integrations/IoT/IoTIntegrationDetails',
  component: IoTIntegrationDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for IoTIntegrationDetails component from Integrations/IoT.',
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
    devLog('IoTIntegrationDetails rendered successfully');
  },
};
