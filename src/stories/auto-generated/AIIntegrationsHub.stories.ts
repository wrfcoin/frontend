import type { Meta, StoryObj } from '@storybook/react';
import AIIntegrationsHub from '../../Integrations/AIIntegrationsHub.jsx';

const meta: Meta<typeof AIIntegrationsHub> = {
  title: 'Components/Integrations/AIIntegrationsHub',
  component: AIIntegrationsHub,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
