import type { Meta, StoryObj } from '@storybook/react';
import AIIntegrationsCard from '../../Integrations/AIIntegrationsCard.jsx';

const meta: Meta<typeof AIIntegrationsCard> = {
  title: 'Components/Integrations/AIIntegrationsCard',
  component: AIIntegrationsCard,
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
