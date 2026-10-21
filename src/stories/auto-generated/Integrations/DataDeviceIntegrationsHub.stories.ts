import type { Meta, StoryObj } from '@storybook/react';
import DataDeviceIntegrationsHub from '../../components/Integrations/DataDeviceIntegrationsHub.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof DataDeviceIntegrationsHub> = {
  title: 'Integrations/DataDeviceIntegrationsHub',
  component: DataDeviceIntegrationsHub,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for DataDeviceIntegrationsHub component from Integrations.',
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
    devLog('DataDeviceIntegrationsHub rendered successfully');
  },
};
