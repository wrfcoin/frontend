import type { Meta, StoryObj } from '@storybook/react';
import FilecoinPanel from '../../components/Integrations/FilecoinPanel.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof FilecoinPanel> = {
  title: 'Integrations/FilecoinPanel',
  component: FilecoinPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for FilecoinPanel component from Integrations.',
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
    devLog('FilecoinPanel rendered successfully');
  },
};
