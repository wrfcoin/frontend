import type { Meta, StoryObj } from '@storybook/react';
import LangChainIntegrationDetails from '../../Integrations/AI/LangChainIntegrationDetails.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof LangChainIntegrationDetails> = {
  title: 'Components/Integrations/AI/LangChainIntegrationDetails',
  component: LangChainIntegrationDetails,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LangChainIntegrationDetails

Component from the Integrations/AI category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 262
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
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
  play: async ({ canvasElement }) => {
    devLog('LangChainIntegrationDetails rendered successfully');
  },
};
