import type { Meta, StoryObj } from '@storybook/react';
import IntegrationsHub from '../../components/Integrations/IntegrationsHub.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof IntegrationsHub> = {
  title: 'Integrations/IntegrationsHub',
  component: IntegrationsHub,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for IntegrationsHub component from Integrations.',
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
    devLog('IntegrationsHub rendered successfully');
  },
};
